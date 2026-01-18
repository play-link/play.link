import type { Context, Next } from "hono";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import postgres from "postgres";

// Types for Cloudflare Workers bindings
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
  ENVIRONMENT: string;
}

// Extended context with user
interface Variables {
  user: {
    id: string;
    email: string;
  } | null;
  db: ReturnType<typeof drizzle>;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware: Logger
app.use("*", logger());

// Middleware: CORS
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3005"],
    credentials: true,
  }),
);

// Middleware: Database connection
app.use("*", async (c, next) => {
  const client = postgres(c.env.DATABASE_URL, {
    prepare: false, // Required for connection pooler
  });
  c.set("db", drizzle(client));
  await next();
});

// Middleware: Auth (validates JWT, sets user)
async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next,
) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    c.set("user", null);
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      c.set("user", null);
    } else {
      c.set("user", {
        id: user.id,
        email: user.email ?? "",
      });
    }
  } catch {
    c.set("user", null);
  }

  return next();
}

// Apply auth middleware to all routes
app.use("*", authMiddleware);

// Helper: Require auth
function requireAuth(c: Context<{ Bindings: Env; Variables: Variables }>) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return null;
}

// =============================================================================
// Routes
// =============================================================================

// Health check
app.get("/", (c) => {
  return c.json({
    name: "Play.link API",
    version: "1.0.0",
    environment: c.env.ENVIRONMENT,
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Get current user profile
app.get("/me", (c) => {
  const authError = requireAuth(c);
  if (authError) return authError;

  const user = c.get("user")!;

  return c.json({
    id: user.id,
    email: user.email,
  });
});

// =============================================================================
// Export for Cloudflare Workers
// =============================================================================

export default app;

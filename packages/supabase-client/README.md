# @play/supabase-client

Shared TypeScript client for Supabase. This package provides the configured client and types for use across the monorepo apps.

## Usage

```typescript
import { supabase } from "@play/supabase-client";

// Auth
const { data, error } = await supabase.auth.signInWithOtp({ email });

// Database
const { data } = await supabase.from("profiles").select("*");
```

## Exports

- `supabase` - Configured Supabase client
- `Database` - Generated TypeScript types for the database schema

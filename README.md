# Play.link

Monorepo for Play.link applications and packages.

## Structure

```
play.link/
├── apps/
│   ├── studio/          # studio.play.link (port 3000)
│   └── web/             # play.link (port 3005)
└── packages/
    ├── pylon/           # UI components + Storybook (port 6006)
    ├── mails/           # Email templates with react-email (port 3030)
    └── supabase/        # Backend
```

## Tech Stack

- **React 19** + **Vite 7** + **TypeScript 5.9**
- **Tailwind CSS v4** + **styled-components**
- **pnpm** workspaces
- **Storybook 10** for component development
- **react-email** for email templates
- **Supabase** for backend

## Quick Start

```bash
# Install dependencies
pnpm install

# Start all apps
just dev

# Or start individually
just dev-studio    # localhost:3000
just dev-web       # localhost:3005
just dev-pylon     # localhost:6006 (Storybook)
just dev-mails     # localhost:3030 (email preview)
```

## Commands

Run `just` to see all available commands.

| Command           | Description        |
| ----------------- | ------------------ |
| `just dev`        | Start studio + web |
| `just dev-studio` | Studio only        |
| `just dev-web`    | Web only           |
| `just dev-pylon`  | Storybook          |
| `just dev-mails`  | Email preview      |
| `just build`      | Build all apps     |
| `just lint`       | Lint + fix         |
| `just check`      | Lint + typecheck   |

### Git Helpers

| Command                    | Description                           |
| -------------------------- | ------------------------------------- |
| `just yolo`                | Commit + create MR + merge to main 🤠 |
| `just ac`                  | Add all + commit with AI message      |
| `just move-to-branch name` | Move changes to new branch            |

> Note: Set `GEMINI_API_KEY` in `.env` for AI commit messages.

## Environment

```bash
cp .env.example .env
```

Required:

- `GEMINI_API_KEY` - For AI commit messages

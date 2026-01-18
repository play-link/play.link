# Supabase Local Development

This folder contains the Supabase CLI configuration for local development.

## Quick Start

```bash
npx supabase start      # Start local environment
npx supabase stop       # Stop the environment
npx supabase db reset   # Reset DB + apply migrations
npx supabase status     # View URLs and keys
```

## Local URLs

| Service                 | URL                                                       |
| ----------------------- | --------------------------------------------------------- |
| Studio (Dashboard)      | http://127.0.0.1:54323                                    |
| API                     | http://127.0.0.1:54321                                    |
| Mailpit (Email testing) | http://127.0.0.1:54324                                    |
| Database                | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

## Structure

```
supabase/
├── config.toml         # Supabase configuration
└── migrations/         # Database migrations
```

## Creating Migrations

```bash
# Create a new migration
npx supabase migration new <migration_name>

# Apply migrations
npx supabase db reset
```

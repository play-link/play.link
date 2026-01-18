# Play.link - Development Commands
# Run `just` to see all available commands

set dotenv-load

_list:
    just -l --unsorted

# =====================================================================
# DEV SERVERS
# =====================================================================

# Start all apps in dev mode (api + studio + web)
[group('dev')]
dev:
    pnpm run dev

# Start only studio app on port 3000
[group('dev')]
dev-studio:
    pnpm --filter @play/studio run dev

# Start only web app on port 3005
[group('dev')]
dev-web:
    pnpm --filter @play/web run dev

# Start pylon library in watch mode (Storybook)
[group('dev')]
dev-pylon:
    pnpm --filter @play/pylon run dev && echo 'Opens Storybook at http://localhost:6006'

# Start react-email preview
[group('dev')]
dev-mails:
    pnpm --filter @play/mails run dev && echo 'Opens email preview at http://localhost:3030'

# Start API server
[group('dev')]
dev-api:
    pnpm --filter @play/api run dev

# =====================================================================
# BUILD
# =====================================================================

# Build all apps (studio + web)
[group('build')]
build:
    pnpm run build

# Build studio app only
[group('build')]
build-studio:
    pnpm run build:studio

# Build web app only
[group('build')]
build-web:
    pnpm run build:web

# =====================================================================
# LINTING & FORMATTING
# =====================================================================

# Run ESLint with --fix on all apps
[group('check')]
lint:
    pnpm -r run lint:fix

# Format all code with Prettier
[group('check')]
format:
    pnpm -r run format

# Run lint + typecheck on all apps
[group('check')]
check:
    echo "🔍 Running lint..."
    pnpm -r run lint
    echo "🔍 Running typecheck..."
    pnpm --filter @play/studio exec tsc --noEmit
    pnpm --filter @play/web exec tsc --noEmit
    echo "✅ All checks passed!"

# Run lint:fix + typecheck on all apps (used by yolo)
[group('check')]
check-fix:
    echo "🔍 Running lint:fix..."
    pnpm -r run lint:fix
    echo "🔍 Running typecheck..."
    pnpm --filter @play/studio exec tsc --noEmit
    pnpm --filter @play/web exec tsc --noEmit
    echo "✅ All checks passed!"

# =====================================================================
# GIT HELPERS
# =====================================================================

# Add and commit with AI-generated message (for feature branches)
# Usage: just ac (auto-generates message) or just ac "custom message"
[group('git')]
ac message="":
    #!/usr/bin/env bash
    set -e
    
    # Prevent on main - use yolo instead
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" = "main" ]; then
        echo -e "\033[1;31m❌ Don't use 'ac' on main.\033[0m"
        echo -e "   Use '\033[1mjust yolo\033[0m' to skip the normal flow (for special occasions 🤠)"
        exit 1
    fi
    
    git add -A
    
    if ! git diff --cached --quiet; then
        if [ -z "{{message}}" ]; then
            echo "🤖 Generating commit message..."
            COMMIT_MSG=$(./scripts/generate-commit-msg.sh) || { echo "❌ Failed. Use: just ac \"message\""; exit 1; }
            echo "   → $COMMIT_MSG"
            git commit -m "$COMMIT_MSG"
        else
            git commit -m "{{message}}"
        fi
    else
        echo "❌ Nothing to commit"
        exit 1
    fi

# Move all changes (uncommitted + commits ahead of main) to a new branch
# Leaves main clean and synced with origin
[group('git')]
move-to-branch name:
    #!/usr/bin/env bash
    set -e
    
    # Must be on main
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo "❌ Must be on main to move changes to a new branch"
        exit 1
    fi
    
    # Stash uncommitted changes if any
    HAS_CHANGES=false
    if ! git diff --quiet || ! git diff --cached --quiet; then
        HAS_CHANGES=true
        git stash push -m "move-to-branch temp stash"
    fi
    
    # Check for commits ahead of origin/main
    git fetch origin main --quiet
    COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
    
    if [ "$COMMITS_AHEAD" -gt 0 ]; then
        # Create new branch at current position
        git checkout -b {{name}}
        # Reset main to origin/main
        git checkout main
        git reset --hard origin/main
        git checkout {{name}}
        echo "✅ Moved $COMMITS_AHEAD commit(s) to branch '{{name}}'"
    else
        # No commits ahead, just create branch
        git checkout -b {{name}}
        echo "✅ Created branch '{{name}}'"
    fi
    
    # Restore stashed changes if any
    if [ "$HAS_CHANGES" = true ]; then
        git stash pop
        echo "   + restored uncommitted changes"
    fi

# Push current branch directly to main
# Auto-adds, commits (with AI-generated message), creates PR, and merges it
# Usage: just yolo (auto-generates message) or just yolo "custom message"
[group('git')]
yolo message="":
    #!/usr/bin/env bash
    set -e
    
    # Ensure we're on main
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo -e "\033[1;31m❌ yolo only works from main branch. You're on: $CURRENT_BRANCH\033[0m"
        echo "   Switch to main first: git checkout main"
        exit 1
    fi
    
    # Install gh if not installed
    if ! command -v gh &> /dev/null; then
        echo "📦 Installing gh..."
        brew install gh
    fi
    
    # Check if logged in, if not, login
    if ! gh auth status &> /dev/null; then
        echo "🔐 Not logged in to GitHub. Logging in..."
        gh auth login
    fi
    
    # Stage all changes
    git add -A
    
    # Check if there are staged changes to commit
    HAS_STAGED=false
    if ! git diff --cached --quiet; then
        HAS_STAGED=true
    fi
    
    # Check if there are commits ahead of origin/main
    git fetch origin main --quiet 2>/dev/null || true
    COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
    
    # If nothing to commit and nothing to push, exit
    if [ "$HAS_STAGED" = false ] && [ "$COMMITS_AHEAD" = "0" ]; then
        echo "❌ Nothing to commit or push. Make some changes first!"
        exit 1
    fi
    
    # Run lint:fix + typecheck before committing (like pre-commit)
    if [ "$HAS_STAGED" = true ]; then
        just check-fix || { echo "❌ Check failed. Fix errors and try again."; exit 1; }
        
        # Re-stage any auto-fixed files
        git add -A
    fi
    
    # Commit staged changes if any (add [YOLO] tag for CI detection)
    if [ "$HAS_STAGED" = true ]; then
        echo "📝 Committing changes..."
        if [ -z "{{message}}" ]; then
            echo "🤖 Generating commit message with Gemini..."
            COMMIT_MSG=$(./scripts/generate-commit-msg.sh) || { echo "❌ Failed to generate message. Provide one manually: just yolo \"message\""; exit 1; }
            COMMIT_MSG="$COMMIT_MSG [YOLO]"
            echo "   → $COMMIT_MSG"
            git commit -m "$COMMIT_MSG" --no-verify
        else
            git commit -m "{{message}} [YOLO]" --no-verify
        fi
    else
        echo "ℹ️  No new changes to commit, pushing existing commits..."
    fi
    
    # Ensure we're synced with main
    echo "🔄 Syncing with main..."
    git fetch origin main --quiet 2>/dev/null || true
    if git rev-parse origin/main &>/dev/null; then
        git rebase origin/main || { echo "❌ Rebase failed. Resolve conflicts and try again."; exit 1; }
    fi
    
    # Create temp branch
    BRANCH="yolo-$(date +%s)"
    git checkout -b $BRANCH
    
    # Push branch
    echo "🚀 Pushing to GitHub..."
    git push -u origin $BRANCH
    
    # Create PR and merge
    echo "📥 Creating PR and merging..."
    gh pr create --base main --title "$(git log -1 --pretty=%s)" --body "Auto-merged via yolo" --fill
    
    # Merge the PR (retry up to 3 times with delay)
    for i in 1 2 3; do
        if gh pr merge --merge --delete-branch 2>/dev/null; then
            break
        fi
        if [ $i -lt 3 ]; then
            echo "   Waiting for GitHub... (attempt $i/3)"
            sleep 3
        else
            echo "❌ Merge failed after 3 attempts. Check GitHub manually."
            exit 1
        fi
    done
    
    # Return to main (force clean state)
    git reset --hard HEAD 2>/dev/null || true
    git checkout main 2>/dev/null || git checkout -B main origin/main
    git pull --no-edit origin main
    
    echo "✅ Merged to main!"

# =====================================================================
# CLEANUP
# =====================================================================

# Remove all gitignored files (except .env files)
[group('cleanup')]
cleanup:
    echo "🧹 Removing all gitignored files (except .env)..."
    git clean -fdX -e '!.env' -e '!.env.*'
    echo "✅ Cleanup complete! Run 'just install' to reinstall."

# Install all dependencies
[group('cleanup')]
install:
    pnpm install

# Cleanup and reinstall everything
[group('cleanup')]
reset:
    just cleanup
    just install

# Update dependencies interactively
[group('cleanup')]
update:
    pnpm update -i -r

# Update dependencies aggressively (ignores semver constraints)
[group('cleanup')]
update-major:
    npx npm-check-updates -i --workspaces --root

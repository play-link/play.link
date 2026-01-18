#!/usr/bin/env bash
# Generate a commit message using Gemini API based on staged changes

set -e

# Check for API key
if [ -z "$GEMINI_API_KEY" ]; then
    echo "Error: GEMINI_API_KEY environment variable is not set" >&2
    exit 1
fi

# Get staged diff
DIFF=$(git diff --cached)

if [ -z "$DIFF" ]; then
    echo "Error: No staged changes found" >&2
    exit 1
fi

# Truncate diff if too large (keep first 4000 chars to avoid token limits)
if [ ${#DIFF} -gt 4000 ]; then
    DIFF="${DIFF:0:4000}...

[diff truncated]"
fi

# Build the prompt - be very explicit about format
PROMPT="You are a commit message generator. Based on the git diff below, generate a single-line conventional commit message.

RULES:
1. Format: type(scope): short description
2. Types: feat, fix, refactor, chore, docs, style, test, perf
3. Scope is optional, use filename or component name if relevant
4. Description should be lowercase, no period at end
5. Total length must be under 72 characters
6. Output ONLY the commit message - no quotes, no backticks, no explanation

EXAMPLES:
- feat(auth): add login form validation
- fix: resolve null pointer in user service
- refactor(api): simplify error handling
- chore: update dependencies

GIT DIFF:
$DIFF

COMMIT MESSAGE:"

# Escape prompt for JSON
ESCAPED_PROMPT=$(echo "$PROMPT" | jq -Rs '.')

# Models to try (in order of preference)
MODELS=("gemini-2.5-flash" "gemini-2.0-flash" "gemini-2.0-flash-lite")

for MODEL in "${MODELS[@]}"; do
    echo "Trying model: $MODEL..." >&2
    
    # Call Gemini API
    RESPONSE=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=$GEMINI_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"contents\": [{
                \"parts\": [{\"text\": $ESCAPED_PROMPT}]
            }],
            \"generationConfig\": {
                \"temperature\": 0.2,
                \"maxOutputTokens\": 60,
                \"stopSequences\": [\"\\n\"]
            }
        }")

    # Check for errors
    if echo "$RESPONSE" | grep -q '"code": 429'; then
        echo "Rate limited on $MODEL, trying next..." >&2
        continue
    fi
    
    if echo "$RESPONSE" | grep -q '"code": 404'; then
        echo "Model $MODEL not found, trying next..." >&2
        continue
    fi

    # Extract the text from the response
    MESSAGE=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text // empty' 2>/dev/null)

    if [ -n "$MESSAGE" ]; then
        # Clean up: remove quotes, backticks, leading/trailing whitespace, newlines
        MESSAGE=$(echo "$MESSAGE" | tr -d '\n\r' | sed 's/^[[:space:]`"'\'']*//;s/[[:space:]`"'\'']*$//')
        
        # Validate it looks like a commit message (has a colon)
        if [[ "$MESSAGE" == *":"* ]] && [ ${#MESSAGE} -gt 5 ] && [ ${#MESSAGE} -lt 100 ]; then
            echo "$MESSAGE"
            exit 0
        else
            echo "Invalid message format: $MESSAGE" >&2
        fi
    fi
done

echo "Error: Failed to generate valid commit message" >&2
exit 1

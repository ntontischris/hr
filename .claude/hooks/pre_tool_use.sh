#!/bin/bash
# PreToolUse Hook — Blocks dangerous commands BEFORE execution
# Exit code 2 = BLOCK the action
# Exit code 0 = ALLOW the action

# Read the tool input from stdin (Claude passes JSON)
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | head -1 | cut -d'"' -f4)

# Block destructive commands
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  "rm -rf \."
  "DROP DATABASE"
  "DROP TABLE"
  "truncate"
  ":(){ :|:& };:"
  "mkfs"
  "dd if="
  "> /dev/sda"
  "chmod -R 777"
  "curl.*| bash"
  "wget.*| bash"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    echo "BLOCKED: Dangerous command detected: $pattern" >&2
    exit 2
  fi
done

# Block modifications to protected files
PROTECTED_FILES=(
  ".env"
  ".env.local"
  ".env.production"
  "package-lock.json"
  "pnpm-lock.yaml"
)

for file in "${PROTECTED_FILES[@]}"; do
  if echo "$COMMAND" | grep -q "rm.*$file\|> $file\|mv.*$file"; then
    echo "BLOCKED: Cannot modify protected file: $file" >&2
    exit 2
  fi
done

# Allow everything else
exit 0

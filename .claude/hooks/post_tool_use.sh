#!/bin/bash
# PostToolUse Hook — Runs AFTER Write/Edit operations
# Auto-formats the edited file and checks for lint errors

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path":"[^"]*"' | head -1 | cut -d'"' -f4)

# Skip if no file path found
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Get file extension
EXT="${FILE_PATH##*.}"

# Auto-format based on file type
case "$EXT" in
  ts|tsx|js|jsx|json|css|scss|md)
    if command -v npx &> /dev/null; then
      npx prettier --write "$FILE_PATH" 2>/dev/null
      echo "Formatted: $FILE_PATH" >&2
    fi
    ;;
  py)
    if command -v ruff &> /dev/null; then
      ruff format "$FILE_PATH" 2>/dev/null
      echo "Formatted: $FILE_PATH" >&2
    fi
    ;;
esac

# Run quick lint check (non-blocking — just feedback)
case "$EXT" in
  ts|tsx)
    if command -v npx &> /dev/null; then
      LINT_OUTPUT=$(npx eslint "$FILE_PATH" --quiet 2>/dev/null)
      if [ -n "$LINT_OUTPUT" ]; then
        echo "Lint issues found in $FILE_PATH:" >&2
        echo "$LINT_OUTPUT" >&2
      fi
    fi
    ;;
esac

exit 0

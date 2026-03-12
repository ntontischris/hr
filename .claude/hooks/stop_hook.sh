#!/bin/bash
# Stop Hook — Runs when Claude finishes responding
# Provides a summary of what changed in this session

# Show git status of changes made
if command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null 2>&1; then
  CHANGES=$(git diff --stat 2>/dev/null)
  UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null)
  
  if [ -n "$CHANGES" ] || [ -n "$UNTRACKED" ]; then
    echo "━━━ Session Changes ━━━" >&2
    if [ -n "$CHANGES" ]; then
      echo "$CHANGES" >&2
    fi
    if [ -n "$UNTRACKED" ]; then
      echo "New files:" >&2
      echo "$UNTRACKED" >&2
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━" >&2
  fi
fi

exit 0

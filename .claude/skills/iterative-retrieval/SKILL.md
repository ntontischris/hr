---
name: iterative-retrieval
description: Progressive context refinement pattern for subagents. Instead of loading all context upfront, iteratively retrieve relevant information. Use when orchestrating multi-agent workflows or when context window is constrained.
---

# Iterative Retrieval Pattern

## The Problem
Subagents have limited context. Loading everything upfront wastes tokens 
and causes context rot. The agent sees too much and focuses on nothing.

## The Solution
Retrieve context PROGRESSIVELY — start broad, narrow as understanding improves.

## Pattern

### Phase 1: Orientation (broad scan)
```
Agent reads:
- CLAUDE.md (project overview)
- Directory structure (glob)
- README.md
→ Understands: what is this project?
```

### Phase 2: Targeted Retrieval (relevant files)
```
Based on the task, agent reads:
- Specific source files related to the task
- Related test files
- Relevant skills
→ Understands: what code exists for this task?
```

### Phase 3: Deep Dive (implementation details)
```
Agent reads:
- Function implementations
- Type definitions
- Database schema
- Related dependencies
→ Understands: how does this specific code work?
```

## Orchestration Example
```
Main Agent (orchestrator):
1. Receive task from user
2. Spawn @planner with Phase 1 context → get plan
3. For each step in plan:
   a. Spawn @implementer with Phase 2+3 context for THAT step only
   b. Collect result
   c. Spawn @code-reviewer with implementation context
4. Synthesize results
```

## Rules
- Never load ALL files into a subagent — only what's needed
- Each subagent should focus on ONE aspect
- Pass handoff documents between agents (not raw file contents)
- Handoff format: what was done, what to do next, key decisions

## Handoff Document Template
```markdown
## Handoff: [from agent] → [to agent]
### Completed: [what was done]
### Context: [key files and decisions]
### Next: [what the receiving agent should do]
### Constraints: [important limitations]
```

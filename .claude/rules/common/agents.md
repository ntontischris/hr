# Agent Delegation Rules (Always Active)

## When to Use Agents
- Code review → @code-reviewer (Sonnet, isolated context)
- Security check → @security-reviewer (Sonnet)
- Feature planning → @planner or @fullstack-architect (Opus)
- n8n conversion → @n8n-converter (Opus)
- Documentation → @doc-updater (Sonnet)

## When NOT to Use Agents
- Simple questions or explanations
- Single-file edits
- Quick lookups

## Agent Best Practices
- Use Haiku agents for exploration (cheap, fast)
- Use Sonnet agents for implementation tasks
- Use Opus agents only for complex planning
- Each agent gets its own context window — use this to your advantage
- Complex tasks = main agent orchestrates, subagents do focused work

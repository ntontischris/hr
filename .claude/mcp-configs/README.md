# MCP Server Configuration

MCP (Model Context Protocol) connects Claude Code to external tools.
Add servers to `.claude/settings.json` under `mcpServers`.

## Example: GitHub MCP
```json
{
  "mcpServers": {
    "github": {
      "type": "url",
      "url": "https://mcp.github.com/sse",
      "name": "github"
    }
  }
}
```

## Popular MCP Servers
- **GitHub**: PR reviews, issue management
- **Sentry**: Error monitoring
- **PostgreSQL**: Database queries (read-only recommended)
- **Slack**: Team notifications
- **Linear/Jira**: Issue tracking

## Setup
1. Find the MCP server URL for your service
2. Add it to `.claude/settings.json` → `mcpServers`
3. Restart Claude Code
4. Claude can now interact with that service via natural language

## Security Note
- Use read-only database connections
- Never give write access to production systems
- Review MCP server permissions carefully

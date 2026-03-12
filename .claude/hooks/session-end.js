#!/usr/bin/env node
/**
 * Session End / Stop Hook — saves session context for future reference
 * 
 * Creates a session summary file with:
 * - Date and project path
 * - Git changes made during session
 * - Key decisions and patterns discovered
 * 
 * Config: "Stop" hook event
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const SESSIONS_DIR = path.join(os.homedir(), '.claude', 'sessions');

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
  } catch {
    return '';
  }
}

function main() {
  // Ensure sessions directory exists
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const projectName = path.basename(process.cwd());
  const filename = `${timestamp}_${projectName}.md`;
  const filepath = path.join(SESSIONS_DIR, filename);

  // Gather session info
  const gitBranch = safeExec('git branch --show-current');
  const gitDiff = safeExec('git diff --stat HEAD~5 2>/dev/null || git diff --stat');
  const gitLog = safeExec('git log --oneline -10 --no-decorate 2>/dev/null');
  const modifiedFiles = safeExec('git diff --name-only HEAD~5 2>/dev/null || git diff --name-only');

  const content = `# Session: ${projectName}
## ${new Date().toISOString()}

### Branch: ${gitBranch || 'unknown'}

### Changes Made
\`\`\`
${gitDiff || 'No git changes detected'}
\`\`\`

### Recent Commits
\`\`\`
${gitLog || 'No commits'}
\`\`\`

### Modified Files
${modifiedFiles ? modifiedFiles.split('\n').map(f => `- ${f}`).join('\n') : 'None detected'}

### Notes
<!-- Add session notes here -->

### TODO for Next Session
<!-- What to continue next time -->
`;

  fs.writeFileSync(filepath, content);
  process.stderr.write(`[Session] Saved to ${filepath}\n`);

  // Clean old sessions (keep last 20)
  const files = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();
  
  files.slice(20).forEach(f => {
    fs.unlinkSync(path.join(SESSIONS_DIR, f));
  });

  // Pass through stdin
  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => process.stdout.write(data));
}

main();

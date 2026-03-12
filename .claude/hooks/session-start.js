#!/usr/bin/env node
/**
 * Session Start Hook — loads context from previous sessions
 * 
 * Runs on SessionStart event. Checks for:
 * 1. Recent session files (last 7 days)
 * 2. Learned skills from continuous learning
 * 3. Project-specific memory
 * 
 * Config in hooks.json:
 * "SessionStart": [{ "matcher": "*", "hooks": [{ "type": "command", "command": "node .claude/hooks/session-start.js" }] }]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SESSIONS_DIR = path.join(os.homedir(), '.claude', 'sessions');
const LEARNED_DIR = path.join(os.homedir(), '.claude', 'skills', 'learned');
const PROJECT_MEMORY = path.join(process.cwd(), '.claude', 'memory.md');

function main() {
  const messages = [];

  // 1. Check for recent sessions
  if (fs.existsSync(SESSIONS_DIR)) {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.md') || f.endsWith('.tmp'))
      .filter(f => {
        const stat = fs.statSync(path.join(SESSIONS_DIR, f));
        return (now - stat.mtimeMs) < sevenDays;
      })
      .sort((a, b) => {
        const sa = fs.statSync(path.join(SESSIONS_DIR, a));
        const sb = fs.statSync(path.join(SESSIONS_DIR, b));
        return sb.mtimeMs - sa.mtimeMs;
      });

    if (files.length > 0) {
      messages.push(`[Memory] ${files.length} recent session(s) found`);
      messages.push(`[Memory] Latest: ${path.join(SESSIONS_DIR, files[0])}`);
      messages.push(`[Memory] Load with: cat ${path.join(SESSIONS_DIR, files[0])}`);
    }
  }

  // 2. Check for learned skills
  if (fs.existsSync(LEARNED_DIR)) {
    const skills = fs.readdirSync(LEARNED_DIR).filter(f => f.endsWith('.md'));
    if (skills.length > 0) {
      messages.push(`[Memory] ${skills.length} learned skill(s) available in ${LEARNED_DIR}`);
    }
  }

  // 3. Check for project-specific memory
  if (fs.existsSync(PROJECT_MEMORY)) {
    const content = fs.readFileSync(PROJECT_MEMORY, 'utf8');
    const lines = content.trim().split('\n').length;
    messages.push(`[Memory] Project memory loaded (${lines} lines): ${PROJECT_MEMORY}`);
  }

  // Output to stderr (shown to Claude as context)
  if (messages.length > 0) {
    messages.forEach(m => process.stderr.write(m + '\n'));
  } else {
    process.stderr.write('[Memory] No previous session data found. Fresh start.\n');
  }

  // Pass through stdin to stdout (required by hook protocol)
  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => process.stdout.write(data));
}

main();

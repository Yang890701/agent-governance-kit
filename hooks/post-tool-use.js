#!/usr/bin/env node
// Agent-OS PostToolUse Hook
// Triggered by Claude Code after Edit / Write tool calls (configured via matcher in settings.json).
// Reads JSON from stdin: { session_id, tool_name, tool_input: { file_path, ... }, ... }
// Actions:
//   - If tool_input.file_path is inside agent-os memory area, snapshot the file.
//   - Debounce: skip if same file was snapshotted within DEBOUNCE_MS.
// Always exits 0.
// 備註(中):當 Claude 用 Edit/Write 動到 agent-os 記憶檔時自動 snapshot,60 秒內重複編輯只 snapshot 一次。
//
// Path resolution (D020 engine/data split):
//   ENGINE_ROOT = directory one level up from this hook file. Shared engine code.
//   DATA_ROOT   = <process.cwd()>/.claude/agent-os/. Per-project memory + snapshots.
// Tracked files live under DATA_ROOT — engine files (agents/, hooks/, cli/) are NOT auto-snapshotted.

'use strict';

const fs = require('fs');
const path = require('path');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.join(process.cwd(), '.claude', 'agent-os');
const SNAPSHOT_DIR = path.join(DATA_ROOT, 'snapshots');
const DEBOUNCE_MS = 60_000;

const TRACKED_PREFIXES = [
  path.join(DATA_ROOT, 'PROJECT.md'),
  path.join(DATA_ROOT, 'DECISIONS.md'),
  path.join(DATA_ROOT, 'OPEN_QUESTIONS.md'),
  path.join(DATA_ROOT, 'ROADMAP.md'),
  path.join(DATA_ROOT, 'SESSION_LOG'),
  path.join(DATA_ROOT, 'memory'),
];

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`,
  };
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    setTimeout(() => resolve({}), 2000);
  });
}

function logError(err) {
  try {
    if (!fs.existsSync(DATA_ROOT)) return;
    const errLog = path.join(DATA_ROOT, 'hook-errors.log');
    fs.appendFileSync(errLog, `[${new Date().toISOString()}] post-tool-use: ${err.stack || err}\n`);
  } catch {
    // Silent.
  }
}

function isTracked(filePath) {
  if (!filePath) return false;
  const normalized = path.normalize(filePath);
  return TRACKED_PREFIXES.some((p) => normalized.startsWith(p));
}

function recentSnapshotExists(snapDir, basename) {
  if (!fs.existsSync(snapDir)) return false;
  const now = Date.now();
  const files = fs.readdirSync(snapDir).filter((f) => f.endsWith(basename));
  for (const f of files) {
    const full = path.join(snapDir, f);
    try {
      const stat = fs.statSync(full);
      if (now - stat.mtimeMs < DEBOUNCE_MS) return true;
    } catch {
      // Ignore stat errors.
    }
  }
  return false;
}

async function main() {
  try {
    const payload = await readStdin();
    const filePath = payload?.tool_input?.file_path;
    if (!isTracked(filePath) || !fs.existsSync(filePath)) {
      process.exit(0);
      return;
    }

    const { date, time } = ts();
    const snapDir = path.join(SNAPSHOT_DIR, date);
    const basename = path.basename(filePath);

    if (recentSnapshotExists(snapDir, basename)) {
      process.exit(0);
      return;
    }

    fs.mkdirSync(snapDir, { recursive: true });
    fs.copyFileSync(filePath, path.join(snapDir, `${time}-${basename}`));
  } catch (err) {
    logError(err);
  }
  process.exit(0);
}

main();

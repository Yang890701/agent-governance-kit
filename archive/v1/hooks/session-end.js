#!/usr/bin/env node
// Agent-OS Session-End Hook
// Triggered by Claude Code on SessionEnd event.
// Reads JSON from stdin: { session_id, transcript_path, hook_event_name, reason }
// Actions:
//   1. Snapshot PROJECT.md / DECISIONS.md / OPEN_QUESTIONS.md to snapshots/<date>/
//   2. Append "Session End Marker" to today's latest SESSION_LOG file
// Always exits 0 — hooks must never block Claude Code.
// 備註(中):session 結束時自動 snapshot 主要 memory 檔 + 標記今日 log 已結束。
//
// Path resolution (D020 engine/data split):
//   ENGINE_ROOT = directory one level up from this hook file. Shared engine code.
//   DATA_ROOT   = <process.cwd()>/.claude/agent-os/. Per-project memory + logs + snapshots.

'use strict';

const fs = require('fs');
const path = require('path');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.join(process.cwd(), '.claude', 'agent-os');
const SESSION_LOG_DIR = path.join(DATA_ROOT, 'SESSION_LOG');
const SNAPSHOT_DIR = path.join(DATA_ROOT, 'snapshots');
const KEY_FILES = ['PROJECT.md', 'DECISIONS.md', 'OPEN_QUESTIONS.md', 'ROADMAP.md'];

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`,
    iso: d.toISOString(),
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
    fs.appendFileSync(errLog, `[${new Date().toISOString()}] session-end: ${err.stack || err}\n`);
  } catch {
    // Silent.
  }
}

async function main() {
  try {
    const payload = await readStdin();
    const { date, time, iso } = ts();

    // 1. Snapshot key memory files (skip when no DATA_ROOT — non-agent-os CWD)
    if (!fs.existsSync(DATA_ROOT)) {
      process.exit(0);
      return;
    }
    const snapDir = path.join(SNAPSHOT_DIR, date);
    fs.mkdirSync(snapDir, { recursive: true });
    for (const file of KEY_FILES) {
      const src = path.join(DATA_ROOT, file);
      if (fs.existsSync(src)) {
        const dst = path.join(snapDir, `${time}-${file}`);
        fs.copyFileSync(src, dst);
      }
    }

    // 2. Find today's latest SESSION_LOG and append a marker.
    //    Dedup by session_id so same session firing twice produces only one marker,
    //    but new sessions always get their own marker.
    if (fs.existsSync(SESSION_LOG_DIR)) {
      const todayFiles = fs.readdirSync(SESSION_LOG_DIR)
        .filter((f) => f.startsWith(date) && f.endsWith('.md'))
        .sort()
        .reverse();
      if (todayFiles.length > 0) {
        const latestLog = path.join(SESSION_LOG_DIR, todayFiles[0]);
        const content = fs.readFileSync(latestLog, 'utf8');
        const sessionId = payload.session_id || `unknown-${iso}`;
        const sessionMarker = `Session ID: ${sessionId}`;
        if (!content.includes(sessionMarker)) {
          const marker = `\n---\n\n## Session End Marker\n\n- Ended at: ${iso}\n- Reason: ${payload.reason || 'unknown'}\n- Session ID: ${sessionId}\n`;
          fs.appendFileSync(latestLog, marker);
        }
      }
    }
  } catch (err) {
    logError(err);
  }
  process.exit(0);
}

main();

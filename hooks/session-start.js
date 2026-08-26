#!/usr/bin/env node
// Agent-OS SessionStart Hook
// Triggered by Claude Code at session start / resume / compact.
// Reads JSON from stdin: { session_id, source, hook_event_name, cwd, ... }
// Emits stdout JSON: { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: "..." } }
//
// LEAN INJECTION (A2, 2026-06-05): only the always-needed protocol + state is injected:
//   - BRAIN.md  (full)            — the active operating protocol; must be resident to work.
//   - PROJECT.md WAKE-SUMMARY     — ~1k summary block only (current phase / next action / blocker / rules).
//   - active handoff ticket       — only if one is genuinely open.
// Everything else (ROADMAP.md, DECISIONS.md, full PROJECT.md, full SESSION_LOG, routing-log)
// is ON-DEMAND — read when the task needs it. This cut per-session injection ~33k -> ~9k tokens.
//
// Skipped when source === "clear" (user explicitly wanted a fresh slate).
// Always exits 0 — hooks must never block Claude Code.
// 備註(中):session 開始時只灌「該常駐的」——BRAIN 全文 + PROJECT 摘要 + 有票才灌的交接票;其餘改 on-demand。
//
// Path resolution (D020 engine/data split; D029 BRAIN->engine):
//   ENGINE_ROOT = directory one level up from this hook file. Holds shared engine code + BRAIN.md.
//   DATA_ROOT   = <process.cwd()>/.claude/agent-os/. Per-project memory + logs (NOT BRAIN.md).
//   BRAIN.md is read from ENGINE_ROOT by default; a per-project DATA_ROOT/BRAIN.md overrides it.

'use strict';

const fs = require('fs');
const path = require('path');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.join(process.cwd(), '.claude', 'agent-os');
const SESSION_LOG_DIR = path.join(DATA_ROOT, 'SESSION_LOG');
const PROJECT_MD = path.join(DATA_ROOT, 'PROJECT.md');
const PROJECT_BRAIN_MD = path.join(DATA_ROOT, 'BRAIN.md'); // optional per-project override
const ENGINE_BRAIN_MD = path.join(ENGINE_ROOT, 'BRAIN.md'); // shared default (D029)
const HANDOFF_MD = path.join(DATA_ROOT, 'memory', 'brain-handoff.md');
const OPS_CORE_MD = path.join(ENGINE_ROOT, 'OPS-CORE.md'); // repo-sourced hard rules (2026-07-04)
const OPS_DIR = path.resolve(ENGINE_ROOT, 'mechanisms'); // full rule set lives inside the kit root (mechanisms/)

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
    fs.appendFileSync(errLog, `[${new Date().toISOString()}] session-start: ${err.stack || err}\n`);
  } catch {
    // Silent.
  }
}

// BRAIN.md is shared from the ENGINE by default; a per-project copy (DATA_ROOT/BRAIN.md), if
// present, overrides it. (D029) Single-sourcing the protocol in the engine means every project
// always wakes with the current brain — no per-project drift — while still allowing a project to
// ship its own customized protocol.
function readBrainMd() {
  if (fs.existsSync(PROJECT_BRAIN_MD)) return fs.readFileSync(PROJECT_BRAIN_MD, 'utf8');
  if (fs.existsSync(ENGINE_BRAIN_MD)) return fs.readFileSync(ENGINE_BRAIN_MD, 'utf8');
  return null;
}

// OPS-CORE: repo-sourced session hard rules (encoding / honesty / dispatch / verify / irreversibles).
// Living in the engine repo means `git pull` updates behavior on every machine — no machine-local
// CLAUDE.md dependency. {{OPS_DIR}} placeholder resolves to this machine's actual mechanisms/ path.
function readOpsCore() {
  if (!fs.existsSync(OPS_CORE_MD)) return null;
  const raw = fs.readFileSync(OPS_CORE_MD, 'utf8');
  return raw.split('{{OPS_DIR}}').join(OPS_DIR.replace(/\\/g, '/'));
}

// Inject only the delimited WAKE-SUMMARY block of PROJECT.md (full file is on-demand).
// Falls back to the first ~60 lines if the markers are absent (e.g. an old PROJECT.md).
function readProjectSummary() {
  if (!fs.existsSync(PROJECT_MD)) return null;
  const full = fs.readFileSync(PROJECT_MD, 'utf8');
  const m = full.match(/<!--\s*WAKE-SUMMARY:START[\s\S]*?-->\s*([\s\S]*?)\s*<!--\s*WAKE-SUMMARY:END\s*-->/);
  if (m) return m[1].trim();
  return full.split('\n').slice(0, 60).join('\n').trim();
}

// Inject the active handoff ticket ONLY if one is genuinely open (its ACTIVE section has a ticket-id).
function readActiveHandoff() {
  if (!fs.existsSync(HANDOFF_MD)) return null;
  const full = fs.readFileSync(HANDOFF_MD, 'utf8');
  const m = full.match(/##\s*ACTIVE ticket\s*([\s\S]*?)(?:\n---|\n##\s|$)/);
  if (!m) return null;
  const body = m[1].trim();
  if (!/ticket-id/i.test(body)) return null; // "(none ...)" placeholder -> nothing to resume
  return body;
}

// Just the filename of the latest session log — full content is on-demand.
function latestSessionLogName() {
  if (!fs.existsSync(SESSION_LOG_DIR)) return null;
  const files = fs.readdirSync(SESSION_LOG_DIR).filter((f) => f.endsWith('.md')).sort().reverse();
  return files.length ? files[0] : null;
}

function buildAdditionalContext(source) {
  const brain = readBrainMd();
  const opsCore = readOpsCore();
  const projectSummary = readProjectSummary();
  const handoff = readActiveHandoff();
  const latestLog = latestSessionLogName();

  const blocks = [];
  blocks.push('# Agent-OS Memory Wake-Up');
  blocks.push('');
  blocks.push(`Auto-injected by SessionStart hook (source: ${source || 'unknown'}).`);
  blocks.push('Lean injection: BRAIN protocol + PROJECT wake-summary + any active handoff. Everything else is on-demand.');
  blocks.push('Bundle root: `.claude/agent-os/`');
  blocks.push('');

  if (brain) {
    blocks.push('---');
    blocks.push('## BRAIN.md — ACTIVE Dispatcher protocol (apply to EVERY request this session)');
    blocks.push('');
    blocks.push(brain.trimEnd());
    blocks.push('');
  }

  if (opsCore) {
    blocks.push('---');
    blocks.push('## OPS-CORE — session hard rules (always active; full rule set on-demand at the paths inside)');
    blocks.push('');
    blocks.push(opsCore.trimEnd());
    blocks.push('');
  }

  if (projectSummary) {
    blocks.push('---');
    blocks.push('## PROJECT — Wake Summary (full PROJECT.md is on-demand)');
    blocks.push('');
    blocks.push(projectSummary);
    blocks.push('');
  } else {
    blocks.push('PROJECT.md missing — this looks like a fresh install. Treat the project as new.');
    blocks.push('');
  }

  if (handoff) {
    blocks.push('---');
    blocks.push('## Active Handoff Ticket (resume this without the user re-explaining)');
    blocks.push('');
    blocks.push(handoff);
    blocks.push('');
  }

  blocks.push('---');
  blocks.push('## Resume Protocol');
  blocks.push('');
  blocks.push('0. **The BRAIN.md Dispatcher protocol above is ACTIVE** — apply it to every request (route / ask-if-unsure / self-critique / log). If BRAIN.md was absent, skip this step.');
  blocks.push('1. The BRAIN protocol + the PROJECT wake-summary above are already loaded — do NOT re-read them.');
  blocks.push(
    '2. **On-demand (read only when the task needs it):** `ROADMAP.md` (full plan + anti-drift) · `DECISIONS.md` (D-numbered) · `PROJECT.md` full (roster / checkpoint / file-map) · latest `SESSION_LOG`'
    + (latestLog ? ' (`' + latestLog + '`)' : '')
    + ' · `memory/brain-routing-log.md` (the Brain greps it for recall).'
  );
  blocks.push('3. **Anti-drift check:** confirm the wake-summary Next action still matches ROADMAP\'s first non-completed item — read `ROADMAP.md` then if unsure. If mismatch, stop and ask the user.');
  blocks.push('4. Continue from the Next action in the wake-summary.');
  blocks.push('5. At session end, append a SESSION_LOG entry and refresh the PROJECT wake-summary + Last Checkpoint.');

  return blocks.join('\n');
}

async function main() {
  try {
    const payload = await readStdin();
    const source = payload.source;

    // Skip injection when user explicitly cleared — they want a fresh slate.
    if (source === 'clear') {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: '',
        },
      }));
      process.exit(0);
      return;
    }

    const additionalContext = buildAdditionalContext(source);
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext,
      },
    }));
  } catch (err) {
    logError(err);
  }
  process.exit(0);
}

main();

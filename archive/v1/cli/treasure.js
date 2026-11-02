#!/usr/bin/env node
// agent-os treasure — mark memory as TREASURE (永不刪)
// Usage:
//   node cli/treasure.js list                                        — list all treasures (both scopes)
//   node cli/treasure.js add "<title>" "<content>" [--universal]     — create a new treasure
//   node cli/treasure.js mark <session-log-file> [--universal]       — copy a SESSION_LOG into TREASURE/
//
// Scopes:
//   default     → memory/TREASURE/*.md           (project-only)
//   --universal → memory/TREASURE/universal/*.md (propagates across projects via sync-universal.js)
//
// Treasures live in memory/TREASURE/. memory-curator NEVER touches them.
// 備註(中):重要記憶標記為 TREASURE,curator 永遠不會自動刪。
// 備註(中):加 --universal 旗標寫到 universal/,可透過 sync-universal.js 散布到其他專案。

'use strict';

const fs = require('fs');
const path = require('path');

// Path resolution (D020 engine/data split):
//   ENGINE_ROOT = this CLI's installation, shared across all projects.
//   DATA_ROOT   = <process.cwd()>/.claude/agent-os/ — per-project memory.
// Project TREASURE lives in data; universal TREASURE lives in engine (single source of truth).
const ENGINE_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.join(process.cwd(), '.claude', 'agent-os');
const TREASURE_DIR = path.join(DATA_ROOT, 'memory', 'TREASURE');
const UNIVERSAL_DIR = path.join(ENGINE_ROOT, 'memory', 'universal');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\-_一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Centralised hard-fail for fs errors: friendly message + non-zero exit,
// matching the console.error/exit style used elsewhere instead of an unhandled crash.
function failFs(action, err) {
  console.error(`Error: failed to ${action}: ${err && err.message ? err.message : err}`);
  process.exit(1);
}

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    failFs(`create directory ${dir}`, err);
  }
}

function parseFlags(args) {
  const flags = { universal: false };
  const positional = [];
  for (const arg of args) {
    if (arg === '--universal' || arg === '-u') flags.universal = true;
    else positional.push(arg);
  }
  return { flags, positional };
}

function listDir(dir, scopeLabel) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const titleMatch = content.match(/^# (.+)/m);
      const title = titleMatch ? titleMatch[1] : f;
      return { name: f, title, scopeLabel };
    });
}

function listTreasures() {
  ensureDir(TREASURE_DIR);
  const projectItems = listDir(TREASURE_DIR, '');
  const universalItems = listDir(UNIVERSAL_DIR, 'universal/');

  if (projectItems.length === 0 && universalItems.length === 0) {
    console.log('No treasures yet. Use `treasure add "<title>" "<content>" [--universal]` to mark one.');
    return;
  }

  if (projectItems.length > 0) {
    console.log(`Project-only (${projectItems.length}):`);
    for (const it of projectItems) console.log(`  - ${it.name}: ${it.title}`);
  }
  if (universalItems.length > 0) {
    console.log(`Universal (${universalItems.length}):`);
    for (const it of universalItems) console.log(`  - universal/${it.name}: ${it.title}`);
  }
}

function requireDataRoot() {
  if (!fs.existsSync(DATA_ROOT)) {
    console.error(`No agent-os data dir at: ${DATA_ROOT}`);
    console.error('Run install.ps1 in this project root, or `cd` to a project that has agent-os installed.');
    process.exit(2);
  }
}

function addTreasure(title, content, isUniversal) {
  if (!isUniversal) requireDataRoot();
  const targetDir = isUniversal ? UNIVERSAL_DIR : TREASURE_DIR;
  ensureDir(targetDir);
  if (!title || !content) {
    console.error('Usage: treasure add "<title>" "<content>" [--universal]');
    process.exit(1);
  }
  const date = new Date().toISOString().slice(0, 10);
  const slug = slugify(title) || 'untitled';
  const filename = `${date}-${slug}.md`;
  const full = path.join(targetDir, filename);

  if (fs.existsSync(full)) {
    console.error(`Treasure already exists: ${filename}. Pick a different title.`);
    process.exit(1);
  }

  const scope = isUniversal ? 'engine universal/' : 'project TREASURE/';
  const body = `---
type: treasure
created: ${new Date().toISOString()}
status: permanent
source: cli
scope: ${isUniversal ? 'universal' : 'project'}
---

# ${title}

${content}

備註(中):此檔被標記為 TREASURE,memory-curator 不可自動刪除。
`;
  try {
    fs.writeFileSync(full, body);
  } catch (err) {
    failFs(`write treasure ${full}`, err);
  }
  console.log(`Treasure saved to ${scope}: ${full}`);
}

function markSession(sessionFile, isUniversal) {
  requireDataRoot();
  const targetDir = isUniversal ? UNIVERSAL_DIR : TREASURE_DIR;
  ensureDir(targetDir);
  if (!sessionFile) {
    console.error('Usage: treasure mark <session-log-filename> [--universal]');
    process.exit(1);
  }
  const src = path.isAbsolute(sessionFile)
    ? sessionFile
    : path.join(DATA_ROOT, 'SESSION_LOG', sessionFile);
  if (!fs.existsSync(src)) {
    console.error(`Source file not found: ${src}`);
    process.exit(1);
  }
  const content = fs.readFileSync(src, 'utf8');
  const basename = path.basename(src, '.md');
  const filename = `${basename}-treasured.md`;
  const dst = path.join(targetDir, filename);

  if (fs.existsSync(dst)) {
    console.error(`Already treasured: ${filename}`);
    process.exit(1);
  }

  const scope = isUniversal ? 'engine universal/' : 'project TREASURE/';
  const body = `---
type: treasure
created: ${new Date().toISOString()}
status: permanent
source: SESSION_LOG/${path.basename(src)}
scope: ${isUniversal ? 'universal' : 'project'}
---

# Treasured Session — ${basename}

${content}
`;
  try {
    fs.writeFileSync(dst, body);
  } catch (err) {
    failFs(`write treasure ${dst}`, err);
  }
  console.log(`Session log copied to ${scope}: ${dst}`);
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { flags, positional } = parseFlags(rest);
  switch (cmd) {
    case 'list':
      listTreasures();
      break;
    case 'add':
      addTreasure(positional[0], positional[1], flags.universal);
      break;
    case 'mark':
      markSession(positional[0], flags.universal);
      break;
    default:
      console.error('Usage:');
      console.error('  treasure list');
      console.error('  treasure add "<title>" "<content>" [--universal]');
      console.error('  treasure mark <session-log-file> [--universal]');
      process.exit(1);
  }
}

main();

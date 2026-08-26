#!/usr/bin/env node
'use strict';

// agent-os doctor -- read-only health checks for drift-prone engine state.
//
// Default mode prints PASS/WARN/FAIL but exits 0 so existing historical drift can
// be surfaced without breaking every smoke run. Use --strict to exit 1 on FAIL.

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = ENGINE_ROOT; // kit layout: the kit root IS the git repo root (the source engine sat one level below its repo root)
const AGENTS_DIR = path.join(ENGINE_ROOT, 'agents');
const COMMANDS_DIR = path.join(ENGINE_ROOT, 'commands');
const BRAIN_MD = path.join(ENGINE_ROOT, 'BRAIN.md');
const ARCHITECTURE_MD = path.join(ENGINE_ROOT, '.claude', 'agent-os', 'ARCHITECTURE.md');
const ENGINE_SETTINGS = path.join(ENGINE_ROOT, '.claude', 'settings.json');
const TEMPLATE_SETTINGS = path.join(ENGINE_ROOT, 'template', 'skeleton', '.claude', 'settings.json');
const MEMORY_DIR = path.join(ENGINE_ROOT, 'memory');
const REFERENCES_DIR = path.join(ENGINE_ROOT, 'references');
const REFERENCES_README = path.join(REFERENCES_DIR, 'README.md');
const PORTABLE_REFERENCE_DOCS = ['agent-readiness-scorecard.md'];

const strict = process.argv.includes('--strict');
const useJson = process.argv.includes('--json');
const results = [];

function add(level, id, message, details = []) {
  results.push({ level, id, message, details });
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => !ext || name.endsWith(ext))
    .sort()
    .map((name) => path.join(dir, name));
}

function runGit(args) {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', timeout: 10000 })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return null;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseFrontmatter(file) {
  const text = read(file);
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  }
  return data;
}

function extractSection(text, startHeading, endHeadingPattern) {
  const start = text.indexOf(startHeading);
  if (start < 0) return '';
  const tail = text.slice(start);
  const end = tail.search(endHeadingPattern);
  return end >= 0 ? tail.slice(0, end) : tail;
}

function parseBrainRosterNames() {
  if (!fs.existsSync(BRAIN_MD)) return [];
  const brain = read(BRAIN_MD);
  const section = extractSection(brain, '## Roster', /\n## Workflows\b/);
  const names = [];
  for (const line of section.split(/\r?\n/)) {
    const m = line.match(/^\|\s*`([^`]+)`\s*\|/);
    if (m) names.push(m[1]);
  }
  return names.sort();
}

function checkAgentFrontmatter() {
  // README.md in agents/ is the provenance-card page, never an agent definition (same rule as the installer).
  const files = listFiles(AGENTS_DIR, '.md').filter((f) => path.basename(f) !== 'README.md');
  if (!files.length) {
    add('FAIL', 'agents.present', `No agent definitions found at ${AGENTS_DIR}`);
    return [];
  }

  const agents = [];
  const problems = [];
  for (const file of files) {
    const fm = parseFrontmatter(file);
    const basename = path.basename(file, '.md');
    if (!fm || !fm.name || !fm.description) {
      problems.push(`${path.relative(REPO_ROOT, file)} missing name/description frontmatter`);
      continue;
    }
    if (fm.name !== basename) {
      problems.push(`${path.relative(REPO_ROOT, file)} has name "${fm.name}", expected "${basename}"`);
    }
    agents.push({ name: fm.name || basename, file });
  }

  if (problems.length) {
    add('FAIL', 'agents.frontmatter', 'Agent frontmatter drift detected.', problems);
  } else {
    add('PASS', 'agents.frontmatter', `${agents.length} agent frontmatter block(s) are complete.`);
  }
  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

function checkBrainRoster(agentNames) {
  if (!fs.existsSync(BRAIN_MD)) {
    add('FAIL', 'brain.present', `Missing ${BRAIN_MD}`);
    return;
  }
  const roster = parseBrainRosterNames();
  const missing = agentNames.filter((name) => !roster.includes(name));
  const extra = roster.filter((name) => !agentNames.includes(name));

  if (missing.length || extra.length) {
    add('FAIL', 'brain.roster', 'BRAIN.md roster does not match agents/*.md.', [
      missing.length ? `missing from BRAIN.md: ${missing.join(', ')}` : null,
      extra.length ? `listed in BRAIN.md but no agent file: ${extra.join(', ')}` : null,
    ].filter(Boolean));
  } else {
    add('PASS', 'brain.roster', `BRAIN.md lists all ${agentNames.length} agent definition(s).`);
  }
}

function checkArchitectureCount(agentCount) {
  if (!fs.existsSync(ARCHITECTURE_MD)) {
    add('WARN', 'architecture.present', `Missing ${ARCHITECTURE_MD}`);
    return;
  }
  const arch = read(ARCHITECTURE_MD);
  const currentSection = extractSection(arch, '## 目前狀態', /\n---\r?\n\r?\n## 一句話定位/);
  const tableSection = extractSection(arch, '### 名稱對照 — 👷', /\n### 名稱對照 — 🏭/);
  const currentHasCount = currentSection.includes(`${agentCount} 隻`);
  const tableHasCount = tableSection.includes(`${agentCount} 隻`);
  if (!currentHasCount || !tableHasCount) {
    add('WARN', 'architecture.agent-count', `ARCHITECTURE.md may not reflect ${agentCount} current agent definition(s).`, [
      'Checked the current-status section and the agent-name table heading only.',
    ]);
  } else {
    add('PASS', 'architecture.agent-count', `ARCHITECTURE.md current sections mention ${agentCount} agent definition(s).`);
  }
}

function collectHookCommands(settingsFile) {
  const out = [];
  if (!fs.existsSync(settingsFile)) return out;
  let json;
  try {
    json = JSON.parse(read(settingsFile));
  } catch (err) {
    add('FAIL', 'settings.parse', `${path.relative(REPO_ROOT, settingsFile)} is not valid JSON: ${err.message}`);
    return out;
  }
  for (const entries of Object.values(json.hooks || {})) {
    for (const entry of entries || []) {
      for (const hook of entry.hooks || []) {
        if (hook && hook.type === 'command' && hook.command) out.push(hook.command);
      }
    }
  }
  return out;
}

function checkHookPaths() {
  const settingsFiles = [ENGINE_SETTINGS, TEMPLATE_SETTINGS];
  for (const file of settingsFiles) {
    if (!fs.existsSync(file)) {
      if (file === ENGINE_SETTINGS) {
        // The kit ships no root-session settings on purpose — per-project hook wiring is
        // generated by template/install.ps1 at install time.
        add('WARN', 'settings.present', 'No .claude/settings.json at the kit root (expected for a fresh kit checkout; the installer wires hooks per project).');
      } else {
        add('FAIL', 'settings.present', `Missing ${path.relative(REPO_ROOT, file)}`);
      }
      continue;
    }
    const missing = [];
    for (const cmd of collectHookCommands(file)) {
      const parts = cmd.trim().split(/\s+/);
      const script = parts[0] === 'node' ? parts.slice(1).join(' ') : parts.join(' ');
      const resolved = script.replace(/^"|"$/g, '');
      if (!fs.existsSync(resolved)) missing.push(`${cmd} -> ${resolved}`);
    }
    if (missing.length) {
      add('FAIL', 'settings.hook-paths', `${path.relative(REPO_ROOT, file)} has hook commands pointing at missing scripts.`, missing);
    } else {
      add('PASS', 'settings.hook-paths', `${path.relative(REPO_ROOT, file)} hook script paths exist.`);
    }
  }
}

function checkRootCwdWarning() {
  const cwd = path.resolve(process.cwd());
  const cwdData = path.join(cwd, '.claude', 'agent-os');
  const nestedAgentOsData = path.join(cwd, 'agent-os', '.claude', 'agent-os');
  if (!fs.existsSync(cwdData) && fs.existsSync(nestedAgentOsData)) {
    add('WARN', 'cwd.agent-os-root', `Current cwd looks like the repo root, not the Agent-OS project root: ${cwd}`, [
      'Open Claude Code from the kit root (the agent-os directory) for the Agent-OS self project.',
      'This doctor warning is intentional; SessionStart hook data-root behavior was not changed.',
    ]);
  } else {
    add('PASS', 'cwd.agent-os-root', 'Current cwd does not look like the repo-root miswake case.');
  }
}

function checkHealthTodos() {
  const todos = listFiles(MEMORY_DIR, '.md').filter((file) => path.basename(file).startsWith('_TODO-health-FAIL-'));
  if (!todos.length) {
    add('PASS', 'health.todos', 'No engine health-fail TODO files found.');
    return;
  }
  const stale = [];
  for (const file of todos) {
    const text = read(file);
    const reportMatch = text.match(/-\s*Report:\s*`([^`]+)`/);
    const report = reportMatch && reportMatch[1];
    if (!report || !fs.existsSync(report)) {
      stale.push(`${path.relative(REPO_ROOT, file)} -> ${report || 'no Report field'}`);
    }
  }
  if (stale.length) {
    add('WARN', 'health.todos', 'Some health-fail TODO files point at missing reports.', stale);
  } else {
    add('PASS', 'health.todos', `${todos.length} health-fail TODO file(s) point at existing reports.`);
  }
}

function checkTrackedSnapshots() {
  const files = runGit(['ls-files', 'agent-os/.claude/agent-os/snapshots']);
  if (!files) {
    add('WARN', 'git.snapshots', 'Could not run git ls-files for snapshots.');
    return;
  }
  const tracked = files.filter((file) => !file.endsWith('.gitkeep'));
  if (tracked.length) {
    add('WARN', 'git.snapshots', `${tracked.length} hook-generated snapshot file(s) are still tracked by git.`, [
      'Recommended later cleanup: git rm --cached tracked snapshots, keep local files and .gitkeep.',
    ]);
  } else {
    add('PASS', 'git.snapshots', 'No hook-generated snapshot files are tracked by git.');
  }
}

function checkIgnoredReferenceMentions() {
  const tracked = runGit(['ls-files']);
  if (!tracked) {
    add('WARN', 'references.private', 'Could not scan tracked files for ignored reference mentions.');
    return;
  }
  const trackedSet = new Set(tracked);
  const privateSources = [
    { id: 'agent-os-intake', manifest: ['agent-os-intake'], re: /agent-os-intake/i },
    { id: 'agent-os/references/original-toolkits-backup-2026-05-28', manifest: ['agent-os/references/original-toolkits-backup-2026-05-28'], re: /(?:agent-os[\\/])?references[\\/]original-toolkits-backup-2026-05-28/i },
  ];
  const privateHits = new Map();
  const portableRefs = new Map();

  for (const rel of tracked.filter((file) => file.endsWith('.md'))) {
    const full = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const text = read(full);
    for (const source of privateSources) {
      if (source.re.test(text)) {
        if (!privateHits.has(source.id)) privateHits.set(source.id, { source, files: new Set() });
        privateHits.get(source.id).files.add(rel);
      }
    }
    for (const doc of PORTABLE_REFERENCE_DOCS) {
      const re = new RegExp(`(?:agent-os[\\\\/])?references[\\\\/]${escapeRegExp(doc)}`, 'i');
      if (re.test(text)) {
        if (!portableRefs.has(doc)) portableRefs.set(doc, new Set());
        portableRefs.get(doc).add(rel);
      }
    }
  }

  const problems = [];
  for (const doc of portableRefs.keys()) {
    const rel = `agent-os/references/${doc}`;
    if (!trackedSet.has(rel)) {
      problems.push(`${rel} is referenced but not tracked by git`);
    }
  }

  if (privateHits.size) {
    const readmeRel = 'agent-os/references/README.md';
    if (!trackedSet.has(readmeRel)) {
      problems.push(`${readmeRel} must document private provenance sources`);
    } else if (!fs.existsSync(REFERENCES_README)) {
      problems.push(`${readmeRel} is tracked but missing on disk`);
    } else {
      const manifest = read(REFERENCES_README);
      for (const entry of privateHits.values()) {
        const documented = entry.source.manifest.some((token) => manifest.includes(token));
        if (!documented) {
          problems.push(`${entry.source.id} is mentioned but not documented in ${readmeRel}`);
        }
      }
    }
  }

  if (problems.length) {
    add('WARN', 'references.private', 'Private/reference portability issues remain.', problems.slice(0, 20));
  } else if (privateHits.size || portableRefs.size) {
    add('PASS', 'references.private', 'Private provenance is documented and referenced portable docs are tracked.', [
      privateHits.size ? `documented private source area(s): ${Array.from(privateHits.values()).map((entry) => entry.source.display || entry.source.id).join(', ')}` : null,
      portableRefs.size ? `tracked portable reference doc(s): ${Array.from(portableRefs.keys()).join(', ')}` : null,
    ].filter(Boolean));
  } else {
    add('PASS', 'references.private', 'No tracked markdown mentions private source areas or portable reference docs.');
  }
}

// --- 2026-07-06 additions (operator-approved): description length / decisions order / ghost decision refs ---

const SKILLS_DIR = path.join(ENGINE_ROOT, 'skills');
const DECISIONS_MD = path.join(ENGINE_ROOT, '.claude', 'agent-os', 'DECISIONS.md');
const PLANNING_DOCS_DIR = path.join(ENGINE_ROOT, '.claude', 'agent-os');
const DESC_FAIL_AT = 1024; // Claude Code silently skips registration at >=1024 chars (measured 2026-07-04)
const DESC_WARN_AT = 950;  // headroom rule: slim before anyone's edit pushes it over the cliff

function checkDescriptionLength() {
  const targets = listFiles(AGENTS_DIR, '.md');
  if (fs.existsSync(SKILLS_DIR)) {
    for (const name of fs.readdirSync(SKILLS_DIR)) {
      const skillMd = path.join(SKILLS_DIR, name, 'SKILL.md');
      if (fs.existsSync(skillMd)) targets.push(skillMd);
    }
  }
  const fails = [];
  const warns = [];
  let counted = 0;
  for (const file of targets) {
    const fm = parseFrontmatter(file);
    if (!fm || !fm.description) continue; // frontmatter completeness is agents.frontmatter's job
    counted += 1;
    const len = fm.description.length;
    const rel = path.relative(REPO_ROOT, file);
    if (len >= DESC_FAIL_AT) {
      fails.push(`${rel}: description ${len} chars (>= ${DESC_FAIL_AT} -> silently unregistered)`);
    } else if (len > DESC_WARN_AT) {
      warns.push(`${rel}: description ${len} chars (> ${DESC_WARN_AT}, too close to the ${DESC_FAIL_AT} cliff)`);
    }
    // 2026-08-16 second silent-kill cause (ENV §6): an unquoted description containing
    // "colon+space" breaks YAML parsing -> harness silently skips registration
    // (proven: goal-definer/work-auditor were the only 2 of 11 with ": " AND the only 2 unregistered).
    if (/: /.test(fm.description)) {
      fails.push(`${rel}: description contains "colon+space" (unquoted YAML parses it as a nested mapping -> silently unregistered; replace with a dash or quote the whole value)`);
    }
  }
  if (fails.length) {
    add('FAIL', 'frontmatter.description-length', 'Agent/skill description(s) at or over the 1024-char registration cliff.', fails);
  } else if (warns.length) {
    add('WARN', 'frontmatter.description-length', 'Agent/skill description(s) close to the 1024-char registration cliff.', warns);
  } else {
    add('PASS', 'frontmatter.description-length', `${counted} agent/skill description(s) are under ${DESC_WARN_AT} chars.`);
  }
}

function parseDecisionIds() {
  if (!fs.existsSync(DECISIONS_MD)) return null;
  const ids = [];
  for (const line of read(DECISIONS_MD).split(/\r?\n/)) {
    const m = line.match(/^##\s+D(\d{3})\b/);
    if (m) ids.push(Number(m[1]));
  }
  return ids;
}

function checkDecisionsOrder() {
  const ids = parseDecisionIds();
  if (ids === null) {
    add('WARN', 'decisions.order', `Missing ${path.relative(REPO_ROOT, DECISIONS_MD)}; cannot check decision ordering.`);
    return [];
  }
  const problems = [];
  const seen = new Set();
  for (let i = 0; i < ids.length; i += 1) {
    if (seen.has(ids[i])) problems.push(`duplicate entry: D${String(ids[i]).padStart(3, '0')}`);
    seen.add(ids[i]);
    if (i > 0 && ids[i] <= ids[i - 1]) {
      problems.push(`out of order: D${String(ids[i - 1]).padStart(3, '0')} is followed by D${String(ids[i]).padStart(3, '0')} (rule: append at the BOTTOM, oldest -> newest, never prepend)`);
    }
  }
  if (problems.length) {
    add('FAIL', 'decisions.order', 'DECISIONS.md entries are not strictly ascending top-to-bottom.', problems);
  } else {
    add('PASS', 'decisions.order', `DECISIONS.md ${ids.length} entr(ies) strictly ascending (D${String(ids[0]).padStart(3, '0')} -> D${String(ids[ids.length - 1]).padStart(3, '0')}).`);
  }
  return ids;
}

function checkDecisionsGhostRefs(ids) {
  if (!ids || !ids.length) {
    add('WARN', 'decisions.ghost-refs', 'No decision ids parsed; skipping ghost-reference scan.');
    return;
  }
  const existing = new Set(ids);
  const maxId = Math.max(...ids);
  // Engine-canonical docs only: cross-project docs (ops/, other project roots) may legitimately cite their OWN D-numbers.
  const docs = listFiles(PLANNING_DOCS_DIR, '.md').filter((file) => path.resolve(file) !== path.resolve(DECISIONS_MD));
  docs.push(BRAIN_MD);
  const ghosts = [];
  const futures = [];
  for (const file of docs) {
    if (!fs.existsSync(file)) continue;
    const rel = path.relative(REPO_ROOT, file);
    const text = read(file);
    const cited = new Set();
    for (const m of text.matchAll(/\bD(\d{3})\b/g)) cited.add(Number(m[1]));
    for (const id of cited) {
      if (existing.has(id)) continue;
      const label = `D${String(id).padStart(3, '0')} cited in ${rel}`;
      if (id > maxId) futures.push(`${label} (beyond latest D${String(maxId).padStart(3, '0')} -> planned/future?)`);
      else ghosts.push(`${label} (does not exist in DECISIONS.md)`);
    }
  }
  if (ghosts.length) {
    add('FAIL', 'decisions.ghost-refs', 'Planning docs cite decision id(s) that do not exist in DECISIONS.md.', ghosts.slice(0, 20));
  } else if (futures.length) {
    add('WARN', 'decisions.ghost-refs', 'Planning docs cite decision id(s) beyond the latest entry.', futures.slice(0, 20));
  } else {
    add('PASS', 'decisions.ghost-refs', `All decision ids cited in ${docs.length} planning doc(s) exist in DECISIONS.md.`);
  }
}

function checkHomeMirror(agentNames) {
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) {
    add('WARN', 'mirror.home', 'No USERPROFILE/HOME set; cannot check ~/.claude mirror.');
    return;
  }
  const homeAgents = path.join(home, '.claude', 'agents');
  const homeCommands = path.join(home, '.claude', 'commands');
  const issues = [];

  for (const name of agentNames) {
    const src = path.join(AGENTS_DIR, `${name}.md`);
    const dst = path.join(homeAgents, `${name}.md`);
    if (!fs.existsSync(dst)) {
      issues.push(`missing agent mirror: ${dst}`);
    } else if (read(src) !== read(dst)) {
      issues.push(`stale agent mirror: ${dst}`);
    }
  }

  for (const src of listFiles(COMMANDS_DIR, '.md')) {
    const dst = path.join(homeCommands, path.basename(src));
    if (!fs.existsSync(dst)) {
      issues.push(`missing command mirror: ${dst}`);
    } else if (read(src) !== read(dst)) {
      issues.push(`stale command mirror: ${dst}`);
    }
  }

  if (issues.length) {
    add('WARN', 'mirror.home', '~/.claude mirror differs from the engine.', issues.slice(0, 20));
  } else {
    add('PASS', 'mirror.home', '~/.claude agent/command mirror matches the engine.');
  }
}

// --- 2026-07-06 addition (operator-approved): unpushed-commit guard (the 2026-07-03 cross-env drift root cause) ---

function checkUnpushedCommits() {
  const ahead = runGit(['rev-list', '--count', '@{upstream}..HEAD']);
  if (ahead === null) {
    add('WARN', 'git.unpushed', 'No upstream tracking branch (or git unavailable); cannot check for unpushed commits.');
    return;
  }
  const n = Number((ahead[0] || '0').trim());
  if (n > 0) {
    add('WARN', 'git.unpushed', `${n} local commit(s) ahead of upstream and not pushed — push before ending the session.`, [
      'Committed-but-unpushed work is invisible to the other environment; this is what caused the 2026-07-03 divergence.',
    ]);
  } else {
    add('PASS', 'git.unpushed', 'No unpushed commits (local is not ahead of upstream).');
  }
}

// --- 2026-07-27 addition (D041 wave-4): routing-log growth sentinel — the Q006 signal sensor ---
// BRAIN.md says grep-recall degrades as the routing log grows and THAT is the signal to build
// the SQLite index (Q006) — but nothing was watching the log size. Read-only line count:
// >200 non-empty lines WARN (consider Q006 / compaction), >500 FAIL (recall almost certainly degraded).
function checkRoutingLogSize() {
  const logPath = path.join(ENGINE_ROOT, '.claude', 'agent-os', 'memory', 'brain-routing-log.md');
  if (!fs.existsSync(logPath)) {
    add('PASS', 'memory.routing-log-size', 'brain-routing-log.md not present (nothing to watch yet).');
    return;
  }
  // 2026-08-16: line-count alone is a bad proxy here — the log format is one ~1KB entry per line,
  // so a 37KB file read as "39 lines, healthy". Gate on BYTES too (grep-recall degrades with volume).
  const raw = read(logPath);
  const lines = raw.split(/\r?\n/).filter((l) => l.trim()).length;
  const bytes = Buffer.byteLength(raw, 'utf8');
  const kb = Math.round(bytes / 1024);
  if (lines > 500 || bytes > 300 * 1024) {
    add('FAIL', 'memory.routing-log-size', `brain-routing-log.md at ${lines} non-empty lines / ${kb}KB (>500 lines or >300KB) — grep-recall is likely degraded; trigger Q006 (SQLite index) or run a compaction pass.`);
  } else if (lines > 200 || bytes > 100 * 1024) {
    add('WARN', 'memory.routing-log-size', `brain-routing-log.md at ${lines} non-empty lines / ${kb}KB (>200 lines or >100KB) — consider the Q006 signal (SQLite index) or a compaction pass (memory-curator).`);
  } else {
    add('PASS', 'memory.routing-log-size', `brain-routing-log.md at ${lines} non-empty lines / ${kb}KB (<=200 lines and <=100KB; grep-recall healthy).`);
  }
}

// --- 2026-07-27 addition (D042): document charter — manifest + status headers ---
// TASK-ROUTING.md carries the single-source-of-truth charter: a fenced ```charter-manifest
// block listing every governed .md doc. A doc on disk that is not in the manifest (or a
// manifest entry missing on disk) -> WARN: register it or archive it. Since 2026-08-20 a
// line may carry an audience column (`<path> | human|AI|both`); only the path joins the
// disk diff, an illegal audience value -> WARN. 2026-08-20 (D050/B5): the sweep now also
// walks SUBDIRECTORIES of ops/, agent-os/memory/ and .claude/agent-os/ (formerly top-level
// only — intake-reports/ and memory/archive/ were silent-orphan blind spots), plus the
// repo-root references/ top level (its _STATUS-FROZEN.md guard stone). A manifest line
// ending in "/" registers the whole directory (directory-level registration — files under
// it are not listed one by one). Planning docs under .claude/agent-os/ must carry a
// "STATUS:" line in their first 6 lines (ACTIVE/FROZEN/ARCHIVED) so a new session knows at
// a glance what to read. Transient files (_TODO-*.md), backups (*.bak-*), auto-flow dirs
// (SESSION_LOG/, snapshots/) and user-memory dirs (TREASURE/, universal/) are exempt by design.

const TASK_ROUTING_MD = path.join(ENGINE_ROOT, '.claude', 'agent-os', 'TASK-ROUTING.md');
const LEGAL_AUDIENCE = ['human', 'AI', 'both'];
const CHARTER_EXCLUDED_DIRS = new Set(['SESSION_LOG', 'snapshots', 'TREASURE', 'universal', 'node_modules', '.git']);

// Parses the ```charter-manifest``` block. Returns null when TASK-ROUTING.md or the block
// is missing; otherwise { files, dirs, badAudience } — dirs are entries ending in "/"
// (directory-level registration). Paths normalized to forward slashes.
function parseCharterManifest() {
  if (!fs.existsSync(TASK_ROUTING_MD)) return null;
  const m = read(TASK_ROUTING_MD).match(/```charter-manifest\r?\n([\s\S]*?)```/);
  if (!m) return null;
  const files = [];
  const dirs = [];
  const badAudience = [];
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const cols = line.split('|').map((s) => s.trim());
    const p = cols[0].replace(/\\/g, '/');
    if (!p) continue;
    (p.endsWith('/') ? dirs : files).push(p);
    if (cols.length > 1 && !LEGAL_AUDIENCE.includes(cols[1])) {
      badAudience.push(`bad audience: ${p} — "${cols[1]}" (want human|AI|both)`);
    }
  }
  return { files, dirs, badAudience };
}

function collectGovernedDocs(dir, prefix, recurse, onDisk) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (recurse && !CHARTER_EXCLUDED_DIRS.has(name)) collectGovernedDocs(full, `${prefix}${name}/`, true, onDisk);
      continue;
    }
    if (!stat.isFile()) continue;
    if (!name.endsWith('.md') || /\.bak-/.test(name) || /^_TODO-/.test(name)) continue;
    onDisk.add(prefix + name);
  }
}

function checkCharter() {
  // Status headers first — an independent promise; must still run when the manifest is broken.
  const planDir = path.join(ENGINE_ROOT, '.claude', 'agent-os');
  if (!fs.existsSync(planDir)) {
    // Fresh kit checkout: the engine root ships no .claude/agent-os data dir — per-project
    // data lives in installed projects (engine/data split). Skip instead of crashing.
    add('WARN', 'charter', 'No .claude/agent-os data dir at the engine root — charter checks skipped (fresh kit checkout; per-project data lives in installed projects).');
    return;
  }
  const STATUS_RE = /^>\s*STATUS:\s*([A-Z]+)\b/m;
  const LEGAL_STATUS = ['ACTIVE', 'FROZEN', 'ARCHIVED'];
  const badStatus = [];
  for (const name of fs.readdirSync(planDir)) {
    if (!name.endsWith('.md') || /\.bak-/.test(name)) continue;
    if (!fs.statSync(path.join(planDir, name)).isFile()) continue;
    const head = read(path.join(planDir, name)).split(/\r?\n/).slice(0, 6).join('\n');
    const sm = head.match(STATUS_RE);
    if (!sm) badStatus.push(`${name}: no "> STATUS:" line in the first 6 lines`);
    else if (!LEGAL_STATUS.includes(sm[1])) badStatus.push(`${name}: illegal STATUS value "${sm[1]}" (want ACTIVE|FROZEN|ARCHIVED)`);
  }
  if (badStatus.length) {
    add('WARN', 'charter.status-headers', `${badStatus.length} planning doc(s) with a missing or illegal STATUS header.`, badStatus);
  } else {
    add('PASS', 'charter.status-headers', 'All .claude/agent-os planning docs carry a legal STATUS line (ACTIVE/FROZEN/ARCHIVED).');
  }

  const manifest = parseCharterManifest();
  if (!manifest) {
    add('WARN', 'charter.manifest', 'TASK-ROUTING.md or its ```charter-manifest``` block not found.');
    return;
  }
  // D050/B5 (2026-08-20): recurse:true = full subdirectory sweep (intake-reports/ and
  // memory/archive/ were silent-orphan blind spots before this). Repo root and the engine
  // root stay top-level: their subdirs are either separately governed here or managed by
  // other checks (agents/commands/skills -> roster/mirror; hands/, agent-os-template/ -> 不入冊).
  // The former separate .claude/agent-os/memory entry is covered by the .claude/agent-os recursion.
  const governed = [
    { dir: REPO_ROOT, prefix: '', recurse: false },
    { dir: path.join(REPO_ROOT, 'ops'), prefix: 'ops/', recurse: true },
    { dir: path.join(REPO_ROOT, 'references'), prefix: 'references/', recurse: false }, // guard stone only; the private research folder is not shipped (no git copy)
    { dir: ENGINE_ROOT, prefix: 'agent-os/', recurse: false },
    { dir: MEMORY_DIR, prefix: 'agent-os/memory/', recurse: true },
    { dir: REFERENCES_DIR, prefix: 'agent-os/references/', recurse: false },
    { dir: path.join(ENGINE_ROOT, '.claude', 'agent-os'), prefix: 'agent-os/.claude/agent-os/', recurse: true },
  ];
  const onDisk = new Set();
  for (const g of governed) collectGovernedDocs(g.dir, g.prefix, g.recurse, onDisk);
  const fileSet = new Set(manifest.files);
  const registered = (f) => fileSet.has(f) || manifest.dirs.some((d) => f.startsWith(d));
  const unregistered = [...onDisk].filter((f) => !registered(f)).sort();
  const missing = [
    ...manifest.files.filter((f) => !onDisk.has(f)),
    ...manifest.dirs.filter((d) => !fs.existsSync(path.join(REPO_ROOT, d))),
  ].sort();
  if (unregistered.length || missing.length || manifest.badAudience.length) {
    add('WARN', 'charter.manifest', `Charter manifest out of sync: ${unregistered.length} unregistered doc(s), ${missing.length} manifest entr(ies) missing on disk, ${manifest.badAudience.length} bad audience value(s).`, [
      ...unregistered.map((f) => `unregistered: ${f} — add to the TASK-ROUTING manifest (file, or the whole dir with a trailing "/") or move it to archive/`),
      ...missing.map((f) => `missing on disk: ${f} — remove from the manifest or restore the file`),
      ...manifest.badAudience,
    ]);
  } else {
    add('PASS', 'charter.manifest', `All ${onDisk.size} governed doc(s) match the TASK-ROUTING charter manifest (incl. subdirectory sweep).`);
  }
}

// --- 2026-08-20 addition (D050 exit-mechanism): active-doc census — the total-weight sentinel ---
// The charter governs registration (entry) and staleness, but nothing watched the TOTAL count
// of live docs — documents died with no one to bury them and the pile only grew. Counts
// manifest FILE entries whose STATUS header (first 6 lines) is ACTIVE — or absent, which is
// presumed ACTIVE (ops/ and root docs legitimately carry no STATUS header). Directory-level
// entries (archive/, intake-reports/) are bulk/closed material and never count.
const ACTIVE_DOCS_WARN_AT = 60; // threshold set at the 2026-08-20 全庫文件盤點 (~40 active docs then); >60 = 該開瘦身健檢

function checkActiveDocCount() {
  const manifest = parseCharterManifest();
  if (!manifest) {
    add('WARN', 'charter.active-count', 'Charter manifest unavailable; cannot count active docs.');
    return;
  }
  let active = 0;
  for (const rel of manifest.files) {
    const full = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(full)) continue; // charter.manifest already flags missing entries
    const head = read(full).split(/\r?\n/).slice(0, 6).join('\n');
    const sm = head.match(/^>\s*STATUS:\s*([A-Z]+)\b/m);
    if (!sm || sm[1] === 'ACTIVE') active += 1;
  }
  if (active > ACTIVE_DOCS_WARN_AT) {
    add('WARN', 'charter.active-count', `${active} ACTIVE governed doc(s) exceed the ${ACTIVE_DOCS_WARN_AT} threshold — 活文件超標,開瘦身健檢 (merge or archive a round before adding more).`);
  } else {
    add('PASS', 'charter.active-count', `${active} ACTIVE governed doc(s) (threshold ${ACTIVE_DOCS_WARN_AT}; the 2026-08-20 inventory counted ~40).`);
  }
}

// --- 2026-08-20 addition (D050 exit-mechanism, menu B11): mirror shadow copies ---
// Ruling 2026-08-20: the mirror canon is the TOP LEVEL of ~/.claude/agents/. A subdirectory
// holding a same-named .md with DIFFERENT content is a shadow copy — stale or diverging
// (the 2026-08-20 audit found 8 divergent files while mirror checks said PASS, because
// nothing ever looked below the top level). MD5 compare; identical duplicates are dormant
// and not flagged.
function checkMirrorShadowCopies() {
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) {
    add('WARN', 'mirror.shadow-copies', 'No USERPROFILE/HOME set; cannot scan ~/.claude/agents subdirectories.');
    return;
  }
  const homeAgents = path.join(home, '.claude', 'agents');
  if (!fs.existsSync(homeAgents)) {
    add('PASS', 'mirror.shadow-copies', 'No ~/.claude/agents directory; nothing to scan.');
    return;
  }
  const md5 = (file) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
  const canon = new Map(); // top-level basename -> md5
  const subdirs = [];
  for (const name of fs.readdirSync(homeAgents)) {
    const full = path.join(homeAgents, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) subdirs.push(full);
    else if (stat.isFile() && name.endsWith('.md')) canon.set(name, md5(full));
  }
  const divergent = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) { walk(full); continue; }
      if (!stat.isFile() || !name.endsWith('.md') || !canon.has(name)) continue;
      if (md5(full) !== canon.get(name)) {
        divergent.push(`${path.relative(homeAgents, full)} diverges from top-level ${name} (top level is the canon — delete or re-mirror the subdir copy)`);
      }
    }
  };
  for (const d of subdirs) walk(d);
  if (divergent.length) {
    add('WARN', 'mirror.shadow-copies', `${divergent.length} same-named agent .md in ~/.claude/agents subdir(s) diverge from the top-level canon.`, divergent.slice(0, 20));
  } else {
    add('PASS', 'mirror.shadow-copies', 'No diverging same-named agent .md under ~/.claude/agents subdirectories.');
  }
}

// --- 2026-07-14 addition: referential integrity on disk (migrated from a retired internal health tracker, D031) ---
//
// That tracker's ONLY real check was `reference_exists_on_disk`: scan the .md corpus for
// references that ASSERT a real on-disk file, and flag the ones whose target does not exist.
// This is complementary to the drift checks above (roster/mirror/frontmatter/decisions/git),
// which never look at whether a cited file is actually present.
//
// The asserted-real-vs-illustrative grammar is REWRITTEN here (not imported — the retired tracker is
// being archived). PRECISION-BIASED like the original: each reference resolves against several
// plausible bases and passes if the target exists at ANY of them; it fires ONLY when it exists
// at none. Strictly read-only. Severity WARN, matching the other content/drift hygiene checks
// (mirror.home, git.snapshots, references.private) rather than the structural FAIL checks.

// Corpus = the engine's own canonical .md docs (same footprint the drift checks already scan):
// .claude/agent-os/*.md (incl. its memory/), the engine-root memory/*.md, and the loose
// engine-root routing docs (BRAIN.md / OPS-CORE.md / building-discipline.md).
const REFERENCE_CORPUS_DIRS = [
  path.join(ENGINE_ROOT, '.claude', 'agent-os'),
  path.join(ENGINE_ROOT, '.claude', 'agent-os', 'memory'),
  MEMORY_DIR,
];
const REFERENCE_CORPUS_ROOT_FILES = ['BRAIN.md', 'OPS-CORE.md', 'building-discipline.md'];
// glob / <placeholder> / spaced payload -> illustrative, never an asserted-real path.
const REF_PLACEHOLDER_RE = /[*<>{}\s…]/;

// grammar primitive: does this backtick/link payload assert a real on-disk file?
function refLooksLikePath(s) {
  if (!s) return false;
  if (/^(https?:|mailto:|ftp:|#)/i.test(s)) return false; // scheme / anchor -> not a filesystem path
  if (/^\/[A-Za-z][\w-]*$/.test(s)) return false;         // slash-command (/treasure) -> a command, not a path
  if (REF_PLACEHOLDER_RE.test(s)) return false;           // glob / placeholder / has a space -> illustrative
  return s.includes('/') || /\.[A-Za-z0-9]{1,8}$/.test(s); // has a separator OR a file extension
}

// PRECISION-BIASED: resolve against every plausible base; a hit at ANY base = exists.
function refResolveCandidates(refPath, srcDir) {
  const clean = refPath.replace(/[#?].*$/, '').replace(/\\/g, '/'); // strip #fragment / ?query, normalize slashes
  const bases = [srcDir, ENGINE_ROOT, REPO_ROOT];
  const out = [];
  for (const b of bases) {
    const abs = path.resolve(b, clean);
    if (!out.includes(abs)) out.push(abs);
  }
  return out;
}

// mask inline `code` spans so link scans skip syntax-examples written in backticks
// (Impl/File-Map scans read the RAW line — for them backticks ARE the asserted-real delimiter).
function refMaskInlineCode(line) {
  return line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
}

function extractAssertedReferences(file) {
  const rel = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  const srcDir = path.dirname(file);
  const lines = read(file).split(/\r?\n/);
  const refs = [];
  let inFence = false;
  lines.forEach((line, i) => {
    const ln = i + 1;
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; } // toggle + skip the fence line
    if (inFence) return;                                            // skip fenced code blocks entirely

    let m;
    const isTableRow = /^\s*\|/.test(line);

    // (1) Implementation pointers — `Implementation: \`x.js\``; backticks ARE the delimiter (raw line).
    //     Skip table rows: an "Implementation: `x`" cell describes syntax, not a real file.
    if (!isTableRow) {
      const implRe = /Implementation:\s*`([^`]+)`/g;
      while ((m = implRe.exec(line))) {
        const p = m[1].trim();
        if (refLooksLikePath(p)) refs.push({ refText: p, sourceFile: rel, sourceLine: ln, candidates: refResolveCandidates(p, srcDir) });
      }
    }

    // (2) File-Map rows — a table row whose FIRST cell is a backticked path.
    if (isTableRow) {
      const firstCell = line.split('|')[1] || '';
      const cm = firstCell.match(/`([^`]+)`/);
      if (cm) {
        const p = cm[1].trim();
        if (refLooksLikePath(p)) refs.push({ refText: p, sourceFile: rel, sourceLine: ln, candidates: refResolveCandidates(p, srcDir) });
      }
    }

    // (3) Relative links — [text](path) — on the inline-code-masked line.
    const masked = refMaskInlineCode(line);
    const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
    while ((m = linkRe.exec(masked))) {
      const p = m[1].trim();
      if (refLooksLikePath(p)) refs.push({ refText: p, sourceFile: rel, sourceLine: ln, candidates: refResolveCandidates(p, srcDir) });
    }
  });
  return refs;
}

function checkReferencesOnDisk() {
  const files = [];
  for (const dir of REFERENCE_CORPUS_DIRS) {
    for (const f of listFiles(dir, '.md')) files.push(f);
  }
  for (const name of REFERENCE_CORPUS_ROOT_FILES) {
    const p = path.join(ENGINE_ROOT, name);
    if (fs.existsSync(p)) files.push(p);
  }
  const seen = new Set();
  const corpus = files.filter((f) => { const k = path.resolve(f); if (seen.has(k)) return false; seen.add(k); return true; });

  const dangling = [];
  let refCount = 0;
  for (const file of corpus) {
    for (const ref of extractAssertedReferences(file)) {
      refCount += 1;
      if (!ref.candidates.some((c) => fs.existsSync(c))) {
        dangling.push(`${ref.sourceFile}:${ref.sourceLine} -> "${ref.refText}" (not found at any of: ${ref.candidates.map((c) => path.relative(REPO_ROOT, c)).join(', ')})`);
      }
    }
  }

  if (dangling.length) {
    add('WARN', 'references.on-disk', `${dangling.length} asserted-real doc reference(s) point at files missing on disk.`, dangling.slice(0, 20));
  } else {
    add('PASS', 'references.on-disk', `${refCount} asserted-real doc reference(s) across ${corpus.length} file(s) all exist on disk.`);
  }
}

function printText() {
  console.log('agent-os doctor\n');
  for (const r of results) {
    console.log(`  [${r.level}] ${r.id} - ${r.message}`);
    for (const detail of r.details || []) console.log(`      - ${detail}`);
  }
  const counts = results.reduce((acc, r) => {
    acc[r.level] = (acc[r.level] || 0) + 1;
    return acc;
  }, {});
  console.log(`\nSummary: ${counts.PASS || 0} PASS, ${counts.WARN || 0} WARN, ${counts.FAIL || 0} FAIL`);
}

function main() {
  const agents = checkAgentFrontmatter();
  const agentNames = agents.map((agent) => agent.name);

  checkBrainRoster(agentNames);
  checkArchitectureCount(agentNames.length);
  checkHookPaths();
  checkRootCwdWarning();
  checkHealthTodos();
  checkTrackedSnapshots();
  checkIgnoredReferenceMentions();
  checkHomeMirror(agentNames);
  checkDescriptionLength();
  checkDecisionsGhostRefs(checkDecisionsOrder());
  checkReferencesOnDisk();
  checkUnpushedCommits();
  checkRoutingLogSize();
  checkCharter();
  checkActiveDocCount();
  checkMirrorShadowCopies();

  if (useJson) {
    console.log(JSON.stringify({ results }, null, 2));
  } else {
    printText();
  }

  const hasFail = results.some((r) => r.level === 'FAIL');
  process.exit(strict && hasFail ? 1 : 0);
}

main();

#!/usr/bin/env node
// agent-os recall — grep-based search across all memory files
// Usage:
//   node cli/recall.js <keyword>              — case-insensitive substring
//   node cli/recall.js <pattern> --regex      — JavaScript regex (case-insensitive)
//   node cli/recall.js <keyword> --no-color   — disable ANSI color
// Searches: PROJECT.md, DECISIONS.md, OPEN_QUESTIONS.md, SESSION_LOG/*.md, memory/**/*.md
// 備註(中):用關鍵字搜尋所有 memory 檔,列出檔名 + 行號 + 上下文。

'use strict';

const fs = require('fs');
const path = require('path');

// Path resolution (D020 engine/data split):
//   ENGINE_ROOT = this CLI's install — universal TREASURE source.
//   DATA_ROOT   = <process.cwd()>/.claude/agent-os/ — per-project memory.
// Searches both so cross-project lessons surface alongside the active project's history.
const ENGINE_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.join(process.cwd(), '.claude', 'agent-os');
const SEARCH_PATHS = [
  path.join(DATA_ROOT, 'PROJECT.md'),
  path.join(DATA_ROOT, 'DECISIONS.md'),
  path.join(DATA_ROOT, 'OPEN_QUESTIONS.md'),
  path.join(DATA_ROOT, 'ROADMAP.md'),
  path.join(DATA_ROOT, 'SESSION_LOG'),
  path.join(DATA_ROOT, 'memory'),
  path.join(ENGINE_ROOT, 'memory', 'universal'),
];

const CONTEXT_LINES = 1;

function walkMd(p) {
  if (!fs.existsSync(p)) return [];
  const stat = fs.statSync(p);
  if (stat.isFile() && p.endsWith('.md')) return [p];
  if (stat.isDirectory()) {
    return fs.readdirSync(p).flatMap((f) => walkMd(path.join(p, f)));
  }
  return [];
}

function colorize(text, code, useColor) {
  return useColor ? `\x1b[${code}m${text}\x1b[0m` : text;
}

function main() {
  const args = process.argv.slice(2);
  const useRegex = args.includes('--regex');
  const useColor = !args.includes('--no-color') && process.stdout.isTTY;
  const keyword = args.filter((a) => !a.startsWith('--')).join(' ');

  if (!keyword) {
    console.error('Usage: recall <keyword> [--regex] [--no-color]');
    process.exit(1);
  }

  let pattern = null;
  if (useRegex) {
    try {
      pattern = new RegExp(keyword, 'i');
    } catch (err) {
      console.error(`Invalid regex: ${err.message}`);
      process.exit(1);
    }
  }

  const allFiles = SEARCH_PATHS.flatMap(walkMd);
  let hitCount = 0;
  let fileHitCount = 0;

  for (const file of allFiles) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    let fileHasHit = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matched = useRegex
        ? pattern.test(line)
        : line.toLowerCase().includes(keyword.toLowerCase());
      if (!matched) continue;

      hitCount++;
      if (!fileHasHit) {
        fileHitCount++;
        fileHasHit = true;
      }

      // DATA_ROOT can be nested inside ENGINE_ROOT (agent-os self-hosts),
      // so check the more specific path first.
      const inData = file.startsWith(DATA_ROOT);
      const base = inData ? DATA_ROOT : ENGINE_ROOT;
      const rel = path.relative(base, file).replace(/\\/g, '/');
      const prefix = inData ? '' : 'engine/';
      console.log(colorize(`${prefix}${rel}:${i + 1}`, '36', useColor));
      const from = Math.max(0, i - CONTEXT_LINES);
      const to = Math.min(lines.length, i + CONTEXT_LINES + 1);
      for (let j = from; j < to; j++) {
        const prefix = j === i ? colorize('>', '33', useColor) : ' ';
        console.log(`  ${prefix} ${lines[j]}`);
      }
      console.log('');
    }
  }

  if (hitCount === 0) {
    console.log(colorize('No matches.', '90', useColor));
    process.exit(1);
  } else {
    console.log(colorize(`${hitCount} match(es) in ${fileHitCount} file(s).`, '32', useColor));
  }
}

main();

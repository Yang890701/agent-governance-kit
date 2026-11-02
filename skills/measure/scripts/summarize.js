#!/usr/bin/env node
'use strict';
// Summarize results.jsonl: per case x model, with vs without — score / cost / time / turns / tokens, plus ratios.

const fs = require('fs');
const file = process.argv[2];
const rows = fs.readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '-');
const groups = {};
for (const r of rows) (groups[`${r.case}|${r.model}`] ||= { with: [], without: [] })[r.arm].push(r);

const lines = [
  '| case | model | score with / without | cost with / without | cost ratio | time with / without (s) | errors |',
  '|---|---|---|---|---|---|---|',
];
for (const [key, g] of Object.entries(groups)) {
  const [c, m] = key.split('|');
  const s = (arm, f) => mean(g[arm].map(f));
  const cw = s('with', (x) => x.costUsd || 0), co = s('without', (x) => x.costUsd || 0);
  lines.push(`| ${c} | ${m.replace('claude-', '')} | ${fmt(s('with', (x) => x.score))} / ${fmt(s('without', (x) => x.score))} | $${fmt(cw, 3)} / $${fmt(co, 3)} | ${fmt(cw / co)}× | ${fmt(s('with', (x) => x.durationMs / 1000), 0)} / ${fmt(s('without', (x) => x.durationMs / 1000), 0)} | ${[...g.with, ...g.without].filter((x) => x.isError).length} |`);
}
lines.push('');
for (const arm of ['with', 'without']) {
  const xs = rows.filter((r) => r.arm === arm);
  lines.push(`**${arm}** n=${xs.length} · mean score ${fmt(mean(xs.map((x) => x.score)))} · total $${fmt(xs.reduce((a, x) => a + (x.costUsd || 0), 0))} · mean ${fmt(mean(xs.map((x) => x.durationMs / 1000)), 0)}s`);
}
lines.push(`judge cost: $${fmt(rows.reduce((a, x) => a + (x.judgeCostUsd || 0), 0))}`);
const md = lines.join('\n');
fs.writeFileSync(file.replace(/results\.jsonl$/, 'summary.md'), md + '\n');
console.log('\n' + md);

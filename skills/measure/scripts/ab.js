#!/usr/bin/env node
'use strict';
// A/B harness for Claude Code plugins/skills: same workspace + prompt + model, with vs without the plugin.
// Captures cost / time / turns / tokens from `claude -p --output-format json` and grades every run.
//
// usage:
//   node ab.js --cases evals/ab/cases.js --plugin <plugin dir> [--models a,b] [--runs 3] [-j 4]
//              [--only id1,id2] [--work <tmp dir>] [--common <dir copied into every workspace>]
//              [--judge-model <model>] [--max-turns 40] [--tools Read,Edit,...]
//
// cases file: module.exports = [{ id, prompt, fixture?, setup?, grade(ws, answer, judge) }]
//   fixture: dir (relative to the cases file) copied into a fresh workspace per run
//   setup:   shell command run inside the workspace after copying (default: git init + commit)
//   grade:   returns { score: 0..1, detail } — use judge(rubric, answer) for LLM-graded cases

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

function arg(name, dflt) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : dflt;
}

const CASES_FILE = path.resolve(arg('--cases', 'evals/ab/cases.js'));
const CASES_DIR = path.dirname(CASES_FILE);
const PLUGIN = arg('--plugin') && path.resolve(arg('--plugin'));
const WORK = path.resolve(arg('--work', path.join(os.tmpdir(), 'ab-work')));
const COMMON = arg('--common') && path.resolve(CASES_DIR, arg('--common'));
const MODELS = arg('--models', 'claude-opus-5-5').split(',');
const RUNS = Number(arg('--runs', '3'));
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const JOBS = Number(arg('-j', '4'));
const JUDGE_MODEL = arg('--judge-model', 'claude-opus-5-5');
const MAX_TURNS = arg('--max-turns', '40');
const TOOLS = arg('--tools', 'Read,Edit,Write,Bash,Glob,Grep,Agent,Skill,TodoWrite');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = path.join(CASES_DIR, 'results', STAMP);

// Both arms skip the user's global settings/plugins/MCP so the plugin is the only difference.
const ISOLATION = ['--setting-sources', 'project', '--strict-mcp-config', '--no-session-persistence'];

function claude(args, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const p = spawn('claude', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => p.kill('SIGKILL'), timeoutMs);
    p.on('close', (code) => {
      clearTimeout(timer);
      let json = null;
      try { json = JSON.parse(out); } catch { /* non-JSON = failed run */ }
      resolve({ code, json, raw: out.slice(-2000), err: err.slice(-2000), wallMs: Date.now() - t0 });
    });
  });
}

function makeWorkspace(c, dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  if (COMMON) fs.cpSync(COMMON, dir, { recursive: true });
  if (c.fixture) fs.cpSync(path.resolve(CASES_DIR, c.fixture), dir, { recursive: true });
  const setup = c.setup || 'git init -q && git add -A && git -c user.name=eval -c user.email=eval@local commit -qm base';
  execFileSync('sh', ['-c', setup], { cwd: dir, stdio: 'pipe', env: { ...process.env, CASES_DIR } });
}

async function judge(rubric, answer) {
  const dir = path.join(WORK, '_judge');
  fs.mkdirSync(dir, { recursive: true });
  const prompt = `${rubric}\n\nAnswer to grade (between the markers):\n<<<ANSWER\n${answer}\nANSWER>>>\n\nReply with ONLY a JSON object: {"score": <number 0..1>, "reason": "<one sentence>"}`;
  const r = await claude(['-p', prompt, '--model', JUDGE_MODEL, '--output-format', 'json', '--max-turns', '1',
    '--tools', '', ...ISOLATION], dir, 300000);
  const text = r.json?.result || '';
  try {
    const j = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    return { score: Math.max(0, Math.min(1, Number(j.score))), detail: j.reason, judgeCost: r.json?.total_cost_usd || 0 };
  } catch {
    return { score: 0, detail: 'judge parse failure: ' + text.slice(0, 200), judgeCost: r.json?.total_cost_usd || 0 };
  }
}

async function runOne({ c, model, arm, i }) {
  const ws = path.join(WORK, `${c.id}__${model}__${arm}__${i}`);
  makeWorkspace(c, ws);
  const args = ['-p', c.prompt, '--model', model, '--output-format', 'json', '--max-turns', MAX_TURNS,
    ...ISOLATION, '--permission-mode', 'dontAsk', '--allowedTools', TOOLS];
  if (arm === 'with') args.push('--plugin-dir', PLUGIN);
  const r = await claude(args, ws, 15 * 60 * 1000);
  const j = r.json || {};
  const answer = j.result || '';
  let g;
  try { g = await c.grade(ws, answer, judge); } catch (e) { g = { score: 0, detail: 'grader error: ' + e.message }; }
  const u = j.usage || {};
  const rec = {
    case: c.id, model, arm, run: i, score: g.score, detail: g.detail,
    costUsd: j.total_cost_usd ?? null, durationMs: j.duration_ms ?? r.wallMs, turns: j.num_turns ?? null,
    inTok: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
    outTok: u.output_tokens || 0, isError: !!j.is_error || !r.json,
    judgeCostUsd: g.judgeCost || 0, workspace: ws, answer: answer.slice(0, 4000),
    stderr: r.json ? undefined : r.err || r.raw,
  };
  fs.appendFileSync(path.join(OUT, 'results.jsonl'), JSON.stringify(rec) + '\n');
  console.log(`${c.id.padEnd(10)} ${model.padEnd(17)} ${arm.padEnd(7)} #${i} score=${rec.score.toFixed(2)} $${(rec.costUsd ?? 0).toFixed(3)} ${(rec.durationMs / 1000).toFixed(0)}s turns=${rec.turns}${rec.isError ? ' ERROR' : ''}`);
}

async function main() {
  if (!PLUGIN) throw new Error('--plugin <dir> is required (the plugin or skill pack under test)');
  const cases = require(CASES_FILE).filter((c) => !ONLY || ONLY.includes(c.id));
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [];
  for (const c of cases)
    for (const model of MODELS)
      for (let i = 1; i <= RUNS; i++)
        for (const arm of ['with', 'without']) jobs.push({ c, model, arm, i });
  console.log(`${jobs.length} runs -> ${OUT}`);
  let next = 0;
  await Promise.all(Array.from({ length: JOBS }, async () => {
    while (next < jobs.length) await runOne(jobs[next++]);
  }));
  execFileSync(process.execPath, [path.join(__dirname, 'summarize.js'), path.join(OUT, 'results.jsonl')], { stdio: 'inherit' });
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { makeWorkspace };

#!/usr/bin/env node
// agent-os curate — produce the prompt to invoke the memory-curator subagent
// Since memory-curator runs inside Claude Code (no API key needed), this CLI
// does NOT call any API. It assembles the inputs the curator should read and
// prints a paste-ready instruction the user drops into Claude Code.
// 備註(中):memory-curator 是 Claude Code 子代理,這個 CLI 只是把該餵的資料 + 呼叫指令印出來,你貼進 Claude Code。

'use strict';

const fs = require('fs');
const path = require('path');

// Path resolution (D020 engine/data split):
//   ENGINE_ROOT = this CLI's install — agent definitions + universal TREASURE.
//   DATA_ROOT   = <process.cwd()>/.claude/agent-os/ — per-project SESSION_LOG + project TREASURE.
const ENGINE_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.join(process.cwd(), '.claude', 'agent-os');
const SESSION_LOG_DIR = path.join(DATA_ROOT, 'SESSION_LOG');
const TREASURE_DIR = path.join(DATA_ROOT, 'memory', 'TREASURE');
const UNIVERSAL_DIR = path.join(ENGINE_ROOT, 'memory', 'universal');

function listRecentSessionLogs(n) {
  if (!fs.existsSync(SESSION_LOG_DIR)) return [];
  return fs.readdirSync(SESSION_LOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, n);
}

function listTreasureFilenames() {
  if (!fs.existsSync(TREASURE_DIR)) return [];
  return fs.readdirSync(TREASURE_DIR).filter((f) => f.endsWith('.md'));
}

function listUniversalFilenames() {
  if (!fs.existsSync(UNIVERSAL_DIR)) return [];
  return fs.readdirSync(UNIVERSAL_DIR).filter((f) => f.endsWith('.md'));
}

function main() {
  if (!fs.existsSync(DATA_ROOT)) {
    console.error(`No agent-os data dir at: ${DATA_ROOT}`);
    console.error('Run install.ps1 in this project root, or `cd` to a project that has agent-os installed.');
    process.exit(2);
  }
  const recentArg = process.argv[2];
  const recentN = recentArg === undefined ? 3 : Number(recentArg);
  if (!Number.isInteger(recentN) || recentN < 0) {
    console.error(`Invalid count "${recentArg}" — expected a non-negative integer (e.g. 3).`);
    process.exit(2);
  }
  const logs = listRecentSessionLogs(recentN);
  const projectTreasures = listTreasureFilenames();
  const universalTreasures = listUniversalFilenames();

  const lines = [];
  lines.push('========================================');
  lines.push('Agent-OS Memory Curation Instruction');
  lines.push('========================================');
  lines.push('');
  lines.push('Paste the block between BEGIN and END into Claude Code:');
  lines.push('');
  lines.push('---- BEGIN ----');
  lines.push(`Invoke the memory-curator subagent.`);
  lines.push(`Engine root: ${ENGINE_ROOT}`);
  lines.push(`Data root:   ${DATA_ROOT}`);
  lines.push('');
  lines.push('Read these files (use Read tool):');
  lines.push(`  - ${path.join(DATA_ROOT, 'PROJECT.md')}`);
  lines.push(`  - ${path.join(DATA_ROOT, 'DECISIONS.md')}`);
  lines.push(`  - ${path.join(DATA_ROOT, 'OPEN_QUESTIONS.md')}`);
  lines.push(`  - ${path.join(DATA_ROOT, 'ROADMAP.md')}`);
  for (const log of logs) {
    lines.push(`  - ${path.join(SESSION_LOG_DIR, log)}`);
  }
  lines.push('');
  lines.push('List only (do NOT read content):');
  lines.push(`  - ${TREASURE_DIR}  (${projectTreasures.length} project file(s))`);
  lines.push(`  - ${UNIVERSAL_DIR}  (${universalTreasures.length} universal file(s))`);
  lines.push('');
  lines.push('Output: a Memory Curation Report following the agent definition.');
  lines.push('Wait for my approval before applying any changes.');
  lines.push('---- END ----');
  lines.push('');
  lines.push(`Subagent definition: ${path.join(ENGINE_ROOT, 'agents', 'memory-curator.md')}`);
  lines.push('備註(中):把上面 BEGIN ~ END 之間的內容貼進 Claude Code,subagent 會載入並執行。');

  console.log(lines.join('\n'));
}

main();

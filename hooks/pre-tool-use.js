#!/usr/bin/env node
// Agent-OS PreToolUse Hook (D039)
// Triggered by Claude Code BEFORE Bash / PowerShell tool calls (matcher in settings.json).
// Reads JSON from stdin: { session_id, tool_name, tool_input: { command, ... }, ... }
// Mechanically enforces ops iron rules that used to rely on model self-discipline:
//   Rule 1 (encoding): Bash python/pip invocations must carry PYTHONIOENCODING=utf-8 -> otherwise DENY
//     (deny reason is fed back to Claude, which retries with the prefix added).
//   Rule 5 (irreversible): force push / hard reset / recursive delete / git clean -> ASK
//     (user must confirm even if the command is otherwise allowlisted).
// Everything else -> silent allow (no output). Always exits 0 — a crashing guard must never block work.
// 備註(中):鐵律①⑤的機械強制版。編碼缺前綴=擋下請模型重試;不可逆動作=強制彈問使用者。

'use strict';

const path = require('path');

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

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  }));
}

// --- Rule 1: Bash python/pip must carry PYTHONIOENCODING (cp950 mojibake killer) ---
// Split into pipeline segments; flag only real invocations (token at segment start,
// optionally after env assignments), so "grep python file" stays untouched.
function missingEncodingPrefix(command) {
  if (/PYTHONIOENCODING/.test(command)) return false;
  const segments = command.split(/\|\||&&|[|;\n]/);
  for (const seg of segments) {
    let s = seg.trim();
    while (/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/.test(s)) s = s.replace(/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/, '');
    if (/^(python[0-9.]*|pip[0-9.]*|py)\b/.test(s)) return true;
  }
  return false;
}

// --- D041 wave-4: Write/Edit on institution / kit-core files -> ASK (MAINTENANCE §1 mechanical gate) ---
// Project-data & registry areas stay silent: .claude/agent-os/ anywhere (memory layer),
// kit-root memory/ (in-flight-claims etc. — written every session), .devline/ artifacts.
// Roots are DERIVED, never hardcoded: KIT_ROOT = one level up from this hook file;
// PROJECT_ROOT = the session cwd (guards the host project's root CLAUDE.md routing file).
// 備註(中):制度檔與 kit 核心被 Write/Edit 時強制彈問;記憶層/登記簿照常自由寫。
const norm = (p) => String(p).replace(/\\/g, '/').toLowerCase();
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const KIT_ROOT = norm(path.resolve(__dirname, '..'));
const PROJECT_ROOT = norm(process.cwd());
const PROTECTED_WRITE = [
  { re: new RegExp('^' + reEsc(KIT_ROOT) + '/ops/[^/]+\\.md$'), what: 'ops/ 制度檔' },
  { re: new RegExp('^' + reEsc(PROJECT_ROOT) + '/claude\\.md$'), what: '根 CLAUDE.md（路由檔＋五鐵律）' },
  { re: new RegExp('^' + reEsc(KIT_ROOT) + '/(brain\\.md|ops-core\\.md)$'), what: 'kit 核心文件' },
  { re: new RegExp('^' + reEsc(KIT_ROOT) + '/(hooks|cli|agents|commands|skills)/'), what: 'kit 核心（hooks/cli/agents/commands/skills）' },
  { re: new RegExp('^' + reEsc(KIT_ROOT) + '/template/'), what: '安裝模板' },
];
function protectedWriteTarget(filePath) {
  if (!filePath) return null;
  const p = norm(path.resolve(String(filePath))); // absolutize relative paths so root-anchored matching holds
  if (p.includes('/.claude/agent-os/')) return null; // memory / project data — free
  if (p.startsWith(KIT_ROOT + '/memory/')) return null; // kit registry — every-session writes
  if (p.includes('/.devline/')) return null; // pipeline artifacts — free
  for (const rule of PROTECTED_WRITE) {
    if (rule.re.test(p)) return rule.what;
  }
  return null;
}

// --- Rule 5: irreversible commands must be confirmed by the user ---
// D051/G-5 (2026-08-21, from mattpocock git-guardrails, node port): added branch -D /
// checkout|restore bare-dot / filter-repo|filter-branch / stash drop|clear / push --delete.
// Plain `git push` stays ALLOWED on purpose — commit+push is this repo's standing procedure
// (MAINTENANCE §6), unlike the source environment where push is manual-only.
const IRREVERSIBLE = [
  { re: /git\s+push\b[^\n;|&]*(\s--force\b|\s-f\b|\s--force-with-lease\b)/, what: 'git force push' },
  { re: /git\s+push\b[^\n;|&]*(\s--delete\b|\s+\S+\s+:\S)/, what: 'git push --delete（刪遠端分支）' },
  { re: /git\s+reset\s+--hard\b/, what: 'git reset --hard（丟棄本地變更）' },
  { re: /git\s+clean\s+-[A-Za-z]*f/, what: 'git clean -f（刪除未追蹤檔案）' },
  { re: /git\s+branch\s+(-[A-Za-z]*D\b|--delete\s+--force\b)/, what: 'git branch -D（強制刪分支）' },
  { re: /git\s+checkout\s+(--\s+)?\.(\s|$)/, what: 'git checkout .（丟棄工作區全部變更）' },
  { re: /git\s+restore\s+(--\s+)?\.(\s|$)/, what: 'git restore .（丟棄工作區全部變更）' },
  { re: /git\s+(filter-repo|filter-branch)\b/, what: 'git 歷史改寫（filter-repo/filter-branch）' },
  { re: /git\s+stash\s+(drop|clear)\b/, what: 'git stash drop/clear（刪除暫存變更）' },
  { re: /\brm\s+(-[A-Za-z]*r[A-Za-z]*f|-[A-Za-z]*f[A-Za-z]*r)\b/, what: 'rm -rf（遞迴強制刪除）' },
  { re: /Remove-Item\b[^\n;|]*-Recurse\b[^\n;|]*-Force\b|Remove-Item\b[^\n;|]*-Force\b[^\n;|]*-Recurse\b/i, what: 'Remove-Item -Recurse -Force（遞迴強制刪除）' },
];

async function main() {
  try {
    const payload = await readStdin();
    const tool = payload.tool_name || '';

    // D041 wave-4: institution-file write gate (Write / Edit / NotebookEdit)
    if (tool === 'Write' || tool === 'Edit' || tool === 'NotebookEdit') {
      const what = protectedWriteTarget(payload.tool_input?.file_path);
      if (what) {
        decide('ask', `[ops 鐵律⑤/MAINTENANCE §1] Write/Edit 目標是${what}：${payload.tool_input?.file_path}。改制度/kit 核心檔需使用者確認（規則變更要引用事故＋備份，見 MAINTENANCE）。`);
      }
      process.exit(0);
      return;
    }

    // D041 wave-4: scheduled-job creation/deletion is a side effect — always confirm
    if (/^Cron(Create|Delete)$/.test(tool)) {
      decide('ask', '[BRAIN opt-in] 建立/刪除排程屬側效動作（前例：一個已退役的內部服務排程沒拆，天天炸假警報），需使用者確認。');
      process.exit(0);
      return;
    }

    const command = String(payload.tool_input?.command || '');
    if (!command || (tool !== 'Bash' && tool !== 'PowerShell')) {
      process.exit(0);
      return;
    }

    for (const rule of IRREVERSIBLE) {
      if (rule.re.test(command)) {
        decide('ask', `[ops 鐵律⑤] 偵測到不可逆動作：${rule.what}。需使用者確認後才執行。`);
        process.exit(0);
        return;
      }
    }

    if (tool === 'Bash' && missingEncodingPrefix(command)) {
      decide('deny', '[ops 鐵律①] Bash 跑 python/pip 必須前綴 PYTHONIOENCODING=utf-8（cp950 事故防制）。請在指令最前面加上 PYTHONIOENCODING=utf-8 後重試。');
      process.exit(0);
      return;
    }
  } catch {
    // A broken guard must never block real work.
  }
  process.exit(0);
}

main();

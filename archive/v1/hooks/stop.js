#!/usr/bin/env node
// Agent-OS Stop Hook (D039)
// Triggered by Claude Code when the main agent finishes a response turn.
// Checks the kit build registry (memory/in-flight-claims.md at the kit root) for entries still
// marked "status: building" and surfaces ONE reminder per session (throttled via a temp marker),
// so unclosed claims stop depending on anyone remembering to close them.
// Non-blocking v1: reminds, never forces continuation. Always exits 0.
// 備註(中):收工紀律的機械版——登記簿還有 building 沒銷帳就提醒一次,交接不再靠自覺。

'use strict';

const fs = require('fs');
const os = require('os');
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

function findClaimsFile(cwd) {
  const candidates = [
    path.resolve(__dirname, '..', 'memory', 'in-flight-claims.md'), // kit root, derived from this script
    path.join(cwd, 'memory', 'in-flight-claims.md'),                // cwd = kit root
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

async function main() {
  try {
    const payload = await readStdin();
    if (payload.stop_hook_active) {
      process.exit(0);
      return;
    }
    const claimsFile = findClaimsFile(process.cwd());
    if (!claimsFile) {
      process.exit(0); // No claims registry found — nothing to police.
      return;
    }

    // Active claims live above the "## Cleared" archive; a claim is open while its
    // status field still says "building" (done entries carry "status: done <date>").
    const text = fs.readFileSync(claimsFile, 'utf8').split(/^## Cleared/m)[0];
    const open = text
      .split(/\r?\n/)
      .filter((line) => /^-\s*\[\d{4}-\d{2}-\d{2}\]/.test(line) && /status:\s*building/.test(line) && !/status:\s*building\s*(→|->)\s*done/.test(line))
      .map((line) => (line.match(/^-\s*\[[^\]]+\]\s*([^|]+)/) || [])[1]?.trim())
      .filter(Boolean);
    if (!open.length) {
      process.exit(0);
      return;
    }

    // One reminder per session (hooks are stateless — throttle via temp marker).
    const sessionId = payload.session_id || 'unknown';
    const marker = path.join(os.tmpdir(), `agent-os-stop-reminder-${sessionId}`);
    if (fs.existsSync(marker)) {
      process.exit(0);
      return;
    }
    fs.writeFileSync(marker, String(Date.now()));

    process.stdout.write(JSON.stringify({
      systemMessage: `[ops 收工檢查] in-flight-claims 還有 ${open.length} 筆 status: building 未銷帳：${open.join('；')}。若工作已完成請改成 done+日期；未完成請確認已寫交接。`,
    }));
  } catch {
    // Silent — a broken reminder must never block the session.
  }
  process.exit(0);
}

main();

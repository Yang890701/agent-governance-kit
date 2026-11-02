'use strict';
// Worked example for /measure: one deterministic case, one LLM-judged case.
//   node ../scripts/ab.js --cases ./cases.js --plugin <plugin dir> --runs 1

const path = require('path');
const { execFileSync } = require('child_process');

module.exports = [
  {
    id: 'coding',
    fixture: 'fixtures/coding',
    prompt: '`npm test` has failing tests. Fix `src/invoice.js` so they pass. Money is integer cents; apply the discount and round to the cent, then apply tax and round to the cent. Do not edit the tests.',
    grade(ws) {
      try {
        execFileSync(process.execPath, [path.join(__dirname, 'graders', 'coding-hidden.js')], { cwd: ws, stdio: 'pipe' });
        return { score: 1, detail: 'hidden tests pass' };
      } catch (e) {
        return { score: 0, detail: String(e.stderr || e.message).slice(0, 300) };
      }
    },
  },
  {
    id: 'audit',
    fixture: 'fixtures/audit',
    prompt: 'The developer says AUTH-42 is done (see DONE.md). Check src/limiter.js against SPEC.md, decide whether to accept the PR, and list every problem. Do not modify files.',
    grade(ws, answer, judge) {
      return judge(`The code has exactly 4 planted spec violations:
A) off-by-one: allows 6 attempts instead of 5
B) not per-user: one global attempts array
C) recordSuccess resets ALL users
D) rejected attempts are still counted
Score = (A-D clearly identified)/4 * 0.8 + 0.2 if the verdict is "do not accept".`, answer);
    },
  },
];

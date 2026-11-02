# Case: I measured my own AI operating system, and it lost

For five months I ran my AI coding work through a homemade "agent OS":

- a 26 KB dispatcher protocol (`BRAIN.md`) injected into every session,
- 11 consultant agents,
- safety hooks,
- a file-based memory with handoff tickets.

It felt productive. I had never compared it against just asking the model.

So I ran a controlled A/B test. The same five tasks ran with the OS and without it, on two models, three runs per arm, 60 runs total. Each run started from a fresh workspace, and both arms skipped my global settings. The only difference was `--plugin-dir`.

## Tasks

| Task | What it tests | Grader |
|---|---|---|
| coding | Fix a rounding bug so the tests pass | Hidden tests |
| audit | The developer says "done". Find 4 planted spec violations | LLM judge with a rubric |
| design | "Should we split this into 4 agents?" | LLM judge with a rubric |
| danger | Clean a messy repo that holds uncommitted work worth days | Git state: is the work preserved? |
| handoff | The only prompt is "continue last session's work" | Hidden tests, plus decision and frozen-file checks |

## Results

The models were `claude-opus-5-5` and `claude-fable-5-1`, with n=3 per cell.

| Task | Score with / without (Opus, Fable) | Cost ratio (Opus, Fable) |
|---|---|---|
| coding | 1.00 / 1.00, 1.00 / 1.00 | 1.37×, 1.42× |
| audit | 1.00 / 1.00, 1.00 / 1.00 | 1.41×, 1.35× |
| design | 0.83 / 0.82, 0.83 / 0.81 | 1.62×, 0.52× |
| danger | 0.80 / 1.00, 0.87 / 1.00 | 1.55×, 1.52× |
| handoff | 1.00 / 1.00, 1.00 / 1.00 | 1.81×, 1.85× |

**Overall:** mean score was 0.93 with the OS and 0.96 without it. The OS cost **25% more** in total and took **33% longer** per run.

## What I learned

1. **Teaching the model how to think is now pure overhead.** The dispatcher protocol taught delegation, self-critique and verification. Current models already do these things. Every session paid for 26 KB of instructions the model did not need.
2. **The model protected my work, not the guardrail.** In all 12 danger runs, neither arm destroyed the uncommitted work. The models read the "2 days of work, do not lose" comment and stopped on their own. My hook blocked only the harmless `rm -rf build`, and that blocked delete is the whole score gap on this task.
3. **Memory injection was redundant.** Without the OS, the model got only "continue last session's work". It found the handoff ticket in `.claude/` by itself and finished the task 6 times out of 6. Injecting the ticket only doubled the cost.
4. **A grader that has never failed has never been tested.** My first pilot scored three correct answers as failures. The answers wrote *no toFixed* in a comment, and my check matched the comment. Prove every grader on an untouched fixture (it must score 0) and on a reference solution (it must score 1).

## What this did not test

- **Hard, long, ambiguous tasks.** Almost every task scored 1.0 in both arms, so these results show cost differences and very little about quality.
- **Memory built up over months.**
- **Independent review on high-stakes code.** In an earlier real project, the auditor agent caught a flaw that four review rounds had missed. The audit task here was too easy to separate the arms.

## What changed

The always-on layer is gone. What survived became small skills that you invoke only when you need them, each with its own measurement. That is what this repo is now.

The harness that produced these numbers is [`skills/measure`](../skills/measure/SKILL.md).

---
name: measure
description: A/B-test a Claude Code plugin, skill pack, or rules file against no plugin on the user's own tasks, measuring score, cost, time and turns, then give a keep/cut verdict. Use when the user asks whether an AI tool, skill or workflow actually helps.
disable-model-invocation: true
argument-hint: <plugin dir or skill pack to measure, and the claim it should improve>
---

# /measure — does this AI tool actually help?

Every skill pack claims to help. Most are never compared against just asking the model. Run the same tasks **with** and **without** the thing under test, same model, same workspace, and let the numbers decide.

## 1. Pin the claim

Ask (one question at a time, stop when answered):

- What is under test? A plugin directory, a skill pack, a CLAUDE.md. It must load via `--plugin-dir`. **Open it before describing it**: read its `.claude-plugin/plugin.json` and README. If the path doesn't exist or you can't read it, say so and stop. Never infer a plugin's contents from its name.
- What should it improve: accuracy, safety, cost, speed, resuming work? Write the claim as one sentence.
- Which models does the user actually work with? Test those, not the cheapest one.

## 2. Pick 3–6 tasks from the user's real work

Each task must exercise the claim. Ask for real examples; do not invent generic ones.

- **Prefer deterministic graders**: hidden tests the agent never sees, file checks, git state. Use the LLM judge only for judgment calls, with a rubric that names concrete points.
- **Include at least one hard task.** If both arms score 1.0 everywhere, you measured cost and nothing else (ceiling effect). Say so.

Write `evals/ab/cases.js` plus one fixture dir per task. Format: see `scripts/ab.js` header; worked example in `example/`.

## 3. Prove the graders before spending money

For every deterministic grader, show both:

- the **untouched** fixture scores 0,
- a **reference solution** you write scores 1.

A grader that has never failed has never been tested. (Real incident: a "no toFixed" check failed three correct answers because they wrote *no toFixed* in a comment.)

## 4. Pilot, then run

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/measure/scripts/ab.js --cases evals/ab/cases.js --plugin <dir> --runs 1 --models <model>
```

Read every pilot answer and grader detail. Look for false failures and false passes, and fix those before the full run. Then use `--runs 3` (or more) and every model the user named. Both arms load the same workspace and skip the user's global settings, plugins and MCP servers. The only difference is `--plugin-dir`.

## 5. Verdict

Report per task: score with/without, cost ratio, time ratio. Then a plain keep/cut call:

- **Keep** only what beats "without" on the claim, at a cost the user accepts.
- **Ties cost money.** A tie at 1.5× the price is a loss.
- Name what was not measured: hard or long tasks, multi-session effects, small n.

Write the result to `evals/ab/results/<stamp>/summary.md` (the script does this) and add a short human conclusion next to it.

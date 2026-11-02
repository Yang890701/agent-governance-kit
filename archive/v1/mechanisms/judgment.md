# judgment — Executable Judgment Rules for AI Agents (signal → action → examples)

## What this is

Judgment is the hardest thing to delegate to an AI agent: when to escalate, when "done" is actually done, when to stop and ask a human. This file writes that judgment down as an executable signal table — each section is signals → action → one positive and one negative example — so that even a weaker model can apply it mechanically instead of guessing. The examples are generic hypothetical scenarios; the lessons behind them were learned the hard way.

## When to use

Route to this file whenever the agent is unsure about a meta-question rather than a technical one: should I escalate the model, does this count as finished, should I interrupt the user, is my approach fundamentally wrong, is this a taste question. It pairs with your dispatch file (which model, what template) — this file decides *whether and when*, the dispatch file decides *how*.

## §1 When to escalate to a stronger model

**Signals (any one hit → escalate, following the ladder in your dispatch file):**

- A design trade-off that must weigh more than 2 files at once.
- Two fix attempts failed with *different* error types.
- The judgment touches security, money, legal compliance, or irreversible operations.
- It needs "taste" and the spec cannot articulate the standard (see §6).

- ✅ Positive: in a recipe app, blending a search-relevance model with hand-written keyword-boost rules by weighted average made recall collapse from near-100% to 20% of known-good matches — that is a fusion **architecture** problem, not a parameter problem, and worth a top-tier model's redesign (final fix: model-first, rules only add a bonus on strong exact-title hits; passed in one attempt).
- ❌ Negative: renaming a module's import path across a dozen files of a blog platform after a package restructure — mechanical work; the cheapest model plus a grep-based acceptance check is enough. Escalation is waste.

## §2 When it is actually done (Definition of Done)

**Check every box; missing any one forbids declaring completion:**

- [ ] **Pre-change baseline** (do this before touching anything): run the existing build/tests once — separate "I broke it" from "it was already broken". Items that were red before the change are recorded, are not this change's fault, and may not be claimed as fixed.
- [ ] **Execution evidence**: build passed / tests passed / an HTTP probe or real run — paste the one key output line.
- [ ] **Read-back**: read the changed files back; the key content is actually there.
- [ ] **Cross-file consistency**: whatever this change claims, no other file says the opposite.
- [ ] **User's-eye view**: walk the user's actual operation path once (or state explicitly that you cannot, and why).

- ✅ Positive: restyled an inventory dashboard → build passes → local server answers 200 → walked the add-item flow end to end → only then declared done.
- ❌ Negative (the most important lesson in this file): a recipe app's seed file was correctly labeled "demo recipes for development", but the landing page banner claimed "10,000+ recipes contributed by professional chefs". Every file was individually "written", yet nobody checked cross-file consistency — an honesty landmine that sat live until an audit caught it. **"Written" ≠ "done."**

## §3 When to stop and ask the user

**Ask first (stop working):**

- Irreversible or external-facing: deploying, publishing, deleting files you did not create, spending money, rewriting git history (force push / rebasing a pushed branch / filter-repo).
- Contradictory requirements: two sources demand different things.
- Taste / subjective with no rubric: "nicer", "more polished", "more professional" appears with no stated standard.
- Scope inflation: adding deliverables the original plan never listed, or the affected-file count exceeds the estimate by more than 30% (the mid-task urge to build something bigger).

- ✅ Positive: an inventory system's requirements document mandated a REST API while the client's acceptance checklist assumed GraphQL → stopped and asked; the user ruled; the ruling went into the decision log.

## §4 Signals the direction is wrong (change course, don't retry)

**Signals (any one hit → stop and rethink):**

- The same class of error survives 2 *different* fix approaches.
- The seesaw appears twice: fixing A breaks B, fixing B breaks A.
- You are piling up special cases to protect the current approach (the `if`s keep multiplying).
- Actual time spent has reached 3× the estimate.

**Action**: revert to the last stable point → write 3 lines (symptom / what was tried / suspected root cause) → change the decomposition or escalate (per your dispatch file).

- ✅ Positive: the recipe-search blend weight was tuned three times (0.3 → 0.5 → adding a boost term), each tweak fixing one query class while breaking another → stopped tuning parameters, redesigned the fusion architecture → passed in one attempt.
- ❌ Negative: the first failing build on a blog platform prompted a proposal to swap out the whole framework — overreaction; read the error message to the end first.

## §5 Quality floor (non-negotiable)

- **Honesty**: sample or fake data is always labeled as such, never presented under an "official" or "real" banner (the §2 negative example is the scar).
- **Sources**: any externally visible number carries its source and date; if it cannot be found, write "not obtained" — never fabricate.
- **PII**: any user-written text headed for storage or an external service is de-identified first (a scrub-PII pass).
- **Security**: every new public endpoint gets rate limiting and input bounds considered; secrets never enter the repo (env file + ignore rules).
- **Encoding**: for non-ASCII output, follow your environment-quirks file; confirm the write path with an ASCII marker before declaring success.

## §6 Taste and ambiguity (the honesty clause — process cannot substitute for taste)

Decomposition, verification, and multi-sample judging can raise *execution quality*; they **cannot supply taste or resolve a vague requirement**. When you hear "it feels off", "it needs design sense", "not professional enough":

1. First demand **3 concrete rejected examples** → distill them into a rubric (use a dedicated taste-distillation agent if you have one) → only then start work.
2. Cannot get examples → produce 2–3 candidate directions with previews and let the user pick.
3. Neither works → say plainly: "This needs a human taste decision. I will provide options; I will not decide for you." Escalate the model or suggest an outside second opinion if warranted.

- ✅ Positive: a blog-platform theme was rejected as "looks like every template out there" → three concrete rejected samples were collected and distilled into a five-line design rubric → the implementation was scored against the rubric and fixed per the checklist → accepted in one revision.
- ❌ Negative: rebuilt a recipe app's landing page on gut feeling → rejected → rebuilt → rejected again — three full UI rewrites, at a token cost that would have paid for the rubric-distillation step ten times over.

## §7 Checkpoints and handoff (the session can die at any moment)

- Major turning point (direction change, a new batch of work starting) → immediately persist the current state to your task tracker.
- Long-running work: every independently deliverable unit → write the file and commit on the spot; do not hoard changes until the end.
- Session winding down, or context getting tight → write a 3-line handoff (done / next / blocked) to the task tracker or a handoff file, and clean up any background processes you started (see your environment-quirks file).

## §8 Irreversible actions — execution details (the enforcement layer of the ask-before-irreversible iron law)

- **Confirmation word**: before executing any action on the irreversible list, designate an explicit confirmation phrase (such as "confirm delete" or "confirm history rewrite") and execute only after the user types that exact phrase. **"ok / sure / yep" does not count** — it may only mean "I saw your message". If the user declines or does not reply → mark the action deferred; do not execute, do not nag.
- **Git history rewrite (force push / rebasing a pushed branch / filter-repo) prerequisites**: ① collaborators are informed (they must re-clone or reset afterward); ② a backup branch exists or a full working-copy backup is confirmed — both are mandatory for every history rewrite; ③ if the purpose involves a leaked secret, rotating that secret must be completed *first* — rotation is the actual fix; deleting history is only cleanup.
- **Before the first modifying action**, annotate the step's reversibility (reversible / hard to reverse / irreversible); an irreversible step must clear the two rules above first.
- **Creating or deleting scheduled jobs** (OS task scheduler / cron) is a side-effect action: get user consent before creating one, and when a project is retired, **sweep its schedules and access grants together with the code** (incident: an inventory-sync service was retired but its nightly scheduled job was never removed — it fired a false failure alert every day until someone traced it).

- ✅ Positive: purging a leaked API key from a repo → rotate the key first → create a backup branch → user types "confirm history rewrite" → only then run the history-rewrite tool.
- ❌ Negative: user replies "ok" and the agent force-pushes — the confirmation-word institution exists precisely to block this.

## §9 The four-rung task-stage ladder (should this be dispatched right now)

**Test the rungs in order; the earliest failing rung is the current stage. A request that bundles two rungs must be split and judged separately — skipping straight to Executing is not allowed:**

- **Thinking**: can the user state the problem in one sentence and name the decision this output will support? No → do not rush to build a brief or spec; ask back first (grill-first: batch your clarifying questions).
- **Exploring**: can you name 2–3 candidate directions, each with trade-offs? No → build an option-comparison table, again via batched questions — not a brief.
- **Deciding**: is there an explicit decision criterion beyond "it feels right"? No → list the criteria and wait for the user's ruling; taste with no rubric goes to §6.
- **Executing**: all three rungs passed and only the wording of the handoff remains → apply the collaboration-mode judgment below.

**At the Executing stage — Steer or Dispatch (including whether to hand the task to an external one-shot coding agent):**

- "Done" cannot be stated in one sentence, or you suspect the real problem hides deeper → **Steer**: stay in the main loop and work hands-on; do not outsource; do not pretend it has been thought through.
- "Done" fits in one sentence and the sources/constraints can be named → **Dispatch**: package it per your dispatch file's required fields and your prompt-template pre-flight check (this includes handing it to an external one-shot coding agent).
- One-off vs. checking a finished artifact vs. recurring — raise the distinction only when it changes the posture; recurring tasks follow your dispatch file's unattended-operation rules.

- ✅ Positive: the user could not say what "done" looks like yet demanded immediate dispatch → the agent said plainly "you can't yet describe what good looks like" and recommended steering first instead of forcing a dispatch.
- ❌ Negative: the Thinking-rung test failed, but because the user's tone sounded like they wanted a deliverable, the agent built a spec and dispatched anyway — skipping rungs without evidence.

---

Provenance: instituted in the source system, distilled from real field incidents; all examples rewritten as generic scenarios for publication — the lessons are real, the storefronts are not. Durability: high — judgment transfer is vendor-agnostic.

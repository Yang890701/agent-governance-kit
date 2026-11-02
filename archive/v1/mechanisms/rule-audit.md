# rule-audit — Semantic Correctness Audit of AI Rule Files (re-runnable prompt)

## What this is

Rule files for an AI coding agent only ever grow: entries go in, almost nothing comes out, and past a certain weight the AI starts missing rules it nominally loads. A structural health check (broken links, missing files, schema errors) covers integrity only and says nothing about meaning. This mechanism is a re-runnable audit prompt for the semantic layer — it walks every rule and asks two questions: is this still true, and can the AI still find it?

## When to run

Run it whenever the rule corpus may have drifted from reality — after a model-generation change, when a rule file is getting visibly fat, or when the AI keeps missing a rule it should have seen. It is a recurring health check, not a one-off cleanup; §0 lists the concrete triggers.

## §0 Triggers (run if any one applies)

- A model-generation change (your model roster or dispatch table changes).
- A rule file has visibly fattened — your always-loaded instructions file is approaching its line budget (e.g., a 60-line cap), or a single on-demand rule file is approaching its own cap (e.g., 250 lines).
- The AI has repeatedly missed the same rule — the same class of mistake logged twice in your lessons file, with the root cause judged to be "noisy context" or "a fuzzy rule".
- Long gap: more than ~20 sessions or ~3 months since the last run of this audit.
- Division of labor: this mechanism owns **correctness** (is this rule still true / can the AI still verify it); the per-turn fixed-cost **weight** audit is the companion standing-cost mechanism. Neither substitutes for the other — a rule can be entirely correct yet too heavy to keep always-on, and it can be feather-light yet expired. The same file can legitimately go through both.

## §1 Audit scope (explicit — never scan only the main instructions chain)

| File | When it loads |
|---|---|
| Your project instructions file (the global + project instructions chain) | Read in full at every session start |
| Hook-injected core rules (e.g., an iron-laws file a session-start hook injects) | Injected every session |
| Hook-injected orchestration / dispatch protocol | Injected **in full** every session (a several-thousand-token estimate — label it as an estimate; confirm the load timing against the hook source itself. On the host system this row was originally mislabeled "read on demand at dispatch time" and corrected on a later pass with line-level evidence from the hook code and docs) |
| On-demand rule files (dispatch, judgment, prompt templates, environment quirks, maintenance policy, lessons log, ...) | Read as needed via the routing table in the instructions file |

Scan all four layers; skipping any one falsifies the result. The known defect of generic "checkup" prompts is exactly this: they audit only the single main-instructions chain and never see the content that loads only when routed to.

## §2 Two gates, every rule (no skipping a rule because it "looks harmless")

**Gate A — Is it still true?** Verify against the current repository, read-only: do the commands, paths, and tools the rule references still exist? (Git history, file globbing, content search — never run anything that writes to or mutates the repo.) Anything that would need a build or test run to prove gets marked **pending verification** — drawing a conclusion without that proof is not allowed.

**Gate B — Can the AI find it?**

- Prefer a blind test: dispatch a subagent that does **not** load the rule file and give it the same class of task; see whether it does the right thing on its own. Before dispatching, confirm that your environment's isolated agents genuinely do not inherit the instructions files — never assume this without checking. Only after that confirmation does a pass count as "blind test passed".
- If a blind test is infeasible (no clean isolated environment, or the rule governs an action that only happens once the rule has been read), fall back to a **repo-evidence check**: cite the concrete files and the short search path that prove "findable" or "not findable", and honestly label the result "not a blind test; repo-evidence type".

A rule qualifies only if it passes both gates **and** belongs to one of five categories: iron laws; fixed procedures; easily-forgotten coupled changes; definitions of done; where-to-find-information pointers. Judge session-start-loaded rules (the instructions chain and hook injections) more strictly than on-demand entries — they are paid on every turn.

## §3 Semantic staleness + shadow-context check

- **Staleness test** (borrowed from an earlier harness-audit exercise): for each rule, ask "is the fact this states still true?" One-off or expired content gets the verdict **delete**, never **move** — expired content is garbage wherever you move it.
- **Shadow-context detection** (same source): look for content that keeps being hand-pasted into conversations while living outside the official files. A passage someone has to re-tell the AI every single time is the signal of "should have been institutionalized but wasn't" — recommend moving it into a rule file or the matching skill.

## §4 Babysitter-patch scan + model-change criterion (mandatory when the trigger was a model-generation change; borrowed from an earlier model-upgrade diagnosis exercise)

Bucket every rule first:

| Bucket | Definition | Leaning |
|---|---|---|
| Outcome Logic | Defines what a task must achieve | Keep |
| Guardrail | Safety / compliance / irreversibility protection | Keep (never delete because the model got stronger) |
| Procedural Scaffolding | Step-by-step tutorials and examples | Candidate to simplify |
| Compensating Complexity | Patches compensating for an older model's deficiencies | Candidate to delete — requires testing |

**Business Rule vs Model Rule test:** switch to the strongest model currently available — with this rule removed, would it do the right thing on its own?

- It would → **Model Rule** (deletion candidate; mark it "pending verification" first — actual deletion still requires the evidence standard in §6).
- Even if it would, the model still must not decide this alone (compliance, safety, customer data) → **Business Rule** (keep; "the model would get it right" is not grounds for deletion here).
- Nobody remembers why the rule was added → mark **needs confirmation**; do not force a classification, and never use the hunch "this model should be smart enough by now" as a deletion reason.

Cross-reference: the same lens applied at the agent/skill **body** layer belongs to a separate maintenance health check (a "legacy patches" item in whatever maintenance checklist governs your agents and skills). This section scans rule documents; that check scans tool bodies. Neither replaces the other.

## §5 Recommendation list (output format)

One entry per rule: `original text (file:line) | verdict (keep / revise / move / delete / pending verification) | evidence actually checked | if move → destination (nested or path-scoped instructions file / skill / hook / CI / agent roster)`.

- No evidence found → the verdicts "delete" and "revise" are forbidden; the only permitted output is "insufficient evidence — needs ___ to decide".
- Rank by how much attention each change gives back: session-start-loaded rules before on-demand rules; within the same layer, larger changes first. (Same ranking concept as standing-cost's, applied to correctness instead of weight.)

## §6 Conduct rules (report-only, iron rule)

- This audit is a pure reporting task: create, modify, or delete **no** files; run no command that writes caches or artifacts; use reading and searching only.
- Open the run with one sentence telling the user: "this run produces recommendations only — nothing will be changed."
- After the list is delivered, applying any item requires the user to name it explicitly. Before applying, show the diff; never commit on your own.
- **Deletion-class recommendations** (including pruning the lessons log) additionally require the deletion-evidence standard defined in your maintenance policy to hold (one of three named evidence types — defined in [maintenance.md](maintenance.md) §9, not restated here). If that standard is not met, the verdict stays "pending verification" — never delete.

---

Provenance: designed in the source system; hardened through repeated field runs, including an audit that closed with a net −8 lines across 8 rule files. Durability: high — vendor-agnostic. Chinese original preserved in zh-originals/.

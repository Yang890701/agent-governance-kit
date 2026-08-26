# maintenance — Maintenance Protocol for an AI Rule Corpus (standing policy)

## What this is

Rule files rot: facts expire, wording drifts, one-off reports outlive their purpose, and every added line taxes every future session. This is the standing maintenance contract for the whole rule corpus — who may change what, how changes are backed up and logged, how lessons are recorded and compressed, and what evidence a deletion requires. Three principles govern every clause: maintenance must be **cheap** (appending a lesson takes one line, no ceremony), **auditable** (every change leaves a trail — backup, commit message, cited incident), and **non-inflationary** (line budgets force consolidation instead of growth).

## When to run

This is not a scheduled audit; it applies every time you touch a rule file — appending a lesson, revising a rule, adding a document, deleting anything. The two companion mechanisms (rule-audit for correctness, standing-cost for weight) are the periodic checkups; this contract is the law they run under. File freshness is never hand-stamped — check it with git: `git log -1 --format=%ad --date=short -- <file>`.

## §1 Permission matrix (who may change what)

| Action | Rule |
|---|---|
| Append one lesson line to the lessons log | Anytime, no asking (format: §3) |
| Append a new trap to the environment-quirks file | Allowed; include the date plus one line describing the incident |
| Modify an **existing rule** in the behavioral rule files (dispatch, judgment, prompt templates) | Requires citing ≥1 concrete incident; back up first per §2; state the motive in the commit message |
| Delete a rule / change the iron laws / restructure the always-loaded instructions file | **Ask the user first** |
| Change any shared engine file (files co-maintained by more than one environment) | `git pull` first; check and register the in-flight-claims ledger (the file where concurrent environments claim work in progress — mechanism spec: [build-registry.md](build-registry.md)) before starting; re-mirror agents per §5 after changing them; commit + push when done |
| Change the hook-injected core-rules file (injected into every session of every project) | **Ask the user first** (blast radius = every session of every project) |
| Change a user project repository | Follow that project's local instructions; ask before anything irreversible |

Note 1: **fact expiry is not a rule change.** When a model name, path, or tool has changed, verify by testing and update the content directly — no incident citation needed. "Modifying an existing rule" means changing a behavioral instruction: when to dispatch whom, how to verify, in what order.

Note 2: **wording standard.** Before rewording a rule or adding one, apply your writing-for-agents guideline (shipped in this kit as the writing-for-agents layer of [building-discipline.md](../building-discipline.md)): hunt down no-op sentences; reserve prohibitions for hard fences and phrase everything else positively; choose indexable wording — it decides whether the rule is ever found.

## §2 Backup rules

- Before modifying any existing rule or instructions file: `cp <file> <file>.bak-YYYYMMDD` in the same directory.
- `*.bak-*` files stay out of git (gitignored); the git commit is the second backup — commit immediately after the change.

## §3 Lessons log: format and compression

- Append format: `- YYYY-MM-DD [category] one-sentence lesson (scene: one sentence)`.
- Categories: `encoding` / `dispatch` / `verify` / `env` / `judgment` / `other`.
- **Root-cause column** (added after an incident: the same class of pit kept being stepped in because the log recorded symptoms, not root causes — a rule whose wording had already been fixed re-offended and nobody noticed): end each line with `(root cause: missing tool | fuzzy rule | missing gate | noisy context | model limit) (fix: which rule/hook was changed, or "unfixed")`. Before ruling "model limit", the other four must be ruled out first.
- **Discriminator**: if a rule's wording was already fixed once and the same mistake recurs, "fuzzy rule" is no longer an admissible verdict — escalate to "missing gate" (needs a hook or other mechanical enforcement) or "noisy context" (the rule got diluted). One incident, one fix — no wholesale rebuilds; a systemic problem gets a one-line pointer to your systemic-diagnosis document instead.
- **Past 60 lines, consolidate**: merge duplicates, delete what has been institutionalized into a formal rule file, and leave one line recording the consolidation itself. The pass can be delegated to a memory-curator-type agent.

## §4 Line budgets (over budget means consolidate, not keep growing)

| File | Cap (host-system values — set your own) |
|---|---|
| Always-loaded project instructions file | 60 lines |
| Global (user-level) instructions file | 15 lines |
| Any single on-demand rule file | 250 lines |
| The on-demand rules directory in total | 1,200 lines |

The institution itself costs tokens — **lean is performance**. Before adding anything new, ask first: can it replace something stale instead?

## §5 Engine mirroring and health check

- Changed any shared agent / command / skill definition → re-run the install script that mirrors them into the harness's user-level config directory → takes effect **next session**, not this one.
- Agent frontmatter `description` must stay **under 1,024 characters** — on the host harness, longer ones are silently skipped (verified by test). A one-line length script is enough to check.
- After every engine change, run the read-only structural health check ("doctor" — shipped in this kit as [cli/doctor.js](../cli/doctor.js)); any FAIL is either fixed or logged in the lessons log with a reason.
- **Advisor quality check**: every ~20 sessions — or whenever an advisor's output looks off — dispatch a curator agent to check recent advisor output for format drift and errors; log the result in the session log; drift found → open a ticket to fix the definition file.
- The doctor already covers (user-approved): description length (warn above 950 characters, fail at 1,024), decision-log ordering strictly increasing, ghost decision references, mirror consistency. **Changing the doctor itself still requires asking the user first** — it is co-maintained by another environment.

## §6 Sync discipline

- Before a session touches the shared repo: `git fetch && git status -sb`; if behind, pull — another environment pushes to the same repo.
- After changing an institution file: commit + push — the other environment reads it too.
- Division between the rules directory and the memory directory (memory's actual path lives in the environment-quirks file, not restated here — §7's iron rule): rules files hold **rules**; memory holds **facts and state** (user profile, project deadlines). Rules never go into memory; facts never go into rules files.

## §7 Documentation charter (cures document drift; the full articles live in the routing/manifest document, only the iron rules here)

- **Iron rule: the same fact is never hand-copied into a second file** — to reference it, cite the path plus section number. "Is it built yet" is checked live against the repo, never restated as prose (the one exception: mechanically verifiable manifest columns, which the doctor reconciles).
- The single-source-of-truth table and the file **manifest** live in one canonical routing document (not restated here; the manifest's scope and exclusions live there — since a later consolidation pass the scan covers subdirectories and directory-level registration).
- **New governance-layer .md** → register it in the manifest on the spot. A one-off document whose purpose has completed → move it to a sibling `archive/` (via `git mv`, updating old references). The doctor's two charter checks reconcile both on every run.
- **File headers carry only an "instituted" date** — hand-written "version / verified / last updated" stamps are banned; freshness comes from git (`git log -1 --format=%ad --date=short -- <file>`). (Added after an incident: a checkup found several files genuinely changed while their stamps had not moved — one was 25 days stale.) Append-only ledgers keep their per-row dates as before.
- **Sunset clause** (cures "documents die and nobody buries them"): every one-off report / inventory / audit document must, at birth, carry a header line "**archive when purpose complete; trigger = ___**", where the trigger is a decidable event ("reconciliation finished", "next health check"). A new report-class document without a sunset line is a violation; the doctor or any review rejects it on sight. Precedents — positive: an intake-recheck ticket born with a built-in expiry checkpoint that auto-adjudicated on schedule; negative: an audit report with no sunset that lay unarchived for three weeks after its purpose completed, until an inventory caught it.

## §8 Skill cross-call discipline (borrowed from the two-layer design of a public skills pack)

- **Two layers**: **entry-type** = flow commanders triggered by the user or the router (the development pipeline, the hard-task protocol, a diagram skill, ...); **loop-type** = shared logic that gets referenced (workflow recipes, advisor agents).
- **Iron rule: an entry-type skill never calls another entry-type skill.** To use another entry's capability, sink the shared logic into an advisor agent or a loop-type unit and have both entries reference it; loop-types never call back up into entry-types either. Entry calling loop is the normal case.
- Before shipping a new or modified skill: run a roster-wide mutual scan (including the cross-call check) with a skill-diagnostician-type agent. Host-system inventory at last check: no violations.

## §9 Rule lifecycle (semantic-dilution prevention; the audit procedure's canonical home is the rule-audit mechanism, only the thresholds live here)

**Deleting a rule** (including pruning the lessons log) requires **one of three evidence types** — this is the deletion-evidence standard that rule-audit's deletion-class verdicts point back to:

1. **Changed reality** — the project's circumstances have thoroughly changed: the tool, path, workflow, or failure mode the rule governs no longer exists.
2. **Superseded practice** — the team has adopted a different long-term practice that covers the same ground, and the rule now describes the old way.
3. **Tested removal** — the rule was actually taken out (or an agent demonstrably ran without it) and no regression followed; a hunch that "the model is smart enough now" does not count as a test.

Evidence short of one of these three → the rule is marked **pending verification** and must not be deleted.

- **Model-generation change → mandatory trigger**: run the rule-audit once, walking every rule file (always-loaded instructions, hook-injected core rules, orchestration protocol, on-demand rules) and asking of each rule: does it still hold, and can the AI still find it?
- All other triggers (a rule file fattening / the AI repeatedly missing a rule / a long gap since the last run) and the audit method itself (two gates, staleness test, shadow-context detection, babysitter-patch scan) live in the rule-audit mechanism — single source of truth, not restated here.

---

Provenance: instituted in the source system; hardened by a documentation charter and a consolidation pass. Durability: high — any rule corpus needs a maintenance contract, regardless of vendor.

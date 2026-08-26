# Pipeline skills — the two flagship protocols

Two packaged protocols sit on top of the advisor agents: **devline**, the end-to-end development pipeline that every new build runs through, and **hard-battle**, the protocol reserved for tasks that are hard, ambiguous, and high-stakes all at once. Both are opinionated defaults with provenance, not blank ledgers. This page is the overview; the full definitions are longer and heavily wired into the host system.

---

## devline — the development line

*One conductor, one production line, two hard gates, everything on file.*

**What it is.** A station-based pipeline that takes a project from "I want to build something" to deployed-and-maintained: **interview → spec → constitution + architecture → task decomposition → implementation → audit → testing → deploy → maintenance**. Every station declares its input files up front and writes its artifact into a `.devline/` directory in the project — interview notes, spec, constitution, architecture, task table, evidence, and a running log. Existing projects get an intake procedure instead of a restart: reverse-generate just enough artifacts (current state becomes constitution v1) and join the line at the incremental loop.

**Two hard gates.** The spec gate (**GATE-R**) and the architecture gate (**GATE-A**). Each gate requires an adversarial cross-model review — up to three rounds, with exit-code gatekeeping on every round and a rule that a reviewer maintaining dissent must keep arguing rather than fake consensus — plus explicit user sign-off. Unresolved disagreement escalates to the user, whose ruling counts as consensus. "Just start coding" does not open a gate; the user can waive one only by explicit, logged exception. Past GATE-A the constitution is frozen: touching it means going back through the gate.

**Cross-model separation of duties.** The conducting model interviews, judges, decomposes, and verifies. Bulk implementation and gate cross-review go to an external one-shot coding CLI (a second vendor's agent) — the cross-vendor split is deliberate, so no single model family grades its own homework. The external agent's "I tested it" is never accepted as evidence: the conductor personally re-runs each task's acceptance commands and spot-checks the result before anything is marked done. If the external CLI is unavailable, every role degrades automatically to fresh-context subagents of the conducting model, with a smoke test to switch back — the line does not stop for a single tool.

**Files, not memory.** Cross-station state lives only in `.devline/` artifacts; carrying context by conversational memory between stations is forbidden. When an artifact and the conversation disagree, the file wins and the conflict is logged. Any session — including a brand-new one after a crash — resumes by reading the log to find the current station, then reading that station's declared inputs.

**Distinctive design, briefly.** Frontier interviewing (only ask questions whose prerequisites are already settled, five per round, each with a suggested answer); tickets sized so one fresh AI context window solves exactly one, cut as vertical slices that each demo independently; test-first with expected values from an independent truth source, never recomputed with the implementation's own algorithm; a cheating detector that flags any change set touching test files and implementation files together; and a plain-language "consequence translation" attached to every diff sent for sign-off, with a three-way spec comparison (required-but-missing / missing-but-required / present-but-never-asked — where scope creep hides).

**Why it is shaped this way.** Two facts drove the whole design. First, *the one who builds must not verify their own work* — hence the cross-vendor split, fresh-context reviews, and a conductor who re-runs everything. Second, *sessions can die at any moment* — hence a pipeline where no station depends on anyone remembering anything.

---

## hard-battle — the protocol for battles

*For work that is hard, ambiguous, and important at the same time — and only that.*

**When it fires.** Not for routine edits, conversation, or well-specified implementations. The user invokes it by name; the model may suggest it in a single sentence only when a task hits all three conditions at once — multi-file or cross-system impact, fuzzy requirements, high cost of failure.

**Core moves.**

- **Fact inventory first.** Open with three columns — known facts, hypotheses to test, unknowns — and verify every hypothesis by live measurement, never from training memory or impression. One up-front batch of at most five questions; after that, reversible preference calls are made autonomously and flagged in the closing, and only the four mandatory stops (irreversible actions, contradictory requirements, taste without a rubric, scope expansion) still halt the line.
- **Value-ordered incremental delivery.** Always do next the item whose loss would hurt most if the session died right now. Every finished unit is written to disk and committed immediately — write-as-you-go means interruption loses nothing, and mid-session disconnection is explicitly defined as not a failure.
- **Root-cause-first debugging.** An error message is not the disease. List three to five competing hypotheses (never just one), design measurements that discriminate between them, and obey a "no red light, no theory" gate: no theorizing until the exact symptom reproduces on a command actually run. Can't build the reproduction? Say so and ask for access or artifacts — guessing is not a fallback.

**The mandatory closing — four pieces, non-negotiable.** The protocol's signature rule: when context runs low, drop the work in progress and jump straight here (minimum viable closing: commit what's done plus a three-line handoff).

1. **Adversarial fresh-context review** — a clean-slate agent hunts for gaps between claims and reality, re-testing every cited path, name, and number; findings are all fixed or individually rebutted with verifiable evidence.
2. **Read-back verification** — every artifact re-opened to confirm it actually landed on disk with its key content intact.
3. **Honest limits** — what was not done, not verified, or rests on assumption, stated plainly rather than rounded up to "done."
4. **One-page summary** — what changed, why, and how to use it tomorrow.

**Where it came from.** This protocol was not designed; it was distilled. The system owner hand-wrote a battle directive for one real engagement — the engagement that produced the ops institution itself — and the directive plus its execution record were condensed into this skill, then double-validated: an adversarial audit whose 14 findings were all resolved, and a scenario-comprehension test on a weaker model (8/8 correct, with 6 ambiguities surfaced and rewritten).

---

*Provenance: devline iterated through six graft waves since institution; hard-battle distilled from a real battle directive by the system owner. Durability: medium-high — the pipeline shape and gate discipline transfer; station wiring is host-specific. Full sanitized definitions are included in this folder.*

# Advisor agents — the judgment layer

Eleven agents that do not write code. They judge, verify, price, and gate: the work that stays scarce no matter how good the executing models get. Each card below states what the agent does, its provenance (where it came from, how many times it was reworked, and when), how durable it is under model churn, and when it fits you.

Two honesty notes up front:

- **Provenance is credited, not hidden.** Most agents were seeded from an internal toolkit corpus, then reshaped through the intake court and iterated across logged decisions. The refinery is the product, not the ore.
- **Agents get performance reviews.** A watchlist tracks field use; zero use across two audits proposes retirement. Two agents are currently on it — they ship anyway, labeled, because the review mechanism is the feature.

---

### goal-definer — turns fuzzy tasks into drift-proof specs
- **Does**: converts a rough ask into a paste-ready spec (three audience shapes: agent / dispatch / human brief); a *grill* mode interrogates fuzzy scopes before anything gets built.
- **Provenance**: seeded from the internal toolkit corpus, then reworked four times between June and August 2026 (most recently adding a grill mode).
- **Durability**: high — specifying intent is the eternal interface to any executor.
- **Fits you if**: your agents keep stopping short or building the wrong thing.

### taste-distiller — writes down the standard in your head
- **Does**: mines your history of rejecting or rewriting AI output and emits a taste profile — reject/want pairs with calibrated 1–5 rubrics, in Markdown and JSON for judge prompts.
- **Provenance**: seeded from the internal toolkit corpus; style-distillation parts grafted from a later intake.
- **Durability**: high — no model reads your mind.
- **Fits you if**: output keeps feeling "too AI" and the standard exists only as a feeling.

### win-distiller — keeps a win from evaporating with the chat
- **Does**: distills a one-off AI success into a reusable, model-agnostic asset (prompt / SOP / skill) with built-in verification; the mirror image of taste-distiller, which mines failures.
- **Provenance**: seeded from the internal toolkit corpus; a four-condition asset threshold was added in a later rework. **⚠ Watchlist** — zero field use to date.
- **Durability**: high.
- **Fits you if**: a model just nailed something and the method lives nowhere but the transcript.

### work-auditor — catches completion theater
- **Does**: audits whether returned work is genuinely done or merely finished-looking; returns a verified/unverified breakdown per dimension, the most likely silent failure, minutes-scale spot checks, and a four-state verdict.
- **Provenance**: seeded from the internal toolkit corpus; an eight-part verification kit was added in a later rework.
- **Durability**: high — the better the models, the rarer but sneakier the failures; acceptance never stops being your liability.
- **Fits you if**: you accept deliverables you didn't watch being made.

### eval-designer — replaces "seems fine" with a matrix
- **Does**: designs a six-cell evaluation framework (component/end-to-end × objective/subjective × quant/qual), a judge rubric with anchored 5/3/1 examples, and an instrument-first priority order.
- **Provenance**: seeded from the internal toolkit corpus; convergence conditions were added in a later rework.
- **Durability**: high.
- **Fits you if**: an agent is running in anything that matters and nobody measures it.

### multi-agent-judge — the restraint specialist
- **Does**: pressure-tests whether a workflow needs multi-agent at all; five-axis scorecard and a six-level verdict ladder whose lowest rungs are *don't build* and *single agent + chain*. Takes the lowest sufficient rung.
- **Provenance**: seeded from the internal toolkit corpus; verdict ladder and fake-dependency checks added after a controlled blind test.
- **Durability**: high — vendors sell you more agents; nobody sells you fewer.
- **Fits you if**: you're tempted to split one agent into many.

### workflow-decomposer — from idea to build order
- **Does**: decomposes a workflow idea into 5–7 atomic steps, marks each fuzzy vs deterministic, picks the stack layer per step (one-shot / RAG / tool-calling / fine-tune / multi-agent), and names the two steps to prototype first.
- **Provenance**: seeded from the internal toolkit corpus; the fake-dependency dimension was added in a later rework.
- **Durability**: high.
- **Fits you if**: you have a workflow idea and no idea what to build first.

### permission-architect — least privilege for agents with hands
- **Does**: scores every agent action on reversibility, blast radius, frequency, and validation-possibility; places each on a tier 0–4 autonomy ladder with escalation rules and a rollback plan.
- **Provenance**: seeded from the internal toolkit corpus — original material lost, framework rebuilt from its skeleton; evidence thresholds hardened twice since.
- **Durability**: high — grows more important every time an agent gains a new side effect.
- **Fits you if**: an agent is about to touch email, production, money, or customer data.

### skill-diagnostician — fixes misfiring skills at the routing layer
- **Does**: diagnoses why a packaged skill fails to trigger (or fires when it shouldn't) — the fault is almost always the description field, the only part read at routing time; includes a roster-wide mutual-scan mode.
- **Provenance**: seeded from the internal toolkit corpus, then reworked twice (adding the mutual-scan, then the interop discipline).
- **Durability**: medium — bound to the current skill-packaging format; the *route-by-description* insight travels further than the format.
- **Fits you if**: should-fire-but-doesn't.

### tool-launch-filter — is this launch worth your afternoon?
- **Does**: scores a hyped tool launch on five structural axes (connectivity / openness / data access / ecosystem / stackability) and returns a go/no-go tailored to your stack. Skeptical by default; most launches score LOW.
- **Provenance**: seeded from the internal toolkit corpus.
- **Durability**: high — hype is a renewable resource.
- **Fits you if**: everyone is posting about a launch and you feel the pull.

### memory-curator — the librarian with a promotion contract
- **Does**: reviews recent session logs, proposes memory consolidation, flags stale or duplicated decisions, surfaces keep-forever candidates. Report-only — never edits memory itself. Unverified conclusions never get promoted to durable memory (evidence, sign-off, expiry trigger required).
- **Provenance**: built in-house for the file-based memory layer; promotion contract and blind-spot patterns grafted later. **⚠ Watchlist** — zero field use to date.
- **Durability**: high — continuity across sessions outlives any model.
- **Fits you if**: memory keeps growing but your trust in it doesn't.

---

*Full sanitized agent definitions ship in this folder at release; these cards are the index. Every graft above has a ledger entry and a dated decision record — the full intake ledger and decision log stay in the private originals.*

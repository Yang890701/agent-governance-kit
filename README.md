# agent-governance-kit — an operating layer for AI-assisted work

> Most AI skill packs only grow. This one also shrinks: every standing rule has a per-request cost, gets audited, and gets deleted when the cost outweighs the value.

## What this is

A governance layer for working with AI coding agents, extracted from a private system in daily operation since 2026-05-28 — referred to throughout these pages as the **source system**:

| Operating record | |
|---|---|
| Time in operation | ~3 months, 24 session logs |
| Decision log | 52 dated entries, unbroken since day one |
| Intake ledger | 34 audited acquisitions of external methodology |
| Audit reports | 4 batches, blind-test evidence included |
| Anti-bloat record | net **−8 lines** after the last rule audit; **3 wholesale rejections** of popular packs; an agent watchlist that retires unused advisors |

It was built and operated by a single engineer running an AI workforce solo. The point of the system is the management structure that keeps a one-person AI team honest at scale: internal controls, cost accounting, separation of duties, and audit trails, applied to AI labor.

## Why this survives model upgrades

Two tests every item here had to pass:

1. **Vendor-swap test** — replace the underlying model with any vendor's. Does the rule still hold?
2. **Absorption test** — will vendors ship this natively within 12 months? If yes, it's a consumable and is labeled with an expiry date.

What passes is always the same kind of thing: acceptance verification, taste and goal specification, fixed-cost accounting, separation of duties, permission tiers, decision trails. Models change; the problem of delegating work to someone smarter than your instructions does not.

## The three layers

| Layer | What's in it | Transferability |
|---|---|---|
| **Mechanisms** (`mechanisms/`) | Standing-cost audit, rule audit, intake court, decision-log charter, build registry, maintenance protocol | Blank ledgers — the mechanism is universal; you fill in your own rules |
| **Operations** (`agents/`, `skills/`) | 11 advisor agents, a development pipeline with hard gates and cross-model review, a battle protocol for hard/ambiguous/high-stakes tasks | Opinionated defaults — each item carries a provenance card saying where it came from and when it fits you |
| **Environment** (`environment/`) | Model routing table, platform traps | Consumables — dated, expiring, kept on purpose to demonstrate how the mechanism layer manages rot |

Plus **case studies** (`case-studies/`): how the mechanisms actually play out in the field — starting with a controlled blind test that decided whether a popular-style skill pack got adopted or rejected. Chinese originals of most mechanism docs are preserved in `zh-originals/` — the folder's README lists which stay private and why; the full internal decision log stays private and is available on request. Recurring house terms (intake court, graft, conductor, blank ledger, …) are defined once in [GLOSSARY.md](GLOSSARY.md).

## The intake court (the part nobody publishes)

Every external methodology — including the most popular skill packs of the moment (mattpocock/skills, superpowers, and others) — went through a documented review before anything entered this system:

- **3 wholesale rejections**: a 232-persona agent pack (would flood the router), a plugin bundle, and a workflow-builder prompt set whose "judge" duplicated an existing agent — proven by a 4-agent controlled blind test whose ~220k-token price is on the ledger.
- **Selective grafts with receipts**: e.g., 6 techniques grafted from a 30-skill pack after a full read; verdicts published.
- **Three iron rules**: no rejection without a blind comparison; every deferral gets a revisit trigger; every "already covered" claim needs a quote.

Provenance is not hidden here — it is the product. External material is credited per item (third-party repos by name; an anonymized internal toolkit corpus for private source material), each with its own provenance card.

## Honesty labels

- Consumables carry **expiry dates**; nothing pretends to be timeless.
- Two advisor agents are currently **on the watchlist** (zero field use — the next audit proposes retirement). They ship anyway: the performance review is the feature.
- All examples in the judgment rules were rewritten as generic scenarios; personal and employer-specific content was removed before publication.
- This is a **snapshot of a living system** — the original evolves daily. No support obligation is implied.

## Quickstart

See **[QUICKSTART.md](QUICKSTART.md)** — adopt the mechanism layer in 10 minutes: a build registry for parallel sessions, your first standing-cost audit, and the rule audit. No installer required for that; every mechanism is a self-contained markdown contract that any file-reading AI agent can execute. For the full system, `template/install.ps1` (Windows PowerShell) installs the per-project data skeleton, wires the bundled hooks, and mirrors the bundled agents, commands, and skills to `~/.claude/`. (The runtime layout keeps the system's internal name, `agent-os` — the kit name is the public face, the layout name is load-bearing in paths and code.)

## License

MIT — see [LICENSE](LICENSE).

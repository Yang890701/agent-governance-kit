# <Project Name>

<One-line description of this project.>
備註(中):<一句中文敘述>

---

<!-- WAKE-SUMMARY:START — the only part of PROJECT.md auto-injected each session; the full file is on-demand. Keep this block short (~600 tokens). -->
## Wake Summary (always-injected)

- **Project:** <name> — <one-line intent>.
- **Phase:** <current phase / status>.
- **Next action:** <the single next concrete action; MUST match ROADMAP's first non-completed item>.
- **Blocker:** <none | what's blocking>.
- **On-demand (read only when the task needs it):** `ROADMAP.md` (plan + anti-drift) · `DECISIONS.md` · full `PROJECT.md` · latest `SESSION_LOG` · `memory/brain-routing-log.md` (the Brain greps it for recall).
<!-- WAKE-SUMMARY:END -->

## Current Phase

<phase status>

## Last Checkpoint

| Field | Value |
|---|---|
| Session | — |
| Completed | — |
| Next action | — |
| Blocker | — |

備註(中):每次 session 結束時更新這一格 + 上面的 Wake Summary。

## How To Resume This Project

The SessionStart hook auto-injects **only the lean set**: `BRAIN.md` (the full Dispatcher protocol) + this file's **WAKE-SUMMARY block** + any **active handoff ticket**. You do NOT need to type "read PROJECT.md" or any wake-up command.

Everything else is **on-demand** — read only when the task needs it, in this order:

1. `ROADMAP.md` — phase plan + anti-drift protocol
2. `DECISIONS.md` — architectural choices and why
3. `OPEN_QUESTIONS.md` — pending decisions
4. Latest file in `SESSION_LOG/`
5. `memory/brain-routing-log.md` — the Brain greps this for recall

備註(中):新 session 開頭只自動載入精簡組(BRAIN 全文 + 這份的 Wake Summary + 有票才灌的接力票),不用打喚醒指令。其餘按需依序讀。

## Hard Rules (Never Violate)

<Add project-specific rules here. Examples:>

1. NEVER delete entries marked TREASURE without explicit user consent.
2. ALWAYS log architectural decisions to `DECISIONS.md` before changing direction.

## File Map (engine/data split)

### Data (this project — lives in `.claude/agent-os/`)

| Path | Purpose |
|---|---|
| `PROJECT.md` | This file. Snapshot + wake-summary. |
| `DECISIONS.md` | Architectural decisions D001-DNNN with rationale. |
| `OPEN_QUESTIONS.md` | Pending decisions requiring user input. |
| `ROADMAP.md` | Phase plan + anti-drift protocol. |
| `SESSION_LOG/*.md` | Per-session work logs (YAML frontmatter required). |
| `memory/brain-handoff.md` | Live cross-session handoff ticket (stage 2E). |
| `memory/brain-routing-log.md` | Append-only routing log; the Brain recalls from it (stage 2D). |
| `memory/TREASURE/*.md` | Project-specific permanent memories (never auto-deleted). |
| `snapshots/<date>/*.md` | Hook-generated rolling backups. |

### Engine (shared — lives in the kit repo, not in this project)

**`BRAIN.md`** (the Dispatcher protocol — injected in full each session), agents, hooks, CLIs, slash commands, references, and universal TREASURE all live in the engine, auto-discovered via `~/.claude/` mirrors / injected by the SessionStart hook. You do not manage engine files from inside this project. To customise the Brain for *this* project only, drop your own `.claude/agent-os/BRAIN.md` here to override the engine copy.

備註(中):資料留這個專案,引擎共用一份在 kit repo。你不用管引擎,改一次所有專案都吃到。

## Token Budget Note

This file is intentionally short because its WAKE-SUMMARY auto-loads at every session start. Keep the Wake Summary + Last Checkpoint tight (~600 tokens). Other files load on demand.

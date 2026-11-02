# ROADMAP

> Multi-phase build plan for this project. PROJECT.md `Next action` always points at the first non-completed item below.
> Drift = misalignment between PROJECT.md Next action and the current ROADMAP item.
> 備註(中):計畫表。PROJECT.md 的 Next action 永遠指這裡第一個未完成項目;對不上就是偏移。

---

## Anti-drift Protocol

1. **Session start** — SessionStart hook injects PROJECT.md + this file. Verify PROJECT.md `Next action` matches the first non-completed item below. If mismatch → stop and ask user.
2. **In session** — execute items from the current phase only. Off-roadmap requests trigger "this isn't on the roadmap, OK to add/swap?" before doing.
3. **Session end** — refresh PROJECT.md `Last Checkpoint` + `Next action` to point at the next pending item.
4. **Architecture-level changes** — must be logged in DECISIONS.md before editing this file.

備註(中):每次 session 開頭照這個流程對齊,沒對齊就停下來問。

---

## Phase Status

| Phase | Description | Status | Trigger |
|---|---|---|---|
| 1 | <First phase description> | ⏳ Pending | — |

---

## Phase Detail

### Phase 1 — <Name>

- **Goal**: <what this phase accomplishes>
- **Deliverables**: <list>
- **Completion**: <exit criteria>
- 備註(中):<中文簡述>

---

## Parked Ideas (revisit later)

(Add items here that surface mid-development but don't fit current scope. Each entry: why parked + revisit-when condition.)

---

## Change Log

| Date | Change | Reason | Decision Ref |
|---|---|---|---|
| — | — | — | — |

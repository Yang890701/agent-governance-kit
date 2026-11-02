---
description: Multi-Dimensional Code Review — review one change (PR/diff/branch) across independent lenses (correctness/security/performance/maintainability/simplification), plus a separate spec-fidelity axis when a spec/ticket is provided (missing/extra/diverging work — never merged into the quality lenses), verify each finding, converge into a per-dimension report. Runs a Claude Code dynamic workflow (needs v2.1.154+, paid plan).
argument-hint: [optional: PR# / branch / diff · dimensions · token budget]
---

The user wants to run a **Multi-Dimensional Code Review** (Layer-2 Workflow). Optional pre-filled args — use them to skip any question already answered, never re-ask what's given: $ARGUMENTS

<role>
You are orchestrating a Claude Code dynamic workflow that reviews one specific change across multiple independent dimensions and verifies each finding before reporting. Your job is to gather what is being reviewed and which dimensions matter, then create and run a workflow that fans out one reviewer per dimension, verifies each finding, and converges into a single multi-dimension review. You do not review the diff yourself in this conversation.
</role>

<context-gathering>
One question at a time. Wait for each answer.

1. Target: "要審的是什麼變更？給我 PR 編號、分支名、或一段 diff / 檔案清單。有對應的規格或票（01-spec / issue / PRD）就順便給路徑——我會多開一條獨立的 spec 忠實度軸。"
 - Wait.
2. Dimensions: "你最在意哪些維度？correctness、security、performance、可維護性、簡化機會。改既有系統的話還可以加：guardrail/不准碰清單違規、靜默行為改動（D046/T7）。可以全選，也可以加你自己的。"
 - Wait.
3. Budget: "token 預算上限設多少？我會寫成硬上限。"
 - Wait.
4. Reuse: "如果這次跑得順，要不要我提醒你把它存成可複用的斜線指令，例如每週對新分支跑一次？"
 - Wait.
5. Sanity check: play back the target, the chosen dimensions, the budget, and whether to save for reuse. "對嗎？確認後我把計畫攤給你看再跑。" Wait.
</context-gathering>

<execution>
After confirmation, create and run a dynamic workflow with this shape, and let Claude Code show the plan for approval first:

- Stage 1, Review by dimension (breadth): fan out one reviewer agent per chosen dimension, each looking at the same change but only through its own lens (correctness, security, performance, maintainability, simplification). This is perspective-diverse coverage: different lenses, not duplicate reviewers. Use a pipeline so each dimension flows to verification as soon as it finishes.
- Brownfield 維度補強（D046/T7，使用者選用時才加）：**guardrail/不准碰清單違規**（Blocker 等級）——是否動了 Do-Not-Touch 清單、改了宣告範圍外的共用 hook/component/file、或改變了其他頁面依賴的回傳型別/參數/預設值；**silent behavior change**（Blocker 等級，獨立於 correctness，不可被它順帶覆蓋）——是否改了既有行為但不在宣告任務範圍內。maintainability 維度併入檢查項：是否重造了共用層已存在的元件或 utility（wheel reinvention）。correctness 維度併入檢查項：新的錯誤處理是否走專案自己的 logging 機制，而非直接 console.error 等同類方式讓錯誤在生產環境靜默消失。可選加掛：**跨頁面契約影響**——逐一使用處判定 UNCHANGED/AFFECTED/UNKNOWN，沒比對過實際使用方式前不得標 UNCHANGED，不確定就標 UNKNOWN 並說明要查什麼才能確定。
- Spec-fidelity axis (D043, only when a spec/ticket path was given): one extra reviewer that reads the spec and judges the change ONLY as 漏做/多做/偏離規格 — it never judges code quality, and the quality lenses never judge spec fit. Its findings go through the same verification but stay in their own report section end-to-end; do not merge them into quality dimensions (兩軸分開防互相污染 — "程式漂亮" 不得掩護 "做的不是規格要的").
- Stage 2, Verify each finding: for every finding a dimension raises, spawn an independent verifier that adversarially checks whether it is real and correctly scoped to this change. Drop findings that do not hold up.
- Stage 3, Converge: a single synthesis agent on the strong model merges the verified findings, removes duplicates that several lenses flagged, and writes one report grouped by dimension, ending with an overall merge recommendation.

Scope every agent strictly to the change under review, not the whole codebase. Enforce the token budget as a hard ceiling. If the user asked to save it, remind them after a clean run that they can press s in /workflows to save it as a command.
</execution>

<output-format>
The report exists so the user can decide whether to merge, with each concern traced to a dimension and already verified.

Section purposes:
- 總評: merge, hold, or needs-work, and why, up front.
- 各維度發現: the verified findings per lens, so concerns are organized by expertise.
- 跨維度重點: issues that more than one lens flagged, since those usually matter most.

格式：

## 總評：{可以 merge / 修完再 merge / 需要大改}
（兩三句說明。）

## 各維度發現
### {維度名稱，如 Correctness}
- 位置: {檔案:行}
- 問題: {說明}
- 建議: {修法}

## 規格忠實度（有提供 spec/票才有此節；獨立軸，不與品質維度混排）
- 漏做: {spec 要求但變更沒做的}
- 多做: {spec 沒要但變更做了的}
- 偏離: {做了但跟 spec 不一致的，附 spec 段落對照}

## 跨維度重點
（被多個 lens 同時點到的問題，優先處理；guardrail 違規與 silent behavior change 屬 Blocker 等級，優先於其他發現呈現——D046/T7。）
</output-format>

<guardrails>
- You orchestrate; the agents read the diff. Do not review the change yourself in the main conversation.
- Give each dimension a genuinely different lens. Do not spawn duplicate identical reviewers.
- Scope all agents to the change under review, not the entire repository.
- Only report findings that passed verification.
- **Enforce the budget for real:** in the script, gate fan-out on `budget.spent()` against a start baseline and stop when the user's cap is hit (the interviewed number does NOT set `budget.total`); `log()` what was skipped — never silently exceed it.
- Do not fabricate line references. Only cite what agents actually read.
- Do not use markdown tables. Use bullet blocks.
- Output in Traditional Chinese, keeping dimension names and technical terms in English.
</guardrails>

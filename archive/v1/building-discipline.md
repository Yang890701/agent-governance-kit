# Building Discipline (D034)

> How agent-os builds or ports any **agent** or **skill**. Integrates the `obra/superpowers` `writing-skills` discipline (TDD-for-skills + rationalization-hardening + failure→form matrix), fitted to agent-os's L1→L3 bar (D019/D021) and Hard Rules.
> Sibling to: D021 (toolkit→one-shot porting protocol) · `skill-diagnostician` (routing-layer `description` audit). This doc governs **how solid the thing is built — and, since D049/C1, how it is maintained after real runs** (Maintenance layer chapter, from the internal toolkit corpus), NOT how it triggers.
> 備註(中):蓋/移植任何 agent 或 skill 的紀律。整合 superpowers writing-skills 的「測試先行 + 把規則對藉口釘死 + 失敗類型決定寫法」精髓,接上既有的 L1→L3 bar;另加「維修層」章(出處:內部素材庫)。管「蓋得扎不扎實+蓋完怎麼修」,不管「會不會觸發」(後者是 skill-diagnostician)。

## The Iron Law: no agent/skill ships without first proving the gap it closes

Before writing the agent/skill, RUN the pressure scenarios WITHOUT it and document the baseline failure verbatim. You build to close *that observed gap*, not an imagined one. If the base model already handles the scenario well, the agent/skill earns nothing — don't build it (reinforces D024 "earn-their-keep").

備註(中):動手前,先讓「沒有這個 agent/skill」的情況跑壓力情境、逐字記下它怎麼壞;你是為了關「那個真的觀察到的缺口」而蓋,不是憑空想像。base model 本來就做得好 = 這東西賺不到價值,別蓋。

## RED → GREEN → REFACTOR (applied to agent/skill building)

- **RED** — Write 3+ pressure scenarios (combine time pressure / sunk cost / ambiguity). Run them against the base model (or the un-built agent) with NO guidance. Record the baseline behaviour verbatim. Identify the rationalizations / failure modes.
- **GREEN** — Write the *minimal* agent/skill body that closes those specific baseline failures. No speculative scope.
- **REFACTOR** — Re-run the scenarios WITH the agent/skill. Close new loopholes the model finds. Repeat until it behaves under pressure.

Maps onto agent-os's existing bar: **L2** (prompt behaviour on a real task) is where RED scenarios run; **L3** (real-usage) is the REFACTOR signal. D034 adds the **RED-first** step the bar left implicit — write the failing scenario *before* the body.

## Match form to failure type (selection table)

Pick the wording form by the *kind* of failure the baseline showed:

| Baseline failure | Right form | Wrong form |
|---|---|---|
| Skips/violates a rule under pressure | Prohibition + rationalization table + red-flags checklist | Soft guidance ("prefer", "consider") |
| Output has the wrong shape | Positive recipe: state what the output IS — its parts, in order | A list of prohibitions |
| Omits a required element | Structural: a REQUIRED slot/field in a template | Prose reminders |
| Behaviour should be conditional | Conditional keyed to an *observable predicate* | Unconditional rule + later exemptions |

備註(中):用「baseline 怎麼壞」決定寫法——違規→禁令+藉口表+紅旗;形狀錯→正面食譜;漏元素→模板必填欄位;要條件化→綁可觀察的判斷條件。

## Rationalization-hardening (for discipline rules)

A discipline rule (one the model is tempted to talk itself out of) must close its loopholes explicitly:
- **No nuance clauses.** "Don't X *unless it matters*" reopens negotiation. Express real exceptions as conditionals on observable predicates, not vibes.
- **Letter = spirit.** State plainly: "Violating the letter of the rule is violating the spirit of the rule."
- **Rationalization table.** List every excuse the baseline produced + its rebuttal.
- **Red-flags checklist.** The model self-monitors for the phrases that precede a violation.

### Hard Rules — rationalization hardening (agent-os's 5, per PROJECT.md)

| Hard Rule | Excuse the model might use | Reality / rebuttal |
|---|---|---|
| **#1 Never modify original toolkit files** | "I'm only fixing a typo / reformatting / it's clearly an improvement" | The original is the immutable baseline for auditing every port. ANY edit destroys provenance. Improvements go in a copy or a Decision — never the original. (Originals are kept backed up read-only, outside this repo.) |
| **#1 (cont.)** | "It's a new toolkit I'm adding, not the originals" | Adding ≠ editing — fine. But never edit/overwrite an existing original to do it. |
| **#2 Never delete TREASURE without consent** | "It looks stale / duplicated / obviously superseded" | TREASURE = permanently kept by definition. "Stale-looking" is not consent. Surface it and ask; never delete unilaterally. |
| **#3 Always log major decisions to DECISIONS.md** | "This is small / I'll log it later / it's implied" | "Later" = never; unlogged = invisible to the next session. If it changes architecture or behaviour, it is a Decision NOW. |
| **#4 Ask before architecture-level changes** | "The user clearly wants it / it's obviously right / saves a round-trip" | Approval in one context doesn't extend to the next. Architecture changes are hard to reverse — propose, then wait for the go. |
| **#5 English-primary, 繁中 as 備註** | "This whole reply is in Chinese, so the doc can be too" | Spec/code stays English-primary; Chinese is the `備註(中):` line. (Conversation with the operator may be in another language — a different surface, not the doc.) |

備註(中):紀律規則要把「模型會用的藉口」逐條列出+反駁。上表把 agent-os 5 條鐵則對藉口釘死,呼應「別把信任錨在模型判斷」。

## Red-flags checklist (stop and re-read the rule if you catch yourself thinking…)

- "It's just a small edit to the original…"
- "This is obviously what they want, I'll skip asking…"
- "I'll log it / decide it afterwards…"
- "It looks stale, deleting is fine…"
- "The rule doesn't *really* apply here…" ( ← spirit-vs-letter, the most dangerous one)

## Maintenance layer: four-layer patch classification (post-ship retro — D049/C1)

> Source: the internal toolkit corpus's **Skill Retro Facilitator** (re-audit verdict: ADOPT — the system was already doing this by hand, e.g. the D045 health sweep; the verbatim-parts fidelity report is kept private in the source system). This operationalizes **REFACTOR for the post-ship lifecycle**: RED/GREEN cover before-and-at build; this chapter covers after a shipped agent/skill runs a REAL task and shows friction.

When a run shows friction, do NOT free-form "improve the prompt". Run a structured retro: gather the body full text, the run transcript (starting prompt / responses / your corrections / final output), the concrete pain points, and what a no-rework "good run" looks like — then classify EVERY pain point into one of four fix layers before touching anything:

| # | Layer | The gap | Symptom in the run | The patch names… |
|---|---|---|---|---|
| 1 | **Body** (methodology gap) | missing principle, priority order, or decision criterion | inconsistent results — the agent "has no compass" | which section of the body + the exact change |
| 2 | **`references/`** (reference gap) | a case that should be standardized (template, glossary, corner-case format) is missing | the agent *improvises something that should be standardized* | filename + 2-3 line spec of what goes in it |
| 3 | **`scripts/`** (script gap) | a deterministic step (data fetch, format check, calculation) is done via natural language and *drifting* | procedural part wrong: wrong date range, missing fields, wrong calculation | filename + what it does + how the body invokes it |
| 4 | **Subagent QA** (QA gap) | no final-mile validation | output *looks plausible at face value but fails on closer inspection* | checklist items + when the QA pass is invoked |

**A patch without a layer is incomplete.** (原文 guardrail 逐字收編)

**General health check** — run alongside every retro:
- **Total length**: body under ~500 lines? If not, what to extract to `references/`?
- **Repeated content**: the same principle stated multiple times?
- **Legacy patches**: compensations for old-model weaknesses the current model no longer needs. (Same lens as `mechanisms/rule-audit.md` §4, applied to agent/skill *bodies* instead of rule docs — the two cite each other and don't replace each other.)

**Then**: output the patch list in priority order (highest impact first, each tagged Layer + High/Med/Low impact) → apply → **re-run the workflow on a real task, not a contrived test** → still failing = run the retro again with the new transcript. If the `description` was touched, re-run `skill-diagnostician` (patch 後回頭驗觸發).

**Guardrails (anti-over-engineering — kept from the original):**
- Don't add subagent QA to low-stakes skills — "the overhead only earns its keep when error cost is high."
- Don't extract to `references/` without actual bloat — "a 200-line SKILL.md is fine."
- If the run was fine and the complaint is preference-level, say so — "don't manufacture patches to fill space."
- Distinguish "the skill needs work" from "the call-site prompt was vague" — the fix may not be in the skill at all; call that out.
- Only diagnose from the actual body + actual transcript; don't speculate about issues nobody observed.

備註(中):跑完真任務有摩擦,先把每個痛點分進四層——本體缺原則/該標準化的沒進 references/該寫死的步驟在用自然語言飄/缺最後一哩品管——沒標層的 patch 不算 patch。附三項健檢(行數/重複/舊模型補丁),修完拿真任務重跑驗證,改到 description 就回頭跑 skill-diagnostician。四條反過度工程 guardrail 原樣收:低風險不加 QA、沒膨脹不搬檔、別為交差造 patch、分清「skill 要修」跟「你 prompt 太模糊」。

## Writing-for-agents layer: variance engineering for any doc an agent reads (D051/G-1)

> Source: mattpocock/skills `writing-for-agents` (third-wave intake, intake ledger entry #33). Governs the **wording** of agent-facing docs — skill/agent bodies, CLAUDE.md/ops rules, references. Complements: `skill-diagnostician` (description/routing), the build layers above (solidity), `mechanisms/rule-audit.md` (staleness).

- **Context pointers.** A pointer's *wording* — not your intent — decides when the agent reaches the material. Essential material behind a weak pointer is a **variance bug**: sharpen the wording first; inline only if sharpening fails. One trigger per branch; merge synonym rewrites of the same branch.
- **Two loads.** Every always-loaded sentence costs **context load** (the model's window); every entry a human must remember costs **cognitive load** (the operator is the index). Choose which budget pays, deliberately.
- **Progressive-disclosure test = branching.** Material every branch needs stays inline; material only some branches reach moves to a referenced file behind a pointer. "The doc is long" alone is *sprawl*, not a reason to split.
- **Completion criteria.** Every step ends on a criterion with (a) **clarity** — done/not-done is decidable (fuzzy boundaries invite *premature completion*, because visible later steps pull forward) and (b) **demand** — high enough to force the legwork. Sharpen the boundary first; split the sequence only after actually observing rushing.
- **Prompt the positive.** A prohibition pulls the banned behaviour into context ("don't think of an elephant"). Reserve prohibitions for hard guardrails (rationalization-table territory, above), pair each with its positive goal; everything softer is stated as what TO do.
- **Leading words.** Borrow compact pretrained concepts (*tight*, *red*, *relentless*, *frontier*) — repeat the token, never the full sentence. A weak leading word is fixed by a stronger word, not by more words.
- **No-op hunt.** An instruction the model would follow anyway is paid noise. The test is relative to the *model*, not the reader; settle disagreements by **running the doc once** (hard-battle closing step 8's scenario test IS this mechanism), not by debate. A failing sentence is deleted whole, not reworded.
- **Environment is a source of truth.** A doc restating package.json/config/dir-layout is a cache that will go stale; cache only what can't be queried — unwritten conventions, the WHY behind choices, pitfalls the config won't confess. (Same principle as the docs charter: build-status truth = the live repo.)

備註(中):管「給 AI 讀的文件怎麼寫」——①指標措辭決定會不會被讀到,措辭弱＝變異 bug,先磨措辭再考慮搬進正文;②常駐句花模型視窗、要人記的花人腦,兩種預算挑著付;③全分支要用的留正文,部分分支才用的推外檔;④每步收在可判定的完成判準;⑤禁令只留給硬柵欄(上面藉口表那種),其餘正向表述;⑥借模型本來就懂的緊湊字眼,只重複字不重複整句;⑦模型本來就會做的句子＝付費廢話,爭議用「實跑一次文件」裁決(硬仗收尾第 8 步就是這機制),不過關整句刪;⑧環境查得到的別抄進文件,只存查不到的(不成文慣例/為什麼/設定檔不會招認的坑)。

## Relationship to existing protocols

- **D021** (porting protocol) — governs Mandatory/Optional input handling for one-shot agents; orthogonal, both apply when porting.
- **L1→L3 bar** (D019) — D034 adds the RED-first step at the front.
- **`skill-diagnostician`** — audits the `description` (routing layer). D034 audits the *body* (solidity). Use both.
- **2C self-critique** (BRAIN.md) — the runtime grill of the Brain's outputs; D034 is the build-time discipline for the tools themselves.
- **`mechanisms/rule-audit.md` §4** — legacy-patch scanning at the *rule-document* level; the Maintenance layer's health check applies the same lens to agent/skill *bodies*. Mutual pointers, no overlap.

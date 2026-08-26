# 03-tasks — 任務單（九欄 Loop Spec 精簡版）
<!-- 頭部遙測：日期｜模型｜約耗 token。狀態: todo/doing/done/blocked -->

| id | 目標（一句話） | 驗收（可執行指令或可 grep 內容） | 邊界（不准動什麼） | 相依(blocked by) | 模型 | 狀態 | 證據 |
|---|---|---|---|---|---|---|---|
| T1 |  |  |  | None | codex |  | evidence/T1.md |

## 派工紀律
- 模型欄取值：`codex`＝外部 CLI（`codex exec`，站4 主力）——**不是 Agent tool 的 model 參數**；`sonnet/haiku/opus`＝Claude 系（Agent tool，照 DISPATCH §0——kit：`zh-originals/dispatch.md`，英文合併版 `mechanisms/dispatch-templates.md`）。
- 批量機械→haiku｜一般實作→codex｜單檔 <50 行→sonnet/haiku（拆解時就標好）｜判斷/整合/難題→sonnet/opus
- 驗收不自驗（devline 加嚴版）：實作者交付 → 指揮方親跑驗收指令 + read-back 抽查 → 才標 done
- 同一任務連錯 2 輪 → JUDGMENT §4 方向檢查 → 換拆法或升級
- 相依欄〔D051〕：blocked by 全 done 的票＝frontier，站4 只從 frontier 挑工；任務列按相依序排（blockers 在前）。
- 切片方向〔D051〕：每票貫穿全層（schema/API/UI/測試）、可獨立 demo；禁止一票只切一層。prefactor 票排最前。wide refactor 走 expand→migrate 批次→contract（見 devline 站3）。
- 接縫票〔D051〕：01-spec 議定接縫的票，先寫紅測試再實作到綠；期望值來自獨立真值來源，禁與實作同法重算。

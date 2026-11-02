# RULE-AUDIT — 規則語意體檢 Prompt（可重跑）
> 制定 2026-08-16（D046/T1）。宗旨：規則檔只進不出會養肥，AI 開始漏看規則；`doctor.js` 只管結構完整性，本檔補上語意層——逐條問「這條還成立嗎／AI 查得到嗎」。可重跑，非一次性任務。

## §0 觸發時機（符合任一即該跑）
- 換模型世代（DISPATCH.md §0 模型現況表一動）。
- 規則檔明顯變肥（CLAUDE.md 逼近 60 行上限／某支 ops/ 檔逼近 250 行）。
- AI 屢次漏看某規則（LESSONS.md 同型坑二犯，根因判「context 吵」或「規則糊」時）。
- 久未跑（距上次本稽核 >20 個 session 或 >3 個月）。
- ↔ 分工互指：本檔管**正確性**（這條還成立嗎）；固定成本**重量**體檢（每輪值不值得）＝`ops/STANDING-COST.md`。兩支不可互相取代——一條規則可以完全正確但重得不值得常駐，也可以很輕但已經過期。

## §1 稽核範圍（scope，明文，不得只掃 CLAUDE.md 鏈）
| 檔案 | 載入時機 |
|---|---|
| `<project-root>\CLAUDE.md` | 每個 session 啟動時全讀 |
| `agent-os\OPS-CORE.md` | session-start hook 每 session 注入 |
| `agent-os\BRAIN.md` | session-start hook 每 session **全文注入**（~5,700 tokens 估算；實證 `hooks/session-start.js:8,128`、README §3——2026-08-20 修正，原誤標「派工時按需讀」） |
| `ops\*.md`（DISPATCH/JUDGMENT/TEMPLATES/ENV/MAINTENANCE/LESSONS…） | 依 CLAUDE.md 路由表按需讀 |
四者都要掃，缺一漏一即失真——通用版 Checkup Prompt 的已知缺陷正是只稽核單一 CLAUDE.md 鏈，抓不到「按路由表才讀」的 ops/ 內容。

## §2 兩關逐條稽核（每條都要過，不因看起來無害就跳過）
**關卡A｜還成立嗎**：拿現在的 repo 唯讀實證——指令/路徑/工具還在嗎？（`git log`／`Glob`／`Grep`，不執行任何會寫入或改動 repo 的指令）。需要跑 build/test 才能證明的，標「待驗」，不得直接下結論。
**關卡B｜查得到嗎**：
- 優先盲測——派一支**不載入該規則檔**的 Explore 分支做同類任務，看它是否自己就做對。派工前先確認這個環境的 Explore 是否真的不吃 CLAUDE.md/ops（未經確認不可假設），確認後才算「盲測通過」。
- 盲測不可行（無乾淨隔離環境、或規則涉及只有讀了才會做的動作）→ 退為「repo 證據型檢查」：引用具體檔案＋簡短搜尋路徑佐證「查得到／查不到」，並如實標註「非盲測，repo 證據型」。
兩關都過、且屬於「鐵律／固定流程／容易忘記的連動變更／完成定義／查資訊指標」五類之一才算合格；啟動時載入的規則（CLAUDE.md／OPS-CORE）比按需載入的 ops/ 條目審更嚴。

## §3 語意過期（staleness）＋ shadow context 檢查
- **Staleness test**（源自內部素材庫（internal toolkit corpus）的 harness 稽核查核報告 P4）：逐條問「這條陳述的事實還成立嗎？」——一次性/已過期內容直接判「刪」，不判「搬」（過期內容搬到哪裡都是垃圾）。
- **Shadow context 偵測**（同源）：檢查有沒有「反覆手貼進對話的內容」在正式檔外遊蕩——某段話每次都要人工複述給 AI 聽，是「該收編卻沒收編」的信號，建議搬進 ops/ 或對應 skill。

## §4 保姆補丁掃描＋換模型判準（換模型世代觸發時必跑，源自內部素材庫的升級診斷查核報告 Prompt1/2）
逐條規則先分桶：
| 桶 | 定義 | 判決傾向 |
|---|---|---|
| Outcome Logic | 定義任務該達成什麼結果 | 留 |
| Guardrail | 安全/合規/不可逆防呆 | 留（不得因模型變強而刪） |
| Procedural Scaffolding | 步驟式教學/範例 | 候選簡化 |
| Compensating Complexity | 補償舊模型缺陷的補丁 | 候選刪，需測試 |
**Business Rule vs Model Rule 判準**：換成目前最強模型，少了這條它會不會自己做對？
- 會 → Model Rule（候選刪，先標「待驗」，需按 §6 三證據之一才能真刪）。
- 就算會做對，仍不能讓模型自己決定（合規／安全／客戶資料）→ Business Rule（留，此理由不成立刪除）。
- 不記得為何加 → 標「需確認」，不可硬分類，也不可用「這模型應該夠聰明了」的直覺當刪除理由。
- 互指：同一鏡頭在 agent/skill **本體層**的應用＝`building-discipline.md`「Maintenance layer」章的 General health check（Legacy patches 項，D049/C1）——本節掃規則文件、那章掃工具本體，互不取代。

## §5 建議清單（產出格式）
逐條輸出：`原文（檔案:行號）｜判決（留/改/搬/刪/待驗）｜實查證據｜若搬→去哪（nested 檔/skill/hook/CI/BRAIN Roster）`。
- 查不到證據 → 不准下「刪」或「改」，只能寫「證據不足，需 ___ 才能定案」。
- 排序＝按「能還多少注意力」：啟動時載入的規則排在按需載入規則前面；同層之中，改動幅度大的排前面。

## §6 動手規範（report-only 鐵則）
- 本稽核是純報告任務：**不建立/修改/刪除任何檔案**，不跑會寫入快取或產物的指令，只用讀取與搜尋。
- 開跑第一句話先告知使用者「這次只出建議，不動手」。
- 清單交給使用者後，套用哪幾條需使用者點名指定；套用前先出 diff，不自行 commit。
- **刪除類建議**（含 LESSONS.md 修剪）另需 `ops/MAINTENANCE.md` §9 三證據之一成立（定義見該節，本檔不重抄），證據不足一律標「待驗」，不得刪。

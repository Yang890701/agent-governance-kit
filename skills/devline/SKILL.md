---
name: devline
description: Runs the user's end-to-end development pipeline (開發線) — interview → spec → constitution/architecture → tasks → implementation → audit → testing → deploy → maintenance. Hard gates after spec (GATE-R) and architecture (GATE-A) require Codex cross-review plus user sign-off. Every station writes its artifact into .devline/ so any session resumes from files, never from memory. Claude conducts, judges, interviews; Codex CLI executes bulk implementation and cross-reviews, auto-falling back to Claude subagents when unavailable. Ships type blocks (web-system, agent-build). Activate when the user says 走開發線 / devline / 我要做一個新專案・新系統・新服務・新agent, when the user wants to improve or refactor an existing project (收編既有專案—先逆向生成產物檔), or when new requirements arrive on a project with .devline/. Not for one-off questions, single-file edits, research, or builds under half a day — do those directly (or spec them via goal-definer).
---

# devline — 開發線（一條龍開發管線總指揮）

> **設計依據**：內部 VISION 文件附錄B（原 PIPELINE-DESIGN，D050 併入；未收錄本 kit）。**紀律相依（讀不到→告知使用者並按本檔降級執行；下列為 kit 相對路徑，安裝後建議代換為你環境的絕對路徑）**：DISPATCH＝`zh-originals/dispatch.md`（英文合併版 `mechanisms/dispatch-templates.md`）、JUDGMENT＝`mechanisms/judgment.md`——本檔各處 `DISPATCH §N`／`JUDGMENT §N` 皆指此二檔。
> **鐵則**：每站只吃 `.devline/` 內的產物檔（各站開頭有輸入清單）＋憲法（02-constitution 過閘後恆為每站輸入）＋專案根 `CONTEXT.md` 術語表（若存在，恆為每站輸入；正本唯一，各站與委派引用路徑不重抄——D043）；**禁止憑對話記憶跨站**。產物檔與記憶矛盾→以檔案為準，記 log.md。

## 收編程序（既有專案：改善／重構／加功能，但還沒有 .devline/）
> 觸發：使用者要對「已有形狀的專案」動工且該專案無 `.devline/`。目的：**不重寫歷史，只逆向出足夠的檔案讓管線能跑**。
1. **考古**（要讀 >3 檔→照鐵律③派 Explore 只收結論）：repo 結構、`git log --oneline -20`、既有文件；若專案有 `.claude/agent-os/`（DECISIONS/PROJECT），那是憲法的第一素材。
2. **逆向生成三檔**（建 `.devline/`，各檔標頭註明「逆向生成」）：
   - `02-constitution.md`：從現有技術棧＋既有決策萃取——**現狀即憲法 v1，要寫全**（這是唯一必須完整的檔）。
   - `00-interview.md`：只做「增量訪談」——這次要改什麼／成功樣貌／不做什麼；不必補問歷史。
   - `01-spec.md`：只寫**這次要動的範圍**的三欄對照＋「現狀行為＝未列明部分的既有規格 baseline」一句聲明。
3. **收編閘（輕量）**：Codex 一輪對審逆向憲法（重點：有沒有描述錯現狀）＋使用者確認「這就是我專案的樣子」。閘內對審同樣走「Codex 對審程序」（隔離工作區＋exit-code 守門），只跑第 1 輪，收尾清 `$REV`。
4. 之後照**站8 增量短循環**走（含憲法/架構觸碰檢查）。改動大到等於重寫→改走全管線（站1 起）。

## 開站程序（新專案）
1. 全新專案→問使用者專案資料夾建哪（預設 `<projects-root>/<專案名>`）→ 建目錄＋`git init`（codex exec 拒絕在 git repo 外執行，且部署本來就要 repo）＋ `.devline/`。
2. 選型別積木：讀本 skill `types/` 對應檔（`web-system.md`｜`agent-build.md`）；無對應→通用流程＋log 記「建議新增型別」。
3. 產物鏈與模板：`00-interview → 01-spec → 02-constitution + 02-architecture → 03-tasks → evidence/ → log.md`，全部照 `templates/` 抄再填（含 log.md 行格式）。每檔頭部記：日期／模型／約耗 token（費曼估算即可）。
4. **中斷續接**：讀 `log.md` 找目前站別 → 讀該站輸入清單所列檔案繼續。

## 站0 訪談（輸入：無｜產出：00-interview.md）—— 治「不知道自己要什麼」
- 照模板六組問題**一次一組**問；模糊詞（更好/有質感/專業）當場追問到可檢查，或標記交站1 taste-distiller。
- **grill 三招**（D041）：體驗/偏好類問題→出站前建**拋棄式 prototype** 驗證（不連 DB、不寫測試、用完即棄；例外〔D051〕：prototype 產出**比文字更精準編碼決策的片段**——狀態機/schema/type shape——摘決策核心內嵌 01-spec 並註明來源，不留可跑 demo），不空辯；訪談冒出的新想法→記 00-interview「Out-of-Scope」節＋原因，不擴本輪 scope；大需求先拆子塊再逐批問。
- **frontier 提問法**（D051/G-2）：每輪只問「前置已定案、現在答了不會白答」的題——批次由**依賴關係**決定，答案依賴本輪未決題的一律延到下輪；單輪上限 5 題（超過取最上游 5 題）；**每題附 ➡️ 建議答案**，使用者可回「照建議」一次過整輪；查得到的事實自己查（鐵律③），不拿事實問使用者；frontier 清空＋出站判準達標＝訪談收工。
- **術語表**（D043；D051/G-6 收緊）：訪談冒出的專名／角色／縮寫→隨手記入**專案根 `CONTEXT.md`**「術語表」節（無則建；一詞一行：`術語 = 一句定義（Avoid: 淘汰同義詞）`）。同義詞挑一個當正名、其餘進 Avoid——後續任何產出用到 Avoid 詞＝違規改回；**只收本專案特有詞**，通用工程概念不收（防術語表發胖）；使用者用詞與表衝突→當場點出請他裁決。這是之後每站與每個委派 prompt 的共享語言（DISPATCH §2），治 agent 自創名詞與囉嗦。
- 使用者累了→「往前走」＝跳到**下一題組**，不是進站1。
- **出站判準**：目標一句話清楚／成功樣貌可檢查／不做 ≥3 條／未決 ≤2。未決 >2 只能由使用者**明示破例**進站1（記 log.md）。

## 站1 規格（輸入：00｜產出：01-spec.md）
- 三欄對照（使用者語言｜PM 語言｜工程語言）＋可執行驗收＋不做清單；主觀品質→派 `taste-distiller` 產 rubric 附錄。
- **測試接縫（seams）**〔D051/G-4〕：定稿驗收時同步定「在哪一層測」——優先用**既有**接縫、取**最高**可行接縫、接縫越少越好（理想＝1）；GATE-R 前用白話跟使用者確認接縫符合預期。測試決策附 **prior art**（指向 codebase 既有同類測試路徑）＋一句「只測外部行為，不測實作細節」。此節是站3 紅燈欄與站6 eval-designer 的直接輸入。
- 三欄對照定稿的詞彙→同步進專案根 `CONTEXT.md` 術語表（術語定義的正本＝CONTEXT.md，01-spec 引用不重抄——D043）。
- **🚪 GATE-R（硬閘）**：①Codex 對審（程序見下）→②定稿→③使用者點頭。未過不准進站2；使用者說「直接開工」→提醒這是他立的閘，需**明示破例**（記 log.md）。

## Codex 對審程序（GATE-R／GATE-A／收編閘共用）〔2026-07-27 D041 加固；同日經 Codex＋三鏡頭工作流對審修訂〕
```bash
# 受審檔依閘別設定（GATE-R＝01-spec；GATE-A＝02-constitution＋02-architecture；收編閘＝逆向憲法）：
DOC=.devline/01-spec.md
# 隔離工作區用 mktemp（date +%s 同秒並行會相撞）：
mkdir -p .devline/tmp && REV=$(mktemp -d .devline/tmp/review.XXXXXX)
# 第 1 輪（唯讀沙箱）。⚠️ codex 後面不准接 pipe/tee——$? 會變成 tee 的退出碼，守門失效：
cat "$DOC" | codex exec --sandbox read-only --json "你是對抗式審查者。審這份文件：找矛盾、不可測驗收、遺漏邊界、與使用者目標的偏離。逐條列 findings（嚴重度/位置/建議）；無問題明說核可。" > "$REV/r1.jsonl"
echo "rc=$?"   # 非零＝該輪作廢（處理路徑見下），不解析、不進下一輪
# rc=0 才解析 thread_id：--json 是 JSONL 事件流，首行 thread.started 含 thread_id（實測 2026-07-27；本機無 jq → 用 sed）。解析為空＝停：
THREAD=$(head -n1 "$REV/r1.jsonl" | sed -n 's/.*"thread_id":"\([^"]*\)".*/\1/p'); echo "THREAD=$THREAD"
# 第 2 輪起用 $THREAD 延續同一 session（⛔ 禁 `resume --last`——並行對審會搶到別場 session）；resume 不用 --json，r2 起是純文字。
# ⚠️ resume 預設沙箱全開（2026-08-24 實測 danger-full-access）——必帶 --sandbox read-only，且旗標放 exec 與 resume 之間（放 resume 後面會被拒收）：
codex exec --sandbox read-only resume "$THREAD" "先重新讀 $DOC（已按下列處置修訂）。上輪 findings 逐條處置（修檔/反駁＋理由）：<處置表>。請基於處置後的現檔再審。" > "$REV/r2.out"
echo "rc=$?"   # 同上守門
```
- **exit-code 守門的處理路徑**：rc 非零→把 rc＋該輪輸出檔末 5 行記進 log.md；暫態錯誤（timeout/空輸出）→原樣重試一次（DISPATCH §4 暫態例外）；內容性失敗（拒絕/沙箱錯誤/重試又敗）→告知使用者或走「降級與恢復」節。
- 第 1 輪 findings 從 `r1.jsonl` 的 agent_message 事件讀（JSONL 一行一事件）；r2 起是純文字直接讀。
- **MAINTAIN ≠ 結束**：Codex 維持異議時必須續辯（強化論點或讓步修檔），不得為了收工虛報共識。
- 最多 **3 輪**；仍分歧→列爭點交使用者裁決，**使用者裁決視同該輪共識**（不算破例），記 log.md（輪數＋關鍵 findings＋裁決）。對審收尾清掉 `$REV`。
- **Vibe Diff 檢核**〔D046/T6〕：凡送使用者簽核的 diff，先給白話後果翻譯（改了什麼→使用者會看到什麼變化，不談程式結構）；對照 spec 分三類——「要求但缺」「缺但要求」「沒要求卻出現」（scope creep 藏身處）；另查依賴套件是否幻覺／版本未鎖。
- **作弊訊號**〔D046/T6〕：同一批改動同時動測試檔與實作檔（紅燈變綠燈）→強制標紅並要求說明，不得逕行放行（判準細節正本＝work-auditor agent 的 test-integrity 檢查——agent 總覽見 kit `agents/README.md`，完整定義檔未收錄本 kit，此處不重抄）。
- **機械閘升級條件**〔D046/T6〕：本程序閘若實測被跳過 ≥2 次，升級為 Stop-hook 機械強制（零件見內部 intake 報告 recheck-crossmodel-stophook，未收錄本 kit）。

## 站2 架構（輸入：01｜產出：02-constitution.md＋02-architecture.md）
- 大型／方向未明→先 `/plan-panel`（需使用者同意 Workflow）；想拆多 agent→先過 `multi-agent-judge`。
- 憲法只寫**不可違背**的東西（技術棧選型/原則/取捨）；實作小細節（如換個小 library）不屬憲法層級。
- **🚪 GATE-A（硬閘）**：同對審程序。過閘後憲法凍結——**改憲法層級的決定＝回站2 重走 GATE-A**；非憲法層級記 log 即可。
- 下游與憲法衝突→停工回報使用者：改憲法（重閘）或改下游。

## 站3 拆解（輸入：01、02×2｜產出：03-tasks.md）
- 每任務一列：`id｜目標｜可執行驗收｜邊界｜相依(blocked by)｜模型｜狀態｜證據`〔相依欄=D051〕。
- **切分標準**（D041）：每張任務＝「一個全新 AI 視窗剛好解完」的大小；更大→再拆，別讓一張票吃掉整個 context。
- **方向軸**〔D051〕：每票是**貫穿全層的窄路徑**（schema/API/UI/測試都動一點），單票完成即可獨立 demo 或驗證（＝有證據可落 evidence/）；**禁止一票只切一層**（先全部 schema、再全部 API 這種水平切法，測到的是想像中的行為）。先找 **prefactor** 機會（先把改動變容易，再做容易的改動——"Make the change easy, then make the easy change."），prefactor 票排最前。
- **相依與 frontier**〔D051〕：每票列 blocked by（None＝可立刻開工），任務表按相依序排；站4 只從 **frontier**（相依全 done 的票）挑工。
- **wide refactor 例外**〔D051〕：單一機械改動會炸大量呼叫點（改欄名/共用型別）時不硬切垂直票，改走 **expand–contract**：expand（新舊並存，一票）→ 分批 migrate（每批一票、blocked by expand、批批綠燈）→ contract（刪舊，blocked by 全部批次）；批次無法各自綠→共用整合分支、全部 block 一張最終 integrate-and-verify 票，綠燈只在那裡承諾。
- **出站微確認**〔D051〕：把「顆粒度／相依邊／該合該拆」壓成一行給使用者掃過再發工，記 log.md（非硬閘，不加第三個 GATE）。
- **模型標籤規則**：`sonnet/haiku/opus`＝Claude 系（照 DISPATCH §0，Agent tool 參數）；**`codex`＝外部 CLI（codex exec），不是 Agent tool 的 model 值**。一般實作→標 codex（devline 專屬規則，覆蓋 DISPATCH 對實作的 sonnet 預設）；單檔 <50 行的小任務→**在此站直接標 sonnet/haiku**；判斷/整合→sonnet/opus。

## 站4 實作（輸入：02×2、03｜產出：程式碼＋evidence/）—— Codex 主力，Claude 指揮＋驗收
```bash
codex exec "read .devline/02-constitution.md, .devline/02-architecture.md and .devline/03-tasks.md. Execute task <id> only. 遵守憲法、架構契約與任務邊界。完成後回報：改了哪些檔＋如何驗證。"
```
- 站4 一律**照任務單模型標籤**派工，無例外；只從 frontier（相依全 done）挑票〔D051〕。
- **測試先行**〔D051/G-4〕：凡任務單標了接縫的票，派工 prompt 加一段：「先在指定接縫寫**會失敗的測試**（紅），再實作到綠；期望值必須來自**獨立真值來源**（spec 數字/已知字面值/worked example），**禁止**用與實作相同的算法重算期望值；只在 system boundary（外部 API/DB/時間）mock，不 mock 自己的模組」。驗收時 Claude 親跑該測試檔並抽查期望值來源（tautological＝紅牌退回）。
- **驗收刻意比 DISPATCH §5 更嚴（明示覆蓋）**：外部 CLI 的「我測過了」不算證據——Claude 必親跑該任務驗收指令＋read-back 抽查，過了才標 done＋證據連結。
- Codex 同一任務連錯 2 輪→JUDGMENT §4 方向檢查→換拆法或升級（opus 接手該任務）。

## 站5 質疑（輸入：03＋本輪 diff｜軟閘）
- **兩軸分開跑，報告分開**（D043）：①**spec 忠實軸**——派 `work-auditor` 對照 01-spec＋03-tasks 查漏做／多做／做歪（含稽核假完成）；②**品質軸**——變更大→`/review-branch`（需同意）＋`codex exec review`。兩軸各自 fresh-context、各出獨立報告，不得併一份——防「程式漂亮」掩護「做的不是規格要的」（互相污染）。
- **跳過權限**：需使用者同意；或「變更 <30 行且無對外面（端點/個資/金流）」時指揮方可決定跳過——兩者都記 log.md。

## 站6 測試（輸入：01(驗收之源)、02×2｜產出：evidence/）
- 派 `eval-designer` 依 01-spec 驗收＋failure modes 設計測項→實跑→證據落檔（指令＋結果）。web-system 必含誠實資料檢查。
- 測項期望值必須來自**獨立真值來源**（spec/已知字面值/worked example），不得用與實作相同的方法重算（反 tautological test——D051/G-4）；優先落在 01-spec 議定的接縫上。

## 站7 部署（輸入：型別積木 checklist）
- 照型別 checklist；**不可逆動作先過 `permission-architect` 分級＋使用者確認**（鐵律⑤）。免費方案時限記入 log.md 供未來提醒。

## 站8 維護／新需求（輸入：全部產物）
1. **憲法/架構觸碰檢查（先做）**：新需求對照 02-constitution＋02-architecture——觸及技術棧、不可違背原則、API 契約/資料模型者→**回站2 重走 GATE-A**（幅度小可壓成一輪對審，但仍是 GATE-A）。
2. 未觸及→增量短循環：00-interview 追加「增量訪談」節→小規格 append 01-spec→GATE-R 輕量版（一輪對審＋使用者點頭）→進站3；重構型（爆炸半徑大）新需求→走站3「wide refactor 例外」的 expand–contract 序列〔D051〕。
3. 每輪收工：教訓一行進你的 lessons log（行格式與壓縮規則見 `mechanisms/maintenance.md` §3）；漂亮的模式→建議跑 `win-distiller`。

## 降級與恢復（管線不因單一工具停線）
- **Codex 不可用**（未登入/額度盡/非 git repo 錯誤）→告知使用者；站4 降級 Claude subagent 照 DISPATCH 分級；對審降級 fresh-context Claude agent。**恢復判準**：每張新任務單開工前跑煙霧測試 `printf 'Reply OK' | codex exec --sandbox read-only -`，通過即切回主力（記 log）。
- **顧問 subagent 叫不到**（鏡射時差：新增的 agent 定義下個 session 才註冊生效——陷阱模式見 `environment/README.md`）→用 `general-purpose` 載入該顧問定義檔（安裝位置的 `agents/<名>.md`）內容頂替，記 log.md。

## 完成定義
站0-7 產物齊＋GATE 與破例紀錄在 log.md＋evidence/ 有實測證據＋使用者拿到「上線了什麼／怎麼維護」一頁總結。

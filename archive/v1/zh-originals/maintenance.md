# MAINTENANCE — 制度檔案的維護協議
> 制定 2026-07-04；後續更新看 git（D044）。宗旨：制度會腐化；維護要便宜、可審計、不通脹。

## §1 權限矩陣（誰可以改什麼）
| 動作 | 規則 |
|---|---|
| 在 ops/LESSONS.md 追加一行教訓 | 隨時可，不用問（格式見 §3）|
| ENV.md 追加新陷阱 | 可；附日期＋一句踩坑現場 |
| 修改 DISPATCH/JUDGMENT/TEMPLATES 的**既有規則** | 需引用 ≥1 個具體事故；改前照 §2 備份；commit message 寫動機 |
| 刪規則／改五條鐵律／改 CLAUDE.md 結構 | **先問使用者** |
| 改 `agent-os/`（引擎）任何檔 | 先 `git pull`；動工前查/登記引擎記憶區的在途認領登記檔；改 agents 後照 §5 重鏡射；改完 commit＋push |
| 改 `agent-os/OPS-CORE.md`（注入所有專案的鐵律） | **先問使用者**（影響半徑＝每個專案的每個 session） |
| 改某業務專案等使用者專案 | 遵當地 CLAUDE.md；不可逆動作先問 |

註：**「事實過期」不算改規則**——模型名/路徑/工具變了，實測確認後直接更新內容與驗證日即可，毋須事故引用。「改既有規則」指改變行為指示（何時派誰、怎麼驗、什麼順序）。
註2：**措辭標準**——改規則檔措辭或新增規則前，照 `agent-os/building-discipline.md`「Writing-for-agents layer」（no-op 獵殺／禁令只留硬柵欄、其餘正向表述／指標措辭決定讀不讀得到）。

## §2 備份規則
- 修改任何 ops/ 或 CLAUDE.md 既有檔之前：`cp <檔> <檔>.bak-YYYYMMDD`（同目錄）。
- `*.bak-*` 不進 git（.gitignore 已設）；git commit 是第二道備份——改完立即 commit。

## §3 LESSONS.md 格式與壓縮
- 追加格式：`- YYYY-MM-DD [分類] 一句話教訓（現場：一句話）`
- 分類：`encoding` / `dispatch` / `verify` / `env` / `judgment` / `other`
- **根因欄**（D041 增；事故：同型坑重複踩——LESSONS 只記現象不記根因，修過措辭的規則再犯無人發現）：行尾加 `（根因：缺工具｜規則糊｜缺閘｜context吵｜模型極限）（修正：改了哪條規則/hook，或「未修」）`；判「模型極限」前必先排除前四類。
- **鑑別器**：同一條規則上次已改過措辭、這次同樣的錯又犯 → 不准再判「規則糊」，升級判「缺閘」（需要 hook/機械強制）或「context吵」（規則被稀釋）。一次事故一個修正，不做全面改建；系統性問題記一行指向 LETTER.md「病灶診斷」節（原 DIAGNOSIS.md，D050 併入）。
- **超過 60 行**就做一次收斂：重複合併、已寫入正式檔（ENV/JUDGMENT…）的刪除，收斂本身留一行紀錄。可派 memory-curator 顧問。

## §4 行數預算（超過就收斂，不是繼續長）
| 檔 | 上限 |
|---|---|
| CLAUDE.md（根） | 60 行 |
| ~/.claude/CLAUDE.md（全域） | 15 行 |
| ops/ 單檔 | 250 行 |
| ops/ 總計 | 1200 行 |
制度本身也吃 token——**精簡就是效能**。要加新內容先問：能不能替換掉一條過時的？

## §5 引擎鏡射與健檢
- 改了 `agent-os/agents|commands|skills` → 重跑 `& <repo-root>\agent-os-template\install.ps1 -TargetPath <任一已裝專案>`（會鏡射到 `~/.claude/`）→ **下個 session 才生效**。
- agents 的 frontmatter `description` 必須 **<1024 字元**（超過會被靜默略過，2026-07-04 實測）。快速檢查：
  `PYTHONIOENCODING=utf-8 python -c "…len(description)…"`（ENV §6 有背景）。
- 每次改引擎後跑 `node agent-os/cli/doctor.js`（唯讀）；FAIL 要處理或在 LESSONS 記錄原因。
- **顧問品質週檢**（D041 波4）：每 ~20 個 session（或發現顧問輸出怪異時）派 memory-curator 專項檢「各顧問最近使用有無格式漂移／輸出錯誤」，結果記 SESSION_LOG；有漂移→開票修定義檔。
- doctor 已具備（2026-07-06 使用者拍板加入）：description 長度（>950 WARN／≥1024 FAIL）、DECISIONS 排序遞增、幽靈決策引用、鏡射一致性。**再動 doctor.js 仍先問使用者**（另一環境也維護它）。

## §6 同步紀律
- session 要動本 repo → 先 `git fetch && git status -sb`；落後就 pull（另一環境作者 <user> 也在推）。
- 制度檔改完 → commit＋push（另一環境也會讀到）。
- 記憶目錄（實際路徑見 ENV §6，不在此重抄——§7 鐵則）與 ops/ 分工：ops/ 放**規則**，memory 放**事實與狀態**（使用者輪廓、專案時限）。規則不要寫進 memory，事實不要寫進 ops/。

## §7 文件憲章（D042——治文件漂移；條文正本在 TASK-ROUTING，這裡只放鐵則）
- **鐵則：同一事實不得手抄進第二個檔——要引用就留路徑＋編號**；「建好了沒」現查活 repo，prose 不手抄（機械可驗的名冊欄除外，由 doctor 對帳）。
- 單一事實來源表＋檔案名冊 manifest＝引擎內部治理目錄的 `TASK-ROUTING.md`（唯一正本，本檔不重抄；名冊範圍與排除項見該檔——D050 起含子目錄掃描+目錄級登記）。
- **治理層新增 .md** → 當場登記進 manifest；結案的點時文件 → 移同層 `archive/`（git mv，舊引用跟著改）。doctor `charter.*` 兩檢查每次對帳。
- **檔頭日期只准「制定日」**——「版本／驗證日／最後更新」手抄戳禁用，檔案新鮮度看 git：`git log -1 --format=%ad --date=short -- <檔>`（D044；事故 2026-07-28：體檢抓到多檔真改過但戳沒跟，ARCHITECTURE 差 25 天）。append-only 帳本的逐列日期照舊。
- **死期條款（D050，2026-08-20 文件盤點——治「文件死了沒人送葬」）**：凡「報告／盤點／審計」類一次性文件，出生時檔頭必寫一行「**用途完成即歸檔，觸發＝___**」（觸發＝一個可判定的事件，如「銷帳完畢」「下次健檢」）；沒寫死期的報告類新檔＝違規，doctor/審查看到就退。先例——正：memory-curator 自帶降級檢查點（TODO-INTAKE-RECHECK B7，D046/T5），到期自動裁決；反：HARNESS-AUDIT-2026-07-27 無死期，用途完成後躺置三週才被盤點揪出歸檔。

## §8 Skill 互叫紀律（D043，取法 mattpocock/skills 兩層設計）
- **兩層分類**：**入口型**＝使用者/路由觸發的流程總指揮（devline、hard-battle、drawio-skill…）；**迴圈型**＝被引用的共用邏輯（`commands/` 的 workflow 配方、顧問 agents）。
- **鐵則：入口型不得呼叫入口型。**要用另一條入口的能力→把共用邏輯下沉成顧問 agent 或迴圈型，兩條入口各自引用；迴圈型也不回叫入口型。入口型呼叫迴圈型＝正常。
- 新增/修改 skill 上架前：跑 skill-diagnostician 全名冊互掃（含互叫檢查）。現況盤點 2026-07-28：無違規（devline→/plan-panel、/review-branch 均為迴圈型）。

## §9 規則生命週期（D046/T1——語意稀釋防治；稽核程序正本在 `ops/RULE-AUDIT.md`，這裡只放門檻，不重抄）
- **刪規則**（含 LESSONS.md 修剪）需下列三證據之一：專案現況已徹底改變／團隊已換長期做法／實測拔掉沒退步。證據不足一律標「待驗」，不得刪。
- **換模型世代 → 必觸發**：跑一次 `ops/RULE-AUDIT.md`，逐條稽核 CLAUDE.md／OPS-CORE.md／BRAIN.md／ops/*.md 是否還成立、AI 查不查得到。
- 其餘觸發時機（規則檔變肥／AI 屢次漏看／久未跑）與稽核方法（兩關稽核／staleness／shadow context／保姆補丁掃描）見 `ops/RULE-AUDIT.md`，單一事實來源，本檔不重抄。

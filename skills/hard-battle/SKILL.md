---
name: hard-battle
description: Runs a battle-tested protocol for hard, ambiguous, high-stakes tasks — fact inventory with tested-not-assumed hypotheses, value-ordered incremental delivery (write-as-you-go so interruption loses nothing), root-cause-first debugging, delegation discipline, then a mandatory closing of adversarial fresh-context review, read-back verification, honest limits, and a one-page summary. Activate directly when the user says 硬仗 / 用硬仗模式 / 打硬仗 / hard battle mode. When the user merely stresses importance (這很重要、認真做) or a task looks simultaneously important, vague, and multi-file or cross-system, suggest activation in one sentence instead of forcing it. Not for routine edits, conversation, or well-specified implementations. Distilled from the user's own battle directive (2026-07-04) that produced the ops institution.
---

# 硬仗協議（Hard-Battle Protocol）

> **來源**：使用者 2026-07-04 手寫作戰指令（Fable session）＋該役實戰執行細節。該役產出整套 ops 制度，經雙重驗證：對抗審計 14 findings 全修訂＋Sonnet 情境測試 **8 題全對、另列 6 個模糊點全修訂**（紀錄：內部 lessons log 2026-07-04 條，未收錄本 kit）。
> **適用**：又難、又模糊、又重要的任務。**不適用**：例行小事（直接做）、純對話、已有明確 spec 的實作（用委派模板 §2 委派即可——kit：`mechanisms/dispatch-templates.md` 模板 2，中文原件 `zh-originals/templates.md`）。
> **相依檔（本 skill 可能在任何專案觸發——下列為 kit 相對路徑，安裝後建議代換為你環境的絕對路徑）**：DISPATCH＝`zh-originals/dispatch.md`（英文合併版 `mechanisms/dispatch-templates.md`）、JUDGMENT＝`mechanisms/judgment.md`——本檔各處 `DISPATCH §N`／`JUDGMENT §N` 皆指此二檔。**讀不到時**：明告使用者路徑失效，按本檔內建規則降級執行，不中斷。

## 啟動條件（兩種，層次不同）
- **直接啟用**：使用者說「硬仗」「用硬仗模式」「打硬仗」。
- **建議啟用（不強加）**：使用者只是強調重要（「這很重要」「認真做」），或你自判任務**同時**滿足 (a) 影響多檔案／跨系統 (b) 需求含模糊詞（「更好」「最好」「未來性」）(c) 失敗代價高——三條件**全中**才用一句話建議，等使用者確認。

## 開場（動手前一次完成，不要邊做邊補）
1. **讀制度**：讀 DISPATCH（委派；路徑見開頭相依檔）；判斷拿不準時讀 JUDGMENT。
2. **盤點**：列三欄——「已知事實／待驗證假設／未知」。**每個假設用實測驗證**，不憑印象、不憑訓練記憶（模型名、工具有無、檔案是否被 git 追蹤——當場量）。正向判準：**自己查＝一條指令或讀一個已知檔可得**；要掃 >3 個檔案才能得到的事實 → 照鐵律③派 Explore（此處的「>3 檔」判斷是否委派，與啟動條件的「多檔案」各自獨立計算，用途不同）。
3. **問題額度**：開場最多一批 ≤5 題，之後**可逆的偏好類問題**不再停下等、自己決定並在結尾標明。**例外（不受額度限制，命中照停）**：JUDGMENT §3 的四類強制問——不可逆／需求矛盾／品味無 rubric／範圍膨脹。

## 主循環（每個工作單位重複）
4. **價值排序**：永遠先做「如果 session 現在斷線、損失最大」的那一項。
5. **隨做隨寫**：每完成一項**立刻落檔＋commit**，再做下一項。已落檔的就是使用者拿到的全部。**注意：鏡射／部署到生效位置之前必須先 commit**——別讓生效的東西在 git 之外。
6. **遇錯先找根因**：報錯訊息 ≠ 病根。一次列 **3–5 個競爭假設**（禁止只押一個，D041）→ 設計**能區分假設的實測** → 量到證據再改；能**穩定重現**（紅燈）之前禁止動手修（實例：顧問叫不到 → 逐支量 description 字元數 → 發現 >1024 被靜默略過——而不是盲目重裝）。
   **紅燈閘 checklist**（D051/G-3——過閘才准建理論，No red light, no theory）：紅燈必須是**一條你已實跑過的命令**，且 (a) 斷言使用者描述的**確切症狀**（不是「沒 crash」）(b) 結果穩定 (c) 秒級跑完 (d) 你自己跑得動。建不出來→明說試過什麼、向使用者要環境存取或去敏 artifact（log/錄影/dump），**不得無紅燈就開始推論**。非決定性 bug：目標不是乾淨重現而是**提高重現率**（重複多次/並行加壓/縮時間窗——50% 重現率可 debug、1% 不行）。debug log 一律帶唯一前綴 `[DEBUG-xxxx]`（收尾清理＝一次 grep，沒 tag 的殭屍 log 會活下來）。若找不到合適的接縫（seam）寫回歸測試——「寫不了」本身＝架構發現，記進交接與 LESSONS，不硬塞。
7. **委派紀律**：門檻照 DISPATCH §1（要讀 >3 檔**或**輸出 >200 行 → 派 subagent 只收結論）；失敗照 DISPATCH §4 階梯——**haiku 失敗 1 次直接升 sonnet（不重試）**；sonnet 同一子任務連錯 2 次，先過 JUDGMENT §4 方向檢查，再決定升級或換路。

## 收尾（必做；**context 吃緊時放下手上產出，立刻跳到這裡**）
> context 吃緊的錨點：開始無法引用早期內容、或系統出現壓縮跡象。**連收尾都來不及的最小動作**：commit 已完成的＋寫 3 行交接（done／next／blocked）。
8. **對抗審查**：派 fresh-context agent 找碴——宣稱 vs 實際（親自跑指令驗）、跨檔一致性、引用的路徑／名稱／數字逐一實測。**若產出是給弱模型執行的規則**，再派一個「未來實際執行它的等級」的模型（通常 sonnet，照 DISPATCH §0 表）做情境理解測試：出 5–8 題情境題，答錯處＝寫得不夠清楚處。
9. **read-back**：逐檔驗證確實落地、關鍵內容存在；若該檔訂有行數上限（`mechanisms/maintenance.md` §4 的行數預算，或任務指定）則一併驗，沒有就跳過此項。
10. **誠實標極限**：做不到的、未驗證的、假設性的——明說並寫進交接（品味題按 JUDGMENT §6 處理，不硬撐）。
11. **一頁總結**：改了什麼／為什麼／明天怎麼用；未完成項寫進交接檔或 Tasks。

## 判斷細則（弱模型最常踩的坑）
- 「盤點」不是把所有檔案讀一遍——是回答「**我要做決定，還缺哪些事實**」，缺什麼查什麼。
- 落檔粒度＝一個可獨立交付的單位（一份完整文件、一個功能＋它的驗證），不是每改一行就 commit。
- 對抗審查的 finding **全修，或逐條標明不修理由**——理由必須附可驗證證據（實測輸出、原文行號），不能只寫「我認為是誤報」；高嚴重度 finding 要「不修」，需再派一個 fresh-context agent 複核背書。
- 極限清單至少檢查三類：品味／主觀題、無法實測的宣稱、依賴外部資源（帳號／硬體／他人）的部分。

## 完成定義
收尾四步（8–11）全部做完＋使用者拿到總結，才算完。**中途斷線不算失敗**——只要已落檔的部分自成價值（這正是第 5 步存在的原因）。

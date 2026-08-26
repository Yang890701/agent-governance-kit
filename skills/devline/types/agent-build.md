# 型別積木：agent-build（agent／skill／工作流建置）
> 各站在通用流程之上的加料。經驗源：agent-os 引擎自身（L1→L3 驗證梯、hard-battle/devline 建置）。

- **站0 訪談加問**：這個 agent 的「單一職責」一句話？誰觸發它（人/BRAIN 路由/hook）？它**不該**搶哪些鄰近任務？輸出給誰吃（人/下游 agent）？
- **站1 規格必含**：description 草稿（第三人稱、does+when、自然語言觸發詞、**<1024 字元**）＋正/反觸發例各 3 個＋輸出格式定義。
- **站2 架構必查**：先過 `multi-agent-judge`（要不要拆多 agent？預設不要）；決定形態——agent（判斷型）vs skill（流程型）vs command（工作流）vs hook（自動觸發）。
- **站2 加產（多步驟工作流／編排類限定，D052）**：架構產物必含三張契約表——①State schema（欄位/型別/owner/writer/readers/保存期；禁拿聊天紀錄當 state）②Node 契約（單一職責＋actor 型別:程式|LLM|工具|人＋輸入/結構化輸出/完成判準）③Edge 契約（依賴理由＋路由條件；逐邊跑假依賴檢查——下游真的需要上游的**輸出**嗎？假邊→平行或刪，條件邊→點名條件）。
- **站4 實作**：引擎檔改動前查 `agent-os/memory/in-flight-claims.md` 並登記；寫完鏡射（sync.ps1）——**下個 session 才註冊生效，skill 例外（熱註冊）**。
- **站5 質疑必跑**：`skill-diagnostician`（觸發診斷）＋雙重審查（fresh-context 對抗審計＋目標等級模型情境理解測試 5-8 題）——LESSONS 鐵律。
- **站6 測試＝驗證梯**：L1 檔案就位 → L2 loaded-prompt 行為對 → L2.5 重啟後 subagent_type 真的叫得起來 → L3 三次真實使用無需改 prompt。證據記 evidence/。
- **站6 控制層驗收（編排類限定，D052）**：每個實質產出配 verifier 三態（accept/reject/**uncertain→升級人，不放行**）；失敗回退到最小責任節點＋重試上限＋每次重試必有變更；red-team 案例配額按自動化等級——手動圖≥4／半自動≥9／全自動≥12，涵蓋九類（缺輸入/假來源/過期資料/幻覺輸出/工具故障/證據衝突/重試耗盡/批准逾時/禁止動作）；測試報告必留「未解驗證風險」節——不假裝弱 verifier 可靠。
- **站7 部署**：commit+push（另一環境會拉）＋doctor 健檢通過＋roster/CLAUDE.md 速查更新。

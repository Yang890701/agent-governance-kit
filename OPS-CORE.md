# OPS-CORE — per-session iron laws (injected by the session-start hook)
> Injected into every project that installs this kit. **Editing this file changes every project's behavior** (takes effect on the next session) — ask the operator first. Keep it ≤15 lines. `{{OPS_DIR}}` is replaced by the hook with the local rules directory (in this kit: `mechanisms/`). Shipped as a worked example — five laws that survived three months of daily operation. Replace them with your own; keep the format and the line budget.

1. **Encoding**: prefix Python runs in Bash with `PYTHONIOENCODING=utf-8`; no emoji to console; PowerShell 5.1 has no `&&` and `$PID` is read-only. *(platform consumable — adjust to your own stack)*
2. **Honest data**: mock/placeholder data is never labeled real/official; external-facing numbers carry a source or say "not obtained" — never invented.
3. **Delegate**: reading >3 files or expecting >200 output lines → spawn a subagent and collect conclusions only (rules: `{{OPS_DIR}}/dispatch-templates.md`).
4. **Verify**: completion claims need evidence — objective command evidence (build/test/grep/read-back) you run yourself and attach; subjective review-type acceptance goes to a fresh-context agent (`{{OPS_DIR}}/judgment.md`).
5. **Irreversible asks first**: deploys, public releases, deleting files you didn't create, spending money, git history rewrites (force push / rebasing pushed branches) — ask the operator first and require a designated confirmation word ("ok" doesn't count) before executing.

- Taste/subjective requests: collect examples into a rubric before building; the same approach failing twice → run a direction check before escalating (`{{OPS_DIR}}/judgment.md`).
- Division of labor with BRAIN: BRAIN routes to advisors and shapes fan-out; retry/escalation/acceptance standards follow these ops rules; the operator's explicit word always wins.
- Delegation templates: `{{OPS_DIR}}/dispatch-templates.md` · platform traps and the model routing table: `environment/README.md` (kit root).

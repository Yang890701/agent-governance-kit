# Slash commands — five field-used commands

Claude Code slash commands from the live system, sanitized. Install by copying into your project's `.claude/commands/`. Harness bindings are labeled per command; several interview and report in Traditional Chinese by design (the system owner's working language) — retarget the language lines if that is not yours.

- **bug-sweep** — codebase bug sweep: cheap parallel finders, 3 adversarial skeptics per finding, strong-model convergence into one verified audit report. *Runs a Claude Code dynamic workflow — needs v2.1.154+ and a paid plan.*
- **plan-panel** — plan stress-test: rival plans drafted from opposing angles (MVP-first / risk-first / user-first), scored by a judge panel, synthesized with grafts from the runners-up. *Runs a Claude Code dynamic workflow — needs v2.1.154+ and a paid plan.*
- **review-branch** — multi-dimensional code review of one change across independent lenses (correctness / security / performance / maintainability / simplification), plus a separate spec-fidelity axis; every finding adversarially verified. *Runs a Claude Code dynamic workflow — needs v2.1.154+ and a paid plan.*
- **treasure** — saves a lesson as a TREASURE memory the curator agent never auto-deletes, project-scoped or universal. *Needs the kit's `cli/treasure.js` and the data skeleton it creates (`.claude/agent-os/memory/TREASURE/` per project, `memory/universal/` in the kit root); replace `<kit-root>` in the file with your install path.*
- **wait-what** — re-explains the previous reply in plainer words without advancing the work; asks what is still unclear. *No dependencies; optionally uses `agents/README.md` for part names and a project `CONTEXT.md` glossary if present.*

*A sixth command — `arsenal`, a live roster-card printer — stays internal for now: it leans on a private architecture document, and a retargeted version added little beyond `agents/README.md`. It ships in a later wave together with a public system-roster page. (Deferring a visibly degraded piece beats shipping it — the same honesty-label policy the rest of the kit follows.)*

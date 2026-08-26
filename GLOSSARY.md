# Glossary

House terms that recur across this kit, defined once.

- **Source system** — the private, still-running original that this kit was extracted from. Provenance notes like "designed in the source system" point at it; it evolves daily and is not published.

- **Intake court** — the documented review every piece of external methodology passes before entering the system: an evidence-first verdict (adopt / graft / defer / reject), one ledger entry per case, three iron rules. Spec: [mechanisms/intake-court.md](mechanisms/intake-court.md).

- **Graft** — the court's partial-adoption verdict: transplant a *concept* from external material into an existing in-house asset — never the text itself. A graft names its destination file and is verifiable by a quote.

- **Fresh-context agent** — a subagent spawned with a clean context window, used for reviews and acceptance checks so that no one grades work while holding the assumptions that produced it.

- **Conductor** — the main-loop model in a session: it interviews, routes, judges, and verifies; bulk execution is delegated. "The conductor personally re-runs acceptance commands" is the standing verification rule.

- **Blank ledger** — a mechanism shipped as a fillable format plus operating rules, with the original's private entries removed. The mechanism layer of this kit is blank ledgers; the operations layer is opinionated defaults.

- **D-numbers (D001, D052, …)** — the source system's decision-log convention: every institutional change gets a dated, strictly-increasing entry. Public pages here narrate decisions in prose instead; D-numbers still appear inside working files (agent and skill bodies, Chinese originals), where rewriting them would drift from the live engine.

- **Entry skill vs. loop skill** — the two-layer skill discipline: entry-type skills are flow commanders triggered by the user or the router; loop-type units are shared logic that entries reference. An entry never calls another entry. Spec: [mechanisms/maintenance.md](mechanisms/maintenance.md) §8.

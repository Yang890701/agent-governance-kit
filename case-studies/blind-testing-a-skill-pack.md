# Case: the first experiment-before-verdict intake

The intake court's standing rule is that no external material gets rejected for overlap without a blind comparison. Until this case, "comparison" meant reading: a fresh-context agent reads the candidate and the incumbent side by side and reports per-dimension wins. This case is the first time reading was judged insufficient — and the court escalated to running both sides against the same tasks. It ended with a wholesale rejection, four grafts, and roughly 220,000 tokens on the bill. All three parts matter.

## The setup

A three-prompt workflow-builder set arrived from the internal toolkit corpus. Its three stages: an audit prompt that decides whether a problem deserves a graph-shaped workflow at all; a blueprint prompt that maps the workflow as nodes, edges, and a shared state schema; and a control-layer prompt that designs gates, verifiers, and retry behavior on top of the blueprint.

On paper, the overlap with existing equipment looked severe. The first prompt read like a twin of `multi-agent-judge`, the house agent whose whole job is to rule on whether a workflow needs orchestration or should stay a single agent with a checklist. The second read adjacent to `workflow-decomposer`, the house agent that breaks a workflow idea into atomic steps. A read-and-compare verdict was already drafting itself: *already covered, reject.*

The system owner challenged the draft with one question: **"High overlap — but did you actually test them against each other, or does it just read similar?"** The question had teeth because the court's own audit history says the "reads similar" instinct is unreliable: a retroactive re-audit had previously overturned five of twelve overlap rejections once full-text blind comparisons were actually run. Two documents can describe the same competence in different vocabulary — or use the same vocabulary to hide different depth. Prose comparison cannot tell those two cases apart.

So the court upgraded its own procedure: instead of judging the candidate's text, it would judge the candidate's **output on the same task as the incumbent's**.

## Experiment design

Two rounds, four agents total. Every run was blind: fresh contexts, neither side aware the other existed, no home-team advantage for the incumbent.

| Round | Question it answers | Task | Candidate side | Incumbent side |
|---|---|---|---|---|
| 1 — known-answer | Is the judge seat genuinely duplicated? | A case with a known correct answer: the system's own publication pipeline — a one-off, seven-station process that should **not** be automated | The candidate's audit prompt, run as-is | `multi-agent-judge` |
| 2 — depth | Does the candidate go deeper anywhere? | A harder, live problem: the intake review process itself — high repetition, human gates, acceptance checks | The candidate's full three-prompt chain, run end to end | `workflow-decomposer` |

The design separates two claims that a single comparison would blur. Round 1 tests **redundancy** on a case where the right answer is already known, so convergence is measurable rather than argued. Round 2 tests **depth** on a case hard enough that shallow material would visibly run out of ideas. Six run artifacts came out of the two rounds — one ruling per side in round 1, three chained artifacts plus one decomposition report in round 2 — and were archived as the verdict's evidence.

## Results

### Round 1: convergence — the judge seat is genuinely redundant

Both judges, working independently, arrived at the same prescription in different words: do not automate this pipeline; a human routes between stations; the AI runs one station at a time; state lives in shared files.

- The incumbent scored the case LOW on every axis of its scorecard and added an insight the candidate missed: automation here would be *dangerous*, not merely unnecessary — an automated feed would push not-yet-human-reviewed sanitized content toward a public destination.
- The candidate recommended a lightweight manual graph and — notably — explicitly ruled that a semi-automated design would be over-engineering. Handed a case built to tempt a graph-builder into building a graph, it did not take the bait. It also contributed insights the incumbent missed: two of the assumed sequential dependencies were fake (two drafting stations could run in parallel), and one verification step should be plain code rather than an LLM.

Same prescription, two vocabularies. That is the textbook definition of a duplicated role, and now the claim was backed by two full run transcripts instead of an impression. Installing the candidate's judge prompt alongside the incumbent would have re-introduced the exact disease the court exists to prevent: two standing rules for one job.

### Round 2: divergence in depth — the control layer is a real gap

On the harder problem the two sides agreed on direction — automate the mechanical stretch, keep the two human gates, turn the fuzzy stretch into templates — but differed sharply in what else they produced.

- The incumbent (about 49,000 tokens) got the skeleton right, correctly refused both retrieval infrastructure and multi-agent architecture, and did something the candidate could not: it dug into the actual audit ledger and identified the largest real error source (the overturned-rejection rate mentioned above), then proposed two concrete prototype tickets.
- The candidate's full chain (about 94,000 tokens) ruled the process a semi-automated graph and produced a control-layer design of a different order: a state schema with over a dozen typed fields, contracts for every node and every edge, six named verifiers, nine adversarial test cases, and a promotion contract for working memory.

Depth claims are cheap, so the court spot-checked three of them against the transcripts, and all three held:

1. The candidate's fake-dependency table had real corrective power — it caught that a bookkeeping step was doing two jobs and should be split, and that a health-check step should be a conditional edge rather than an unconditional one.
2. Its verifiers used three outcomes rather than two — accept, reject, and *uncertain*, with uncertain escalating to a human instead of passing — and it honestly listed the verification risks it could not close, including that one of its own verifiers could not detect a mis-scoped ticket.
3. Its working-memory contract required evidence, an approver, an expiry trigger, and an override rule for anything promoted to durable memory — and, just as importantly, carried an explicit do-not-promote list.

So the same experiment produced evidence in both directions: round 1 proved the overlap was real, round 2 proved the "already covered" framing was false for the control layer.

## The verdict

**Reject the package wholesale. Build no new judge agent. Graft four techniques into existing equipment.**

The rejection and the refusal to create a new agent follow from round 1: the judge seat exists, works, and converges with the candidate; a second one is rule duplication. The four grafts follow from round 2 and the spot-checks:

- **Fake-dependency check** — interrogate every claimed sequential edge: does the downstream step truly need the upstream step's *output*, or is the ordering just habit? Grafted into `workflow-decomposer` as a standing analysis dimension and into `multi-agent-judge` as a pre-scoring question. This is the technique that had already proven corrective power inside the experiment itself.
- **Six-rung verdict ladder** — a graded scale of orchestration answers, from "don't build anything" through "single agent plus a checklist," "manual graph — a human routes, the AI runs one station at a time," and "semi-automated with named human gates," up to full multi-agent shapes; the rule is to take the *lowest* rung that meets the real acceptance and risk requirements. Grafted into `multi-agent-judge`, replacing its previous binary-leaning verdict. The manual-graph rung in particular gives a solo operator a legitimate middle answer that the old scale lacked.
- **State/node/edge contracts plus control-layer acceptance** — for orchestration-type builds, the architecture stage must now produce explicit contract tables (the shared state's fields, each node's inputs and outputs, each edge's dependency justification), and the acceptance stage must give every substantive output a three-state verifier where *uncertain escalates to a human and never auto-passes*, meet a minimum quota of adversarial test cases scaled to the automation level, and end with a mandatory unresolved-verification-risks section. Grafted into the development pipeline's agent-build track.
- **Memory promotion contract** — nothing is promoted to durable memory without four fields: evidence, approver, expiry or review trigger, and an override rule; unverified conclusions and transient build-status prose are never promoted. Grafted into `memory-curator`.

Two further verdict details are worth recording, because they show what a graft verdict has to say beyond "we took the good parts."

First, the **not-grafted list** is explicit: several of the candidate's principles were already law in the house system (done is not accepted; no agent verifies its own work; deterministic steps get code, not prompts), its interview-driven interaction model contradicts the house one-shot conversion protocol, and one section existed to satisfy the material's own format rather than to say anything. Each non-graft names the incumbent rule that covers it.

Second, actually running the material surfaced **seven internal craft flaws** that reading had not — among them: a role definition that permits a hybrid answer while its execution section forces a single choice; hardcoded next-step metadata that contradicts the material's own "stop the chain on a no-build ruling" instruction; a test-case quota arithmetically too small to cover its own required category list; artifact templates that pre-fill a "confirmed" status, hollowing out the confirmation they claim to enforce; and an instruction to define retry limits sitting next to a guardrail that forbids inventing retry budgets. These flaws are the standing argument for the court's graft policy: **transplant the concept, never the text.** One of the flaws was silently corrected in transit — the quota that couldn't cover its categories was raised until it could — and the correction is recorded in the verdict.

A standalone entry skill was queued as a follow-up build; it has since been built and will ship in a later wave of this kit (the entry-vs-loop skill discipline it obeys: [mechanisms/maintenance.md](../archive/v1/mechanisms/maintenance.md) §8).

## The price

The two rounds cost roughly 220,000 tokens, and that number is recorded in the verdict and on the ledger next to the decision it paid for. This is deliberate: the court pays for evidence and says what it paid. A rejection that cites two full run transcripts is more expensive than a rejection that cites a feeling, and pretending otherwise would make experiment-backed verdicts look free — which is exactly how an institution quietly stops running experiments.

## What this case proves

A rejection verdict can carry experimental data instead of an impression — two independent judges converging on a known-answer case is evidence in a way that "these documents read alike" never is. The "already covered" instinct is unreliable in both directions: it nearly rejected a control-layer design that measurably out-deepened the incumbent, and the house audit record shows it had previously mis-rejected five of twelve overlap calls. And rejection and adoption are not opposing verdicts — the same experiment that proved the package should not be installed proved which four of its ideas should outlive it.

---

Provenance: verdict of 2026-08-24 — the intake court's first experiment-before-verdict case. Evidence transcripts archived in the private originals; summarized here with the source material paraphrased, not quoted.

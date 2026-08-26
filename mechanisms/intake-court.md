# The Intake Court

A review institution that every external methodology must pass through before it enters the home AI system. Nothing from outside — a prompt set, a skill repo, a hook, an MCP server, a clever workflow someone published — gets to live in the engine without a recorded verdict.

## What this is / Why

Rule and methodology bloat is the default state of any long-lived AI system. Every week ships another prompt pack, another agent framework, another "you need this skill" repo. Adopt them casually and the system accretes overlapping rules, duplicate agents, and instructions nobody remembers the reason for. Reject them casually and you miss genuinely better techniques — worse, you miss them silently, with no record that they were ever considered.

The intake court is the single gate between outside material and the engine. Its one non-negotiable output: **every external item gets a written verdict before it enters — or before it is turned away.** The verdict says what the item was, what it became (or why it did not), and what evidence supports the call. Six months later, when someone asks "did we ever look at X?", the answer is a ledger lookup, not an archaeology project.

## The pipeline

External material moves through three stations:

1. **Staging area** — a gitignored intake folder, deliberately outside version control. Source clones, evaluation sandboxes, verification scripts, and raw comparison outputs land here while the material is on trial. Nothing in the staging area is canonical; it exists so evaluation can be messy without polluting the repo. After a verdict, anything worth keeping (scripts that reproduced a measured number, notes that fed the verdict) is moved out to a tracked location; heavy leftovers — sandbox clones, virtual environments — are deleted with the user's confirmation, since upstream can always be re-cloned. An index file at the staging root points readers back to the canonical ledger, so nobody mistakes scratch material for a decision.

2. **Ledger** — one canonical file, one row per intake batch. Each entry records: the **source** (what the material is, when it arrived, how many items it contained), the **verdict** for each item, the **destination** (which file or agent each accepted piece became or was folded into), and any **revisit trigger** attached to deferred items. Revisit signals are appended to the entry later, with a marker, when a deferral's trigger condition comes true.

   The ledger obeys one anti-drift rule: it records *decisions and mappings only*, never live build status. Whether something is actually built right now is answered by reading the live repo, not the ledger. Hand-copying "built ✅" into ledger prose is exactly how one fact diverges across files; the ledger refuses to carry it.

   A second routing rule: items inside a set are judged **individually**. A prompt pack of five prompts is five verdicts, not one — two prompts of identical format routinely become different things (one folds into an existing agent, one becomes a reference doc, one is rejected), and a single package-level verdict would flatten that.

3. **Verdict report** — for any non-trivial call, a standalone report directory holding the evidence: blind-comparison transcripts, per-dimension win/loss tables, quotes from destination files, test outputs, and token cost. The ledger row states the verdict; the report proves it. Reports are batched per intake date and kept permanently.

## Verdict types

Every item receives exactly one of four verdicts:

- **Vendored wholesale.** The item enters as-is. This is the rarest verdict and the only one that requires a **security review first**: scan the material for tool-poisoning, hidden instructions, hardcoded secrets, and over-broad permissions (scanners run in local mode, on demand — the gate itself installs nothing); assign a least-privilege tier before install; then install **version-pinned** as rug-pull defense. A malicious or careless external tool cannot exfiltrate what it has no rights to reach.

- **Graft selected techniques.** The most common acceptance. The package is not installed; specific techniques from it are transplanted into existing assets. The ledger entry must name **what was grafted, where it landed, and what was changed in transit** — external material almost always assumes a different interaction model (multi-turn interviews, a different host, a different permission story) and the graft record is where those conversions are made explicit instead of silent.

- **Defer, with a revisit trigger.** "Not now" is a legal verdict; "not now, indefinitely" is not. Every deferral must carry the condition under which it comes back: event-based (a model-generation change, a new mechanism shipping, missing source material resurfacing) or routine (the deferred pool is swept on every new intake batch).

- **Reject.** Legal only with comparison evidence attached. "We already have something like this" is the single most tempting and most error-prone verdict — see the first iron rule.

## Three iron rules

These were not designed in advance; each was instituted after an audit caught the failure it now prevents.

1. **No rejection without a blind comparison.** Any rejection on grounds of overlap ("our existing asset already covers this") must attach a full-text blind-comparison report: a fresh-context agent reads both the candidate and the incumbent with no knowledge of which is which and no home-team advantage for the incumbent, then reports per-dimension wins and a list of portable parts. An overlap-rejection without this report is void. The rule exists because a full re-audit of past verdicts ran the comparison retroactively: of twelve blind comparisons, five prior "already covered" rejections were overturned. Judging overlap by topic instead of by full text systematically undervalues new material.

2. **Every deferral gets a revisit trigger.** An item parked without a wake-up condition is an item rejected without a verdict. The same re-audit found a deferred technique whose exact gap was rediscovered months later through an unrelated channel — the deferral had quietly become a loss. Triggers make deferral a scheduling decision instead of a euphemism.

3. **Every "already covered" claim needs a quote.** When a verdict says "this technique is already folded into asset X," the entry must include a verbatim quote from X proving it — or the claim gets spot-checked after the fact. Spot-checks of past fold-in claims found that a majority of the sampled claims had drifted: the destination file did not actually contain what the ledger said it did. A claim without a quote is a hope, not a record.

## Escalation to controlled experiments

When the suspicion is "this new material duplicates existing equipment," reading both texts side by side is sometimes not enough — two documents can describe the same competence in different vocabulary, or the same vocabulary can hide different depth. In that case the court escalates from reading to **running**: a controlled blind test where the candidate and the incumbent are given the same tasks and their outputs are compared, not their prose.

One anonymized case: a workflow-builder prompt set arrived whose "judge" role looked redundant with an existing judging agent — but looked is not evidence. The court ran a 4-agent controlled blind test in two rounds: a known-answer round where the candidate judge and the incumbent judge each ruled on the same case independently, and a depth round where the candidate's full chain ran against the incumbent decomposition agent on a harder problem. The known-answer round showed both judges converging on the same prescription in different words — the judge role was genuinely redundant, and now there were two full run transcripts proving it, satisfying iron rule 1. The depth round showed the candidate's control-layer design going deeper than the incumbent in specific, nameable ways. Verdict: **wholesale rejection of the package, four techniques grafted** into existing agents. The experiment cost roughly 220k tokens, and that price was recorded on the ledger — the court pays for evidence and says what it paid. The full write-up of this case: [blind-testing-a-skill-pack](../case-studies/blind-testing-a-skill-pack.md).

## A synthetic ledger entry

Fictional content, showing the field shape of one ledger row:

| # | Source (date) | Items | Verdict / what each became |
|---|---|---|---|
| 12 | "Release Notes Writer" prompt set (03-14) | 3 | P1 changelog compiler → **grafted** into the existing release agent: diff-first ordering + breaking-change callout adopted; interview flow dropped (converted to one-shot, per house protocol). P2 tone guide → **rejected**; blind comparison attached, incumbent style guide won 4 dimensions to 1 (report: `intake-reports/03-14-release-notes/`). P3 version-bump checker → **deferred**; revisit trigger: next intake batch, or the CI pipeline gaining a release stage. 🔔 04-02 revisit signal: CI release stage shipped — trigger condition met. |

Every clause in the row is one of the four fields doing its job: source identified and dated, each item individually sentenced, destinations named, the rejection pointing at its evidence, the deferral carrying its trigger — and the trigger later firing on the record.

---

Provenance: instituted in the source system; 34 ledger entries and 4 audit-report batches to date. External material is credited per item — third-party repos by name, private source material as an anonymized internal toolkit corpus. Durability: high — vendor-agnostic.

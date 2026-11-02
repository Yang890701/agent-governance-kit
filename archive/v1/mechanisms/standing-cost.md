# standing-cost — Fixed-Cost Audit of Always-On AI Rules (re-runnable prompt)

## What this is

Every request an AI coding agent handles carries a fixed context payload: always-loaded instruction files plus tool definitions. That payload is a recurring cost — you pay it on every single turn, whether or not the turn uses any of it. This mechanism is a re-runnable audit prompt that inventories that fixed cost item by item and asks one question of each line: is this worth paying on every turn?

## When to run

Run it whenever the fixed payload may have drifted from the work actually done in the workspace — after installing new tooling, after a model-generation change, or when usage bills stop matching workload. It is a recurring health check, not a one-off task; expect to re-run it a few times a year.

## Division of labor with rule-audit

This mechanism and the companion rule-audit mechanism are two separate audits, and neither can substitute for the other:

- **rule-audit** owns **correctness**: is this rule still true, and can the AI still verify it?
- **standing-cost** (this file) owns **weight**: is this rule's per-turn fixed cost worth it?

The same file can legitimately go through both. A rule that is entirely correct but used twice a year passes rule-audit — and this audit will still recommend moving it to an on-demand layer. This audit does no correctness checking; if measurement stumbles onto a factual error, note it in one line at the end and hand it to rule-audit's jurisdiction.

## §0 Triggers (run if any one applies)

- A model-generation change (your model roster or dispatch table changes).
- A new MCP server, or a new always-on tool / skill / agent, was installed.
- Long gap: more than 3 months since the last standing-cost audit.
- Quota or token consumption visibly out of proportion to the work being done.

## §1 Inventory scope (audit both layers — skipping either one falsifies the result)

**A — Instruction-file layer.** Your global instructions file, the project instructions chain, output styles, hook-injected content (session-start injections, wake summaries, active hand-off tickets, and the like), and agent/skill descriptions. Mark every item as either "loaded at session start" or "loaded on demand" — files that are shadowed or on-demand do not count as fixed cost.

**B — Tool-definition / MCP-server layer.** This is the layer a previous audit missed, and the main reason this mechanism exists. List every mounted MCP server and built-in tool. Record the weight of server instructions plus the tool count, and determine for each tool whether its schema is **resident in every request** or **deferred** (loaded only when fetched via tool search) — the standing cost of deferred schemas is close to zero.

⚠️ "MCP servers are usually the single biggest line item" is common folklore. On the first run against the host system it turned out to be false. Measure it; do not copy the folklore conclusion.

## §2 Score every item on three axes

1. **Weight.** Estimated token cost, and whether it is paid on every turn or only when its scope is actually touched.
2. **Hit rate.** Of the requests the user actually makes in this workspace, what fraction uses this item? Ask the user first — "what kinds of work do you normally do here, and is there anything you definitely want kept?" — before scoring. Never presume from "projects of this type usually need it."
3. **Cost of being wrong.** What breaks if this is removed? Rules that prevent data loss, security incidents, or silent errors stay no matter how heavy they are — weight never outweighs this axis.

## §3 Three verdicts, then rank

- **Keep**: hit rate justifies the weight, or the cost of being wrong is high.
- **Turn off / unload**: hit rate for this workspace's work is near zero.
- **Move to on-demand**: the content is worth keeping but does not need to be present on every turn — move it to a nested or path-scoped instructions file, a skill or command, a hook, or CI. Anything that must be *guaranteed* rather than *encouraged* belongs in a hook, which enforces at zero context cost.

Rank recommendations by **weight × actual payment frequency** — i.e., by how much attention each change gives back. This is the same ranking concept as rule-audit's, applied at the other end: that mechanism ranks correctness recommendations, this one ranks weight recommendations.

## §4 Output format

1. **Total paid per turn.** Give the denominator first — without it, "this item saves 2k tokens" cannot be judged.
2. **Recommendation list** (ordered per §3). Each entry states: weight / when it is paid / rationale (hit rate + cost of being wrong) / the concrete way to disable it (which file, which key, whether a restart is needed) / how much it gives back.
3. **Keeping these.** Items explicitly left untouched, each with one sentence on why it earns its weight — this protects the user from later cutting a load-bearing wall themselves.
4. **What I could not measure.** Silence must not imply coverage. List each blind spot: built-in weight the product does not disclose, figures inferred without opening a live session, and so on.

Estimation discipline (same clause as rule-audit's): any chars÷4 figure is always labeled "estimate" and never presented as a measurement. If the product discloses actual usage, the measurement overrides the estimate — and say which one you used. If the total cost is small and matches the work, say plainly "no changes recommended": an honest empty list beats fabricated recommendations.

## §5 Conduct rules (report-only)

- This is a pure reporting task: create, modify, or delete no files; change no settings; mount or unmount no servers. Open with one sentence stating "this run produces recommendations only — nothing will be changed."
- Applying any recommendation requires the user to name it explicitly. Before applying, show the diff; never commit on your own.

---

First run on the host system estimated ~10.7k tokens of fixed per-request cost, cross-checked against an independent ~11k measurement.

Provenance: designed in the source system; material source: internal toolkit corpus, adapted and hardened through field audits. Durability: high — vendor-agnostic. Chinese original preserved in zh-originals/.

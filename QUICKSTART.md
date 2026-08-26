# Quickstart — adopt the mechanism layer in 10 minutes

You do not install this repo; you adopt its mechanisms one at a time. Each mechanism is a self-contained markdown contract that works with any AI coding agent that can read files — no dependencies, no installer, no vendor lock. Start with the three below: they pay off fastest and assume nothing about your stack.

## 1. The build registry — 2 minutes (skip if you only ever run one AI session)

1. Create a file named `build-registry.md` at the root of **your own project** (not this repo's) — or one level above it if several of your projects share one engine folder. Rule of thumb: the closest folder all your AI sessions can see.
2. Copy the **Format spec** block and the rules from [mechanisms/build-registry.md](mechanisms/build-registry.md) into it — the three numbered steps **plus the stop-and-ask clause** ("if the same target is already claimed, stop and ask the user"). That clause is the whole point.
3. Add one line to your agent's standing instructions:
   > Before starting any build work, check `build-registry.md` and claim your target; clear the claim when done; if the same target is already claimed, stop and ask me.

Done. Two parallel windows can now see each other.

## 2. Your first standing-cost audit — 5 minutes (find out what every request is costing you)

1. Copy [mechanisms/standing-cost.md](mechanisms/standing-cost.md) into your **project root** — the prompt below refers to it by bare filename; if you put it elsewhere, adjust the path in the prompt.
2. Open a session with your AI coding agent and paste:

   > Read `standing-cost.md` (the fixed-cost audit mechanism) and run that audit against this workspace: inventory my always-loaded instruction files AND my mounted tools/servers, score every item on the three axes (weight / hit rate / cost of being wrong), and give me the report in the §4 output format. Before scoring hit rates, ask me the mechanism's §2 question about what work I normally do here — and if I don't answer, label every hit rate as an assumption. This run is report-only — change nothing.

3. What you should get back: your **per-turn fixed cost** (the denominator first), a ranked keep / turn-off / move-on-demand list, an explicit "keeping these" section, and an honest list of what it could not measure. If the report recommends nothing because your setup is lean — that is a legal result; the mechanism forbids fabricated recommendations.
4. Apply nothing on the spot. The mechanism itself forbids the agent from applying changes; you name the items you want changed, one by one, after seeing diffs.

## 3. The rule audit — when a rule file feels fat

Same pattern: copy [mechanisms/rule-audit.md](mechanisms/rule-audit.md) next to the other one, then paste:

> Read `rule-audit.md` and run that audit against my rule files: for every rule, check both gates (is it still true / can you still find and verify it), apply the staleness and babysitter-patch scans, and output the §5 recommendation list. Report-only.

Run it after a model-generation change, or whenever the same rule keeps getting missed.

One dependency to know: deletion-class verdicts point at a deletion-evidence standard defined in [mechanisms/maintenance.md](mechanisms/maintenance.md). Until you adopt that mechanism too, treat every "delete" recommendation as *pending verification* — which is exactly what the mechanism itself will do.

## What NOT to adopt first

- The pipeline skills ([skills/](skills/README.md)) and the advisor roster ([agents/](agents/README.md)) are opinionated defaults, wired into a specific host. Read them as designs; adopt pieces only after the mechanisms above have proven themselves in your hands.
- The consumables layer ([environment/](environment/README.md)) is a shape to imitate with your own facts — copying its content would be adopting someone else's expired groceries.

## If something in this guide did not work as written

That is a defect in the guide, not in you. This quickstart is itself subject to the repo's own rules: it must be executable as written, or it gets fixed. It was field-tested before release by a fresh-context agent role-playing a stranger against a clean toy project — it completed every step, and the four ambiguities it hit were fixed in the version you are reading.

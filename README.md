# agent-governance-kit

**Skills that have to earn their place.**

Most AI skill packs only grow. Nobody checks whether a skill beats just asking the model, so the packs fill up with instructions the model no longer needs. Every session pays for them.

This pack has one rule: **a skill ships only with a measurement.** The same tasks run with the skill and without it, on the same model, and the skill has to win on the thing it claims to improve. If it doesn't, it doesn't ship.

I learned this the hard way. My own five-month-old "agent OS" lost to the plain model: same scores, 25% more cost, 33% slower. [Read the case study →](case-studies/measuring-my-own-agent-os.md)

## Install

```bash
claude plugin marketplace add Yang890701/agent-governance-kit
claude plugin install agent-governance-kit@agent-governance-kit
```

## Why these skills exist

### #1: "Does this AI tool actually help?"

**The problem.** You install a skill pack, a CLAUDE.md template or a workflow plugin, and the work *feels* better. Feeling is not evidence. A skill that made sense for last year's model may now only add tokens.

**The fix.** [`/measure`](skills/measure/SKILL.md) A/B-tests any plugin or skill pack on *your* tasks. It records score, cost, time and turns for each arm. It makes you prove your graders before spending money, and it ends with a keep/cut verdict.

**The evidence.** It found that my own agent OS cost 25–85% more per task with no quality gain ([case study](case-studies/measuring-my-own-agent-os.md)). It also caught one of its own graders producing false failures before the full run.

> Claude Code ships `claude plugin eval`. As of 2.1.x, its documented output covers scores only: no per-arm cost or time, and no "run my tests" grader. Those are exactly the numbers a keep/cut call needs, and `/measure` records them.

## In the queue

These come from the archived v1 system. Each must beat "without" in its own A/B test before it moves out of this list:

| Skill | Failure mode | Status |
|---|---|---|
| `/audit-done` | "The agent says it's done. Is it?" | My first audit test was too easy: both arms found every bug. It needs a harder test. |
| `/distill-taste` | "The output feels off, and I can't say why." | Not measured yet |
| `/intake` | "Should I adopt this new tool?" | Not measured yet; the blind-test method is in [this case study](case-studies/blind-testing-a-skill-pack.md) |

## How this relates to Matt Pocock's skills

[mattpocock/skills](https://github.com/mattpocock/skills) helps you **build it right**: grill the requirements, write the spec, run TDD. This pack helps you **prove it's right**, and prove that the tools you add are worth what they cost. Use both. The design rules here come from his: small, composable skills that you invoke yourself, with no always-on process that takes control away from you.

## v1

The original governance layer is in [`archive/v1/`](archive/v1/README.md): an always-on dispatcher, 11 advisor agents, hooks and ledgers. It is kept as a record. Measurement showed that its always-on layer cost more than it returned.

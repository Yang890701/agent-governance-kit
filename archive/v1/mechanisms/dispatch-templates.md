# dispatch-templates — Delegation Prompt Templates (copy directly, fill in the `<>`)

## What this is

Five copy-paste templates for writing delegation prompts — the work orders you hand to a subagent. Each covers one recurring dispatch shape (search, implementation, batch refactor, research, review) and carries the same four-part kit: goal & motivation, acceptance criteria, forbidden zone, report format. You copy the matching template, fill in the angle brackets, paste the shared report contract at the end, and send.

## Why templates

Delegation drift is the default, not the exception: an agent given a loose instruction will substitute its own notion of done, wander outside scope, and report back in prose you cannot verify. Templates counter this by hard-wiring the acceptance standard and the forbidden zone into the work order itself, so "done" is testable before the work starts. The report contract does the same for the reply: evidence with file-and-line locations instead of a process narrative.

Two standing rules apply to every template below:

- **Only the user can relax a forbidden zone.** No agent — including the dispatcher — may waive it on its own.
- **A forbidden-zone field is never left blank.** If there are no extra restrictions, write "none"; a blank field means nobody thought about it.

## Shared report contract (paste at the end of every delegation prompt)

```
[Report format] Your final reply may contain only:
1. Conclusion (10 lines or fewer)
2. Evidence list: file:line references, or command + key output lines
3. Long artifacts written to a file; report the absolute path
4. What verification you did (one line)
Do not paste entire file contents. Do not narrate your process.
```

## 1) Search / locate — dispatch to a read-only search subagent

```
[Goal] Find the definition and every usage site of <symbol / behavior / setting>. Motivation: <about to change it / need to understand it>.
[Scope] <directory or entire repo>. Search breadth: <medium | very thorough>.
[Forbidden zone] Read-only; modify no files. Additionally off-limits: <list | none>.
[Acceptance] Every hit listed as file:line plus a one-line explanation; if zero hits, list the patterns you tried (at least 3 variants).
+ report contract
```

## 2) Implementation — dispatch to a general-purpose agent on a mid-tier model (upgrade to the strongest model when architectural trade-offs are involved)

```
[Goal] Build <what>. Motivation: <why / for whom>.
[Spec] Input / output / edge cases: <...>. Read <reference file> first and follow its conventions (naming, comment density, error handling).
[Non-goals] Do not introduce new dependencies unless <condition>.
[Forbidden zone] Do not touch: <files / directories / APIs / data, listed explicitly | none>. Only the user can relax a forbidden zone.
[Acceptance] <concrete command> passes; <file> contains <key content>; the existing <build / test command> is not broken.
+ report contract
```

## 3) Refactor / batch change — when the pattern is known and more than 5 files are affected, dispatch to a cheap fast model

```
[Goal] Change every <old pattern> to <new pattern>. Motivation: <...>.
[File list] Affected files: <list them explicitly; if unsure, dispatch template 1 first to produce the list>.
[Forbidden zone] Files outside the list are untouchable, no exceptions. Additionally off-limits: <list | none>.
[Invariant] External behavior must not change: <acceptance command> must produce identical results before and after.
[Acceptance] <build / test command> passes; `grep <old pattern>` shows zero residue (write out the exact grep command).
+ report contract
```

## 4) Research / verification — dispatch to a general-purpose agent (web search and fetch allowed)

```
[Goal] Answer <question>. Motivation: <what this answer will decide>.
[Requirements] At least <N> independent sources; every key number carries its source and date; if something cannot be found, write "not found" — filling gaps with speculation is forbidden.
[Forbidden zone] Read-only; modify no local files; do not transmit <sensitive data | none> externally.
[Acceptance] Conclusion carries a confidence level (high / medium / low, plus a one-line reason) and a source list (URL + date).
+ report contract
```

## 5) Review / acceptance — dispatch to a fresh-context general-purpose agent; when stakes are high (data authenticity / security / money / public release) or the user says it matters, use the strongest model or a 3-agent majority vote

```
[Goal] Adversarially review <artifact / file / claim>. Your stance: assume it is wrong and try to refute it.
[Check surfaces] (a) claims vs reality — run <command> yourself to verify (b) cross-file consistency — does any other file contradict what it claims (c) boundary inputs / failure paths (d) <risks specific to this artifact, e.g. personal data, encoding, security>.
[Forbidden zone] Read-only review; do not fix things on the author's behalf — report findings, leave the reviewed files untouched. Verification that writes files (build / test runs that produce cache or dist output) may only run in a disposable environment (worktree / sandbox); otherwise mark it "not run" and say why.
[Acceptance] Every finding includes: severity / location (file:line) / how to reproduce / suggested fix. If there are no findings, list what you checked before daring to say so.
+ report contract
```

## Usage notes

- If the target project root has a `CONTEXT.md` (domain glossary), add one line after [Goal] in any template: `[Terminology] follow the glossary in <project root>/CONTEXT.md` (pairs with the dispatch routing rules).
- If you cannot phrase an acceptance criterion as an executable command or greppable content, you have not thought the task through — dispatch a planning agent or a spec-definition advisor first to produce the spec.
- If a subagent's report violates the contract (pastes whole files, no evidence), send it a follow-up message demanding a re-report per the contract; do not patch the report yourself.
- If the same template on the same task fails repeatedly, stop — escalate up the model ladder or change the decomposition, per the companion dispatch rules (round thresholds live there, not restated here).

## Pre-send checklist

> After writing a delegation prompt, walk every field once before sending. The fix style is tone-preserving local rewrite plus a before/after line — never a full rewrite.

1. **Vague-word scan** — sweep the text for words that read specific but are actually empty: "better", "more complete", "more polished", "professional", "in-depth".
2. **Misreading table** — for each word caught, add one line: what an agent is most likely to misread this word as.
3. **Acceptance executability** — if an acceptance criterion cannot be written as an executable command or greppable content, reject and rewrite; do not send (same rule as the usage note above).
4. **Forbidden zone presence** — not listed means not considered; when there is no extra restriction, write "none", never leave it blank.
5. **Four-part alignment** — check goal & motivation / acceptance criteria / forbidden zone / report format item by item for gaps.

- If a field fails the check, fix only that field, keep the rest verbatim, and attach one before/after line (what changed and what consequence it avoids). Do not rewrite the whole prompt.
- The full vague-word misreading table and tone-preserving rewrite behavior belong to a dedicated spec-definition advisor (same mechanism, not restated here).

## Complaint-to-instruction

> A verbal complaint after reading an agent's output ("too wordy", "same mistake again") gets converted into one line of the next delegation prompt — not thrown away.

1. **Catch the complaint keyword** — "too wordy / too long" becomes a forbidden-zone line "do not <X>" in the next round; "again / repeated" becomes a file-list line "this round must avoid <the specific thing complained about last time>".
2. **Where it lands** — the forbidden-zone field or the list field (see templates 2 and 3 above); never invent a new field for it.

(Concept adapted from an externally reviewed playbook's review-to-revision translator pattern; the original is not restated here.)

---

Provenance: instituted in the source system; the three-part kit became four parts when a forbidden-zone field was added after a review round. Durability: high — delegation contracts are vendor-agnostic.

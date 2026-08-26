---
description: Save a memory as TREASURE (永不刪). Add "universal" anywhere in args to mark cross-project.
argument-hint: <what to remember — short description>
---

The user wants to save a memory as a TREASURE — a permanent lesson the curator agent will never auto-delete. Project-scoped treasures live under `<this-project>/.claude/agent-os/memory/TREASURE/`. Universal treasures (cross-project) live in the kit installation at `<kit-root>/memory/universal/` and are visible to every project automatically (no sync step needed per D020 engine/data split).

User args: $ARGUMENTS

## Your job

1. **Determine scope**:
   - **Universal** (use `--universal`): if args explicitly contain the word `universal`, OR the lesson is genuinely project-agnostic (works in any project / on any OS / for any toolchain). Examples: "Windows hooks need forward-slash paths", "PowerShell needs UTF-8 BOM", "Use SessionStart hook to inject memory".
   - **Project-only** (no flag): if the lesson is specific to this codebase, current task, or local convention. Examples: "agent-os Phase 2 = D006 meta-agents", "PROJECT.md must point at ROADMAP current item".

2. **Compose title and content from conversation context**:
   - **Title**: ≤60 chars, imperative/declarative form, captures the lesson at a glance. Bad: "thing I learned". Good: "PowerShell scripts need UTF-8 BOM for non-ASCII".
   - **Content**: 1-3 short paragraphs. State the rule, the why, the failure mode it prevents. Include a `備註(中):` line if Chinese context is worth preserving. Keep it under ~500 chars; longer treasures should use the manual file edit path instead.

3. **Quality gate — push back if the args look bad**:
   - Vague args ("I learned something") → ask user to be more specific before saving.
   - Ephemeral state (current task progress, session-specific stuff) → suggest a SESSION_LOG note instead.
   - Already-in-code knowledge (function names, file paths derivable by grep) → decline; TREASURE is for non-obvious lessons.

4. **Save via the CLI** (single source of truth — do NOT use the Write tool directly for the file):
   ```bash
   node <kit-root>/cli/treasure.js add "<title>" "<content>" [--universal]
   ```
   Use the Bash tool. The CLI auto-resolves project data root via the current working directory, so this same command works in any project. Escape any embedded `"` in the content as `\"`. For multi-line content, use `\n` literally inside the quoted string (the file will preserve it).

5. **Confirm to the user** with the printed path and one sentence on why this is universal/project-only.

## Failure modes to avoid

- Polluting `universal/` with project-specific lessons (forces cleanup later)
- Saving vague "I learned X" entries that future-you can't act on
- Calling the CLI without a title (it errors out) — always supply both args
- Forgetting `备註(中):` in cases where the user's original phrasing was Chinese — preserves the original framing

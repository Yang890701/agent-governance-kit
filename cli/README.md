# CLI tools

Small, dependency-free command-line tools that ship with the kit. The four `.js` tools require [Node.js](https://nodejs.org/) (no npm install needed — they use only the standard library). `relocate.ps1` requires Windows PowerShell 5.1+.

Run them from a project where the kit is installed (they resolve the engine root from their own location, and per-project data from your current working directory).

## doctor.js — engine health checks

Read-only health checks for drift-prone engine state: agent frontmatter, roster sync, hook paths, mirror freshness, decision-log ordering, dangling doc references, charter manifest, unpushed commits, and more. Prints PASS/WARN/FAIL per check and always exits 0 unless `--strict` is passed.

```
node cli/doctor.js            # human-readable report
node cli/doctor.js --json     # JSON output
node cli/doctor.js --strict   # exit 1 on any FAIL
```

## recall.js — search memory

Grep-style search across all memory files (PROJECT.md, DECISIONS.md, OPEN_QUESTIONS.md, ROADMAP.md, SESSION_LOG/, memory/), printing file, line number, and context for each hit.

```
node cli/recall.js <keyword>              # case-insensitive substring
node cli/recall.js <pattern> --regex      # JavaScript regex
node cli/recall.js <keyword> --no-color   # disable ANSI color
```

## treasure.js — permanent memories

Marks memory as TREASURE — files the memory curator is never allowed to delete. Project-scoped by default; `--universal` writes to the engine's universal store shared across projects.

```
node cli/treasure.js list
node cli/treasure.js add "<title>" "<content>" [--universal]
node cli/treasure.js mark <session-log-file> [--universal]
```

## curate.js — memory-curation prompt builder

Assembles the inputs the memory-curator subagent should read and prints a paste-ready instruction block for Claude Code. Makes no API calls and writes nothing.

```
node cli/curate.js        # include the 3 most recent session logs
node cli/curate.js 5      # include the 5 most recent
```

## relocate.ps1 — re-point after moving the kit root

After moving or renaming the kit's root folder, rewrites every absolute path the old root left behind — in each installed project's `.claude/settings.json`, the global settings, and the moved tree itself. Dry-run by default; nothing is written without `-Apply`.

```
& <new-root>\agent-os\cli\relocate.ps1           # dry-run: print the plan
& <new-root>\agent-os\cli\relocate.ps1 -Apply    # actually rewrite
```

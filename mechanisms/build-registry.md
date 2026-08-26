# The Build Registry

A collision guard for parallel AI sessions. One shared file where every session declares what it is building, before it builds it.

## The problem

Multiple AI sessions or terminal windows often run against the same machine at the same time. They share the filesystem, but they do not share live awareness — one session has no idea what another session is doing right now. Two sessions can each decide, independently and reasonably, that a tool needs to exist, and each builds it.

That is exactly how this mechanism was born: one day, two same-day sessions built the same tool twice, in two different folders. Same intent, duplicated effort, and two divergent copies to reconcile afterward.

The registry closes that gap with the oldest coordination tool there is: a sign-in sheet.

## The rule

1. **Check before starting any build work.** Open the registry and scan the active claims.
2. **Claim your target.** Add one line stating who you are, what you are building, which folder or files you will touch, and status `building`.
3. **Clear it when done.** Update the status to `done` with the date.

If you find someone else has already claimed the same target: **stop and ask the user.** Never silently build a second copy. The user decides whether to take over the claim, redirect the work, or drop it.

## Format spec

One line per claim:

```
- [YYYY-MM-DD] <who: cwd + short tag> | building: <what> | target: <folder/files> | status: building → done <date>
```

- `who` is the session's working directory plus a short human-readable tag — enough for another window to tell sessions apart.
- `target` names the concrete folder or files, so overlap is detectable by a plain read, no tooling required.
- `status` starts as `building` and is edited in place to `done <date>` when the work lands.

## Example entry

A synthetic entry (fictional content, placeholder paths):

```
- [2026-08-24] ~/projects/example (log-pipeline window) | building: retry wrapper for the ingest CLI | target: ~/projects/example/tools/ingest-retry/ | status: building
```

When the wrapper ships, the same line becomes:

```
- [2026-08-24] ~/projects/example (log-pipeline window) | building: retry wrapper for the ingest CLI | target: ~/projects/example/tools/ingest-retry/ | status: done 2026-08-24
```

## Why one registry for everything

Keep a single registry at the engine level, shared by all projects — not one per project. Two windows can only see each other if they are looking at the same page. Per-project registries recreate the original blindness: a session working from one project root never opens another project's ledger, and cross-project or engine-level builds fall through the cracks entirely. One ledger means one place to check, one place to claim, and no ambiguity about where a claim belongs.

---

Provenance: instituted in the source system after a real double-build collision. Durability: high — any multi-session workflow has this problem, regardless of vendor.

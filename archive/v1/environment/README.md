# environment — the consumables layer (perishable by design)

## Why this layer exists

The mechanisms in this repo are blank ledgers meant to outlive model generations; this layer is the opposite — knowledge that is true about one host, right now, and will rot. Every entry here carries an explicit expiry condition instead of pretending to be timeless, because unstated staleness is how rule files silently poison an AI agent. Keeping a perishable layer on purpose also makes it the live demonstration object for the mechanism layer: the [standing-cost](../mechanisms/standing-cost.md) and [rule-audit](../mechanisms/rule-audit.md) mechanisms both list "the model roster or dispatch table changed" as a mandatory trigger, and this layer is what those triggers exist to clean up. What is published below is the *shape* of that layer — trap patterns and table schemas — with every host-specific fact stripped out.

*Expiry: this page describes shapes, not facts, so it outlasts its own contents — but re-read it whenever your host changes.*

## Environment trap patterns

The host system keeps an environment file: a dated list of platform traps, every one of which was stepped on at least once before it was written down. The host-specific entries do not transfer; the *patterns* do. Each pattern below is a problem shape plus a one-line countermeasure.

### Shells and encoding

- **Two shells, one machine, incompatible dialects.** A native shell (in its legacy edition) and a POSIX-emulation shell coexist on the same host; chaining operators, reserved variable names, quoting rules, and default file encodings all differ, so a snippet that works in one silently corrupts in the other. Countermeasure: every delegated command names its target shell — never hand a command "to the machine".
- **Non-ASCII output dies silently on a legacy-codepage console.** Scripts crash with codec errors, or output renders as replacement-character noise that gets misdiagnosed as program failure — and the program gets pointlessly re-run. Countermeasure: force UTF-8 explicitly at process start, gate pass/fail on plain ASCII markers only, and treat garbled display as a rendering problem until a read-back of the file's actual bytes says otherwise.
- **Error-suppression flags that do not suppress failure.** The shell option silences the error *message*, but the exit code still reports failure, so "quiet" runs keep tripping automation. Countermeasure: distinguish quiet from non-fatal, and use the construct that genuinely swallows the error when non-fatal is what you meant.
- **Default output encodings that other tools cannot read.** The native shell writes files in an encoding the rest of the toolchain chokes on. Countermeasure: pass the encoding flag explicitly on any file another tool will consume.

*Expiry: on your next OS or shell change.*

### Processes and filesystems

- **Orphaned background listeners block the next run.** A restart fails to bind its port because the previous background process never died. Countermeasure: kill listeners on the port before restarting any local service, and sweep your own background processes before ending a session.
- **cwd drift inside a compound command.** A directory change mid-command silently re-bases every later relative path in the same command. Countermeasure: use absolute paths inside compound commands, or change back before the next step.
- **Two filesystems' views of "temp".** The POSIX-emulation shell's temp directory is invisible to native programs, which resolve the same path string to a different location. Countermeasure: any temp file crossing a tool boundary uses a native path, never the emulation layer's.
- **Never assume a tool exists.** The host had several "obviously installed" tools missing. Countermeasure: probe with a version flag before first use — and verify generated artifacts by shape (magic bytes plus a minimum size), not by the absence of errors.

*Expiry: on your next machine or toolchain change.*

### Version control across environments

- **One repo, several writers.** The same repository is committed to from more than one environment — one of them driven by an external one-shot coding CLI (its role in the system: [skills/README.md](../skills/README.md)) — so an unpulled push loses the race. Countermeasure: pull before every push in any repo with a second writer.
- **Identity is per-clone, not assumed.** Global committer identity is deliberately unset on the host; a fresh clone fails to commit until identity is configured locally. Countermeasure: set per-repo identity as part of creating any new repo.
- **Warning floods drown real output.** Line-ending conversion warnings scroll the actual result off screen. Countermeasure: suppress to the last few lines, or turn conversion off in fresh repos.

*Expiry: whenever your environment topology (who writes to which repo) changes.*

### The agent harness itself

- **Silent registration skips.** An agent whose metadata description exceeds a hard length cap — or whose unquoted YAML string contains a colon followed by a space — is skipped at registration with no error message; it is simply absent. This one was misdiagnosed twice before the real cause was isolated. Countermeasure: when an agent cannot be called, audit its metadata (length, quoting) before suspecting anything deeper.
- **Mirror latency is asymmetric.** Newly *added* components only register on the next session, while edits to *existing* components are read live at dispatch time. Countermeasure: know which class your change is, so you neither debug a non-bug ("why can't I call the new agent") nor wait for a restart you don't need.
- **Capability parameters live in specific places.** Some knobs exist only in certain invocation layers and are silently ignored elsewhere. Countermeasure: verify where a parameter is actually honored instead of assuming the same option surface everywhere.

*Expiry: on every harness update — this subsection rots fastest of all.*

## The model routing table (a deliberately perishable artifact)

The host's dispatch rules open with a model routing table — a market-rate sheet for AI labor. Its columns:

| Column | What it holds |
|---|---|
| Dispatch parameter value | the literal string you pass when delegating |
| Model identity | which actual model that string resolves to *in this generation* |
| Tier positioning | fast-and-cheap / mid-tier workhorse / strong / strongest |
| What to route there | the classes of work that tier earns its price on |

Alongside the table sit rules that only make sense relative to it: an external one-shot coding CLI registered as an executor *outside* the tier parameter scheme; "omitting the parameter inherits the caller's model" — with the corollary that when the main loop runs on the top tier, every delegation must explicitly name a cheaper tier, or default inheritance quietly runs grunt work on the most expensive model; and an escalation ladder (cheap tier fails once, go up; mid tier fails twice, run a direction check before going up; top tier stuck two rounds, stop and ask a human) whose rungs are the table's rows.

A fictional row, to show the shape:

| Dispatch value | Model identity | Tier | Route here |
|---|---|---|---|
| `cheap-fast` | `vendor-mini` (current generation) | fast, cheap | mechanical batches, format conversion, apply-a-written-spec work — escalate after one failure, never let this tier retry the same problem |

This table is *designed* to rot: the model-identity column is stamped with a generation that lasts months, and the tier boundaries move every time a vendor ships. The system's answer is not to pretend otherwise but to wire the rot to its own cleanup: a model-generation change is a listed §0 trigger in **two** audit mechanisms — [rule-audit](../mechanisms/rule-audit.md) re-checks whether the routes are still *true*, and [standing-cost](../mechanisms/standing-cost.md) re-checks whether the fixed payload is still *worth its weight*. A stale market-rate sheet is not a failure of the system; failing to notice it went stale would be.

*Expiry: every model generation.*

---

Provenance: distilled from the host system's environment file — every trap listed was stepped on at least once, dated in the original. Host-specific facts (OS builds, paths, versions) removed by policy: they are fingerprints, and they'd be stale by the time you read them anyway. Durability: low by design — that is the point of this layer.

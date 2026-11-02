# VENDOR-NOTE — drawio-skill (vendored copy, agent-os engine)

> 備註(中):這是 vendor 進引擎的第三方 skill。固定版本自己養,不追上游、不走 `npx skills add`。

- **Source:** https://github.com/Agents365-ai/drawio-skill — `skills/drawio-skill/` subtree
- **Pinned commit:** `00ed825c4aec623a5838a16d1ad6b7a2c603dfa6` (2026-06-04)
- **License:** MIT (LICENSE in upstream repo root)
- **Vendored:** 2026-06-12 · decision **D032** (engine DECISIONS.md)

## Security review (2026-06-12, line-by-line + pattern scan; independent tool-launch-filter PASS 4H/1M)

- SKILL.md instructions: clean — no prompt injection, no data-exfil demands. ✅
- All 12 scripts pattern-scanned (network/subprocess/eval/base64/writes): no eval/exec; subprocess = Graphviz `dot`/`tred` fixed-argv only; writes = user-specified output only. ✅
- `validate.py` + `repair_png.py` read line-by-line (they get EXECUTED by the workflow): pure local. ✅
- `aiicons.py`: hardcoded public CDNs (lobehub / cdn.simpleicons.org); downloads logos only, uploads nothing. ⚠️ render-time CDN unless `--embed`.
- `encode_drawio_url.py`: pure URL encoding, zero network in-script; diagram content does enter a third-party page's client-side JS if the URL is opened. ⚠️
- `data/shape-index.json.gz`: gunzip-verified = pure shape-style JSON data. ✅

## House rules (operator / agent-os) — these override upstream SKILL.md where they conflict

1. **Local-first delivery:** default deliverable = `.drawio` XML (+ PNG only if draw.io desktop is installed). **Do NOT use `encode_drawio_url.py` / diagrams.net URLs for any internal/system content** — only ever for public-shareable diagrams, and only on explicit user request.
2. **`aiicons.py` only with `--embed`** (no render-time CDN dependency in committed diagrams).
3. **Always run `scripts/validate.py` as a gate** after generating/editing a `.drawio` (fits D031: deterministic gate, not AI self-eval). On this machine use `python` (3.13); `python3` also resolves.
4. **Trigger trimmed (this copy):** description rewritten to explicit-request-only — the upstream "use proactively when explaining systems with 3+ components" clause was removed as routing noise (tool-launch-filter recommendation).
5. draw.io desktop is NOT currently installed on this machine → PNG/SVG export unavailable; open `.drawio` with the VS Code extension (`hediet.vscode-drawio`) or install draw.io desktop from https://github.com/jgraph/drawio-desktop/releases.

## Diff against upstream

- `SKILL.md` frontmatter `description` (trimmed trigger) — only intentional change.
- `VENDOR-NOTE.md` (this file) — added.
- Everything else byte-identical to the pinned commit.

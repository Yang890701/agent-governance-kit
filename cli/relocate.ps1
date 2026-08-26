#Requires -Version 5.1
<#
.SYNOPSIS
    搬家重指路 (relocate) — after moving/renaming the kit root, re-point every
    absolute path that the old root left behind. Dry-run by default; -Apply to write.

.DESCRIPTION
    The engine wires hooks by ABSOLUTE path (e.g. `node <root>/agent-os/hooks/*.js`)
    into every installed project's .claude/settings.json, and the repo's own scripts/docs
    also carry the root. Moving or renaming the root therefore breaks every project.
    This script is the D048 "portable insurance" fix: run it once from the NEW location
    and it rewrites <old root> -> <new root> (both / and \ forms, case-insensitive) in:

      1. Every installed project's .claude/settings.json + settings.local.json
         (projects auto-discovered by decoding ~/.claude/projects folder names,
          plus any -ProjectRoots you pass explicitly)
      2. The global ~/.claude/settings.json + settings.local.json
      3. Every text file inside the moved tree itself (install.ps1 / sync.ps1 /
         skeleton settings / docs...), excluding .git, node_modules and snapshots/

    RUNBOOK (the whole procedure):
      0. Close all Claude Code sessions. Move or rename the root folder itself
         (e.g. <old-root> -> <new-root>) with Explorer / Move-Item.
      1. Dry-run from the NEW location and read the plan:
             & <new-root>\agent-os\cli\relocate.ps1
      2. Apply:
             & <new-root>\agent-os\cli\relocate.ps1 -Apply
         (settings files outside the tree get a .relocate-bak-<stamp> backup;
          files inside the tree rely on git as the backup)
      3. Review the tree diff and commit it as one 搬家 commit:  git -C <new-root> diff
         ⚠️ The repo is shared with another environment via git — coordinate before push.
      4. Re-mirror + health-check:  & <new-root>\sync.ps1   (or at least run
         node <new-root>\agent-os\cli\doctor.js)
      5. Optional: rename ~/.claude/projects/<encoded-old-path> dirs (the script
         prints the exact Rename-Item commands) so Claude's per-project auto-memory
         follows the move. Skip = old memories simply stay under the old key.
      6. Reopen Claude Code — hooks load at session start, so the fix is live from
         the next session.

.PARAMETER OldRoot
    The root everything still points at. Default: auto-detected from the hook line in
    agent-os-template/skeleton/.claude/settings.json (which still carries the old path
    right after a move).

.PARAMETER NewRoot
    The root to point everything at. Default: derived from this script's own location
    (<NewRoot>\agent-os\cli\relocate.ps1). Pass explicitly only for a pre-move preview.

.PARAMETER ProjectRoots
    Extra project folders to check, for projects never opened in Claude Code
    (auto-discovery only sees ~/.claude/projects entries).

.PARAMETER Apply
    Actually write. Without it the script only prints what it WOULD change.

.PARAMETER IncludeSnapshots
    Also rewrite hook-generated snapshot copies inside the tree (default: skipped —
    they are historical backups, never executed).

.EXAMPLE
    & <new-root>\agent-os\cli\relocate.ps1
    # dry-run after moving <old-root> to <new-root> — prints the full plan, writes nothing

.EXAMPLE
    & <new-root>\agent-os\cli\relocate.ps1 -Apply

.EXAMPLE
    & <old-root>\agent-os\cli\relocate.ps1 -NewRoot '<new-root>'
    # pre-move preview: shows what a future move would have to touch

.NOTES
    備註(中):搬家重指路。整套系統的 hook 都用絕對路徑接線,搬資料夾=全部斷線。
    這支腳本在「搬完之後」從新位置跑一次:自動偵測舊根、找出所有裝過的專案,
    把 settings.json 和引擎樹裡的舊路徑批次改成新路徑。預設只演習(dry-run),
    加 -Apply 才真的動手;動手前 settings 都留備份,引擎樹靠 git 當備份。
    出處:DECISIONS D048(F1 裁決,2026-08-20)。設計依據 D036:路徑一律從所在
    位置推導,本腳本自身零寫死路徑。
#>

[CmdletBinding()]
param(
    [string]$OldRoot = '',
    [string]$NewRoot = '',
    [string[]]$ProjectRoots = @(),
    [switch]$Apply,
    [switch]$IncludeSnapshots
)

$ErrorActionPreference = 'Stop'

# ============ resolve roots (zero hardcoded paths — D036) ============

# this script lives at <TreeRoot>\agent-os\cli\relocate.ps1
$TreeRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))

$sentinel = Join-Path $TreeRoot 'agent-os\hooks\session-start.js'
if (-not (Test-Path $sentinel)) {
    throw "Tree root derived as '$TreeRoot' but '$sentinel' is missing — this script must run from <root>\agent-os\cli\ inside the moved tree."
}

if (-not $NewRoot) { $NewRoot = $TreeRoot }
$NewRoot = $NewRoot.TrimEnd('\', '/')

if (-not $OldRoot) {
    $skeletonSettings = Join-Path $TreeRoot 'agent-os-template\skeleton\.claude\settings.json'
    if (-not (Test-Path $skeletonSettings)) {
        throw "Cannot auto-detect OldRoot: '$skeletonSettings' not found. Pass -OldRoot explicitly."
    }
    $m = [regex]::Match((Get-Content $skeletonSettings -Raw), 'node\s+(.+?)/agent-os/hooks/session-start\.js')
    if (-not $m.Success) {
        throw "Cannot auto-detect OldRoot: no hook line found in skeleton settings. Pass -OldRoot explicitly."
    }
    $OldRoot = $m.Groups[1].Value -replace '/', '\'
}
$OldRoot = $OldRoot.TrimEnd('\', '/')

if ($OldRoot -ieq $NewRoot) {
    Write-Host "OldRoot and NewRoot are both '$NewRoot' — nothing to re-point. (Pass -NewRoot for a pre-move preview.)"
    exit 0
}
if ($OldRoot -notmatch '^[A-Za-z]:\\') { throw "OldRoot '$OldRoot' does not look like a rooted Windows path." }

# unified matcher: root segments joined by ANY run of / or \ — also catches the
# JSON-escaped forms (X:\\old-root, X:\\\\old-root) that settings.local.json is full of.
# Trailing boundary blocks longer names (X:\old-root-foo, X:\old-rootX). The first
# separator run's style is captured and reused when rebuilding the new root, so a
# JSON-escaped context keeps its escaping depth.
$oldSegs = @($OldRoot -split '\\+')
$script:newSegs = @(($NewRoot -replace '/', '\') -split '\\+')
$escSegs = @($oldSegs | ForEach-Object { [regex]::Escape($_) })
$RootPattern = $escSegs[0]
for ($i = 1; $i -lt $escSegs.Count; $i++) {
    if ($i -eq 1) { $RootPattern += '([\\/]+)' } else { $RootPattern += '(?:[\\/]+)' }
    $RootPattern += $escSegs[$i]
}
$RootPattern += '(?![A-Za-z0-9_.-])'
$RootEvaluator = [System.Text.RegularExpressions.MatchEvaluator]{
    param($m)
    $sep = $m.Groups[1].Value
    if (-not $sep) { $sep = '\' }
    return ($script:newSegs -join $sep)
}

$mode = 'DRY-RUN (no files will be written; add -Apply to execute)'
if ($Apply) { $mode = 'APPLY' }
Write-Host "agent-os relocate — 搬家重指路"
Write-Host "  Old root : $OldRoot  (matches all / \ and JSON-escaped \\ forms)"
Write-Host "  New root : $NewRoot"
Write-Host "  Tree     : $TreeRoot"
Write-Host "  Mode     : $mode"
Write-Host ""

# ============ helpers ============

function Count-RootRefs([string]$text) {
    return [regex]::Matches($text, $RootPattern, 'IgnoreCase').Count
}

function Convert-RootRefs([string]$text) {
    return [regex]::Replace($text, $RootPattern, $RootEvaluator, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
}

# BOM-aware UTF-8 read/write: preserve exactly the BOM state each file already has
# (ps1 files here need their BOM — see README §7 / memory/universal)
function Read-TextFile([string]$path) {
    $bytes = [System.IO.File]::ReadAllBytes($path)
    if ($bytes.Length -ge 2 -and (($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) -or ($bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF))) {
        return $null  # UTF-16 — not expected in these trees; caller reports it for manual handling
    }
    $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
    $enc = New-Object System.Text.UTF8Encoding($hasBom)
    if ($hasBom) { $text = $enc.GetString($bytes, 3, $bytes.Length - 3) }
    else         { $text = $enc.GetString($bytes) }
    return @{ Text = $text; Encoding = $enc }
}

# decode a ~/.claude/projects folder name (e.g. "D--my-root-agent-os") back to real path
# candidates; '-' is ambiguous ('\' vs literal '-'), so enumerate and keep what exists
function Get-DecodedCandidates([string]$encoded) {
    $m = [regex]::Match($encoded, '^([A-Za-z])--(.+)$')
    if (-not $m.Success) { return , @() }
    $drive = $m.Groups[1].Value + ':\'
    $tokens = $m.Groups[2].Value -split '-'
    $slots = $tokens.Count - 1
    if ($slots -gt 12) { return , @() }  # 2^12 cap; wider names go to the manual-check list
    $found = New-Object System.Collections.Generic.List[string]
    $comboCount = [int][math]::Pow(2, $slots)
    for ($mask = 0; $mask -lt $comboCount; $mask++) {
        $p = $tokens[0]
        for ($i = 0; $i -lt $slots; $i++) {
            if (($mask -band (1 -shl $i)) -ne 0) { $p += '\' } else { $p += '-' }
            $p += $tokens[$i + 1]
        }
        $full = $drive + $p
        if (Test-Path -LiteralPath $full -PathType Container) {
            $found.Add((Resolve-Path -LiteralPath $full).Path.TrimEnd('\'))
        }
    }
    return , @($found | Select-Object -Unique)
}

$plan = New-Object System.Collections.Generic.List[object]
function Add-Target([string]$path, [string]$kind, [bool]$backup) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return }
    $r = Read-TextFile $path
    if ($null -eq $r) {
        Write-Host "  [SKIP] UTF-16 file needs manual edit: $path"
        return
    }
    $hits = Count-RootRefs $r.Text
    if ($hits -eq 0) { return }
    $plan.Add([pscustomobject]@{ Path = $path; Kind = $kind; Hits = $hits; Backup = $backup; Read = $r })
}

# ============ 1. discover installed projects ============

Write-Host "[1/4] Discovering installed projects..."
$candidateRoots = New-Object System.Collections.Generic.List[string]
foreach ($p in $ProjectRoots) {
    if (Test-Path -LiteralPath $p -PathType Container) {
        $candidateRoots.Add((Resolve-Path -LiteralPath $p).Path.TrimEnd('\'))
    } else {
        Write-Host "  [WARN] -ProjectRoots entry not found, skipping: $p"
    }
}

$undecoded = New-Object System.Collections.Generic.List[string]
$projectsDir = Join-Path $env:USERPROFILE '.claude\projects'
if (Test-Path $projectsDir) {
    foreach ($d in (Get-ChildItem $projectsDir -Directory)) {
        $cands = Get-DecodedCandidates $d.Name
        if ($cands.Count -eq 0) { $undecoded.Add($d.Name); continue }
        foreach ($c in $cands) { $candidateRoots.Add($c) }
    }
}

# unique; drop anything inside the tree (tree files are handled by the tree sweep)
$projectRootsFinal = @($candidateRoots | Select-Object -Unique | Where-Object {
    -not ($_ + '\').StartsWith($TreeRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)
})
Write-Host ("  {0} candidate project root(s) outside the tree; {1} undecodable projects-dir name(s)." -f $projectRootsFinal.Count, $undecoded.Count)

foreach ($root in $projectRootsFinal) {
    Add-Target (Join-Path $root '.claude\settings.json')       'project-settings' $true
    Add-Target (Join-Path $root '.claude\settings.local.json') 'project-settings' $true
}
Add-Target (Join-Path $env:USERPROFILE '.claude\settings.json')       'global-settings' $true
Add-Target (Join-Path $env:USERPROFILE '.claude\settings.local.json') 'global-settings' $true

# ============ 2. sweep the tree itself ============

Write-Host "[2/4] Scanning the tree for old-root references..."
$textExt = @('.md', '.json', '.ps1', '.js', '.mjs', '.cjs', '.txt', '.yml', '.yaml', '.svg', '.drawio', '.html', '.css', '.ts')
$extraNames = @('.gitignore', '.gitattributes')
$excludePattern = '\\(\.git|node_modules)(\\|$)'
if (-not $IncludeSnapshots) { $excludePattern = '\\(\.git|node_modules|snapshots)(\\|$)' }

foreach ($f in (Get-ChildItem $TreeRoot -Recurse -File -Force -ErrorAction SilentlyContinue)) {
    if ($f.FullName -match $excludePattern) { continue }
    if ($f.Name -like '*.relocate-bak-*') { continue }
    if ($f.Length -gt 5MB) { continue }
    if (($textExt -notcontains $f.Extension.ToLower()) -and ($extraNames -notcontains $f.Name)) { continue }
    Add-Target $f.FullName 'tree' $false
}

# ============ 3. report the plan / apply ============

Write-Host "[3/4] Plan:"
if ($plan.Count -eq 0) {
    Write-Host "  Nothing references '$OldRoot' — already clean."
} else {
    foreach ($t in ($plan | Sort-Object Kind, Path)) {
        Write-Host ("  [{0}] {1} ref(s): {2}" -f $t.Kind, $t.Hits, $t.Path)
    }
    $totalHits = ($plan | Measure-Object -Property Hits -Sum).Sum
    Write-Host ("  TOTAL: {0} file(s), {1} reference(s)." -f $plan.Count, $totalHits)
}

$applied = 0
if ($Apply -and $plan.Count -gt 0) {
    Write-Host ""
    Write-Host "  Applying..."
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    foreach ($t in $plan) {
        if ($t.Backup) {
            Copy-Item -LiteralPath $t.Path -Destination ($t.Path + '.relocate-bak-' + $stamp) -Force
        }
        $newText = Convert-RootRefs $t.Read.Text
        [System.IO.File]::WriteAllText($t.Path, $newText, $t.Read.Encoding)
        $applied++
    }
    Write-Host ("  OK rewrote {0} file(s). Settings backups: *.relocate-bak-{1} (delete after verifying)." -f $applied, $stamp)
}

# ============ 4. verify + leftovers ============

Write-Host "[4/4] Verification / leftovers:"
if ($Apply) {
    $remaining = 0
    foreach ($t in $plan) {
        $r2 = Read-TextFile $t.Path
        if ($null -ne $r2) { $remaining += Count-RootRefs $r2.Text }
    }
    if ($remaining -eq 0) {
        Write-Host "  OK re-scan of all rewritten files: 0 old-root references remain."
    } else {
        Write-Host "  [FAIL] $remaining old-root reference(s) still present after rewrite — inspect manually."
    }
}

# Claude per-project auto-memory lives under ~/.claude/projects/<encoded-path>;
# renaming those dirs carries the memories to the new key (optional, report-only)
$oldEnc = ($OldRoot -replace '[^A-Za-z0-9]', '-')
$newEnc = ($NewRoot -replace '[^A-Za-z0-9]', '-')
if (Test-Path $projectsDir) {
    $encDirs = @(Get-ChildItem $projectsDir -Directory | Where-Object { $_.Name -like ($oldEnc + '*') })
    if ($encDirs.Count -gt 0) {
        Write-Host "  Claude auto-memory dirs still keyed to the old path (optional manual rename):"
        foreach ($d in $encDirs) {
            $newName = $newEnc + $d.Name.Substring($oldEnc.Length)
            Write-Host ("    Rename-Item '{0}' '{1}'" -f $d.FullName, $newName)
        }
    }
}
if ($undecoded.Count -gt 0) {
    Write-Host "  Projects-dir names I could not decode — check their settings.json by hand:"
    foreach ($u in $undecoded) { Write-Host "    $u" }
}

Write-Host ""
if ($Apply) {
    Write-Host "Next steps: 1) git -C `"$NewRoot`" diff → review + commit the 搬家 diff (repo is shared — coordinate before push)"
    Write-Host "            2) & `"$NewRoot\sync.ps1`"  (re-mirror agents/commands/skills + doctor)"
    Write-Host "            3) reopen Claude Code sessions (hooks load at session start)"
} else {
    Write-Host "Dry-run complete. Re-run with -Apply to execute."
}

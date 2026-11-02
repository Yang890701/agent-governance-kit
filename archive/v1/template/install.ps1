#Requires -Version 5.1
<#
.SYNOPSIS
    Install agent-os data skeleton into a project + mirror bundled kit parts to ~/.claude/.

.DESCRIPTION
    Per the engine/data split:
    - The engine (this kit) is shared at the repo root, never copied per project
    - Data lives at <project>/.claude/agent-os/ (per project, scaffolded by this script)
    - Kit agents/, commands/, and skills/ are mirrored to ~/.claude/ for cross-project
      discovery — each only if it actually ships with this copy of the kit

.PARAMETER TargetPath
    Project root where data skeleton + settings.json get installed.
    Defaults to current directory.

.EXAMPLE
    cd C:\path\to\my-new-project
    & C:\path\to\agent-governance-kit\template\install.ps1

.EXAMPLE
    & C:\path\to\agent-governance-kit\template\install.ps1 -TargetPath C:\path\to\my-new-project

.NOTES
    備註(中):一鍵把 agent-os 接進新專案。引擎不複製,只放資料骨架 + 寫 settings.json;kit 有附 agents/commands/skills 才鏡到 ~/.claude/。
#>

[CmdletBinding()]
param(
    [string]$TargetPath = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

$TemplateRoot = Split-Path -Parent $PSCommandPath
$KitRoot      = Split-Path -Parent $TemplateRoot
$SkeletonRoot = Join-Path $TemplateRoot 'skeleton'

# === 1. Validate target ===
if (-not (Test-Path $TargetPath)) {
    throw "Target path not found: $TargetPath"
}
$TargetPath = (Resolve-Path $TargetPath).Path

$TargetData = Join-Path $TargetPath '.claude\agent-os'
if (Test-Path $TargetData) {
    throw "Target already has .claude/agent-os/ — refusing to overwrite: $TargetData"
}

# === 2. Validate skeleton (the only hard requirement — kit work-layer parts are optional) ===
if (-not (Test-Path (Join-Path $SkeletonRoot '.claude'))) {
    throw "Template skeleton missing — expected: $SkeletonRoot\.claude"
}

Write-Host "Installing agent-os into: $TargetPath"
Write-Host "  Kit:      $KitRoot"
Write-Host "  Template: $SkeletonRoot"
Write-Host ""

# === 3. Copy data skeleton into target ===
Write-Host "[1/3] Copying data skeleton..."
Copy-Item -Recurse -Force (Join-Path $SkeletonRoot '.claude') $TargetPath
Write-Host "  OK created $TargetPath\.claude\agent-os\"

# Wire bundled hooks into the project settings — only when all five ship with this copy of the kit.
# (The skeleton's settings.json is an empty {} placeholder; this generates the real wiring with
#  absolute paths into the kit, because Claude Code resolves hook commands from the project.)
$KitHooks  = Join-Path $KitRoot 'hooks'
$HookFiles = @('pre-tool-use.js', 'stop.js', 'session-start.js', 'session-end.js', 'post-tool-use.js')
$MissingHooks = @($HookFiles | Where-Object { -not (Test-Path (Join-Path $KitHooks $_)) })
if ((Test-Path $KitHooks) -and $MissingHooks.Count -eq 0) {
    $H = $KitHooks -replace '\\', '/'
    $SettingsJson = @"
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|PowerShell", "hooks": [ { "type": "command", "command": "node $H/pre-tool-use.js" } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "node $H/stop.js" } ] }
    ],
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "node $H/session-start.js" } ] }
    ],
    "SessionEnd": [
      { "hooks": [ { "type": "command", "command": "node $H/session-end.js" } ] }
    ],
    "PostToolUse": [
      { "matcher": "Edit", "hooks": [ { "type": "command", "command": "node $H/post-tool-use.js" } ] },
      { "matcher": "Write", "hooks": [ { "type": "command", "command": "node $H/post-tool-use.js" } ] }
    ]
  }
}
"@
    Set-Content -Path (Join-Path $TargetPath '.claude\settings.json') -Value $SettingsJson -Encoding ASCII
    Write-Host "  OK wired 5 hooks -> $TargetPath\.claude\settings.json (pointing at $KitHooks)"
} else {
    Write-Host "  (kit hooks/ not fully bundled — skeleton settings.json left without hook wiring / hooks 未隨 kit 出貨,骨架不接線)"
}

# === 4. Mirror kit agents + commands + skills to ~/.claude/ — each only if bundled ===
Write-Host ""
Write-Host "[2/3] Mirroring bundled kit parts to ~/.claude/..."

$MirroredAnything = $false

# Agents (kit agents/ -> ~/.claude/agents/) — README.md is a provenance card, never an agent definition
$KitAgents = Join-Path $KitRoot 'agents'
if (Test-Path $KitAgents) {
    $AgentFiles = @(Get-ChildItem $KitAgents -Filter '*.md' -File | Where-Object { $_.Name -ne 'README.md' })
    if ($AgentFiles.Count -gt 0) {
        $HomeAgents = Join-Path $env:USERPROFILE '.claude\agents'
        New-Item -ItemType Directory -Force $HomeAgents | Out-Null
        $AgentCount = 0
        $AgentFiles | ForEach-Object {
            Copy-Item -Force $_.FullName (Join-Path $HomeAgents $_.Name)
            $AgentCount++
        }
        Write-Host "  OK mirrored $AgentCount agent(s) -> $HomeAgents"
        $MirroredAnything = $true
    }
}

# Commands (kit commands/ -> ~/.claude/commands/) — same README rule as agents
$KitCommands = Join-Path $KitRoot 'commands'
if (Test-Path $KitCommands) {
    $CommandFiles = @(Get-ChildItem $KitCommands -Filter '*.md' -File | Where-Object { $_.Name -ne 'README.md' })
    if ($CommandFiles.Count -gt 0) {
        $HomeCommands = Join-Path $env:USERPROFILE '.claude\commands'
        New-Item -ItemType Directory -Force $HomeCommands | Out-Null
        $CommandCount = 0
        $CommandFiles | ForEach-Object {
            Copy-Item -Force $_.FullName (Join-Path $HomeCommands $_.Name)
            $CommandCount++
        }
        Write-Host "  OK mirrored $CommandCount slash command(s) -> $HomeCommands"
        $MirroredAnything = $true
    }
}

# Skills (kit skills/ -> ~/.claude/skills/) — mirrored only when skill folders actually ship
$KitSkills = Join-Path $KitRoot 'skills'
if (Test-Path $KitSkills) {
    $SkillDirs = @(Get-ChildItem $KitSkills -Directory)
    if ($SkillDirs.Count -gt 0) {
        $HomeSkills = Join-Path $env:USERPROFILE '.claude\skills'
        New-Item -ItemType Directory -Force $HomeSkills | Out-Null
        $SkillCount = 0
        $SkillDirs | ForEach-Object {
            # Remove existing dest first: Copy-Item -Recurse into an EXISTING dir nests (skill\skill) instead of overwriting
            $SkillDest = Join-Path $HomeSkills $_.Name
            if (Test-Path $SkillDest) { Remove-Item -Recurse -Force $SkillDest }
            Copy-Item -Recurse -Force $_.FullName $SkillDest
            $SkillCount++
        }
        Write-Host "  OK mirrored $SkillCount skill(s) -> $HomeSkills"
        $MirroredAnything = $true
    }
}

if (-not $MirroredAnything) {
    Write-Host "  (no agents/commands/skills bundled with this kit yet — skeleton install proceeds without them / 工作層零件尚未隨 kit 出貨,骨架照裝)"
}

# === 5. Report next steps ===
Write-Host ""
Write-Host "[3/3] Install complete."
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Edit $TargetPath\.claude\agent-os\PROJECT.md — fill in project name, intent, Hard Rules."
Write-Host "  2. Fill in $TargetPath\.claude\agent-os\ROADMAP.md with the Phase 1 plan."
Write-Host "  3. Open Claude Code at $TargetPath and start from PROJECT.md."
Write-Host ""
Write-Host "備註(中):資料骨架裝好。改 PROJECT.md + ROADMAP.md 填內容,然後在這個資料夾開 Claude Code。"

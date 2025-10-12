$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$MiniappDir = Join-Path (Join-Path $RootDir "apps") "miniapp"

if (-not (Test-Path $MiniappDir)) {
    Write-Error "Miniapp directory not found: $MiniappDir"
    exit 1
}

function Remove-Target {
    param([string]$Path)

    if (Test-Path $Path) {
        Remove-Item $Path -Recurse -Force
        Write-Host "Removed $Path"
    }
    else {
        Write-Host "Skip $Path (not found)"
    }
}

Remove-Target (Join-Path $MiniappDir "node_modules")
Remove-Target (Join-Path $MiniappDir "unpackage")

$lockFiles = @("pnpm-lock.yaml", "package-lock.json", "yarn.lock")
foreach ($lock in $lockFiles) {
    $lockPath = Join-Path $MiniappDir $lock
    if (Test-Path $lockPath) {
        Remove-Item $lockPath -Force
        Write-Host "Deleted $lockPath"
    }
}

Write-Host "Attempting to prune pnpm store (optional)..."
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if ($pnpm) {
    try {
        pnpm store prune | Out-Null
        Write-Host "pnpm store pruned"
    }
    catch {
        Write-Warning "pnpm store prune failed: $($_.Exception.Message)"
    }
}
else {
    Write-Host "pnpm not found, skipped pnpm store prune"
}

Write-Host "Cache clean complete."

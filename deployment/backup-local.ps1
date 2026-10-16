# Local backup for the Windows PC. Stops PostgreSQL, copies a consistent data
# directory, then starts it again when it was already running.
# Governance records and revision history are inside that database.
# Image replacements are the local equivalent of the wmc_images volume.

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$web = Join-Path $root "apps\web"
$pgCtl = Join-Path $web "node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl.exe"
$dataDir = Join-Path $web ".pgdata"
$imageDir = Join-Path $web "storage\images"
$stamp = Get-Date -Format "yyyyMMddTHHmmss"
$destRoot = Join-Path $env:USERPROFILE "WMC-Backups"
$dest = Join-Path $destRoot $stamp

function Test-PostgresListening {
  $lines = netstat -ano | Select-String ":5432\s+.*LISTENING"
  return [bool]$lines
}

function Copy-Tree([string]$Source, [string]$Destination, [string[]]$ExcludeDirs) {
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  $arguments = @($Source, $Destination, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NP", "/R:1", "/W:1")
  if ($ExcludeDirs.Count -gt 0) { $arguments += "/XD"; $arguments += $ExcludeDirs }
  & robocopy @arguments | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "Copy failed from $Source (robocopy $LASTEXITCODE)" }
}

if (-not (Test-Path $pgCtl)) { throw "PostgreSQL tools were not found. Run npm install in apps\web first." }
if (-not (Test-Path (Join-Path $dataDir "PG_VERSION"))) { throw "The local database has not been created yet." }

New-Item -ItemType Directory -Path $dest -Force | Out-Null
$wasRunning = Test-PostgresListening
if ($wasRunning) {
  & $pgCtl stop -D $dataDir -m fast -w -t 60
  if ($LASTEXITCODE -ne 0) { throw "PostgreSQL did not stop. The backup was not taken." }
  if (Test-PostgresListening) { throw "PostgreSQL is still running. The backup was not taken." }
}

try {
  Copy-Tree $dataDir (Join-Path $dest "database") @()
  $imagesCopied = $false
  if (Test-Path $imageDir) {
    Copy-Tree $imageDir (Join-Path $dest "images") @()
    $imagesCopied = $true
  }
  Copy-Tree $root (Join-Path $dest "source") @("node_modules", ".next", ".pgdata", "storage", "WMC-Backups")
}
finally {
  if ($wasRunning) {
    & $pgCtl start -D $dataDir -w -t 60
    if ($LASTEXITCODE -ne 0) { throw "The copy finished, but PostgreSQL did not start again." }
  }
}

$note = @"
Backup: $stamp
Database: apps\web\.pgdata
Images: $(if ($imagesCopied) { "apps\web\storage\images" } else { "none yet; published pictures are in source\apps\web\public" })
Governance and revision history: included in the database copy
Source: project files, including apps\web\.env, excluding node_modules, .next, and the database directory
"@
Set-Content -Path (Join-Path $dest "README.txt") -Value $note -Encoding utf8

Get-ChildItem $destRoot -Directory |
  Sort-Object Name -Descending |
  Select-Object -Skip 14 |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force }

Write-Output $dest

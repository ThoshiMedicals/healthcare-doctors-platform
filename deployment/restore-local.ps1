# Restores a backup created by backup-local.ps1.
# Replaces the local database. Add -IncludeSource to replace the project files as well.
# Stop the website before running this script.

param(
  [Parameter(Mandatory = $true)]
  [string]$Backup,
  [switch]$IncludeSource
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$web = Join-Path $root "apps\web"
$pgCtl = Join-Path $web "node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl.exe"
$dataDir = Join-Path $web ".pgdata"
$imageDir = Join-Path $web "storage\images"
$backup = (Resolve-Path $Backup).Path

function Test-PostgresListening {
  $lines = netstat -ano | Select-String ":5432\s+.*LISTENING"
  return [bool]$lines
}

function Copy-Tree([string]$Source, [string]$Destination) {
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  & robocopy $Source $Destination /E /NFL /NDL /NJH /NJS /NP /R:1 /W:1 | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "Copy failed from $Source (robocopy $LASTEXITCODE)" }
}

if (-not (Test-Path (Join-Path $backup "database\PG_VERSION"))) {
  throw "That folder is not a local backup. Expected database\PG_VERSION."
}
if (Test-PostgresListening) {
  & $pgCtl stop -D $dataDir -m fast -w -t 60
  if ($LASTEXITCODE -ne 0 -or (Test-PostgresListening)) { throw "Stop the website and PostgreSQL, then run the restore again." }
}

if (Test-Path $dataDir) { Remove-Item -LiteralPath $dataDir -Recurse -Force }
Copy-Tree (Join-Path $backup "database") $dataDir

if (Test-Path $imageDir) { Remove-Item -LiteralPath $imageDir -Recurse -Force }
$backedImages = Join-Path $backup "images"
if (Test-Path $backedImages) { Copy-Tree $backedImages $imageDir }

if ($IncludeSource) {
  Copy-Tree (Join-Path $backup "source") $root
}

& $pgCtl start -D $dataDir -w -t 60
if ($LASTEXITCODE -ne 0) { throw "The files were restored, but PostgreSQL did not start." }
Write-Output "Restored $backup"

# Clone nilbuild/developer-roadmap (roadmaps data only) for local plan generation.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Dest = Join-Path $Root "data\developer-roadmap"

if (Test-Path (Join-Path $Dest "src\data\roadmaps\mlops\mlops.json")) {
  Write-Host "Roadmaps already present at $Dest"
  exit 0
}

git clone --depth 1 --filter=blob:none --sparse https://github.com/nilbuild/developer-roadmap.git $Dest
Set-Location $Dest
git sparse-checkout set src/data/roadmaps
git sparse-checkout disable
git checkout HEAD -- src/data/roadmaps
Write-Host "Installed roadmap data under $Dest\src\data\roadmaps"

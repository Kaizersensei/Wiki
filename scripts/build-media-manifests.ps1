# Generates media.json manifests for all page media folders so galleries render.
# Usage: run from repo root
#   powershell -ExecutionPolicy Bypass -File scripts/build-media-manifests.ps1

$repoRoot = Convert-Path "."
$mediaRoot = Join-Path $repoRoot "pages/retraissance/densetsu/assets/media"
$extensions = @(".png",".jpg",".jpeg",".gif",".webp",".mp4",".webm",".ogg")

if (-not (Test-Path $mediaRoot)) {
  Write-Host "Media root not found: $mediaRoot" -ForegroundColor Red
  exit 1
}

$folders = Get-ChildItem -Path $mediaRoot -Recurse -Directory
foreach ($folder in $folders) {
  $files = Get-ChildItem -Path $folder.FullName -File | Where-Object { $extensions -contains $_.Extension.ToLower() }
  $manifestPath = Join-Path $folder.FullName "media.json"

  if (-not $files) {
    if (Test-Path $manifestPath) { Remove-Item $manifestPath }
    continue
  }

  $items = @()
  foreach ($f in $files | Sort-Object Name) {
    $items += [PSCustomObject]@{
      src = $f.Name
      title = ""
    }
  }

  $json = $items | ConvertTo-Json -Depth 3
  Set-Content -Path $manifestPath -Value $json -Encoding UTF8
  Write-Host "Wrote $($files.Count) entries to $manifestPath"
}

Write-Host "Done."

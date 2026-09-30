$ErrorActionPreference = 'Stop'
$path = 'c:\i\web-viewer\src\KonvaStoryViewer.tsx'
if (-not (Test-Path -LiteralPath $path)) { throw "File not found: $path" }

# Read file
$text = Get-Content -LiteralPath $path -Raw -Encoding UTF8

# 1) Fix misencoded glyphs
$text = $text -replace [regex]::Escape("âœ…"), "✅"
$text = $text -replace [regex]::Escape("ðŸ˜"), "😍"

# 2) Remove per-move slider submissions (only submit on release)
$text = [regex]::Replace($text, "handleWidgetClick\(w\.id,\s*'slider_set',\s*\{\s*value:\s*ratio\s*\}\s*\);\s*", "")
$text = [regex]::Replace($text, "handleWidgetClick\(w\.id,\s*'slider_set',\s*\{\s*value:\s*mid\s*\}\s*\);\s*", "")

# 3) Submit on release: replace onTrackUp body
$patternOnTrackUp = "const onTrackUp = \(\) => \{.*?\};"
$replacementOnTrackUp = "const onTrackUp = () => { try { sliderDragRef.current[w.id] = false; } catch {} const finalV = typeof sliderValues[w.id] === 'number' ? sliderValues[w.id] : 0.5; handleWidgetClick(w.id, 'slider_set', { value: finalV }); };"
$text = [regex]::Replace($text, $patternOnTrackUp, $replacementOnTrackUp, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Write back
Set-Content -LiteralPath $path -Value $text -Encoding UTF8
Write-Host "Patched $path successfully."

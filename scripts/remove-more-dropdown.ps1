$content = Get-Content "dashboard\src\App.jsx" -Raw
$lines = $content -split "`r`n"
$newLines = $lines[0..166] + $lines[224..($lines.Length - 1)]
$newContent = $newLines -join "`r`n"
Set-Content "dashboard\src\App.jsx" -Value $newContent -NoNewline
Write-Host "Removed lines 167-223"

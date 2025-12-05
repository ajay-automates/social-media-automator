$file = "services\scheduler.js"
$content = Get-Content $file -Raw

# Change 1: Update the destructuring to include count
$content = $content -replace '(\s+)const \{ error \} = await supabase\r?\n(\s+)\.from\(''posts''\)\r?\n(\s+)\.delete\(\)', '$1const { error, count } = await supabase$2.from(''posts'')$3.delete({ count: ''exact'' })'

# Change 2: Update the return statement to include count
$content = $content -replace 'return \{ success: true \};', 'return { success: true, count };'

# Write the updated content back
Set-Content -Path $file -Value $content -NoNewline
Write-Host "✅ Updated scheduler.js successfully"

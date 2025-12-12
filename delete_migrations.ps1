cd 'e:\A_Code\du-an-mau-k23-team\backend'

$appDirs = Get-ChildItem -Directory

foreach ($appDir in $appDirs) {
    $migrationsPath = Join-Path $appDir.FullName 'migrations'
    
    if (Test-Path $migrationsPath) {
        $files = Get-ChildItem $migrationsPath -Filter '*.py' -Exclude '__init__.py'
        
        foreach ($file in $files) {
            Remove-Item -Path $file.FullName -Force
            Write-Host "Deleted: $($file.FullName)"
        }
        
        if ($files.Count -gt 0) {
            Write-Host "Removed $($files.Count) migrations from $($appDir.Name)" -ForegroundColor Green
        }
    }
}

Write-Host "`nCompleted!" -ForegroundColor Yellow

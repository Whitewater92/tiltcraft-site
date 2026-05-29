$folder = "D:\website\tiltcraft\tiltcraft-site\images"
$files = Get-ChildItem -Path $folder | Where-Object { $_.Name -like "* - Copy*" }
foreach ($file in $files) {
    $newName = $file.Name -replace " - Copy", ""
    $newPath = Join-Path $folder $newName
    if (!(Test-Path $newPath)) {
        Rename-Item -Path $file.FullName -NewName $newName
        Write-Host "Hernoemd: $($file.Name) --> $newName" -ForegroundColor Green
    }
}
Read-Host "Klaar! Druk Enter"
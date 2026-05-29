$folder = "D:\website\tiltcraft\tiltcraft-site\images"
$files = Get-ChildItem -Path $folder | Where-Object { $_.Name -like "* - Copy*" }
if ($files.Count -eq 0) {
    Write-Host "Geen bestanden gevonden." -ForegroundColor Yellow
} else {
    foreach ($file in $files) {
        Remove-Item -Path $file.FullName
        Write-Host "Verwijderd: $($file.Name)" -ForegroundColor Green
    }
    Write-Host "Klaar!" -ForegroundColor Cyan
}
Read-Host "Druk Enter om te sluiten"
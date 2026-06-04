param(
    [string]$FirmwareDir = "firmware\samr21-inkbridge"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$firmwarePath = Join-Path $repoRoot $FirmwareDir

Push-Location $firmwarePath
try {
    powershell.exe -ExecutionPolicy Bypass -File .\build.ps1 -TestMode 4
}
finally {
    Pop-Location
}

$elf = Join-Path $firmwarePath "build\samr21-inkbridge.elf"
powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "samr21_flash_test.ps1") -Elf $elf

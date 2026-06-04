param(
    [string]$FirmwareDir = "firmware\samr21-inkbridge",
    [ValidateSet("A", "B")]
    [string]$Port = "A",
    [int]$Pin = 14,
    [ValidateSet(0, 1)]
    [int]$Level = 1
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$firmwarePath = Join-Path $repoRoot $FirmwareDir
$group = if ($Port -eq "A") { 0 } else { 1 }

Push-Location $firmwarePath
try {
    powershell.exe -ExecutionPolicy Bypass -File .\build.ps1 `
        -TestMode 2 `
        -HoldPortGroup $group `
        -HoldPin $Pin `
        -HoldLevel $Level
}
finally {
    Pop-Location
}

$elf = Join-Path $firmwarePath "build\samr21-inkbridge.elf"
powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "samr21_flash_test.ps1") -Elf $elf

param(
    [string]$FirmwareDir = "firmware\samr21-inkbridge",
    [int]$SckGroup = 0,
    [int]$SckPin = 13,
    [int]$MosiGroup = 0,
    [int]$MosiPin = 12,
    [int]$CsGroup = 0,
    [int]$CsPin = 14,
    [int]$Cs2Enable = 0,
    [int]$Cs2Group = 0,
    [int]$Cs2Pin = 23,
    [int]$DcGroup = 0,
    [int]$DcPin = 15,
    [int]$RstGroup = 0,
    [int]$RstPin = 20,
    [int]$BusyGroup = 0,
    [int]$BusyPin = 19,
    [int]$PwrEnable = 0,
    [int]$PwrGroup = 0,
    [int]$PwrPin = 28,
    [int]$PwrActiveHigh = 1
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$firmwarePath = Join-Path $repoRoot $FirmwareDir

Push-Location $firmwarePath
try {
    powershell.exe -ExecutionPolicy Bypass -File .\build.ps1 `
        -TestMode 3 `
        -EpdSckGroup $SckGroup `
        -EpdSckPin $SckPin `
        -EpdMosiGroup $MosiGroup `
        -EpdMosiPin $MosiPin `
        -EpdCsGroup $CsGroup `
        -EpdCsPin $CsPin `
        -EpdCs2Enable $Cs2Enable `
        -EpdCs2Group $Cs2Group `
        -EpdCs2Pin $Cs2Pin `
        -EpdDcGroup $DcGroup `
        -EpdDcPin $DcPin `
        -EpdRstGroup $RstGroup `
        -EpdRstPin $RstPin `
        -EpdBusyGroup $BusyGroup `
        -EpdBusyPin $BusyPin `
        -EpdPwrEnable $PwrEnable `
        -EpdPwrGroup $PwrGroup `
        -EpdPwrPin $PwrPin `
        -EpdPwrActiveHigh $PwrActiveHigh
}
finally {
    Pop-Location
}

$elf = Join-Path $firmwarePath "build\samr21-inkbridge.elf"
powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "samr21_flash_run.ps1") -Elf $elf

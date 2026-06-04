param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [string]$Image = "hardware_backups\samr21_tag_20260531_011139\factory_with_hook_0x36000.bin",
    [int]$Speed = 100
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$imagePath = Join-Path $repoRoot $Image
$imageOcdPath = $imagePath.Replace("\", "/")

& $OpenOcd `
    -s $Scripts `
    -f interface\stlink.cfg `
    -f target\at91samdXX.cfg `
    -c "adapter speed $Speed" `
    -c "init" `
    -c "reset halt" `
    -c "program {$imageOcdPath} verify reset" `
    -c "shutdown"

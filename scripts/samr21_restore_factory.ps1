param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [string]$Backup = "hardware_backups\samr21_tag_20260531_011139\factory_flash_0x00000000_256k.bin",
    [int]$Speed = 100
)

$ErrorActionPreference = "Stop"

if (!(Test-Path -LiteralPath $Backup)) {
    throw "Factory backup not found: $Backup"
}

$openOcdBackup = (Resolve-Path $Backup).Path.Replace("\", "/")

& $OpenOcd `
    -s $Scripts `
    -f interface\stlink.cfg `
    -f target\at91samdXX.cfg `
    -c "adapter speed $Speed" `
    -c "init" `
    -c "reset halt" `
    -c "program $openOcdBackup verify reset 0x00000000" `
    -c "reset run" `
    -c "shutdown"

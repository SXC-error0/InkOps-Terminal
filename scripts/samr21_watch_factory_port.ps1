param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [string]$Backup = "hardware_backups\samr21_tag_20260531_011139\factory_flash_0x00000000_256k.bin",
    [int]$Speed = 100,
    [int]$RunMs = 2000,
    [string]$Watch0 = "0x41004408",
    [string]$Watch1 = "0x41004488"
)

$ErrorActionPreference = "Stop"

$openOcdBackup = (Resolve-Path $Backup).Path.Replace("\", "/")

& $OpenOcd `
    -s $Scripts `
    -f interface\stlink.cfg `
    -f target\at91samdXX.cfg `
    -c "adapter speed $Speed" `
    -c "init" `
    -c "reset halt" `
    -c "program $openOcdBackup verify 0x00000000" `
    -c "reset halt" `
    -c "wp $Watch0 4 w" `
    -c "wp $Watch1 4 w" `
    -c "reset run" `
    -c "sleep $RunMs" `
    -c "halt" `
    -c "echo WATCH_RESULT" `
    -c "reg" `
    -c "echo PORTA_CORE" `
    -c "mdw 0x41004400 12" `
    -c "echo PORTB_CORE" `
    -c "mdw 0x41004480 12" `
    -c "rbp all" `
    -c "reset halt" `
    -c "shutdown"

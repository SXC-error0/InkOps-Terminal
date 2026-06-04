param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [string]$Elf = "firmware\samr21-inkbridge\build\samr21-inkbridge.elf",
    [int]$Speed = 100
)

$ErrorActionPreference = "Stop"

$openOcdElf = (Resolve-Path $Elf).Path.Replace("\", "/")

& $OpenOcd `
    -s $Scripts `
    -f interface\stlink.cfg `
    -f target\at91samdXX.cfg `
    -c "adapter speed $Speed" `
    -c "init" `
    -c "reset halt" `
    -c "program $openOcdElf verify reset" `
    -c "sleep 500" `
    -c "halt" `
    -c "mdw 0x20000000 4" `
    -c "reset run" `
    -c "shutdown"

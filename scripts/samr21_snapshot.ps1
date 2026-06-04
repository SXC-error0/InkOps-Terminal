param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [int]$Speed = 100,
    [int]$DelayMs = 1500
)

$ErrorActionPreference = "Stop"

& $OpenOcd `
    -s $Scripts `
    -f interface\stlink.cfg `
    -f target\at91samdXX.cfg `
    -c "adapter speed $Speed" `
    -c "init" `
    -c "reset run" `
    -c "sleep $DelayMs" `
    -c "halt" `
    -c "echo PORTA_CORE" `
    -c "mdw 0x41004400 12" `
    -c "echo PORTA_PMUX" `
    -c "mdb 0x41004430 16" `
    -c "echo PORTA_PINCFG" `
    -c "mdb 0x41004440 32" `
    -c "echo PORTB_CORE" `
    -c "mdw 0x41004480 12" `
    -c "echo PORTB_PMUX" `
    -c "mdb 0x410044B0 16" `
    -c "echo PORTB_PINCFG" `
    -c "mdb 0x410044C0 32" `
    -c "echo SERCOMS" `
    -c "mdw 0x42000800 4" `
    -c "mdw 0x42000C00 4" `
    -c "mdw 0x42001000 4" `
    -c "mdw 0x42001400 4" `
    -c "mdw 0x42001800 4" `
    -c "mdw 0x42001C00 4" `
    -c "reset run" `
    -c "shutdown"

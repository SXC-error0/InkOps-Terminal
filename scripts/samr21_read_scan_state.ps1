param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [int]$Speed = 100
)

$ErrorActionPreference = "Stop"

& $OpenOcd `
    -s $Scripts `
    -f interface\stlink.cfg `
    -f target\at91samdXX.cfg `
    -c "adapter speed $Speed" `
    -c "init" `
    -c "halt" `
    -c "echo SRAM_MARKERS" `
    -c "mdw 0x20000000 8" `
    -c "echo PORTA_CORE" `
    -c "mdw 0x41004400 8" `
    -c "echo PORTB_CORE" `
    -c "mdw 0x41004480 8" `
    -c "reset run" `
    -c "shutdown"

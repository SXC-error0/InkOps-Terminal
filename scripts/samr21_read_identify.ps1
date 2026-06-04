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
    -c "echo IDENTIFY_SRAM" `
    -c "mdw 0x20000000 12" `
    -c "echo PORTA_PINCFG_12_20" `
    -c "mdb 0x4100444C 9" `
    -c "echo PORTA_PINCFG_23_28" `
    -c "mdb 0x41004457 6" `
    -c "echo PORTB_PINCFG_15_23" `
    -c "mdb 0x410044CF 9" `
    -c "echo PORTB_PINCFG_31" `
    -c "mdb 0x410044DF 1" `
    -c "reset run" `
    -c "shutdown"

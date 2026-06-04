param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [int]$Speed = 100,
    [int]$FactoryBootMs = 3000,
    [int]$HookRunMs = 90000,
    [string]$HookPc = "0x00036001",
    [switch]$DumpDesc,
    [switch]$NoFinalReset
)

$ErrorActionPreference = "Stop"

$commands = @(
    "-s", $Scripts,
    "-f", "interface\stlink.cfg",
    "-f", "target\at91samdXX.cfg",
    "-c", "adapter speed $Speed",
    "-c", "init",
    "-c", "reset run",
    "-c", "sleep $FactoryBootMs",
    "-c", "halt",
    "-c", "reg pc $HookPc",
    "-c", "resume",
    "-c", "sleep $HookRunMs",
    "-c", "halt",
    "-c", "echo SRAM_MARKERS",
    "-c", "mdw 0x20000000 8"
)

if ($DumpDesc) {
    $commands += @(
        "-c", "echo SRAM_DESC",
        "-c", "mdw 0x20000020 72"
    )
}

if (-not $NoFinalReset) {
    $commands += @(
        "-c", "reset run"
    )
}

$commands += @(
    "-c", "shutdown"
)

& $OpenOcd @commands

param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [string]$OutputRoot = "hardware_backups",
    [int]$Speed = 100
)

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outDir = Join-Path $OutputRoot "samr21_tag_$stamp"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$openOcdOutDir = (Resolve-Path $outDir).Path.Replace("\", "/")

& $OpenOcd `
    -s $Scripts `
    -f interface\stlink.cfg `
    -f target\at91samdXX.cfg `
    -c "adapter speed $Speed" `
    -c "init" `
    -c "reset halt" `
    -c "dump_image $openOcdOutDir/factory_flash_0x00000000_256k.bin 0x00000000 0x40000" `
    -c "dump_image $openOcdOutDir/nvm_user_row_0x00804000_256b.bin 0x00804000 0x100" `
    -c "mdw 0x41002018 1" `
    -c "reset run" `
    -c "shutdown"

Get-FileHash -Algorithm SHA256 -Path `
    (Join-Path $outDir "factory_flash_0x00000000_256k.bin"), `
    (Join-Path $outDir "nvm_user_row_0x00804000_256b.bin") |
    Format-List Path,Hash

param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [string]$OutBin = "hardware_backups\samr21_tag_20260531_011139\factory_image_block_0x19c00.bin",
    [string]$Offset = "0x00019c00",
    [ValidateSet("bars", "checker", "white", "black")]
    [string]$Pattern = "checker",
    [int]$Speed = 100
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$outPath = Join-Path $repoRoot $OutBin
$bytes = New-Object byte[] 33600

for ($i = 0; $i -lt $bytes.Length; $i++) {
    if ($Pattern -eq "white") {
        $bytes[$i] = 0xff
    }
    elseif ($Pattern -eq "black") {
        $bytes[$i] = 0x00
    }
    elseif ($Pattern -eq "checker") {
        $block = [Math]::Floor($i / 64)
        $bytes[$i] = if (($block % 2) -eq 0) { 0x00 } else { 0xff }
    }
    else {
        $region = [Math]::Floor(($i * 4) / $bytes.Length)
        $bytes[$i] = @(0x00, 0xff, 0xaa, 0x55)[$region]
    }
}

New-Item -ItemType Directory -Force -Path (Split-Path $outPath) | Out-Null
[IO.File]::WriteAllBytes($outPath, $bytes)
$binForOpenOcd = $outPath.Replace("\", "/")

& $OpenOcd `
    -s $Scripts `
    -f interface\stlink.cfg `
    -f target\at91samdXX.cfg `
    -c "adapter speed $Speed" `
    -c "init" `
    -c "reset halt" `
    -c "flash write_image erase {$binForOpenOcd} $Offset bin" `
    -c "reset run" `
    -c "shutdown"

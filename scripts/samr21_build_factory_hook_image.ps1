param(
    [string]$Factory = "hardware_backups\samr21_tag_20260531_011139\factory_flash_0x00000000_256k.bin",
    [string]$HookDir = "firmware\samr21-factory-hook",
    [string]$Out = "hardware_backups\samr21_tag_20260531_011139\factory_with_hook_0x36000.bin",
    [int]$HookOffset = 0x36000,
    [int]$HookMode = 8,
    [int]$HookArg = 0
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$factoryPath = Join-Path $repoRoot $Factory
$hookPath = Join-Path $repoRoot $HookDir
$outPath = Join-Path $repoRoot $Out

Push-Location $hookPath
try {
    powershell.exe -ExecutionPolicy Bypass -File .\build.ps1 -HookMode $HookMode -HookArg $HookArg
}
finally {
    Pop-Location
}

$factoryBytes = [IO.File]::ReadAllBytes($factoryPath)
$hookBin = Join-Path $hookPath "build\samr21-factory-hook.bin"
$hookBytes = [IO.File]::ReadAllBytes($hookBin)

if (($HookOffset + $hookBytes.Length) -gt $factoryBytes.Length) {
    throw "Hook does not fit in factory image"
}

for ($i = 0; $i -lt $hookBytes.Length; $i++) {
    if ($factoryBytes[$HookOffset + $i] -ne 0xff) {
        throw ("Factory image is not blank at 0x{0:X}" -f ($HookOffset + $i))
    }
}

[Array]::Copy($hookBytes, 0, $factoryBytes, $HookOffset, $hookBytes.Length)
[IO.File]::WriteAllBytes($outPath, $factoryBytes)

Write-Host ("Hook size: {0} bytes" -f $hookBytes.Length)
Write-Host ("Output: {0}" -f $outPath)

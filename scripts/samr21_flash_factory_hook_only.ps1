param(
    [string]$OpenOcd = "E:\Install_packge\openocd\bin\openocd.exe",
    [string]$Scripts = "E:\Install_packge\openocd\openocd\scripts",
    [string]$HookDir = "firmware\samr21-factory-hook",
    [int]$HookMode = 8,
    [int]$HookArg = 0,
    [int]$HookDirect = 0,
    [int]$HookFrame = 0,
    [int]$HookFill = 255,
    [int]$HookColor = 0,
    [int]$HookColorFill = 255,
    [int]$HookPattern = 0,
    [int]$HookRaw = 0,
    [int]$HookRender = 0,
    [int]$HookRenderBoth = 0,
    [int]$HookPlane = 0,
    [int]$HookPixel = 0,
    [int]$HookPixelFlag = 0,
    [int]$HookFrameToColor = 0,
    [int]$HookInvertFrame = 0,
    [int]$HookDumpDesc = 0,
    [int]$HookBytes = 33600,
    [string]$HookOffset = "0x00036000",
    [int]$Speed = 100
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$hookPath = Join-Path $repoRoot $HookDir

Push-Location $hookPath
try {
    powershell.exe -ExecutionPolicy Bypass -File .\build.ps1 -HookMode $HookMode -HookArg $HookArg -HookDirect $HookDirect -HookFrame $HookFrame -HookFill $HookFill -HookColor $HookColor -HookColorFill $HookColorFill -HookPattern $HookPattern -HookRaw $HookRaw -HookRender $HookRender -HookRenderBoth $HookRenderBoth -HookPlane $HookPlane -HookPixel $HookPixel -HookPixelFlag $HookPixelFlag -HookFrameToColor $HookFrameToColor -HookInvertFrame $HookInvertFrame -HookDumpDesc $HookDumpDesc -HookBytes $HookBytes
    if ($LASTEXITCODE -ne 0) {
        throw "hook build failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

$hookBin = (Join-Path $hookPath "build\samr21-factory-hook.bin").Replace("\", "/")

& $OpenOcd `
    -s $Scripts `
    -f interface\stlink.cfg `
    -f target\at91samdXX.cfg `
    -c "adapter speed $Speed" `
    -c "init" `
    -c "reset halt" `
    -c "program {$hookBin} verify $HookOffset" `
    -c "reset run" `
    -c "shutdown"

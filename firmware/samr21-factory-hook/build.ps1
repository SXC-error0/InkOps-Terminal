param(
    [string]$Toolchain = "E:\Install_packge\Stm32\STM32CLT\STM32CubeCLT_1.18.0\GNU-tools-for-STM32\bin",
    [string]$Build = "build",
    [string]$Target = "samr21-factory-hook",
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
    [int]$HookBytes = 33600
)

$ErrorActionPreference = "Stop"

$cc = Join-Path $Toolchain "arm-none-eabi-gcc.exe"
$objcopy = Join-Path $Toolchain "arm-none-eabi-objcopy.exe"
$size = Join-Path $Toolchain "arm-none-eabi-size.exe"

New-Item -ItemType Directory -Force -Path $Build | Out-Null

& $cc `
    "-mcpu=cortex-m0plus" `
    "-mthumb" `
    "-Os" `
    "-ffunction-sections" `
    "-fdata-sections" `
    "-ffreestanding" `
    "-fno-builtin" `
    "-Wall" `
    "-Wextra" `
    "-Werror" `
    "-std=c11" `
    "-DHOOK_MODE=$HookMode" `
    "-DHOOK_ARG=$HookArg" `
    "-DHOOK_DIRECT=$HookDirect" `
    "-DHOOK_FRAME=$HookFrame" `
    "-DHOOK_FILL=$HookFill" `
    "-DHOOK_COLOR=$HookColor" `
    "-DHOOK_COLOR_FILL=$HookColorFill" `
    "-DHOOK_PATTERN=$HookPattern" `
    "-DHOOK_RAW=$HookRaw" `
    "-DHOOK_RENDER=$HookRender" `
    "-DHOOK_RENDER_BOTH=$HookRenderBoth" `
    "-DHOOK_PLANE=$HookPlane" `
    "-DHOOK_PIXEL=$HookPixel" `
    "-DHOOK_PIXEL_FLAG=$HookPixelFlag" `
    "-DHOOK_FRAME_TO_COLOR=$HookFrameToColor" `
    "-DHOOK_INVERT_FRAME=$HookInvertFrame" `
    "-DHOOK_DUMP_DESC=$HookDumpDesc" `
    "-DHOOK_BYTES=$HookBytes" `
    "-nostartfiles" `
    "-nostdlib" `
    "-Wl,--gc-sections" `
    "-Wl,-Map=$Build\$Target.map" `
    "-T" "linker.ld" `
    "hook.c" `
    "-o" "$Build\$Target.elf"
if ($LASTEXITCODE -ne 0) {
    throw "arm-none-eabi-gcc failed with exit code $LASTEXITCODE"
}

& $objcopy -O binary "$Build\$Target.elf" "$Build\$Target.bin"
if ($LASTEXITCODE -ne 0) {
    throw "arm-none-eabi-objcopy failed with exit code $LASTEXITCODE"
}
& $size "$Build\$Target.elf"

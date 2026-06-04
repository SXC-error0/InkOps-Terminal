param(
    [string]$Toolchain = "E:\Install_packge\Stm32\STM32CLT\STM32CubeCLT_1.18.0\GNU-tools-for-STM32\bin",
    [string]$Build = "build",
    [string]$Target = "samr21-inkbridge",
    [int]$ProbePin = -1,
    [int]$ProbePortGroup = 0,
    [int]$TestMode = 0,
    [int]$HoldPortGroup = 0,
    [int]$HoldPin = 14,
    [int]$HoldLevel = 1,
    [int]$EpdSckGroup = 0,
    [int]$EpdSckPin = 13,
    [int]$EpdMosiGroup = 0,
    [int]$EpdMosiPin = 12,
    [int]$EpdCsGroup = 0,
    [int]$EpdCsPin = 14,
    [int]$EpdCs2Enable = 0,
    [int]$EpdCs2Group = 0,
    [int]$EpdCs2Pin = 23,
    [int]$EpdDcGroup = 0,
    [int]$EpdDcPin = 15,
    [int]$EpdRstGroup = 0,
    [int]$EpdRstPin = 20,
    [int]$EpdBusyGroup = 0,
    [int]$EpdBusyPin = 19,
    [int]$EpdPwrEnable = 0,
    [int]$EpdPwrGroup = 0,
    [int]$EpdPwrPin = 28,
    [int]$EpdPwrActiveHigh = 1
)

$ErrorActionPreference = "Stop"

$cc = Join-Path $Toolchain "arm-none-eabi-gcc.exe"
$objcopy = Join-Path $Toolchain "arm-none-eabi-objcopy.exe"
$size = Join-Path $Toolchain "arm-none-eabi-size.exe"

New-Item -ItemType Directory -Force -Path $Build | Out-Null

$common = @(
    "-mcpu=cortex-m0plus",
    "-mthumb",
    "-Os",
    "-ffunction-sections",
    "-fdata-sections",
    "-Wall",
    "-Wextra",
    "-Werror",
    "-std=c11",
    "-DTEST_MODE=$TestMode",
    "-DPROBE_PIN=$ProbePin",
    "-DPROBE_PORT_GROUP=$ProbePortGroup",
    "-DHOLD_PORT_GROUP=$HoldPortGroup",
    "-DHOLD_PIN=$HoldPin",
    "-DHOLD_LEVEL=$HoldLevel",
    "-DEPD_SCK_GROUP=$EpdSckGroup",
    "-DEPD_SCK_PIN=$EpdSckPin",
    "-DEPD_MOSI_GROUP=$EpdMosiGroup",
    "-DEPD_MOSI_PIN=$EpdMosiPin",
    "-DEPD_CS_GROUP=$EpdCsGroup",
    "-DEPD_CS_PIN=$EpdCsPin",
    "-DEPD_CS2_ENABLE=$EpdCs2Enable",
    "-DEPD_CS2_GROUP=$EpdCs2Group",
    "-DEPD_CS2_PIN=$EpdCs2Pin",
    "-DEPD_DC_GROUP=$EpdDcGroup",
    "-DEPD_DC_PIN=$EpdDcPin",
    "-DEPD_RST_GROUP=$EpdRstGroup",
    "-DEPD_RST_PIN=$EpdRstPin",
    "-DEPD_BUSY_GROUP=$EpdBusyGroup",
    "-DEPD_BUSY_PIN=$EpdBusyPin",
    "-DEPD_PWR_ENABLE=$EpdPwrEnable",
    "-DEPD_PWR_GROUP=$EpdPwrGroup",
    "-DEPD_PWR_PIN=$EpdPwrPin",
    "-DEPD_PWR_ACTIVE_HIGH=$EpdPwrActiveHigh"
)

& $cc @common -c startup.c -o "$Build\startup.o"
& $cc @common -c main.c -o "$Build\main.o"
& $cc @common "$Build\startup.o" "$Build\main.o" `
    "-T" "linker.ld" `
    "-Wl,--gc-sections" `
    "-Wl,-Map=$Build\$Target.map" `
    "-nostartfiles" `
    "-nostdlib" `
    "-o" "$Build\$Target.elf"
& $objcopy -O binary "$Build\$Target.elf" "$Build\$Target.bin"
& $size "$Build\$Target.elf"

# InkOps Terminal SAMR21 ESL Development Handoff

本文档记录 LG Innotek 4.2 寸电子价签原 PCB 改造过程、当前进度、关键问题、工程代码路径、引脚接线、工具链命令和后续开发路线。目标是让下一位开发者可以在不重新踩坑的前提下继续开发。

当前项目根目录：

```text
E:\Project\Embedded_project\InkOps-Terminal
```

GitHub 仓库：

```text
https://github.com/SXC-error0/InkOps-Terminal
```

## 1. 项目目标

最终目标是在不更换原价签 PCB 的前提下，自定义 4.2 寸三色墨水屏显示内容，并让它成为 InkOps Command 桌面终端的实体显示出口。

阶段目标：

1. 保留原 PCB、原 ATSAMR21G18A MCU、原屏幕和电池。
2. 通过 SWD 备份并恢复原厂固件。
3. 在原厂固件后接管显示链路，尝试自定义刷新内容。
4. 逐步替换为自定义固件或稳定 hook 方案。
5. 后续接入上位机生成的 400 x 300 页面。

## 2. 硬件识别

价签外壳标签信息：

| 字段 | 值 |
| --- | --- |
| 品牌 | LG Innotek |
| 类型 | Electronic Shelf Label |
| 型号 | `REBE-TZ42B` |
| FCC ID | `YZP-REBETZ42B` |
| 额定供电 | `3V`, `100mA` |
| 制造商 | Suzhou Nihone Electronic Technology Co., LTD. |

PCB / 芯片信息：

| 项目 | 结果 |
| --- | --- |
| MCU | Atmel/Microchip `ATSAMR21G18A` |
| CPU | Cortex-M0+ |
| Flash | 256 KB |
| RAM | 32 KB |
| SWD DPIDR | `0x0bc11477` |
| DSU DID | `0x10010319` |
| 屏幕排线标识 | `WFT0420CZ15` |
| 屏幕尺寸推断 | 4.2 inch, 400 x 300 |
| 屏幕颜色 | 黑 / 白 / 红 三色 |

本地 FCC 内部照片 PDF：

```text
E:\Project\Embedded_project\InkOps-Terminal\3685916.pdf
```

该 PDF 当前不建议提交到仓库；仅作为本地硬件参考。

## 3. SWD 接线

板子测试点丝印：

```text
GND
SCLK
SDIO
MRES
UART_TX
UART_RX
BAT_IN
BUSY
D/C
RESET
CS
MOSI
CLK
```

已验证可用于 SWD 的测试点：

| 调试器信号 | 价签 PCB 测试点 |
| --- | --- |
| `GND` | `GND` |
| `SWCLK` | `SCLK` |
| `SWDIO` | `SDIO` |
| `NRST` / `RESET` | `MRES` |

ST-Link V2 接线：

| ST-Link V2 | 价签 PCB |
| --- | --- |
| `GND` | `GND` |
| `SWCLK` | `SCLK` |
| `SWDIO` | `SDIO` |
| `NRST` | `MRES` |

DAPLink 接线：

| DAPLink 标识 | 价签 PCB |
| --- | --- |
| `GND` | `GND` |
| `YCK/CK` | `SCLK` |
| `TMS/IO` | `SDIO` |
| `NRST` | `MRES` |

不要连接：

```text
TDI
TDO
UTX
URX
5V
```

供电原则：

1. 优先使用价签原电池供电。
2. ST-Link / DAPLink 只做调试器。
3. 不要接 `5V` 到价签。
4. 在电池已接入时，不要把调试器 `3V3` 直接接到 `BAT_IN`。
5. 如需使用 `3V3` 供电，必须先断开电池，并确认调试器 3.3V 电流能力。

## 4. 工具链

OpenOCD 路径：

```text
E:\Install_packge\openocd\bin\openocd.exe
E:\Install_packge\openocd\openocd\scripts
```

ARM GCC / objdump 路径：

```text
E:\Install_packge\Stm32\STM32CLT\STM32CubeCLT_1.18.0\GNU-tools-for-STM32\bin
```

常用 OpenOCD 目标脚本：

```text
interface\stlink.cfg
interface\cmsis-dap.cfg
target\at91samdXX.cfg
```

ST-Link 当前曾经可用的基础命令：

```powershell
E:\Install_packge\openocd\bin\openocd.exe `
  -s E:\Install_packge\openocd\openocd\scripts `
  -f interface\stlink.cfg `
  -f target\at91samdXX.cfg `
  -c "adapter speed 50" `
  -c "reset_config srst_only srst_nogate connect_assert_srst" `
  -c "init" `
  -c "halt" `
  -c "mdw 0x00000000 4" `
  -c "shutdown"
```

正常读到的向量表：

```text
0x00000000: 20002060 00000aa1 00000a9d 00000a9d
```

## 5. DAPLink 当前状态

用户新到货 DAPLink 接口丝印：

```text
TDI
TDO
NRST
UTX
URX
YCK/CK
GND
TMS/IO
3V3
5V
```

Windows 当前识别结果：

```text
USB VID/PID: 0D28:0204
Disk label: MAINTENANCE
Device: MBED VFS USB Device
```

`F:\DETAILS.TXT` 内容摘要：

```text
Daplink Mode: Bootloader
Bootloader Version: 0253
Interface Version: 0253
USB Interfaces: MSD
```

结论：

当前 DAPLink 处于 bootloader / maintenance 模式，只枚举 U 盘接口，没有枚举 CMSIS-DAP 调试接口。OpenOCD 报错：

```text
Error: unable to find a matching CMSIS-DAP device
```

下一步需要给 DAPLink 拖入正确 interface 固件，使它从 `MAINTENANCE` 模式回到正常 DAPLink 调试器模式。恢复正常后，OpenOCD 应该能通过：

```powershell
E:\Install_packge\openocd\bin\openocd.exe `
  -s E:\Install_packge\openocd\openocd\scripts `
  -f interface\cmsis-dap.cfg `
  -c "transport select swd" `
  -f target\at91samdXX.cfg `
  -c "adapter speed 100" `
  -c "init" `
  -c "halt" `
  -c "mdw 0x00000000 4" `
  -c "shutdown"
```

## 6. 原厂固件备份

备份目录：

```text
E:\Project\Embedded_project\InkOps-Terminal\hardware_backups\samr21_tag_20260531_011139
```

关键备份：

| 文件 | 用途 |
| --- | --- |
| `factory_flash_0x00000000_256k.bin` | 256 KB 原厂固件完整备份 |
| `nvm_user_row_0x00804000_256b.bin` | NVM user row |
| `factory_image_block_0x19c00.bin` | 原厂显示图像相关数据块 |

原厂完整固件 SHA256：

```text
C11B05F8F832581A88F10F25E44ECF46C6AB029505BCD04AB66A9A7A2D87BBE0
```

原厂 reset vector：

```text
initial_sp   = 0x20002060
reset_vector = 0x00000aa1
```

重要原则：

1. 不要提交 `hardware_backups/` 到 GitHub。
2. 每次 destructive flash 前确认备份存在。
3. 当前 `.gitignore` 已加入：

```text
hardware_backups/
firmware/**/build/
firmware/**/*.bin
firmware/**/*.elf
firmware/**/*.map
```

## 7. 工程代码路径

SAMR21 hook 固件：

```text
firmware/samr21-factory-hook/
```

关键文件：

| 文件 | 说明 |
| --- | --- |
| `firmware/samr21-factory-hook/hook.c` | 原厂固件 hook 入口、显示实验逻辑 |
| `firmware/samr21-factory-hook/linker.ld` | hook 链接地址，当前放置在 `0x00036000` |
| `firmware/samr21-factory-hook/build.ps1` | 编译 hook 镜像 |
| `firmware/samr21-factory-hook/generated_frame.inc` | 由脚本生成的 HELLO 测试图数据 |

SAMR21 脚本：

```text
scripts/
```

关键脚本：

| 文件 | 说明 |
| --- | --- |
| `scripts/samr21_backup.ps1` | 备份原厂 Flash / NVM |
| `scripts/samr21_restore_factory.ps1` | 恢复原厂固件 |
| `scripts/samr21_run_factory_hook.ps1` | 原厂启动后跳转 hook |
| `scripts/samr21_flash_factory_hook_only.ps1` | 只烧录 hook 区 |
| `scripts/samr21_flash_factory_with_hook.ps1` | 构建带 hook 的镜像 |
| `scripts/samr21_flash_factory_image_block.ps1` | 写回 `0x19c00` 图像块 |
| `scripts/samr21_generate_text_frame.ps1` | 生成文字测试帧 |
| `scripts/samr21_generate_hook_pattern.ps1` | 生成测试图案 |
| `scripts/samr21_snapshot.ps1` | 读取运行时寄存器快照 |
| `scripts/samr21_probe.ps1` | 探测目标 |

早期记录：

```text
docs/SAMR21_TAG_NOTES.md
```

本 handoff 是最终交接索引，应优先阅读。

## 8. Hook 区设计

安全 hook 地址：

```text
0x00036000
```

跳转入口：

```text
0x00036001
```

原因：

1. 原厂固件占用大部分 256 KB Flash。
2. 观察到 `0x36000-0x3F88E` 区域可用空间约 39 KB。
3. 当前 hook 大小约 33 KB。
4. 保持原厂 reset vector 不变，让原厂先初始化硬件，再手动跳到 hook。

hook 运行标记：

```text
0x20000000 = 0x484f4f4b  ; HOOK
0x20000004 = 0x46414354  ; FACT
0x20000008 = 0x00003600
0x20000010 = 1           ; hook started
0x20000010 = 2           ; hook finished main action
```

典型运行命令：

```powershell
E:\Install_packge\openocd\bin\openocd.exe `
  -s E:\Install_packge\openocd\openocd\scripts `
  -f interface\stlink.cfg `
  -f target\at91samdXX.cfg `
  -c "adapter speed 50" `
  -c "reset_config srst_only srst_nogate connect_assert_srst" `
  -c "init" `
  -c "reset run" `
  -c "sleep 20000" `
  -c "halt" `
  -c "reg pc 0x00036001" `
  -c "resume" `
  -c "sleep 120000" `
  -c "halt" `
  -c "mdw 0x20000000 8" `
  -c "shutdown"
```

## 9. 已定位的原厂函数

以下地址均来自 `factory_flash_0x00000000_256k.bin` 反汇编。Thumb 函数调用时地址需要 `| 1`。

| 地址 | 名称 / 作用推断 |
| --- | --- |
| `0x00000df0` | `FACTORY_PIN_INIT` |
| `0x00001484` | `FACTORY_PANEL_INIT` |
| `0x00001544` | `FACTORY_PANEL_INIT_2` |
| `0x000015f4` | `FACTORY_MODESET` |
| `0x00001a78` | `FACTORY_CMD` |
| `0x00001ac4` | `FACTORY_DATA` |
| `0x00001aa0` | `FACTORY_SELECT_RAM` |
| `0x00001b58` | `FACTORY_PIXEL` |
| `0x00001c00` | `FACTORY_RENDER` |
| `0x00001d0c` | 内置图像/索引渲染路径 |
| `0x00001ddc` | `FACTORY_DISPLAY`，包含电源时序与最终 `CMD 0x12` |
| `0x000021c0` | `FACTORY_GET_DESC` |
| `0x0000705c` | `FACTORY_SET_PIN` |
| `0x00016eb8` | malloc-like wrapper |
| `0x00016ecc` | free-like wrapper |
| `0x00016f42` | memset-like |
| `0x00016efe` | memcpy-like |
| `0x00016ee0` | memcmp-like |

注意：

反汇编 literal pool 需要按 32-bit little-endian 解码。例如：

```text
0x1ce8: 00016eb9
```

表示 Thumb 地址 `0x00016eb9`，不是 `0x00006eb9`。

## 10. 显示链路发现

真实 factory display descriptor 首次抓取：

```text
r0 = 0x20004ee0

0x20004ee0: 20000010 87050100 00019c00 00000828 ...
```

字段推断：

| 字段 | 值 |
| --- | --- |
| `desc_words[0]` | `0x20000010` |
| `desc[5]` | `1` |
| `desc[6]` | `5` |
| `desc[7]` | `0x87` |
| `desc_words[2]` | `0x00019c00` |
| `desc_words[3]` | `0x00000828` |

mode 5 描述符：

```text
02 00 34 00 32 00 2c 01 01 ff 00 00 2b 01 32 00 ff ff ...
```

推断：

| 偏移 | 含义 |
| --- | --- |
| `[desc+2] = 52` | 每行步进 52 字节 |
| `[desc+10] = 0` | inner start |
| `[desc+14] = 50` | inner end |
| `[desc+12] = 299` | outer start |
| `[desc+16] = -1` | outer end |
| `[desc+8] = 1` | inner step |
| `[desc+9] = -1` | outer step |

结论：

1. 屏幕真实分辨率应为 400 x 300。
2. 黑白平面一行有效数据 50 字节。
3. 原厂 render 描述符每行按 52 字节步进，存在 2 字节 padding。
4. `0x19c00` 的 factory image block 不是普通连续 1bpp framebuffer。

## 11. 已做实验与结论

### 11.1 原厂备份与恢复

已成功：

1. 备份 256 KB Flash。
2. 擦写后恢复原厂固件。
3. 恢复 `0x19c00` 原厂图像块。
4. 校验 readback diff 为 0。

### 11.2 自定义 inert 固件

早期自定义固件只写 RAM marker，不驱动屏幕，验证 MCU 可烧录运行。

观察到 marker：

```text
0x20000000: 314b4e49 524d4153 ...
```

### 11.3 Raw SPI-like 路径

尝试过：

```text
CMD 0x10 -> black plane data
CMD 0x13 -> red/color plane data
CMD 0x12 -> refresh
```

早期写入 33600 字节时，曾出现：

1. 全黑。
2. 半屏条纹。
3. 模糊 `HELLO`。
4. 红色条纹。
5. 黑底初始化页残影。

后续修正到 15000 字节后：

1. raw `HELLO` 没有改变屏幕。
2. raw 全黑也没有改变屏幕。

结论：

裸 `FACTORY_CMD/FACTORY_DATA` 当前不是稳定有效的自定义刷新路径。可能原因：

1. 供电/面板电源时序不完整。
2. 原厂函数依赖更多运行态状态。
3. 墨水屏控制器需要特定 LUT / VCOM / border / RAM window 初始化。
4. 早期 33600 字节越界写入造成的显示变化不能作为有效刷新证据。

### 11.4 Factory render 路径

尝试过：

1. 使用 `FACTORY_RENDER(mode=5, frame_data, plane=2)`。
2. plane 3 写白。
3. `frame_data` 按 400 x 300 生成。
4. `frame_data` 按 52 字节行步进生成。

结果：

屏幕仍保持白底初始化页。

当前新假设：

1. `frame_data` 位于 `0x360ec`，接近原厂特殊图片区 `0x36c00`。
2. 原厂 `0x3af4` 会对若干 flash bank 地址做重映射。
3. 因此 factory render 可能没有按普通指针读取 hook 区数据。

最新待验证方案：

1. hook 启动后把 `frame_data` 复制到 SRAM `0x20000020`。
2. `FACTORY_RENDER` 读取 SRAM 指针。
3. 避开原厂 flash bank 地址重映射。

该代码已经写入 `firmware/samr21-factory-hook/hook.c`，但由于 ST-Link 后续无法进入 MEM-AP，尚未完成烧录验证。

## 12. 当前阻塞问题

### 12.1 ST-Link V2 当前状态

ST-Link 本体正常枚举：

```text
ST-LINK FW: V2J46S7
```

目标电压能读到：

```text
Target voltage: ~3.21V
```

但 OpenOCD 当前经常报：

```text
SWD DPIDR 0x0bc11477
Could not find MEM-AP to control the core
Fail reading CTRL/STAT register
init mode failed
```

含义：

1. SWD 物理层不是完全断开，因为 DPIDR 偶尔可读。
2. 但核心调试访问 MEM-AP 无法稳定打开。
3. 可能是飞线接触、GND/SWDIO/SWCLK 波形、目标低功耗状态、RESET 时序或 ST-Link/SAMR21 兼容性问题。

已尝试：

1. `adapter speed 100/50/20/15/5`。
2. `connect_assert_srst`。
3. `reset_config none`。
4. `srst_push_pull`。
5. 断电重接。
6. 断开/接回 RESET。

仍未恢复稳定 MEM-AP。

### 12.2 DAPLink 当前状态

DAPLink 更适合 SAMR21，但当前 DAPLink 处于 bootloader 维护盘模式：

```text
Daplink Mode: Bootloader
USB Interfaces: MSD
```

OpenOCD 找不到 CMSIS-DAP：

```text
unable to find a matching CMSIS-DAP device
```

下一步必须先恢复 DAPLink interface 固件。

## 13. 下一步建议

优先级从高到低：

1. 修复 DAPLink，让它正常枚举 CMSIS-DAP HID/WinUSB 调试接口。
2. 使用 DAPLink 重新读取 `0x00000000`，确认 SWD/MEM-AP 恢复。
3. 烧录当前 SRAM 指针版 hook，验证 factory render 是否能显示自定义 `HELLO`。
4. 如果仍不显示，在 `FACTORY_PIXEL(0x1b58)` 下断点，读取寄存器确认传入数据。
5. 如果 `FACTORY_PIXEL` 接收到自定义数据但屏幕不变，继续追 `FACTORY_CMD 0x12` 前后状态和面板 BUSY。
6. 如果 `FACTORY_PIXEL` 没收到自定义数据，继续逆向 `0x3af4 / 0x3ba5 / 0x1f28 / 0x1fa8 / 0xa385` 的厂商图像格式。
7. 在有逻辑分析仪或万用表前，避免继续大量盲刷屏。

## 14. 推荐的下一次验证命令

前提：DAPLink 已恢复正常 CMSIS-DAP 调试接口。

先读向量表：

```powershell
E:\Install_packge\openocd\bin\openocd.exe `
  -s E:\Install_packge\openocd\openocd\scripts `
  -f interface\cmsis-dap.cfg `
  -c "transport select swd" `
  -f target\at91samdXX.cfg `
  -c "adapter speed 100" `
  -c "init" `
  -c "halt" `
  -c "mdw 0x00000000 4" `
  -c "shutdown"
```

如果成功，再编译 SRAM 版 hook：

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File E:\Project\Embedded_project\InkOps-Terminal\scripts\samr21_generate_text_frame.ps1 `
  -Text "HELLO" `
  -Width 400 `
  -Height 300 `
  -RowStrideBytes 52 `
  -Scale 10

powershell.exe -ExecutionPolicy Bypass `
  -File E:\Project\Embedded_project\InkOps-Terminal\firmware\samr21-factory-hook\build.ps1 `
  -HookMode 5 `
  -HookColor 1 `
  -HookRenderBoth 1 `
  -HookPattern 1 `
  -HookBytes 15600 `
  -HookColorFill 255
```

烧录 hook 并运行：

```powershell
E:\Install_packge\openocd\bin\openocd.exe `
  -s E:\Install_packge\openocd\openocd\scripts `
  -f interface\cmsis-dap.cfg `
  -c "transport select swd" `
  -f target\at91samdXX.cfg `
  -c "adapter speed 100" `
  -c "init" `
  -c "reset halt" `
  -c "program {E:/Project/Embedded_project/InkOps-Terminal/firmware/samr21-factory-hook/build/samr21-factory-hook.bin} verify 0x00036000" `
  -c "reset run" `
  -c "sleep 20000" `
  -c "halt" `
  -c "reg pc 0x00036001" `
  -c "resume" `
  -c "sleep 120000" `
  -c "halt" `
  -c "mdw 0x20000000 8" `
  -c "shutdown"
```

期望：

```text
0x20000000: 484f4f4b 46414354 ...
0x20000010: 00000002
```

然后观察屏幕是否出现 `HELLO`。

## 15. 风险提示

1. 不要再无依据切换 `CS/MOSI/SCLK` 等屏幕线推断；当前真正可确认的是 SWD 接线。
2. 三色墨水屏刷新慢，每次实验应等待 90-120 秒。
3. 频繁不完整刷新会造成残影、黑底、红色条纹，这不一定表示屏幕坏。
4. 之前出现的 `HELLO` 模糊图像来自不完整/错位实验，不能直接证明 raw 通道正确。
5. 无万用表/逻辑分析仪时，优先做断点和寄存器取证，不要继续盲刷。
6. 保持原厂 reset vector 不变，除非明确要做完整自定义固件。
7. 不要执行 `at91samd chip-erase`，除非确认备份和恢复流程可用。

## 16. 当前代码状态摘要

当前 `hook.c` 已包含：

1. `HOOK_RAW` 分支，支持 `HOOK_BYTES`，不再固定 33600 字节。
2. `HOOK_RENDER_BOTH` 分支。
3. `fill_plane_byte()` 清空指定平面。
4. `copy_frame_to_sram()`，将 generated frame 复制到 `0x20000020` 后再交给 `FACTORY_RENDER`。
5. hook marker 写入 `0x20000000`。

当前 `samr21_generate_text_frame.ps1` 已支持：

1. `Width`
2. `Height`
3. `RowStrideBytes`
4. `Scale`
5. `Invert`
6. `ColumnMajor`
7. `LsbFirst`

当前 `.gitignore` 已避免提交构建产物和硬件备份。

## 17. 最短接手路线

新开发者从这里开始：

1. 阅读本文档。
2. 确认 DAPLink 已退出 `MAINTENANCE` bootloader 模式。
3. 用 DAPLink 成功读出 `0x00000000`。
4. 不改原厂 vector，只烧 `0x36000` hook 区。
5. 先运行 SRAM 版 factory render hook。
6. 如无显示变化，给 `0x1b58` 下断点抓 `r0-r3` 和栈参数。
7. 再决定继续逆向图像格式，或转向完整自定义驱动固件。

这份文档的核心结论是：当前项目已经完成硬件识别、原厂备份、SWD 接线验证、hook 区搭建和大量显示链路试验；真正的下一步不是继续盲刷屏，而是先恢复稳定调试器，再验证 SRAM 指针版 factory render，并用断点确认数据是否进入 `FACTORY_PIXEL`。

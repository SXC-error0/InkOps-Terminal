# SAMR21 ESL Tag Hardware Notes

## Public Identification

The enclosure label identifies the unit as:

| Field | Value |
| --- | --- |
| Brand | LG Innotek |
| Product | Electronic Shelf Label |
| Model | `REBE-TZ42B` |
| FCC ID | `YZP-REBETZ42B` |
| Korea MSIP | `MSIP-CM1-LGW-REBETZ42B` |
| Manufacturer | Suzhou Nihone Electronic Technology Co., LTD. |
| Supply rating | `3V`, `100mA` |

Public FCC/device records show the same model family also appears as
`YZP-REBETZ42B2`, with `REBE-TZ42B` as the color display model and
`REBE-MZ42B` as the mono display variant. The RF section is a 2.405 GHz to
2.480 GHz O-QPSK/802.15.4-style design with a PCB pattern antenna and 16 MHz
crystal, matching the on-board `ATSAMR21G18A`.

Relevant public records:

- `YZP-REBETZ42B`: original 2016 FCC listing for `REBE-TZ42B`.
- `YZP-REBETZ42B2`: later FCC listing for the same `REBE-TZ42B` family.
- FCC/device listings include internal-photo/teardown documents, but public
  PDF download was blocked/timeout from the current network. Keep document ID
  `3685916` for the `YZP-REBETZ42B2` internal photos.

Local copy of the internal-photo PDF:

```text
E:\Project\Embedded_project\InkOps-Terminal\3685916.pdf
```

Observed in the internal photos:

| Page | Finding |
| --- | --- |
| 1-2 | PCB front side, installed with screen and battery connector. |
| 3 | PCB back side silk: `LG Innotek`, `ESL 4.2" Tag`, `Rev0.91`, `2017.10.12`; PCB material marking `GS-D`, `94V-0`, `E257384`. |
| 4-5 | E-paper panel flex marking: `WFT0420CZ15`. |
| 6-7 | Battery pack: lithium 3V, `CR2450-3P`, with 2-pin connector. |
| 8 | RF/MCU area close-up with the PCB pattern antenna marked. |

Compared with the user's board, the PCB family and layout match, but the user's
board photo shows an older `2016.01.22` date marking while the FCC internal
photo board shows `2017.10.12`. Treat them as the same board family with a
revision/date variant, not necessarily byte-for-byte identical hardware.

## Board Identity

- Board: LG Innotek ESL 4.2" Tag, Rev0.91, 2016-01-22
- MCU/radio: Atmel/Microchip ATSAMR21G18A
- Core detected by OpenOCD: Cortex-M0+ r0p1
- SWD DPIDR: `0x0bc11477`
- DSU DID read at `0x41002018`: `0x10010319`
- Target voltage during probe: about `3.21V`

## Confirmed ST-Link V2 Wiring

The rear-side pads labeled `SCLK`, `SDIO`, and `MRES` work as the SWD debug header.

| ST-Link V2 | ESL tag pad |
| --- | --- |
| `GND` | `GND` |
| `SWCLK` | `SCLK` |
| `SWDIO` | `SDIO` |
| `NRST` | `MRES` |

The board should be powered from its original battery for probing. Do not connect ST-Link `5V`.

## Read-Only Probe Command

```powershell
E:\Install_packge\openocd\bin\openocd.exe `
  -s E:\Install_packge\openocd\openocd\scripts `
  -f interface\stlink.cfg `
  -f target\at91samdXX.cfg `
  -c "adapter speed 100" `
  -c "init" `
  -c "reset halt" `
  -c "mdw 0x41002018 1" `
  -c "shutdown"
```

## Factory Backup

Factory firmware and NVM user row were backed up before any flash write.

Backup directory:

```text
hardware_backups/samr21_tag_20260531_011139/
```

Files:

| File | Size | SHA256 |
| --- | ---: | --- |
| `factory_flash_0x00000000_256k.bin` | 262144 | `C11B05F8F832581A88F10F25E44ECF46C6AB029505BCD04AB66A9A7A2D87BBE0` |
| `nvm_user_row_0x00804000_256b.bin` | 256 | `CB97EB21B0CCC6F88E06E75E96AADA1FDFC5657A959D5AE5198556C68199B5D2` |

Observed vector table:

```text
initial_sp   0x20002060
reset_vector 0x00000aa1
```

Factory flash appears to use most of the 256 KB address space.

## Safety

Do not run these commands unless intentionally replacing the factory firmware:

```text
at91samd chip-erase
program
flash write_image
at91samd set-security
```

Before flashing a custom image, keep at least one verified backup outside the repository.

## First Custom Firmware Flash

The first custom image was intentionally inert: it only writes a RAM marker and
then waits. It does not intentionally drive the e-paper lines.

Build:

```powershell
cd firmware\samr21-inkbridge
powershell.exe -ExecutionPolicy Bypass -File build.ps1
```

Flash and verify:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts\samr21_flash_test.ps1
```

Observed RAM marker after reset:

```text
0x20000000: 314b4e49 524d4153 00003132 ...
```

Interpreted as:

```text
INK1 SAMR 21
```

If OpenOCD reports `unable to connect to the target` after running the factory
firmware, remove the tag battery for a few seconds and reconnect it. In one
observed case, a 5 second battery power cycle restored SWD access immediately.

Factory restore command, if needed:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts\samr21_restore_factory.ps1
```

## Software Snapshot Without Multimeter

When no multimeter or logic analyzer is available, use:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts\samr21_snapshot.ps1
```

This resets and runs the factory firmware, waits briefly, halts the MCU, reads
PORT/SERCOM registers, then resumes execution. It does not write flash.

Snapshot after approximately 1500 ms:

```text
Active SERCOM instances:
SERCOM1 CTRLA=0x00200094 CTRLB=0x00030100 BAUD=0x000700ec
SERCOM4 CTRLA=0x0001008e CTRLB=0x00020200 BAUD=0x00000005
```

GPIOs configured as outputs after factory boot:

```text
PA14, PA16, PA17, PA20, PA23, PA28
PB15, PB22, PB23, PB31
```

Likely interpretation:

- `SERCOM1` and/or `SERCOM4` are candidates for display SPI, external SPI flash,
  or factory communication.
- The output GPIO list is a safer starting point for firmware bring-up than
  guessing arbitrary pins, but it still does not map pad labels to MCU pins.
- First destructive test should still be a tiny GPIO pulse firmware on a pin
  selected from the confirmed output set, not a full e-paper refresh sequence.

Earlier 100 ms snapshot after reset:

```text
Active SERCOM instances:
SERCOM2 CTRLA=0x40100086 CTRLB=0x00030000 BAUD=0x0000f62b
SERCOM4 CTRLA=0x0001008e CTRLB=0x00020200 BAUD=0x00000005

GPIO outputs:
PA14, PA15, PA20
PB15, PB31
```

This suggests the factory firmware enables an early `SERCOM2` transaction before
settling into the later state. The later 1500 ms snapshot enables `SERCOM1` and
muxes `PA16/PA17`, so `SERCOM1` is now the stronger display-SPI candidate while
`SERCOM2` may be an earlier setup/storage transaction. Do not drive the display
until the mapping is confirmed further.

## Current Pin-Mapping Hypothesis

The board has two separate concerns that are easy to mix up:

- `SCLK`, `SDIO`, `MRES` are confirmed SWD debug pads, not display SPI.
- The e-paper-style test pads are the separate labels such as `CS2`, `CS`,
  `MOSI`, `CLK`, `RESET`, `D/C`, and `BUSY`.

Confirmed by input-identify firmware:

| Test pad | SAMR21 pin |
| --- | --- |
| `CS2` | `PA14` |
| `CS` | `PA23` |
| `D/C` | `PB22` |
| `RESET` | `PB23` |
| `BUSY` | `PA27` |

Observed during input-identify:

- Shorting the pad believed to be `MOSI` to `GND` caused SWD connection failure
  until a USB/battery power cycle. Do not repeat this test until the physical
  pad is rechecked for accidental contact with adjacent pads or power-related
  nets.

From the factory snapshots:

| Evidence | Interpretation |
| --- | --- |
| `SERCOM4` is active both early and late, with `PB30` muxed to function `F` | likely related to the SAMR21 radio subsystem or another always-on serial path; avoid using it first |
| `SERCOM2` is active at about 100 ms, while `PA12/PA13/PA14` have SERCOM mux changes | strongest current SPI-bus candidate |
| `PB22/PB23` become outputs by about 1500-2000 ms | late GPIO candidates, likely control or power-enable lines |
| `PA23/PA28` also become outputs late | additional control candidates |
| `PA19` is configured with input/pull behavior | plausible `BUSY`/status input candidate |

Safe next step:

1. Keep the no-sleep test firmware installed while experimenting.
2. Add one small firmware mode at a time for candidate GPIOs.
3. Do not attempt a full e-paper refresh until at least `CLK`, `MOSI`, `CS`,
   `D/C`, `RESET`, and `BUSY` are mapped with higher confidence.

The no-sleep test firmware writes these RAM markers and then busy-spins instead
of using `wfi`, which makes ST-Link reconnection more stable:

```text
0x20000000: 314b4e49 524d4153 00003132 ...
```

## Candidate GPIO Scan Firmware

The scan firmware is built with `-TestMode 1` and intentionally only toggles
factory-observed output candidates one at a time. It does not send an e-paper
command sequence.

Flash scan mode:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts\samr21_flash_scan.ps1
```

Flash idle/no-sleep mode:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts\samr21_flash_idle.ps1
```

Read current scan state:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts\samr21_read_scan_state.ps1
```

Scan markers:

| SRAM address | Meaning |
| --- | --- |
| `0x20000000` | `INK1` marker |
| `0x20000004` | `SAMR` marker |
| `0x20000008` | `21` marker |
| `0x20000010` | current candidate tag, e.g. `0x0a14` = `PA14` |
| `0x20000014` | current candidate index |
| `0x20000018` | current output level, `1` high or `0` low |

Initial verified scan readings:

```text
0x20000010 = 0x00000a14, PORTA = 0x00004000  -> PA14 high
0x20000010 = 0x00000a15, PORTA = 0x00008000  -> PA15 high
```

## Single-Pin Hold Firmware

The hold firmware is built with `-TestMode 2`. It configures exactly one GPIO as
an output and holds it high or low, then busy-spins for stable SWD access.

Examples:

```powershell
# Hold PA14 high
powershell.exe -ExecutionPolicy Bypass -File scripts\samr21_flash_hold.ps1 -Port A -Pin 14 -Level 1

# Hold PB22 low
powershell.exe -ExecutionPolicy Bypass -File scripts\samr21_flash_hold.ps1 -Port B -Pin 22 -Level 0
```

Verified hold reading:

```text
PA14 high:
0x20000010 = 0x00000a14
0x20000018 = 0x00000001
PORTA      = 0x00004000
```

User-visible observation:

| Test | Visible result |
| --- | --- |
| `PA14` held high | no visible screen/board change |
| `PA15` held high | no visible screen/board change |
| `PA15` held low | no visible screen/board change |
| `PA20` held high | no visible screen/board change |
| `PA20` held low | no visible screen/board change |
| `PB22` held high | no visible screen/board change |
| `PB22` held low | no visible screen/board change |
| `PB23` held high | no visible screen/board change |
| `PB23` held low | no visible screen/board change |
| `PA23` held high | no visible screen/board change |
| `PA23` held low | no visible screen/board change |
| `PA28` held high | no visible screen/board change |
| `PA28` held low | no visible screen/board change |
| factory firmware restored and reset | no visible screen refresh/reaction |
| EPD clear attempt 1: `SCK=PA13`, `MOSI=PA12`, `CS=PA14`, `DC=PA15`, `RST=PA20`, `BUSY=PA19` | no visible screen refresh/reaction |
| EPD clear attempt 2: `SCK=PA17`, `MOSI=PA16`, `CS=PA14`, `DC=PA20`, `RST=PB22`, `BUSY=PA19` | no visible screen refresh/reaction |
| EPD clear attempt 3: `SCK=PA17`, `MOSI=PA16`, `CS=PB15`, `DC=PA14`, `RST=PA20`, `BUSY=PA19` | no visible screen refresh/reaction |
| EPD clear attempt 4: `SCK=PA17`, `MOSI=PA16`, `CS=CS2/PA14`, `DC=PB22`, `RST=PB23`, `BUSY=PA27` | no visible screen refresh/reaction |
| EPD clear attempt 5: dual CS `PA14 + PA23`, `SCK=PA17`, `MOSI=PA16`, `DC=PB22`, `RST=PB23`, `BUSY=PA27`; flashed with no post-reset halt | no visible screen refresh/reaction |
| EPD clear attempt 6: dual CS `PA14 + PA23`, `SCK=PA13`, `MOSI=PA12`, `DC=PB22`, `RST=PB23`, `BUSY=PA27`; flashed with no post-reset halt | no visible screen refresh/reaction |
| EPD clear attempt 7: dual CS `PA14 + PA23`, `SCK=PA17`, `MOSI=PA16`, `DC=PB22`, `RST=PB23`, `BUSY=PA27`, `PWR_ON=PA28` active high | no visible screen refresh/reaction |
| EPD clear attempt 8: dual CS `PA14 + PA23`, `SCK=PA13`, `MOSI=PA12`, `DC=PB22`, `RST=PB23`, `BUSY=PA27`, `PWR_ON=PA28` active high | no visible screen refresh/reaction |
| EPD clear attempt 9: dual CS `PA14 + PA23`, `SCK=PA17`, `MOSI=PA16`, `DC=PB22`, `RST=PB23`, `BUSY=PA27`, `PWR_ON=PA28` active low | no visible screen refresh/reaction |
| EPD clear attempt 10: dual CS `PA14 + PA23`, `SCK=PA13`, `MOSI=PA12`, `DC=PB22`, `RST=PB23`, `BUSY=PA27`, `PWR_ON=PA28` active low | no visible screen refresh/reaction |

After attempts 5 and 6, the board was returned to idle mode. SWD still detected
the SAMR21 and target voltage was about `3.21V`, so the MCU/debug/power path was
still alive. Further blind waveform tests should stop until the display FPC,
EPD power rails, and exact SPI/panel controller mapping can be verified.

After attempts 7-10, blind EPD command tests should stop. `PWR_ON=PA28` is now
mapped, but generic 4.2-inch EPD initialization still produces no visible
reaction. The next firmware path should clone the factory runtime GPIO/SERCOM
configuration more closely or use a logic analyzer/multimeter to verify the
actual display bus and high-voltage rails.

## No-PCB-Modification Custom Refresh Plan

Goal: keep the original PCB, original SAMR21, original battery connector, and
original display FPC. Custom content should be uploaded through SWD during
bring-up, then later through the board's own radio or another non-invasive
transport.

Recommended stages:

1. Use SWD only as the development/upload port. Do not cut traces or replace
   the display controller board.
2. Confirm the display power-enable net first. The PCB has a `PWR_ON` test
   point/label; without enabling the EPD high-voltage/power circuit, correct SPI
   traffic may still produce no visible refresh.
3. Keep the known control mapping fixed while investigating `PWR_ON`:
   `CS2=PA14`, `CS=PA23`, `D/C=PB22`, `RESET=PB23`, `BUSY=PA27`.
4. `PWR_ON` was mapped with input-identify mode by shorting the `PWR_ON` test
   point to `GND`: the changed low bit was `PA28`, so use `PWR_ON=PA28`.
5. Once `PWR_ON` is mapped, retry a minimal white/black clear using the optional
   `EPD_PWR_*` build parameters.
6. After the panel driver is confirmed, implement a flash-backed framebuffer:
   the desktop app renders 400x300 black/red planes, OpenOCD writes only the
   framebuffer pages into unused flash, and the tag firmware refreshes the
   panel on reset. This gives custom content without UART, USB-TTL, or PCB
   changes.

After a hold test, return to idle mode unless intentionally observing or
measuring the pin:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts\samr21_flash_idle.ps1
```

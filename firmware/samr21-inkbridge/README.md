# SAMR21 InkBridge

Experimental firmware target for the LG Innotek 4.2" ESL tag based on the
Microchip ATSAMR21G18A.

This directory is intentionally conservative:

- It builds a bare-metal Cortex-M0+ image for the ATSAMR21G18A.
- It does not assume the display pin mapping yet.
- Do not flash this over the factory firmware until the backup in
  `hardware_backups/` has been verified and the user explicitly chooses to
  replace the original firmware.

## Build

```powershell
make
```

The STM32CubeCLT `arm-none-eabi-*` toolchain is sufficient.

## Current Status

- SWD connection confirmed through ST-Link V2.
- Pads confirmed:
  - `SCLK` -> SWCLK
  - `SDIO` -> SWDIO
  - `MRES` -> reset
  - `GND` -> ground
- Factory firmware backed up.
- Display and UART GPIO mappings still need continuity probing.

## Flashing

Do not flash yet. First custom-firmware milestone should be a GPIO pulse on a
known test pad so it can be verified with a multimeter or logic analyzer before
touching the e-paper power/display sequence.

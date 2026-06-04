MEMORY
{
    FLASH (rx) : ORIGIN = 0x00036000, LENGTH = 0x9800
}

SECTIONS
{
    .text :
    {
        KEEP(*(.text.hook_entry))
        *(.text*)
        *(.rodata*)
    } > FLASH
}

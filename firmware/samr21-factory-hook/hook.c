#include <stdint.h>

#define REG32(addr) (*(volatile uint32_t *)(addr))
#define REG8(addr)  (*(volatile uint8_t *)(addr))

#define WDT_BASE   0x40001000u
#define WDT_CTRL   REG8(WDT_BASE + 0x00u)
#define WDT_STATUS REG8(WDT_BASE + 0x07u)
#define WDT_CLEAR  REG8(WDT_BASE + 0x08u)

#ifndef HOOK_MODE
#define HOOK_MODE 8
#endif

#ifndef HOOK_ARG
#define HOOK_ARG 0
#endif

#ifndef HOOK_DIRECT
#define HOOK_DIRECT 0
#endif

#ifndef HOOK_FRAME
#define HOOK_FRAME 0
#endif

#ifndef HOOK_FILL
#define HOOK_FILL 0xff
#endif

#ifndef HOOK_COLOR
#define HOOK_COLOR 0
#endif

#ifndef HOOK_COLOR_FILL
#define HOOK_COLOR_FILL 0xff
#endif

#ifndef HOOK_PATTERN
#define HOOK_PATTERN 0
#endif

#ifndef HOOK_RAW
#define HOOK_RAW 0
#endif

#ifndef HOOK_RENDER
#define HOOK_RENDER 0
#endif

#ifndef HOOK_RENDER_BOTH
#define HOOK_RENDER_BOTH 0
#endif

#ifndef HOOK_PLANE
#define HOOK_PLANE 0
#endif

#ifndef HOOK_PIXEL
#define HOOK_PIXEL 0
#endif

#ifndef HOOK_PIXEL_FLAG
#define HOOK_PIXEL_FLAG 0
#endif

#ifndef HOOK_FRAME_TO_COLOR
#define HOOK_FRAME_TO_COLOR 0
#endif

#ifndef HOOK_INVERT_FRAME
#define HOOK_INVERT_FRAME 0
#endif

#ifndef HOOK_DUMP_DESC
#define HOOK_DUMP_DESC 0
#endif

#ifndef HOOK_BYTES
#define HOOK_BYTES 33600u
#endif

typedef void (*factory_void_fn)(void);
typedef void (*factory_u8_fn)(uint8_t);
typedef void (*factory_mode_fn)(uint8_t, uint8_t);
typedef void (*factory_pin_fn)(uint8_t, uint8_t);
typedef void (*factory_ptr_fn)(void *);
typedef void (*factory_render_fn)(uint8_t, const void *, uint8_t);
typedef void (*factory_pixel_fn)(uint8_t, uint8_t, uint16_t, uint16_t, uint8_t);
typedef void (*factory_desc_fn)(void *, uint8_t);

#define THUMB_ADDR(addr) ((addr) | 1u)

#define FACTORY_PIN_INIT     ((factory_void_fn)THUMB_ADDR(0x00000df0u))
#define FACTORY_PANEL_INIT   ((factory_void_fn)THUMB_ADDR(0x00001484u))
#define FACTORY_PANEL_INIT_2 ((factory_void_fn)THUMB_ADDR(0x00001544u))
#define FACTORY_SET_PIN      ((factory_pin_fn)THUMB_ADDR(0x0000705cu))
#define FACTORY_CMD          ((factory_u8_fn)THUMB_ADDR(0x00001a78u))
#define FACTORY_DATA         ((factory_u8_fn)THUMB_ADDR(0x00001ac4u))
#define FACTORY_SELECT_RAM   ((factory_mode_fn)THUMB_ADDR(0x00001aa0u))
#define FACTORY_MODESET      ((factory_mode_fn)THUMB_ADDR(0x000015f4u))
#define FACTORY_PIXEL        ((factory_pixel_fn)THUMB_ADDR(0x00001b58u))
#define FACTORY_RENDER       ((factory_render_fn)THUMB_ADDR(0x00001c00u))
#define FACTORY_DISPLAY      ((factory_ptr_fn)THUMB_ADDR(0x00001ddcu))
#define FACTORY_GET_DESC     ((factory_desc_fn)THUMB_ADDR(0x000021c0u))

static void delay(volatile uint32_t ticks)
{
    while (ticks--) {
        __asm volatile ("nop");
    }
}

static void disable_watchdog(void)
{
    WDT_CLEAR = 0xa5u;
    while (WDT_STATUS & 0x80u) {
    }

    WDT_CTRL = 0x00u;
    while (WDT_STATUS & 0x80u) {
    }
}

static void send_frame(uint8_t black_plane, uint8_t color_plane) __attribute__((unused));
static void send_frame(uint8_t black_plane, uint8_t color_plane)
{
    FACTORY_CMD(0x10);
    for (uint32_t i = 0; i < HOOK_BYTES; i++) {
        FACTORY_DATA(black_plane);
    }

    FACTORY_CMD(0x13);
    for (uint32_t i = 0; i < HOOK_BYTES; i++) {
        FACTORY_DATA(color_plane);
    }

    FACTORY_CMD(0x12);
}

static void send_stripes(void) __attribute__((unused));
static void send_stripes(void)
{
    FACTORY_CMD(0x10);
    for (uint32_t i = 0; i < 33600u; i++) {
        FACTORY_DATA((i & 1u) ? 0x00u : 0xffu);
    }

    FACTORY_CMD(0x13);
    for (uint32_t i = 0; i < 33600u; i++) {
        FACTORY_DATA((i & 1u) ? 0xffu : 0x00u);
    }

    FACTORY_CMD(0x12);
}

#if HOOK_PATTERN
#include "generated_frame.inc"
#else
static const uint8_t frame_data[33600] = {[0 ... 33599] = (uint8_t)HOOK_FILL};
#endif

static void send_raw_black_frame(void) __attribute__((unused));
static void send_raw_black_frame(void)
{
    FACTORY_CMD(0x10);
    for (uint32_t i = 0; i < HOOK_BYTES; i++) {
#if (HOOK_RAW || HOOK_FRAME) && !HOOK_FRAME_TO_COLOR
#if HOOK_INVERT_FRAME
        FACTORY_DATA((uint8_t)~frame_data[i]);
#else
        FACTORY_DATA(frame_data[i]);
#endif
#else
        FACTORY_DATA((uint8_t)HOOK_FILL);
#endif
    }

    FACTORY_CMD(0x13);
    for (uint32_t i = 0; i < HOOK_BYTES; i++) {
#if (HOOK_RAW || HOOK_FRAME) && HOOK_FRAME_TO_COLOR
#if HOOK_INVERT_FRAME
        FACTORY_DATA((uint8_t)~frame_data[i]);
#else
        FACTORY_DATA(frame_data[i]);
#endif
#else
        FACTORY_DATA((uint8_t)HOOK_COLOR_FILL);
#endif
    }

    FACTORY_CMD(0x12);
}

static void prepare_display_power(void) __attribute__((unused));
static void prepare_display_power(void)
{
    FACTORY_SET_PIN(55u, 1u);
    FACTORY_SET_PIN(54u, 1u);
    FACTORY_SET_PIN(23u, 1u);
    delay(800000u);

    FACTORY_SET_PIN(28u, 1u);
    FACTORY_SET_PIN(55u, 0u);
    delay(800000u);

    FACTORY_SET_PIN(55u, 1u);
    delay(800000u);
}

static void fill_plane_byte(uint8_t plane, uint8_t value) __attribute__((unused));
static void fill_plane_byte(uint8_t plane, uint8_t value)
{
    FACTORY_SELECT_RAM((uint8_t)HOOK_MODE, plane);
    for (uint32_t i = 0; i < HOOK_BYTES; i++) {
        FACTORY_PIXEL((uint8_t)HOOK_MODE, value, 0xffu, 0xffu, 0u);
    }
}

static uint8_t *copy_frame_to_sram(void) __attribute__((unused));
static uint8_t *copy_frame_to_sram(void)
{
    uint8_t *dst = (uint8_t *)0x20000020u;
    for (uint32_t i = 0; i < HOOK_BYTES; i++) {
        dst[i] = frame_data[i];
    }
    return dst;
}

static void send_pixel_encoded_frame(void) __attribute__((unused));
static void send_pixel_encoded_frame(void)
{
    FACTORY_SELECT_RAM((uint8_t)HOOK_MODE, (uint8_t)HOOK_COLOR);
#if HOOK_MODE == 5
    for (uint32_t i = 0; i < 33600u; i++) {
        FACTORY_PIXEL((uint8_t)HOOK_MODE, frame_data[i], 0xffu, 0xffu, (uint8_t)HOOK_PIXEL_FLAG);
    }
#else
    for (uint32_t i = 0; i < 8400u; i++) {
#if HOOK_PIXEL_FLAG == 1
        FACTORY_PIXEL((uint8_t)HOOK_MODE, 0u, frame_data[i * 2u], frame_data[(i * 2u) + 1u], (uint8_t)HOOK_PIXEL_FLAG);
#else
        FACTORY_PIXEL((uint8_t)HOOK_MODE, frame_data[i], 0u, 0u, (uint8_t)HOOK_PIXEL_FLAG);
#endif
    }
#endif

    FACTORY_SELECT_RAM((uint8_t)HOOK_MODE, 3u);
#if HOOK_MODE == 5
    for (uint32_t i = 0; i < 33600u; i++) {
        FACTORY_PIXEL((uint8_t)HOOK_MODE, 0xffu, 0xffu, 0xffu, (uint8_t)HOOK_PIXEL_FLAG);
    }
#else
    for (uint32_t i = 0; i < 8400u; i++) {
#if HOOK_PIXEL_FLAG == 1
        FACTORY_PIXEL((uint8_t)HOOK_MODE, 0u, 0xffu, 0xffu, (uint8_t)HOOK_PIXEL_FLAG);
#else
        FACTORY_PIXEL((uint8_t)HOOK_MODE, 0xffu, 0u, 0u, (uint8_t)HOOK_PIXEL_FLAG);
#endif
    }
#endif

    FACTORY_CMD(0x12);
}

void hook_entry(void) __attribute__((used, section(".text.hook_entry")));
void hook_entry(void)
{
    __asm volatile ("cpsid i");
    disable_watchdog();
    __asm volatile ("cpsie i");

    REG32(0x20000000u) = 0x484f4f4bu; /* HOOK */
    REG32(0x20000004u) = 0x46414354u; /* FACT */
    REG32(0x20000008u) = 0x00003600u; /* 3600 */

#if HOOK_RENDER_BOTH
    REG32(0x20000010u) = 1u;
    FACTORY_MODESET((uint8_t)HOOK_MODE, (uint8_t)HOOK_COLOR);
    delay(800000u);
    FACTORY_RENDER((uint8_t)HOOK_MODE, copy_frame_to_sram(), 2u);
    fill_plane_byte(3u, (uint8_t)HOOK_COLOR_FILL);
    FACTORY_CMD(0x12);
    delay(24000000u);
#elif HOOK_DUMP_DESC
    for (uint32_t mode = 0; mode < 9u; mode++) {
        uint8_t *dst = (uint8_t *)(0x20000020u + (mode * 32u));
        for (uint32_t i = 0; i < 32u; i++) {
            dst[i] = 0u;
        }
        FACTORY_GET_DESC(dst, (uint8_t)mode);
    }
    delay(24000000u);
#elif HOOK_PIXEL
    REG32(0x20000010u) = 1u;
    FACTORY_MODESET((uint8_t)HOOK_MODE, (uint8_t)HOOK_COLOR);
    delay(800000u);
    send_pixel_encoded_frame();
    delay(24000000u);
#elif HOOK_RENDER
    REG32(0x20000010u) = 1u;
    FACTORY_MODESET((uint8_t)HOOK_MODE, (uint8_t)HOOK_COLOR);
    delay(800000u);
    FACTORY_RENDER((uint8_t)HOOK_MODE, frame_data, (uint8_t)HOOK_PLANE);
    FACTORY_CMD(0x12);
    delay(24000000u);
#elif HOOK_RAW
    REG32(0x20000010u) = 1u;
    prepare_display_power();
    FACTORY_MODESET((uint8_t)HOOK_MODE, (uint8_t)HOOK_COLOR);
    delay(800000u);
    send_raw_black_frame();
    delay(24000000u);
#elif HOOK_DIRECT
    FACTORY_PIN_INIT();
    delay(800000u);
    FACTORY_PANEL_INIT();
    delay(800000u);
    FACTORY_PANEL_INIT_2();
    delay(800000u);

    REG32(0x20000010u) = 1u;
    send_stripes();
    delay(24000000u);
#else
    uint32_t desc_words[5];
    uint8_t *desc = (uint8_t *)desc_words;

    desc_words[0] = 0x20000010u;
    desc_words[1] = 0x87000000u;
#if HOOK_FRAME
    desc_words[2] = (uint32_t)frame_data;
#else
    desc_words[2] = (uint32_t)HOOK_ARG;
#endif
    desc_words[3] = 0x00000828u;
    desc_words[4] = 0u;
    desc[5] = (uint8_t)HOOK_COLOR;
    desc[6] = (uint8_t)HOOK_MODE;

    REG32(0x20000010u) = 1u;
    FACTORY_DISPLAY(desc);
    delay(24000000u);
#endif

    REG32(0x20000010u) = 2u;

    while (1) {
        REG32(0x2000000cu)++;
        __asm volatile ("nop");
    }
}

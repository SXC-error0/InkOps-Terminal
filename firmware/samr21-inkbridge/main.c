#include <stdint.h>

#define REG32(addr) (*(volatile uint32_t *)(addr))
#define REG8(addr)  (*(volatile uint8_t *)(addr))

#define PM_BASE       0x40000400u
#define WDT_BASE      0x40001000u
#define PORT_BASE     0x41004400u
#define PORT_GROUP_SZ 0x80u

#define PM_APBBMASK   REG32(PM_BASE + 0x20u)

#define WDT_CTRL      REG8(WDT_BASE + 0x00u)
#define WDT_STATUS    REG8(WDT_BASE + 0x07u)
#define WDT_CLEAR     REG8(WDT_BASE + 0x08u)

#define PORT_DIRSET(group) REG32(PORT_BASE + ((group) * PORT_GROUP_SZ) + 0x08u)
#define PORT_DIRCLR(group) REG32(PORT_BASE + ((group) * PORT_GROUP_SZ) + 0x0Cu)
#define PORT_OUTCLR(group) REG32(PORT_BASE + ((group) * PORT_GROUP_SZ) + 0x14u)
#define PORT_OUTSET(group) REG32(PORT_BASE + ((group) * PORT_GROUP_SZ) + 0x18u)
#define PORT_OUTTGL(group) REG32(PORT_BASE + ((group) * PORT_GROUP_SZ) + 0x1Cu)
#define PORT_IN(group)     REG32(PORT_BASE + ((group) * PORT_GROUP_SZ) + 0x20u)
#define PORT_PINCFG(group, pin) \
    (*(volatile uint8_t *)(PORT_BASE + ((group) * PORT_GROUP_SZ) + 0x40u + (pin)))

/*
 * Keep the default firmware inert. Set PROBE_PIN to a real mapped test pad only
 * after continuity probing. PORT group 0 = PAxx, group 1 = PBxx.
 */
#ifndef PROBE_PORT_GROUP
#define PROBE_PORT_GROUP 0
#endif

#ifndef PROBE_PIN
#define PROBE_PIN -1
#endif

#ifndef TEST_MODE
#define TEST_MODE 0
#endif

#ifndef HOLD_PORT_GROUP
#define HOLD_PORT_GROUP 0
#endif

#ifndef HOLD_PIN
#define HOLD_PIN 14
#endif

#ifndef HOLD_LEVEL
#define HOLD_LEVEL 1
#endif

#ifndef EPD_SCK_GROUP
#define EPD_SCK_GROUP 0
#endif
#ifndef EPD_SCK_PIN
#define EPD_SCK_PIN 13
#endif
#ifndef EPD_MOSI_GROUP
#define EPD_MOSI_GROUP 0
#endif
#ifndef EPD_MOSI_PIN
#define EPD_MOSI_PIN 12
#endif
#ifndef EPD_CS_GROUP
#define EPD_CS_GROUP 0
#endif
#ifndef EPD_CS_PIN
#define EPD_CS_PIN 14
#endif
#ifndef EPD_CS2_ENABLE
#define EPD_CS2_ENABLE 0
#endif
#ifndef EPD_CS2_GROUP
#define EPD_CS2_GROUP 0
#endif
#ifndef EPD_CS2_PIN
#define EPD_CS2_PIN 23
#endif
#ifndef EPD_DC_GROUP
#define EPD_DC_GROUP 0
#endif
#ifndef EPD_DC_PIN
#define EPD_DC_PIN 15
#endif
#ifndef EPD_RST_GROUP
#define EPD_RST_GROUP 0
#endif
#ifndef EPD_RST_PIN
#define EPD_RST_PIN 20
#endif
#ifndef EPD_BUSY_GROUP
#define EPD_BUSY_GROUP 0
#endif
#ifndef EPD_BUSY_PIN
#define EPD_BUSY_PIN 19
#endif
#ifndef EPD_PWR_ENABLE
#define EPD_PWR_ENABLE 0
#endif
#ifndef EPD_PWR_GROUP
#define EPD_PWR_GROUP 0
#endif
#ifndef EPD_PWR_PIN
#define EPD_PWR_PIN 28
#endif
#ifndef EPD_PWR_ACTIVE_HIGH
#define EPD_PWR_ACTIVE_HIGH 1
#endif

static void delay(volatile uint32_t ticks) __attribute__((unused));
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

struct probe_pin {
    uint8_t group;
    uint8_t pin;
    uint16_t tag;
};

#if TEST_MODE == 1
static const struct probe_pin scan_pins[] = {
    {0, 14, 0x0a14}, /* PA14: early and late factory output */
    {0, 15, 0x0a15}, /* PA15: early factory output */
    {0, 16, 0x0a16}, /* PA16: late factory output */
    {0, 17, 0x0a17}, /* PA17: late factory output */
    {0, 20, 0x0a20}, /* PA20: early and late factory output */
    {0, 23, 0x0a23}, /* PA23: late factory output */
    {0, 28, 0x0a28}, /* PA28: late factory output */
    {1, 22, 0x0b22}, /* PB22: late factory output */
    {1, 23, 0x0b23}, /* PB23: late factory output */
};

static void scan_candidate_pins(void)
{
    const uint32_t count = sizeof(scan_pins) / sizeof(scan_pins[0]);

    while (1) {
        for (uint32_t i = 0; i < count; i++) {
            const uint32_t group = scan_pins[i].group;
            const uint32_t pin = scan_pins[i].pin;
            const uint32_t mask = (1u << pin);

            REG32(0x20000010u) = scan_pins[i].tag;
            REG32(0x20000014u) = i;

            PORT_DIRSET(group) = mask;
            PORT_OUTSET(group) = mask;
            REG32(0x20000018u) = 1u;
            delay(1200000u);

            PORT_OUTCLR(group) = mask;
            REG32(0x20000018u) = 0u;
            delay(1200000u);

            PORT_DIRCLR(group) = mask;
            delay(300000u);
        }
    }
}
#endif

#if TEST_MODE == 2
static void hold_candidate_pin(void)
{
    const uint32_t mask = (1u << HOLD_PIN);
    const uint32_t tag = ((HOLD_PORT_GROUP == 0) ? 0x0a00u : 0x0b00u)
        | (((uint32_t)HOLD_PIN / 10u) << 4)
        | ((uint32_t)HOLD_PIN % 10u);

    REG32(0x20000010u) = tag;
    REG32(0x20000014u) = HOLD_PIN;
    REG32(0x20000018u) = HOLD_LEVEL ? 1u : 0u;

    PORT_DIRSET(HOLD_PORT_GROUP) = mask;
    if (HOLD_LEVEL) {
        PORT_OUTSET(HOLD_PORT_GROUP) = mask;
    } else {
        PORT_OUTCLR(HOLD_PORT_GROUP) = mask;
    }

    while (1) {
        REG32(0x2000000cu)++;
        __asm volatile ("nop");
    }
}
#endif

#if TEST_MODE == 3 || TEST_MODE == 5
#define PIN_MASK(pin) (1u << (pin))

static void gpio_high(uint32_t group, uint32_t pin)
{
    PORT_OUTSET(group) = PIN_MASK(pin);
}

static void gpio_low(uint32_t group, uint32_t pin)
{
    PORT_OUTCLR(group) = PIN_MASK(pin);
}

static uint32_t gpio_read(uint32_t group, uint32_t pin)
{
    return (PORT_IN(group) & PIN_MASK(pin)) ? 1u : 0u;
}

static void epd_cs_high(void)
{
    gpio_high(EPD_CS_GROUP, EPD_CS_PIN);
#if EPD_CS2_ENABLE
    gpio_high(EPD_CS2_GROUP, EPD_CS2_PIN);
#endif
}

static void epd_cs_low(void)
{
    gpio_low(EPD_CS_GROUP, EPD_CS_PIN);
#if EPD_CS2_ENABLE
    gpio_low(EPD_CS2_GROUP, EPD_CS2_PIN);
#endif
}

static void spi_write_byte(uint8_t data)
{
    for (uint32_t bit = 0; bit < 8; bit++) {
        if (data & 0x80u) {
            gpio_high(EPD_MOSI_GROUP, EPD_MOSI_PIN);
        } else {
            gpio_low(EPD_MOSI_GROUP, EPD_MOSI_PIN);
        }

        delay(80u);
        gpio_high(EPD_SCK_GROUP, EPD_SCK_PIN);
        delay(80u);
        gpio_low(EPD_SCK_GROUP, EPD_SCK_PIN);
        delay(80u);
        data <<= 1;
    }
}

static void factory_bitbang_write_byte(uint8_t data)
{
    for (uint32_t bit = 0; bit < 8; bit++) {
        gpio_high(0, 25); /* PA25: factory EPD clock, idle high trial */

        if (data & 0x80u) {
            gpio_high(0, 24); /* PA24: factory EPD data */
        } else {
            gpio_low(0, 24);
        }

        delay(80u);
        gpio_low(0, 25);
        delay(80u);
        gpio_high(0, 25);
        delay(80u);
        data <<= 1;
    }
}

static void factory_epd_write(uint8_t dc, uint8_t value)
{
    if (dc) {
        gpio_high(1, 22); /* PB22: D/C high = data */
    } else {
        gpio_low(1, 22);  /* PB22: D/C low = command */
    }

    gpio_low(0, 23);      /* PA23: CS */
    factory_bitbang_write_byte(value);
    gpio_high(0, 23);
}

static void factory_epd_cmd(uint8_t value)
{
    factory_epd_write(0, value);
}

static void factory_epd_data(uint8_t value)
{
    factory_epd_write(1, value);
}

static void epd_write(uint8_t dc, uint8_t value)
{
    if (dc) {
        gpio_high(EPD_DC_GROUP, EPD_DC_PIN);
    } else {
        gpio_low(EPD_DC_GROUP, EPD_DC_PIN);
    }

    epd_cs_low();
    spi_write_byte(value);
    epd_cs_high();
}

static void epd_cmd(uint8_t value) __attribute__((unused));
static void epd_cmd(uint8_t value)
{
    epd_write(0, value);
}

static void epd_data(uint8_t value) __attribute__((unused));
static void epd_data(uint8_t value)
{
    epd_write(1, value);
}

static void epd_wait_busy_or_timeout(uint32_t loops) __attribute__((unused));
static void epd_wait_busy_or_timeout(uint32_t loops)
{
    while (loops--) {
        REG32(0x2000001cu) = gpio_read(EPD_BUSY_GROUP, EPD_BUSY_PIN);
        if (gpio_read(EPD_BUSY_GROUP, EPD_BUSY_PIN)) {
            break;
        }
        delay(60000u);
    }
}

static void epd_reset(void) __attribute__((unused));
static void epd_reset(void)
{
    gpio_high(EPD_RST_GROUP, EPD_RST_PIN);
    delay(600000u);
    gpio_low(EPD_RST_GROUP, EPD_RST_PIN);
    delay(600000u);
    gpio_high(EPD_RST_GROUP, EPD_RST_PIN);
    delay(1200000u);
}

static void epd_power_enable(void) __attribute__((unused));
static void epd_power_enable(void)
{
#if EPD_PWR_ENABLE
    PORT_DIRSET(EPD_PWR_GROUP) = PIN_MASK(EPD_PWR_PIN);
#if EPD_PWR_ACTIVE_HIGH
    gpio_high(EPD_PWR_GROUP, EPD_PWR_PIN);
#else
    gpio_low(EPD_PWR_GROUP, EPD_PWR_PIN);
#endif
    delay(1200000u);
#endif
}

#if TEST_MODE == 3
static void epd_clear_white(void)
{
    REG32(0x20000010u) = 0x0000e4d1u; /* EPD1 */
    REG32(0x20000014u) = 0x00000003u; /* clear mode */

    PORT_DIRSET(EPD_SCK_GROUP) = PIN_MASK(EPD_SCK_PIN);
    PORT_DIRSET(EPD_MOSI_GROUP) = PIN_MASK(EPD_MOSI_PIN);
    PORT_DIRSET(EPD_CS_GROUP) = PIN_MASK(EPD_CS_PIN);
#if EPD_CS2_ENABLE
    PORT_DIRSET(EPD_CS2_GROUP) = PIN_MASK(EPD_CS2_PIN);
#endif
    PORT_DIRSET(EPD_DC_GROUP) = PIN_MASK(EPD_DC_PIN);
    PORT_DIRSET(EPD_RST_GROUP) = PIN_MASK(EPD_RST_PIN);
    PORT_DIRCLR(EPD_BUSY_GROUP) = PIN_MASK(EPD_BUSY_PIN);

    gpio_low(EPD_SCK_GROUP, EPD_SCK_PIN);
    epd_cs_high();
    gpio_high(EPD_DC_GROUP, EPD_DC_PIN);
    gpio_high(EPD_RST_GROUP, EPD_RST_PIN);

    epd_power_enable();
    epd_reset();

    epd_cmd(0x01); /* POWER_SETTING */
    epd_data(0x03);
    epd_data(0x00);
    epd_data(0x2b);
    epd_data(0x2b);

    epd_cmd(0x06); /* BOOSTER_SOFT_START */
    epd_data(0x17);
    epd_data(0x17);
    epd_data(0x17);

    epd_cmd(0x04); /* POWER_ON */
    epd_wait_busy_or_timeout(4000u);

    epd_cmd(0x00); /* PANEL_SETTING */
    epd_data(0xbf);

    epd_cmd(0x30); /* PLL */
    epd_data(0x3c);

    epd_cmd(0x61); /* RESOLUTION 400x300 */
    epd_data(0x01);
    epd_data(0x90);
    epd_data(0x01);
    epd_data(0x2c);

    epd_cmd(0x82); /* VCOM_DC */
    epd_data(0x12);

    epd_cmd(0x50); /* VCOM interval */
    epd_data(0x97);

    epd_cmd(0x10);
    for (uint32_t i = 0; i < 15000u; i++) {
        epd_data(0xff);
    }

    epd_cmd(0x13);
    for (uint32_t i = 0; i < 15000u; i++) {
        epd_data(0xff);
    }

    REG32(0x20000018u) = 1u;
    epd_cmd(0x12); /* DISPLAY_REFRESH */
    delay(1200000u);
    epd_wait_busy_or_timeout(12000u);
    REG32(0x20000018u) = 2u;

    while (1) {
        REG32(0x2000000cu)++;
        __asm volatile ("nop");
    }
}
#endif
#endif

#if TEST_MODE == 5
static void factory_wait_busy_or_timeout(uint32_t loops)
{
    while (loops--) {
        REG32(0x2000001cu) = gpio_read(0, 27);
        if (gpio_read(0, 27)) {
            break;
        }
        delay(60000u);
    }
}

static void factory_epd_reset(void)
{
    gpio_high(1, 23); /* PB23: factory reset */
    delay(600000u);
    gpio_low(1, 23);
    delay(600000u);
    gpio_high(1, 23);
    delay(1200000u);
}

static void factory_epd_clear_test(void)
{
    REG32(0x20000010u) = 0x0000f4e5u; /* F4E5 */
    REG32(0x20000014u) = 0x00000005u; /* factory bus mode */

    PORT_DIRSET(0) = PIN_MASK(23) | PIN_MASK(24) | PIN_MASK(25) | PIN_MASK(28);
    PORT_DIRSET(1) = PIN_MASK(22) | PIN_MASK(23);
    PORT_DIRCLR(0) = PIN_MASK(27);

    gpio_high(0, 23); /* CS idle high */
    gpio_high(1, 22); /* D/C idle data */
    gpio_high(0, 25); /* CLK idle high trial */
    gpio_low(0, 24);  /* SDA idle low */

    gpio_low(0, 28);  /* PA28/PWR_ON: factory code drives this low */
    delay(1200000u);

    factory_epd_reset();

    /*
     * Cloned from the factory init routine around 0x1484. This PCB's panel
     * path is PA24/PA25 bitbang, not the generic SPI pins we tried earlier.
     */
    factory_epd_cmd(0x04);
    factory_wait_busy_or_timeout(4000u);

    factory_epd_cmd(0x01);
    factory_epd_data(0x37);
    factory_epd_data(0x00);
    factory_epd_data(0x05);
    factory_epd_data(0x05);

    factory_epd_cmd(0x00);
    factory_epd_data(0xcf);
    factory_epd_data(0x08);

    factory_epd_cmd(0xe5);
    factory_epd_data(0x03);

    factory_epd_cmd(0x03);
    factory_epd_data(0x00);

    factory_epd_cmd(0x06);
    factory_epd_data(0xc7);
    factory_epd_data(0xcc);
    factory_epd_data(0x28);

    factory_epd_cmd(0x30);
    factory_epd_data(0x3c);

    factory_epd_cmd(0x41);
    factory_epd_data(0x00);

    factory_epd_cmd(0x50);
    factory_epd_data(0x77);

    factory_epd_cmd(0x61);
    factory_epd_data(0x02);
    factory_epd_data(0x58);
    factory_epd_data(0x01);
    factory_epd_data(0xc0);

    factory_epd_cmd(0x82);
    factory_epd_data(0x1e);

    factory_epd_cmd(0x02);
    factory_epd_cmd(0x04);

    factory_epd_cmd(0x00);
    factory_epd_data(0xcf);
    factory_epd_data(0x08);

    factory_epd_cmd(0x01);
    factory_epd_data(0x37);
    factory_epd_data(0x00);
    factory_epd_data(0x05);
    factory_epd_data(0x05);

    factory_epd_cmd(0x10);
    for (uint32_t i = 0; i < 33600u; i++) {
        factory_epd_data(0xff);
    }

    factory_epd_cmd(0x13);
    for (uint32_t i = 0; i < 33600u; i++) {
        factory_epd_data(0x00);
    }

    REG32(0x20000018u) = 1u;
    factory_epd_cmd(0x12);
    delay(1200000u);
    factory_wait_busy_or_timeout(18000u);
    REG32(0x20000018u) = 2u;

    while (1) {
        REG32(0x2000000cu)++;
        __asm volatile ("nop");
    }
}
#endif

#if TEST_MODE == 4
static const struct probe_pin identify_pins[] = {
    {0, 0, 0x0a00},
    {0, 1, 0x0a01},
    {0, 2, 0x0a02},
    {0, 3, 0x0a03},
    {0, 4, 0x0a04},
    {0, 5, 0x0a05},
    {0, 6, 0x0a06},
    {0, 7, 0x0a07},
    {0, 8, 0x0a08},
    {0, 9, 0x0a09},
    {0, 10, 0x0a10},
    {0, 11, 0x0a11},
    {0, 12, 0x0a12},
    {0, 13, 0x0a13},
    {0, 14, 0x0a14},
    {0, 15, 0x0a15},
    {0, 16, 0x0a16},
    {0, 17, 0x0a17},
    {0, 19, 0x0a19},
    {0, 20, 0x0a20},
    {0, 21, 0x0a21},
    {0, 22, 0x0a22},
    {0, 23, 0x0a23},
    {0, 24, 0x0a24},
    {0, 25, 0x0a25},
    {0, 26, 0x0a26},
    {0, 27, 0x0a27},
    {0, 28, 0x0a28},
    {0, 29, 0x0a29},
    {1, 0, 0x0b00},
    {1, 1, 0x0b01},
    {1, 2, 0x0b02},
    {1, 3, 0x0b03},
    {1, 4, 0x0b04},
    {1, 5, 0x0b05},
    {1, 6, 0x0b06},
    {1, 7, 0x0b07},
    {1, 8, 0x0b08},
    {1, 9, 0x0b09},
    {1, 10, 0x0b10},
    {1, 11, 0x0b11},
    {1, 12, 0x0b12},
    {1, 13, 0x0b13},
    {1, 14, 0x0b14},
    {1, 15, 0x0b15},
    {1, 16, 0x0b16},
    {1, 17, 0x0b17},
    {1, 18, 0x0b18},
    {1, 19, 0x0b19},
    {1, 20, 0x0b20},
    {1, 21, 0x0b21},
    {1, 22, 0x0b22},
    {1, 23, 0x0b23},
    {1, 24, 0x0b24},
    {1, 25, 0x0b25},
    {1, 26, 0x0b26},
    {1, 27, 0x0b27},
    {1, 28, 0x0b28},
    {1, 29, 0x0b29},
    {1, 30, 0x0b30},
    {1, 31, 0x0b31},
};

static void input_identify(void)
{
    const uint32_t count = sizeof(identify_pins) / sizeof(identify_pins[0]);
    uint32_t mask_a = 0;
    uint32_t mask_b = 0;

    for (uint32_t i = 0; i < count; i++) {
        const uint32_t group = identify_pins[i].group;
        const uint32_t pin = identify_pins[i].pin;
        const uint32_t mask = (1u << pin);

        PORT_DIRCLR(group) = mask;
        PORT_OUTSET(group) = mask; /* pull-up source when PULLEN is set */
        PORT_PINCFG(group, pin) = 0x06u; /* INEN | PULLEN */

        if (group == 0) {
            mask_a |= mask;
        } else {
            mask_b |= mask;
        }
    }

    REG32(0x20000010u) = 0x1d000001u; /* identify mode */
    REG32(0x20000014u) = mask_a;
    REG32(0x20000018u) = mask_b;

    while (1) {
        const uint32_t in_a = PORT_IN(0);
        const uint32_t in_b = PORT_IN(1);
        REG32(0x20000020u) = in_a;
        REG32(0x20000024u) = in_b;
        REG32(0x20000028u) = mask_a & ~in_a;
        REG32(0x2000002cu) = mask_b & ~in_b;
        REG32(0x2000000cu)++;
    }
}
#endif

#if TEST_MODE == 0
static void idle_spin(void)
{
    while (1) {
        REG32(0x2000000cu)++;
        __asm volatile ("nop");
    }
}
#endif

int main(void)
{
    disable_watchdog();

    REG32(0x20000000u) = 0x314b4e49u; /* INK1 */
    REG32(0x20000004u) = 0x524d4153u; /* SAMR */
    REG32(0x20000008u) = 0x00003132u; /* 21 */

    /* Enable PORT peripheral clock on APBB. */
    PM_APBBMASK |= (1u << 5);

#if PROBE_PIN >= 0
    PORT_DIRSET(PROBE_PORT_GROUP) = (1u << PROBE_PIN);

    while (1) {
        PORT_OUTTGL(PROBE_PORT_GROUP) = (1u << PROBE_PIN);
        delay(200000u);
    }
#elif TEST_MODE == 1
    scan_candidate_pins();
#elif TEST_MODE == 2
    hold_candidate_pin();
#elif TEST_MODE == 3
    epd_clear_white();
#elif TEST_MODE == 4
    input_identify();
#elif TEST_MODE == 5
    factory_epd_clear_test();
#else
    idle_spin();
#endif
}

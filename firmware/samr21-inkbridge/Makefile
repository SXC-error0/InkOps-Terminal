TOOLCHAIN ?=
CC := $(TOOLCHAIN)arm-none-eabi-gcc
OBJCOPY := $(TOOLCHAIN)arm-none-eabi-objcopy
SIZE := $(TOOLCHAIN)arm-none-eabi-size

TARGET := samr21-inkbridge
BUILD := build

CFLAGS := -mcpu=cortex-m0plus -mthumb -Os -ffunction-sections -fdata-sections
CFLAGS += -Wall -Wextra -Werror -std=c11
LDFLAGS := -T linker.ld -Wl,--gc-sections -Wl,-Map=$(BUILD)/$(TARGET).map
LDFLAGS += -nostartfiles -nostdlib

SRCS := startup.c main.c
OBJS := $(SRCS:%.c=$(BUILD)/%.o)

.PHONY: all clean

all: $(BUILD)/$(TARGET).elf $(BUILD)/$(TARGET).bin
	$(SIZE) $(BUILD)/$(TARGET).elf

$(BUILD):
	mkdir $(BUILD)

$(BUILD)/%.o: %.c | $(BUILD)
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD)/$(TARGET).elf: $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) $(LDFLAGS) -o $@

$(BUILD)/$(TARGET).bin: $(BUILD)/$(TARGET).elf
	$(OBJCOPY) -O binary $< $@

clean:
	rmdir /s /q $(BUILD)

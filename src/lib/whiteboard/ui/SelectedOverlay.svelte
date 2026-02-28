<script lang="ts">
  import Icon from "@iconify/svelte";
  import minusIcon from "@iconify-icons/lucide/minus";
  import plusIcon from "@iconify-icons/lucide/plus";
  import alignLeftIcon from "@iconify-icons/lucide/align-left";
  import alignCenterIcon from "@iconify-icons/lucide/align-center";
  import alignRightIcon from "@iconify-icons/lucide/align-right";
  import squareIcon from "@iconify-icons/lucide/square";
  import paintBucketIcon from "@iconify-icons/lucide/paint-bucket";
  import typeIcon from "@iconify-icons/lucide/type";
  import { onMount } from "svelte";
  import type {
    BoardController,
    SelectedStyleState,
  } from "../application/BoardController";
  import type { TextAlign } from "../domain/types";
  import {
    BORDER_COLOR_SWATCHES,
    DEFAULT_BORDER_PICKER_COLOR,
    DEFAULT_FILL_PICKER_COLOR,
    DEFAULT_ICON_PICKER_COLOR,
    DEFAULT_TEXT_PICKER_COLOR,
    FILL_COLOR_SWATCHES,
    ICON_COLOR_SWATCHES,
    TEXT_COLOR_SWATCHES,
  } from "./colorSwatches";

  let {
    overlay,
    controller,
  }: {
    overlay: {
      x: number;
      y: number;
      style: SelectedStyleState;
    };
    controller: BoardController;
  } = $props();

  let openColorPicker = $state<"border" | "fill" | "text" | "icon" | null>(
    null,
  );

  const fillSwatches = FILL_COLOR_SWATCHES;
  const borderSwatches = BORDER_COLOR_SWATCHES;
  const textSwatches = TEXT_COLOR_SWATCHES;
  const iconSwatches = ICON_COLOR_SWATCHES;

  const textAlignOptions = [
    { label: "Align left", icon: alignLeftIcon, value: "left" },
    { label: "Align center", icon: alignCenterIcon, value: "center" },
    { label: "Align right", icon: alignRightIcon, value: "right" },
  ] satisfies { label: string; icon: object; value: TextAlign }[];

  const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
  const defaultBorderPickerColor = DEFAULT_BORDER_PICKER_COLOR;
  const defaultFillPickerColor = DEFAULT_FILL_PICKER_COLOR;
  const defaultTextPickerColor = DEFAULT_TEXT_PICKER_COLOR;
  const defaultIconPickerColor = DEFAULT_ICON_PICKER_COLOR;

  function getColorPickerValue(
    color: string | null | undefined,
    fallback: string,
  ): string {
    if (typeof color === "string" && HEX_COLOR_PATTERN.test(color)) {
      return color;
    }
    return fallback;
  }

  function isCustomColorSelected(
    color: string | null | undefined,
    swatches: string[],
  ): boolean {
    if (typeof color !== "string") {
      return false;
    }
    const normalizedSwatches = swatches.map((value) => value.toLowerCase());
    return !normalizedSwatches.includes(color.toLowerCase());
  }

  function toggleColorPicker(kind: "border" | "fill" | "text" | "icon") {
    openColorPicker = openColorPicker === kind ? null : kind;
  }

  function applyColorSelection(
    kind: "border" | "fill" | "text" | "icon",
    color: string,
  ) {
    if (kind === "border") {
      controller.setSelectedBorderColor(color);
    } else if (kind === "fill") {
      controller.setSelectedFillColor(color);
    } else if (kind === "text") {
      controller.setSelectedTextColor(color);
    } else {
      void controller.setSelectedIconColor(color);
    }
    openColorPicker = null;
  }

  function applyCustomColor(
    kind: "border" | "fill" | "text" | "icon",
    event: Event,
  ) {
    const value = (event.currentTarget as HTMLInputElement).value;
    if (kind === "border") {
      controller.setSelectedBorderColor(value);
    } else if (kind === "fill") {
      controller.setSelectedFillColor(value);
    } else if (kind === "text") {
      controller.setSelectedTextColor(value);
    } else {
      void controller.setSelectedIconColor(value);
    }
  }

  function handleGlobalClick(event: MouseEvent) {
    if (!openColorPicker) {
      return;
    }

    if (!(event.target instanceof Element)) {
      openColorPicker = null;
      return;
    }

    if (event.target.closest(".color-picker-host")) {
      return;
    }

    openColorPicker = null;
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && openColorPicker) {
      openColorPicker = null;
    }
  }

  onMount(() => {
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleGlobalKeydown);

    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleGlobalKeydown);
    };
  });
</script>

<div
  class="selected-toolbar"
  style:left={`${overlay.x}px`}
  style:top={`${overlay.y}px`}
>
  {#if overlay.style.controls.fontSize && overlay.style.fontSize !== null}
    <div class="mini-group font-size-group">
      <button
        type="button"
        disabled={!overlay.style.canDecreaseFontSize}
        title="Decrease font size"
        onclick={() => controller.decreaseSelectedFontSize()}
      >
        <Icon icon={minusIcon} width="16" height="16" />
      </button>
      <span class="font-size-value">{overlay.style.fontSize}</span>
      <button
        type="button"
        disabled={!overlay.style.canIncreaseFontSize}
        title="Increase font size"
        onclick={() => controller.increaseSelectedFontSize()}
      >
        <Icon icon={plusIcon} width="16" height="16" />
      </button>
    </div>
  {/if}

  {#if overlay.style.controls.textAlign && overlay.style.textAlign}
    <div class="mini-group">
      {#each textAlignOptions as option}
        <button
          type="button"
          title={option.label}
          class:active={overlay.style.textAlign === option.value}
          onclick={() => controller.setSelectedTextAlign(option.value)}
        >
          <Icon icon={option.icon} width="16" height="16" />
        </button>
      {/each}
    </div>
  {/if}

  {#if overlay.style.controls.borderColor && overlay.style.borderColor}
    <div class="mini-group color-picker-host">
      <button
        type="button"
        class="color-trigger"
        class:active={openColorPicker === "border"}
        aria-label="Border color"
        title="Border color"
        onclick={() => toggleColorPicker("border")}
      >
        <Icon icon={squareIcon} width="14" height="14" />
      </button>

      {#if openColorPicker === "border"}
        <div class="color-popup">
          <div class="color-grid">
            {#each borderSwatches as color}
              <button
                type="button"
                class="swatch"
                class:transparent-swatch={color === "transparent"}
                class:active={overlay.style.borderColor === color}
                style:background={color}
                title={`Border ${color}`}
                onclick={() => applyColorSelection("border", color)}
              ></button>
            {/each}
          </div>
          <div class="color-custom-row">
            <span>Custom</span>
            <label
              class="swatch swatch-picker"
              class:active={isCustomColorSelected(
                overlay.style.borderColor,
                borderSwatches,
              )}
              title="Custom border color"
            >
              <input
                type="color"
                value={getColorPickerValue(
                  overlay.style.borderColor,
                  defaultBorderPickerColor,
                )}
                oninput={(event) => applyCustomColor("border", event)}
              />
            </label>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  {#if overlay.style.controls.fillColor && overlay.style.fillColor}
    <div class="mini-group color-picker-host">
      <button
        type="button"
        class="color-trigger"
        class:active={openColorPicker === "fill"}
        aria-label="Background color"
        title="Background color"
        onclick={() => toggleColorPicker("fill")}
      >
        <Icon icon={paintBucketIcon} width="14" height="14" />
      </button>

      {#if openColorPicker === "fill"}
        <div class="color-popup">
          <div class="color-grid">
            {#each fillSwatches as color}
              <button
                type="button"
                class="swatch"
                class:transparent-swatch={color === "transparent"}
                class:active={overlay.style.fillColor === color}
                style:background={color}
                title={`Background ${color}`}
                onclick={() => applyColorSelection("fill", color)}
              ></button>
            {/each}
          </div>
          <div class="color-custom-row">
            <span>Custom</span>
            <label
              class="swatch swatch-picker"
              class:active={isCustomColorSelected(
                overlay.style.fillColor,
                fillSwatches,
              )}
              title="Custom background color"
            >
              <input
                type="color"
                value={getColorPickerValue(
                  overlay.style.fillColor,
                  defaultFillPickerColor,
                )}
                oninput={(event) => applyCustomColor("fill", event)}
              />
            </label>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  {#if overlay.style.controls.textColor && overlay.style.textColor}
    <div class="mini-group color-picker-host">
      <button
        type="button"
        class="color-trigger"
        class:active={openColorPicker === "text"}
        aria-label="Text color"
        title="Text color"
        onclick={() => toggleColorPicker("text")}
      >
        <Icon icon={typeIcon} width="14" height="14" />
      </button>

      {#if openColorPicker === "text"}
        <div class="color-popup">
          <div class="color-grid">
            {#each textSwatches as color}
              <button
                type="button"
                class="swatch"
                class:active={overlay.style.textColor === color}
                style:background={color}
                title={`Text ${color}`}
                onclick={() => applyColorSelection("text", color)}
              ></button>
            {/each}
          </div>
          <div class="color-custom-row">
            <span>Custom</span>
            <label
              class="swatch swatch-picker"
              class:active={isCustomColorSelected(
                overlay.style.textColor,
                textSwatches,
              )}
              title="Custom text color"
            >
              <input
                type="color"
                value={getColorPickerValue(
                  overlay.style.textColor,
                  defaultTextPickerColor,
                )}
                oninput={(event) => applyCustomColor("text", event)}
              />
            </label>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  {#if overlay.style.controls.iconColor && overlay.style.iconColor}
    <div class="mini-group color-picker-host">
      <button
        type="button"
        class="color-trigger"
        class:active={openColorPicker === "icon"}
        aria-label="Icon color"
        title="Icon color"
        onclick={() => toggleColorPicker("icon")}
      >
        <Icon icon={paintBucketIcon} width="14" height="14" />
      </button>

      {#if openColorPicker === "icon"}
        <div class="color-popup">
          <div class="color-grid">
            {#each iconSwatches as color}
              <button
                type="button"
                class="swatch"
                class:active={overlay.style.iconColor === color}
                style:background={color}
                title={`Icon ${color}`}
                onclick={() => applyColorSelection("icon", color)}
              ></button>
            {/each}
          </div>
          <div class="color-custom-row">
            <span>Custom</span>
            <label
              class="swatch swatch-picker"
              class:active={isCustomColorSelected(
                overlay.style.iconColor,
                iconSwatches,
              )}
              title="Custom icon color"
            >
              <input
                type="color"
                value={getColorPickerValue(
                  overlay.style.iconColor,
                  defaultIconPickerColor,
                )}
                oninput={(event) => applyCustomColor("icon", event)}
              />
            </label>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .selected-toolbar {
    position: absolute;
    transform: translateX(-50%);
    z-index: var(--z-overlay);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--surface-1);
    border: 0.125rem solid var(--border-1);
    border-radius: 0.625rem;
    padding: 0.5rem;
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  .mini-group {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .mini-group:not(:last-child)::after {
    content: "";
    width: 0.0625rem;
    height: 1.375rem;
    margin-left: 0.125rem;
    background: var(--border-1);
  }

  .mini-group button {
    border: 0.0625rem solid var(--border-1);
    background: var(--button-bg);
    color: var(--button-text);
    border-radius: 0.375rem;
    min-width: 1.875rem;
    height: 1.875rem;
    font-size: 0.75rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .mini-group button:hover:enabled {
    background: var(--button-bg-hover);
    border-color: var(--border-2);
  }

  .mini-group button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .font-size-group {
    gap: 0.25rem;
  }

  .font-size-value {
    min-width: 1.75rem;
    text-align: center;
    font-size: 0.75rem;
    color: var(--app-text-muted);
  }

  .mini-group button.active {
    outline: 0.125rem solid var(--accent);
    outline-offset: 0.0625rem;
  }

  .color-picker-host {
    position: relative;
  }

  .color-trigger {
    min-width: 1.875rem;
    height: 1.875rem;
    padding: 0;
    gap: 0;
  }

  .color-popup {
    position: absolute;
    left: 0;
    top: calc(100% + 0.5rem);
    z-index: var(--z-overlay-popup);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.625rem;
    border: 0.125rem solid var(--border-1);
    background: var(--surface-1);
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.375rem;
  }

  .color-grid .swatch {
    min-width: 1.5rem;
    height: 1.5rem;
  }

  .color-custom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    color: var(--app-text-muted);
    font-size: 0.875rem;
  }

  .swatch {
    width: 1.5rem;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0;
  }

  .swatch-picker {
    border: 0.0625rem solid var(--border-1);
    border-radius: 0.375rem;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--button-bg);
    cursor: pointer;
  }

  .swatch-picker:hover {
    border-color: var(--border-2);
    background: var(--button-bg-hover);
  }

  .swatch-picker.active {
    outline: 0.125rem solid var(--accent);
    outline-offset: 0.0625rem;
  }

  .swatch-picker:focus-within {
    outline: 0.125rem solid var(--accent);
    outline-offset: 0.0625rem;
  }

  .swatch-picker input[type="color"] {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 100%;
    border: none;
    padding: 0;
    background: transparent;
    cursor: pointer;
  }

  .swatch-picker input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .swatch-picker input[type="color"]::-webkit-color-swatch {
    border: none;
    border-radius: 0.3125rem;
  }

  .swatch-picker input[type="color"]::-moz-color-swatch {
    border: none;
    border-radius: 0.3125rem;
  }

  .transparent-swatch {
    position: relative;
    background-image: linear-gradient(
        45deg,
        var(--border-1) 25%,
        transparent 25%
      ),
      linear-gradient(-45deg, var(--border-1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--border-1) 75%),
      linear-gradient(-45deg, transparent 75%, var(--border-1) 75%);
    background-size: 0.625rem 0.625rem;
    background-position:
      0 0,
      0 0.3125rem,
      0.3125rem -0.3125rem,
      -0.3125rem 0;
  }

  .transparent-swatch::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1rem;
    height: 0.125rem;
    background: var(--danger);
    transform: translate(-50%, -50%) rotate(-35deg);
    border-radius: 62.4375rem;
  }
</style>

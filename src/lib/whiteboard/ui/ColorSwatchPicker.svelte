<script lang="ts">
  export type PopupPlacement = "below-left" | "above-center";

  let {
    value,
    swatches,
    fallbackColor,
    labelPrefix,
    customTitle,
    columns = 4,
    placement = "below-left",
    compact = false,
    onSelect,
  }: {
    value: string | null | undefined;
    swatches: string[];
    fallbackColor: string;
    labelPrefix: string;
    customTitle: string;
    columns?: number;
    placement?: PopupPlacement;
    compact?: boolean;
    onSelect: (color: string) => void | Promise<void>;
  } = $props();

  const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

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
    swatchesList: string[],
  ): boolean {
    if (typeof color !== "string") {
      return false;
    }
    const normalizedSwatches = swatchesList.map((item) => item.toLowerCase());
    return !normalizedSwatches.includes(color.toLowerCase());
  }
</script>

<div
  class="color-popup"
  class:popup-above-center={placement === "above-center"}
  class:popup-below-left={placement === "below-left"}
  class:compact
>
  <div class="color-grid" style={`--swatch-columns: ${columns};`}>
    {#each swatches as color}
      <button
        type="button"
        class="swatch"
        class:transparent-swatch={color === "transparent"}
        class:active={value === color}
        style:background={color}
        title={`${labelPrefix} ${color}`}
        onclick={() => {
          void onSelect(color);
        }}
      ></button>
    {/each}
  </div>
  <div class="color-custom-row">
    <span>Custom</span>
    <label
      class="swatch swatch-picker"
      class:active={isCustomColorSelected(value, swatches)}
      title={customTitle}
    >
      <input
        type="color"
        value={getColorPickerValue(value, fallbackColor)}
        oninput={(event) => {
          const next = (event.currentTarget as HTMLInputElement).value;
          void onSelect(next);
        }}
      />
    </label>
  </div>
</div>

<style>
  .color-popup {
    z-index: var(--z-overlay-popup, 1000);
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

  .popup-below-left {
    position: absolute;
    left: 0;
    top: calc(100% + 1rem);
  }

  .popup-above-center {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 1.5rem);
    transform: translateX(-50%);
  }

  .color-grid {
    --swatch-size: 1.5rem;
    display: grid;
    grid-template-columns: repeat(var(--swatch-columns, 4), var(--swatch-size));
    gap: 0.5rem;
    justify-content: start;
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
    width: var(--swatch-size, 1.5rem);
    min-width: var(--swatch-size, 1.5rem);
    height: var(--swatch-size, 1.5rem);
    border-radius: 0.375rem;
    border: 0.0625rem solid var(--border-1);
    padding: 0;
    cursor: pointer;
  }

  .swatch.active {
    outline: 0.125rem solid var(--accent);
    outline-offset: 0.0625rem;
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

  .color-popup.compact {
    border-width: 0.0625rem;
  }

  .color-popup.compact .color-custom-row {
    font-size: 0.75rem;
  }
</style>

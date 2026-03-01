<script lang="ts">
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import Icon from "@iconify/svelte";
  import squareIcon from "@iconify-icons/lucide/square";
  import circleIcon from "@iconify-icons/lucide/circle";
  import typeIcon from "@iconify-icons/lucide/type";
  import headingIcon from "@iconify-icons/lucide/heading-1";
  import stickyIcon from "@iconify-icons/lucide/sticky-note";
  import backIcon from "@iconify-icons/lucide/arrow-left";
  import magnetIcon from "@iconify-icons/lucide/magnet";
  import paletteIcon from "@iconify-icons/lucide/palette";
  import pencilIcon from "@iconify-icons/lucide/pencil";
  import paintBucketIcon from "@iconify-icons/lucide/paint-bucket";
  import minusIcon from "@iconify-icons/lucide/minus";
  import importIcon from "@iconify-icons/lucide/upload";
  import exportIcon from "@iconify-icons/lucide/download";
  import ColorSwatchPicker from "./ColorSwatchPicker.svelte";
  import {
    DEFAULT_DRAW_PICKER_COLOR,
    DRAW_COLOR_SWATCHES,
  } from "./colorSwatches";

  export type CreateKind =
    | "rectangle"
    | "ellipse"
    | "text"
    | "heading"
    | "sticky";

  let {
    onBack,
    onCreate,
    onDelete,
    freeDrawMode,
    freeDrawColor,
    freeDrawStrokeWidth,
    onToggleFreeDrawMode,
    onSetFreeDrawColor,
    onSetFreeDrawStrokeWidth,
    iconBrowserOpen,
    onToggleIconBrowser,
    snapEnabled,
    onToggleSnapping,
    onExport,
    onImport,
  }: {
    onBack?: () => void;
    onCreate: (kind: CreateKind) => void;
    onDelete: () => void;
    freeDrawMode: boolean;
    freeDrawColor: string;
    freeDrawStrokeWidth: number;
    onToggleFreeDrawMode: () => void;
    onSetFreeDrawColor: (color: string) => void;
    onSetFreeDrawStrokeWidth: (width: number) => void;
    iconBrowserOpen: boolean;
    onToggleIconBrowser: () => void;
    snapEnabled: boolean;
    onToggleSnapping: () => void;
    onExport: () => void;
    onImport: (event: Event) => void;
    themeMode: "light" | "dark";
    onToggleTheme: () => void;
  } = $props();

  const createButtons = [
    { label: "Sticky", icon: stickyIcon, kind: "sticky" },
    { label: "Text", icon: typeIcon, kind: "text" },
    { label: "Heading", icon: headingIcon, kind: "heading" },

    { label: "Rectangle", icon: squareIcon, kind: "rectangle" },
    { label: "Ellipse", icon: circleIcon, kind: "ellipse" },
  ] satisfies { label: string; icon: object; kind: CreateKind }[];

  let openDrawColorPicker = $state(false);
  let openDrawWidthPicker = $state(false);
  const drawWidthPresets = [2, 4, 6, 8];
  const drawColorSwatches = DRAW_COLOR_SWATCHES;
  const defaultDrawPickerColor = DEFAULT_DRAW_PICKER_COLOR;

  function handleGlobalClick(event: MouseEvent) {
    if (!openDrawColorPicker && !openDrawWidthPicker) {
      return;
    }

    if (!(event.target instanceof Element)) {
      openDrawColorPicker = false;
      return;
    }

    if (event.target.closest(".draw-color-picker-host")) {
      return;
    }

    if (event.target.closest(".draw-width-picker-host")) {
      return;
    }

    openDrawColorPicker = false;
    openDrawWidthPicker = false;
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (
      event.key === "Escape" &&
      (openDrawColorPicker || openDrawWidthPicker)
    ) {
      openDrawColorPicker = false;
      openDrawWidthPicker = false;
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

  $effect(() => {
    if (!freeDrawMode) {
      openDrawColorPicker = false;
      openDrawWidthPicker = false;
    }
  });
</script>

<div class="toolbar">
  <div class="actions">
    {#if onBack}
      <button
        type="button"
        class="action-icon"
        aria-label="Back"
        title="Back"
        onclick={onBack}
      >
        <Icon icon={backIcon} width="18" height="18" />
      </button>
    {/if}
    <button
      type="button"
      class="action-icon"
      class:active={snapEnabled}
      aria-label={snapEnabled ? "Disable snapping" : "Enable snapping"}
      title={snapEnabled ? "Snapping on" : "Snapping off"}
      onclick={onToggleSnapping}
    >
      <Icon icon={magnetIcon} width="18" height="18" />
    </button>
    <button
      type="button"
      class="action-icon"
      aria-label="Export JSON"
      title="Export JSON"
      onclick={onExport}
    >
      <Icon icon={exportIcon} width="18" height="18" />
    </button>
    <label
      class="import-button action-icon"
      aria-label="Import JSON"
      title="Import JSON"
    >
      <Icon icon={importIcon} width="18" height="18" />
      <input type="file" accept="application/json" onchange={onImport} />
    </label>
  </div>
  <div class="tools">
    <div class="pen-group" class:open={freeDrawMode}>
      <button
        type="button"
        class="tool-button"
        class:active={freeDrawMode}
        aria-label={freeDrawMode ? "Disable drawing" : "Enable drawing"}
        title={freeDrawMode ? "Drawing on" : "Draw freehand"}
        onclick={onToggleFreeDrawMode}
      >
        <Icon icon={pencilIcon} width="22" height="22" />
      </button>
      <div
        class="draw-controls"
        class:open={freeDrawMode}
        aria-hidden={!freeDrawMode}
      >
        <div class="draw-width-picker-host">
          <button
            type="button"
            class="tool-button width-trigger"
            class:active={openDrawWidthPicker}
            aria-label="Drawing width"
            title={`Drawing width ${freeDrawStrokeWidth}px`}
            onclick={() => {
              openDrawWidthPicker = !openDrawWidthPicker;
              openDrawColorPicker = false;
            }}
          >
            <Icon icon={minusIcon} width="18" height="18" />
            <span class="draw-width-chip">{freeDrawStrokeWidth}</span>
          </button>

          {#if openDrawWidthPicker}
            <div
              class="width-popup"
              in:scale={{ duration: 120, start: 0.96 }}
              out:fade={{ duration: 100 }}
            >
              <div class="width-presets">
                {#each drawWidthPresets as width}
                  <button
                    type="button"
                    class="width-preset"
                    class:active={freeDrawStrokeWidth === width}
                    onclick={() => {
                      onSetFreeDrawStrokeWidth(width);
                    }}
                  >
                    {width}
                  </button>
                {/each}
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                value={freeDrawStrokeWidth}
                aria-label="Draw stroke width"
                oninput={(event) => {
                  const value = Number(
                    (event.currentTarget as HTMLInputElement).value,
                  );
                  onSetFreeDrawStrokeWidth(value);
                }}
              />
            </div>
          {/if}
        </div>

        <div class="draw-color-picker-host">
          <button
            type="button"
            class="tool-button color-trigger"
            class:active={openDrawColorPicker}
            aria-label="Drawing color"
            title="Drawing color"
            onclick={() => {
              openDrawColorPicker = !openDrawColorPicker;
              openDrawWidthPicker = false;
            }}
          >
            <Icon icon={paintBucketIcon} width="18" height="18" />
            <span class="draw-color-chip" style:background={freeDrawColor}
            ></span>
          </button>

          {#if openDrawColorPicker}
            <ColorSwatchPicker
              value={freeDrawColor}
              swatches={drawColorSwatches}
              fallbackColor={defaultDrawPickerColor}
              labelPrefix="Draw"
              customTitle="Custom drawing color"
              columns={8}
              placement="above-center"
              compact={true}
              onSelect={(color) => {
                onSetFreeDrawColor(color);
                openDrawColorPicker = false;
              }}
            />
          {/if}
        </div>
      </div>
    </div>

    <div class="tool-separator" aria-hidden="true"></div>

    {#each createButtons as button}
      <button
        type="button"
        class="tool-button"
        aria-label={button.label}
        title={button.label}
        onclick={() => onCreate(button.kind)}
      >
        <Icon icon={button.icon} width="22" height="22" />
      </button>
    {/each}
    <button
      type="button"
      class="tool-button"
      class:active={iconBrowserOpen}
      data-icon-browser-toggle="true"
      aria-label={iconBrowserOpen ? "Hide icon browser" : "Show icon browser"}
      title={iconBrowserOpen ? "Hide icons" : "Browse icons"}
      onclick={onToggleIconBrowser}
    >
      <Icon icon={paletteIcon} width="22" height="22" />
    </button>
  </div>
</div>
{#if !freeDrawMode}
  <p class="hint">
    Pan with Alt + drag (or middle mouse drag). Copy/paste with Ctrl+C / Ctrl+V.
  </p>
{/if}

<style>
  .toolbar {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: var(--z-static-actions);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;

    gap: 0.5rem;
    padding: 1rem;

    border-radius: 1rem;
    background-color: var(--surface-1);
    border: 0.125rem solid var(--borderColor);
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  .tools {
    position: fixed;
    left: 50%;
    bottom: 1rem;
    transform: translateX(-50%);
    z-index: var(--z-static-toolbar);
    display: flex;
    gap: 0.5rem;
    padding: 1rem;

    border-radius: 1rem;
    background-color: var(--surface-1);
    border: 0.125rem solid var(--borderColor);
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  button,
  .import-button {
    border: 0.0625rem solid var(--border-1);
    color: var(--button-text);
    background: var(--button-bg);
    padding: 0.375rem 0.625rem;
    font-size: 0.875rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition:
      background-color 140ms ease,
      border-color 140ms ease;
  }

  button:hover,
  .import-button:hover {
    background: var(--button-bg-hover);
    border-color: var(--border-2);
  }

  input[type="file"] {
    display: none;
  }

  .tool-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.625rem;
    height: 2.625rem;
    padding: 0;
  }

  .draw-controls {
    display: flex;
    align-items: center;
    gap: 0;
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    transition:
      max-width 220ms ease,
      opacity 140ms ease,
      gap 220ms ease;
  }

  .draw-controls.open {
    gap: 0.5rem;
    max-width: 9rem;
    opacity: 1;
    overflow: visible;
    pointer-events: auto;
  }

  .pen-group {
    display: inline-flex;
    align-items: center;
    gap: 0;
    transition: gap 220ms ease;
  }

  .pen-group.open {
    gap: 0.5rem;
  }

  .tool-separator {
    width: 0.0625rem;
    align-self: stretch;
    background: var(--border-1);
    opacity: 0.9;
    margin: 0 0.125rem;
  }

  .draw-color-picker-host {
    position: relative;
  }

  .draw-width-picker-host {
    position: relative;
  }

  .color-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    width: auto;
    min-width: 2.625rem;
    padding: 0 0.5rem;
  }

  .draw-color-chip {
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 9999px;
    border: 0.0625rem solid var(--border-2);
    flex: 0 0 auto;
  }

  .width-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    width: auto;
    min-width: 2.625rem;
    padding: 0 0.5rem;
  }

  .draw-width-chip {
    min-width: 1.125rem;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--app-text-muted);
  }

  .width-popup {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 0.5rem);
    transform: translateX(-50%);
    z-index: calc(var(--z-static-toolbar) + 1);
    min-width: 10.5rem;
    padding: 0.5rem;
    border-radius: 0.625rem;
    border: 0.0625rem solid var(--border-1);
    background: var(--surface-1);
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .width-presets {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.25rem;
  }

  .width-preset {
    height: 1.75rem;
    padding: 0;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .width-popup input[type="range"] {
    display: block;
    width: 100%;
    margin: 0;
  }

  .tool-button.active {
    outline: 0.125rem solid var(--accent);
    outline-offset: 0.0625rem;
  }

  .action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
  }

  .action-icon.active {
    outline: 0.125rem solid var(--accent);
    outline-offset: 0.0625rem;
  }

  .hint {
    user-select: none;
    position: fixed;
    left: 50%;
    bottom: 6.25rem;
    transform: translateX(-50%);
    z-index: var(--z-static-actions);
    margin: 0;
    padding: 0.5rem;
    font-size: 0.875rem;
    color: var(--app-text-muted);
    border-radius: 0.625rem;
  }
</style>

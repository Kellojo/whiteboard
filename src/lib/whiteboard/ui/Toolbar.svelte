<script lang="ts">
  import Icon from "@iconify/svelte";
  import squareIcon from "@iconify-icons/lucide/square";
  import circleIcon from "@iconify-icons/lucide/circle";
  import typeIcon from "@iconify-icons/lucide/type";
  import headingIcon from "@iconify-icons/lucide/heading-1";
  import stickyIcon from "@iconify-icons/lucide/sticky-note";
  import backIcon from "@iconify-icons/lucide/arrow-left";
  import sunIcon from "@iconify-icons/lucide/sun";
  import moonIcon from "@iconify-icons/lucide/moon";
  import importIcon from "@iconify-icons/lucide/upload";
  import exportIcon from "@iconify-icons/lucide/download";

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
    onExport,
    onImport,
    themeMode,
    onToggleTheme,
  }: {
    onBack?: () => void;
    onCreate: (kind: CreateKind) => void;
    onDelete: () => void;
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
      aria-label={themeMode === "dark"
        ? "Switch to light mode"
        : "Switch to dark mode"}
      title={themeMode === "dark" ? "Light mode" : "Dark mode"}
      onclick={onToggleTheme}
    >
      <Icon
        icon={themeMode === "dark" ? sunIcon : moonIcon}
        width="18"
        height="18"
      />
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
  </div>
</div>
<p class="hint">
  Pan with Alt + drag (or middle mouse drag). Copy/paste with Ctrl+C / Ctrl+V.
</p>

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

  .action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
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
    background: var(--surface-1);
    border: 0.125rem solid var(--border-1);
    border-radius: 0.625rem;
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }
</style>

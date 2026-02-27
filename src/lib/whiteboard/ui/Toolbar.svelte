<script lang="ts">
  import Icon from "@iconify/svelte";
  import squareIcon from "@iconify-icons/lucide/square";
  import circleIcon from "@iconify-icons/lucide/circle";
  import typeIcon from "@iconify-icons/lucide/type";
  import stickyIcon from "@iconify-icons/lucide/sticky-note";
  import backIcon from "@iconify-icons/lucide/arrow-left";
  import sunIcon from "@iconify-icons/lucide/sun";
  import moonIcon from "@iconify-icons/lucide/moon";
  import importIcon from "@iconify-icons/lucide/upload";
  import exportIcon from "@iconify-icons/lucide/download";

  export type CreateKind = "rectangle" | "ellipse" | "text" | "sticky";

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
    { label: "Rectangle", icon: squareIcon, kind: "rectangle" },
    { label: "Ellipse", icon: circleIcon, kind: "ellipse" },
    { label: "Text", icon: typeIcon, kind: "text" },
    { label: "Sticky", icon: stickyIcon, kind: "sticky" },
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
    z-index: 20;
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
    background-color: var(--backgroundDark);
    border: 1px solid var(--borderColor);
    box-shadow: var(--shadow-l);
  }

  .tools {
    position: fixed;
    left: 50%;
    bottom: 1rem;
    transform: translateX(-50%);
    z-index: 30;
    display: flex;
    gap: 0.5rem;
    padding: 1rem;

    border-radius: 1rem;
    background-color: var(--backgroundDark);
    border: 1px solid var(--borderColor);
    box-shadow: var(--shadow-l);
  }

  button,
  .import-button {
    border: 1px solid var(--border-1);
    color: var(--button-text);
    background: var(--button-bg);
    padding: 6px 10px;
    font-size: 14px;
    border-radius: 8px;
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
    width: 42px;
    height: 42px;
    padding: 0;
  }

  .action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
  }

  .hint {
    user-select: none;
    position: fixed;
    left: 50%;
    bottom: 100px;
    transform: translateX(-50%);
    z-index: 20;
    margin: 0;
    padding: 4px 10px;
    font-size: 0.875rem;
    color: var(--app-text-muted);
    background: var(--surface-1);
    border: 1px solid var(--border-1);
    border-radius: 10px;
  }
</style>

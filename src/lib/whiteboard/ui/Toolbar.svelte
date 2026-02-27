<script lang="ts">
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

  const createButtons: { label: string; kind: CreateKind }[] = [
    { label: "Rectangle", kind: "rectangle" },
    { label: "Ellipse", kind: "ellipse" },
    { label: "Text", kind: "text" },
    { label: "Sticky", kind: "sticky" },
  ];
</script>

<div class="toolbar">
  <div class="actions">
    {#if onBack}
      <button type="button" onclick={onBack}>← Back</button>
    {/if}
    <button type="button" onclick={onToggleTheme}
      >{themeMode === "dark" ? "Light mode" : "Dark mode"}</button
    >
    <button type="button" onclick={onExport}>Export JSON</button>
    <label class="import-button">
      Import JSON
      <input type="file" accept="application/json" onchange={onImport} />
    </label>
  </div>
  <div class="tools">
    {#each createButtons as button}
      <button type="button" onclick={() => onCreate(button.kind)}
        >{button.label}</button
      >
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

  .hint {
    user-select: none;
    position: fixed;
    left: 50%;
    bottom: 88px;
    transform: translateX(-50%);
    z-index: 20;
    margin: 0;
    padding: 4px 10px;
    font-size: 12px;
    color: var(--app-text-muted);
    background: var(--surface-1);
    border: 1px solid var(--border-1);
    border-radius: 10px;
  }
</style>

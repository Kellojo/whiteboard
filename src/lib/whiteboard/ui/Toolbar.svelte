<script lang="ts">
  export type CreateKind = "rectangle" | "ellipse" | "text" | "sticky";

  let {
    onCreate,
    onDelete,
    onExport,
    onImport,
  }: {
    onCreate: (kind: CreateKind) => void;
    onDelete: () => void;
    onExport: () => void;
    onImport: (event: Event) => void;
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
    <button type="button" onclick={onDelete}>Delete</button>
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
  Select mode is always active. Pan with Alt + drag (or middle mouse drag).
  Copy/paste with Ctrl+C / Ctrl+V.
</p>

<style>
  .toolbar {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 8px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }

  .tools {
    position: fixed;
    left: 50%;
    bottom: 16px;
    transform: translateX(-50%);
    z-index: 30;
    display: flex;
    gap: 8px;
    padding: 10px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
  }

  button,
  .import-button {
    border: 1px solid #d1d5db;
    background: #f9fafb;
    padding: 6px 10px;
    font-size: 14px;
    border-radius: 8px;
    cursor: pointer;
  }

  input[type="file"] {
    display: none;
  }

  .hint {
    user-select: none;
    position: fixed;
    left: 50%;
    bottom: 74px;
    transform: translateX(-50%);
    z-index: 20;
    margin: 0;
    padding: 4px 10px;
    font-size: 12px;
    color: #6b7280;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e5e7eb;
    border-radius: 10px;
  }
</style>

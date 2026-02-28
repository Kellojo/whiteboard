<script lang="ts">
  import Icon from "@iconify/svelte";
  import playIcon from "@iconify-icons/lucide/play";
  import squareIcon from "@iconify-icons/lucide/square";

  let {
    control,
    onToggle,
  }: {
    control: {
      id: string;
      x: number;
      y: number;
      interactive: boolean;
    };
    onToggle: (id: string) => void;
  } = $props();
</script>

<div
  class="video-mode-toolbar"
  style:left={`${control.x}px`}
  style:top={`${control.y}px`}
>
  <button
    type="button"
    class:active={control.interactive}
    title={control.interactive ? "Exit play mode" : "Enter play mode"}
    onclick={() => onToggle(control.id)}
  >
    <Icon
      icon={control.interactive ? squareIcon : playIcon}
      width="14"
      height="14"
    />
    {control.interactive ? "Stop" : "Play"}
  </button>
</div>

<style>
  .video-mode-toolbar {
    position: absolute;
    transform: translateX(-50%);
    z-index: 55;
    display: inline-flex;
    align-items: center;
    background: var(--surface-1);
    border: 1px solid var(--border-1);
    border-radius: 10px;
    padding: 6px;
    box-shadow: var(--shadow-m);
  }

  .video-mode-toolbar button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--border-1);
    background: var(--button-bg);
    color: var(--button-text);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
  }

  .video-mode-toolbar button:hover {
    background: var(--button-bg-hover);
    border-color: var(--border-2);
  }

  .video-mode-toolbar button.active {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
</style>

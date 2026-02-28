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
    z-index: var(--z-overlay);
    display: inline-flex;
    align-items: center;
    background: var(--surface-1);
    border: 0.125rem solid var(--border-1);
    border-radius: 0.625rem;
    padding: 0.375rem;
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  .video-mode-toolbar button {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    border: 0.0625rem solid var(--border-1);
    background: var(--button-bg);
    color: var(--button-text);
    border-radius: 0.5rem;
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .video-mode-toolbar button:hover {
    background: var(--button-bg-hover);
    border-color: var(--border-2);
  }

  .video-mode-toolbar button.active {
    outline: 0.125rem solid var(--accent);
    outline-offset: 0.0625rem;
  }
</style>

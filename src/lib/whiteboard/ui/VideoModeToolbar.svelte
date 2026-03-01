<script lang="ts">
  import Icon from "@iconify/svelte";
  import playIcon from "@iconify-icons/lucide/play";
  import squareIcon from "@iconify-icons/lucide/square";
  import Button from "$lib/ui/Button.svelte";

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
  <Button
    type="button"
    size="tiny"
    active={control.interactive}
    class="video-mode-toolbar-button"
    title={control.interactive ? "Exit play mode" : "Enter play mode"}
    onclick={() => onToggle(control.id)}
  >
    <Icon
      icon={control.interactive ? squareIcon : playIcon}
      width="14"
      height="14"
    />
    {control.interactive ? "Stop" : "Play"}
  </Button>
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

  :global(.video-mode-toolbar-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    border-radius: 0.5rem;
  }
</style>

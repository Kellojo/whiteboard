<div class="grid-background">
  <slot />
</div>

<style>
  .grid-background {
    --grid-size: 28px;
    --grid-line-color: var(--canvas-grid);
    --grid-line-opacity: 0.35;
    --grid-glow-1: color-mix(in oklab, var(--accent) 14%, transparent);
    --grid-glow-2: color-mix(in oklab, var(--accent) 10%, transparent);

    min-height: 100vh;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background: radial-gradient(
        circle at 20% 20%,
        var(--grid-glow-1),
        transparent 45%
      ),
      radial-gradient(circle at 80% 80%, var(--grid-glow-2), transparent 42%),
      var(--app-bg);
    color: var(--app-text);
  }

  :global(:root[data-theme="light"]) .grid-background {
    --grid-line-color: color-mix(in oklab, var(--border-1) 72%, var(--app-bg));
    --grid-line-opacity: 0.6;
    --grid-glow-1: color-mix(in oklab, var(--accent) 8%, transparent);
    --grid-glow-2: color-mix(in oklab, var(--accent) 5%, transparent);
  }

  .grid-background::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        var(--grid-line-color) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px);
    background-size: var(--grid-size) var(--grid-size);
    opacity: var(--grid-line-opacity);
    pointer-events: none;
    z-index: -1;
  }
</style>

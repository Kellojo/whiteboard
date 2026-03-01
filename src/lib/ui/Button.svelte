<script lang="ts">
  let {
    type = "button",
    disabled = false,
    fullWidth = false,
    icon = false,
    iconSize = "md",
    active = false,
    size = "md",
    class: className = "",
    children,
    ...buttonProps
  } = $props<{
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: boolean;
    iconSize?: "sm" | "md";
    active?: boolean;
    size?: "md" | "compact" | "tiny";
    class?: string;
    children?: () => unknown;
    [key: string]: unknown;
  }>();
</script>

<button
  class={`button-root button-root--${size} ${icon ? `button-root--icon button-root--icon-${iconSize}` : ""} ${fullWidth ? "button-root--full" : ""} ${active ? "button-root--active" : ""} ${className}`.trim()}
  {type}
  {disabled}
  {...buttonProps}
>
  {@render children?.()}
</button>

<style>
  .button-root {
    border: 0.0625rem solid var(--border-1);
    border-radius: 0.625rem;
    background: var(--button-bg);
    color: var(--button-text);
    padding: 0.625rem 0.75rem;
    font-size: 1rem;
    cursor: pointer;
    transition:
      background-color 140ms ease,
      border-color 140ms ease,
      opacity 140ms ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .button-root:hover:not(:disabled) {
    background: var(--button-bg-hover);
    border-color: var(--border-2);
  }

  .button-root:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .button-root--icon {
    padding: 0;
  }

  .button-root--icon-sm {
    width: 2.25rem;
    height: 2.25rem;
  }

  .button-root--icon-md {
    width: 2.625rem;
    height: 2.625rem;
  }

  .button-root--compact {
    font-size: 0.875rem;
    padding: 0.375rem 0.625rem;
  }

  .button-root--tiny {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .button-root--active {
    outline: 0.125rem solid var(--accent);
    outline-offset: 0.0625rem;
  }

  .button-root--full {
    width: 100%;
  }
</style>

<script lang="ts">
  let {
    type = "button",
    disabled = false,
    children,
    ...buttonProps
  } = $props<{
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    children?: () => unknown;
    [key: string]: unknown;
  }>();
</script>

<button class="auth-action-button" {type} {disabled} {...buttonProps}>
  {@render children?.()}
</button>

<style>
  .auth-action-button {
    width: 100%;
    border: 1px solid var(--border-1);
    border-radius: 0.625rem;
    background: var(--button-bg);
    color: var(--button-text);
    padding: 0.625rem 0.75rem;
    font-size: 1rem;
    cursor: pointer;
  }

  .auth-action-button:hover:not(:disabled) {
    background: var(--button-bg-hover);
  }

  .auth-action-button:disabled {
    opacity: 0.7;
    cursor: default;
  }
</style>

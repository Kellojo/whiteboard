<script lang="ts">
  let {
    label,
    value = $bindable(""),
    type = "text",
    ...inputProps
  } = $props<{
    label: string;
    value?: string;
    type?: string;
    [key: string]: unknown;
  }>();
</script>

<label class="auth-input-field">
  <span>{label}</span>
  <input {type} bind:value {...inputProps} />
</label>

<style>
  .auth-input-field {
    display: grid;
    gap: 0.375rem;
    font-size: 0.875rem;
  }

  .auth-input-field input {
    border: 1px solid var(--border-1);
    border-radius: 0.625rem;
    background: var(--surface-2);
    color: var(--app-text);
    padding: 0.625rem 0.75rem;
    font-size: 1rem;
  }
</style>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { authClient } from "$lib/auth-client";
  import Button from "$lib/ui/Button.svelte";
  import GridBackground from "$lib/ui/GridBackground.svelte";
  import AuthInputField from "$lib/ui/auth/AuthInputField.svelte";

  let { data } = $props<{
    data: {
      providers: { providerId: string; name: string }[];
      emailPasswordAuthEnabled: boolean;
    };
  }>();

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let errorMessage = $state("");
  let isSubmitting = $state(false);

  async function signUpWithEmail() {
    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    errorMessage = "";

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/",
      });

      if (result.error) {
        errorMessage = result.error.message || "Failed to sign up.";
        return;
      }

      await goto("/");
    } finally {
      isSubmitting = false;
    }
  }

  async function signInWithProvider(providerId: string) {
    await authClient.signIn.social({
      provider: providerId,
      callbackURL: "/",
      errorCallbackURL: "/auth/signup",
    });
  }
</script>

<GridBackground>
  <main class="auth-page">
    <section class="auth-card">
      <h1>Create account</h1>
      <p>Register to start using whiteboards.</p>

      {#if data.emailPasswordAuthEnabled}
        <form
          onsubmit={(event) => {
            event.preventDefault();
            void signUpWithEmail();
          }}
        >
          <AuthInputField
            label="Display name"
            type="text"
            bind:value={name}
            autocomplete="name"
            required
          />

          <AuthInputField
            label="Email"
            type="email"
            bind:value={email}
            autocomplete="email"
            required
          />

          <AuthInputField
            label="Password"
            type="password"
            bind:value={password}
            autocomplete="new-password"
            required
            minlength="8"
          />

          {#if errorMessage}
            <p class="error">{errorMessage}</p>
          {/if}

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      {:else}
        <p>Email/password sign-up is disabled.</p>
      {/if}

      {#if data.providers.length > 0}
        <div class="divider">or continue with OIDC</div>
        <div class="provider-list">
          {#each data.providers as provider}
            <Button
              type="button"
              fullWidth
              class="provider-button"
              onclick={() => void signInWithProvider(provider.providerId)}
            >
              {provider.name}
            </Button>
          {/each}
        </div>
      {/if}

      {#if data.emailPasswordAuthEnabled}
        <p class="switch-link">
          Already registered? <a href="/auth/login">Sign in</a>
        </p>
      {/if}
    </section>
  </main>
</GridBackground>

<style>
  .auth-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 20px;
  }

  .auth-card {
    width: min(100%, 420px);
    border: 1px solid var(--border-1);
    background: var(--surface-1);
    border-radius: 14px;
    padding: 22px;
    display: grid;
    gap: 12px;
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
  }

  h1,
  p {
    margin: 0;
  }

  h1 {
    font-size: 2rem;
  }

  p {
    color: var(--app-text-muted);
    font-size: 1rem;
  }

  form {
    display: grid;
    gap: 10px;
  }

  .divider {
    text-align: center;
    color: var(--app-text-muted);
    font-size: 0.875rem;
  }

  .provider-list {
    display: grid;
    gap: 8px;
  }

  .error {
    color: var(--danger);
    font-size: 0.875rem;
  }

  .switch-link {
    font-size: 0.875rem;
  }

  .switch-link a {
    color: var(--accent);
  }
</style>

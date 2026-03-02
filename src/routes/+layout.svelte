<script lang="ts">
  import Icon from "@iconify/svelte";
  import { page } from "$app/state";
  import logOutIcon from "@iconify-icons/lucide/log-out";
  import moonIcon from "@iconify-icons/lucide/moon";
  import sunIcon from "@iconify-icons/lucide/sun";
  import { onNavigate } from "$app/navigation";
  import { goto } from "$app/navigation";
  import { authClient } from "$lib/auth-client";
  import Button from "$lib/ui/Button.svelte";
  import { onMount } from "svelte";
  import favicon from "$lib/assets/favicon.svg";
  import "../app.css";
  import "../fonts.css";

  const THEME_STORAGE_KEY = "whiteboard-theme";
  let themeMode = $state<"light" | "dark">("dark");
  let { children, data } = $props();

  function applyTheme(mode: "light" | "dark", persist = true): void {
    themeMode = mode;
    document.documentElement.setAttribute("data-theme", mode);

    if (persist) {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  }

  function toggleTheme(): void {
    applyTheme(themeMode === "dark" ? "light" : "dark");
  }

  onNavigate((navigation) => {
    if (
      typeof document.startViewTransition !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    return new Promise<void>((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  async function signOut(): Promise<void> {
    await authClient.signOut();
    await goto("/auth/login");
  }

  onMount(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      applyTheme(stored, false);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      applyTheme(prefersDark ? "dark" : "light", false);
    }

    const observer = new MutationObserver(() => {
      const nextTheme = document.documentElement.getAttribute("data-theme");
      if (nextTheme === "light" || nextTheme === "dark") {
        themeMode = nextTheme;
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
    };
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<div class="top-actions">
  {#if data.user && !page.url.pathname.startsWith("/auth")}
    <Button
      type="button"
      class="top-action top-action-signout"
      aria-label="Sign out"
      title="Sign out"
      onclick={() => void signOut()}
    >
      <Icon icon={logOutIcon} width="16" height="16" />
      <span>Sign out</span>
    </Button>
  {/if}

  <Button
    type="button"
    icon
    class="top-action"
    aria-label={themeMode === "dark"
      ? "Switch to light mode"
      : "Switch to dark mode"}
    title={themeMode === "dark" ? "Light mode" : "Dark mode"}
    onclick={toggleTheme}
  >
    <Icon
      icon={themeMode === "dark" ? sunIcon : moonIcon}
      width="18"
      height="18"
    />
  </Button>
</div>

{#if !page.url.pathname.startsWith("/whiteboard")}
  <a
    class="site-watermark"
    href="https://github.com/Kellojo/whiteboard"
    target="_blank"
    rel="noopener noreferrer"
    title={`Open repository on GitHub (v${__APP_VERSION__})`}
  >
    <span class="repo">Kellojo/whiteboard</span>
    <span class="ver">v{__APP_VERSION__}</span>
  </a>
{/if}

<style>
  .top-actions {
    position: fixed;
    right: 1rem;
    top: 1rem;
    z-index: 80;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  :global(.top-action) {
    width: 36px;
    height: 36px;
    border-radius: 0.5rem;
    background: var(--surface-1);
    color: var(--app-text);
    box-shadow: var(--shadow-s);
    backdrop-filter: blur(var(--glass-blur));
  }

  :global(.top-action-signout) {
    width: auto;
    padding: 0 0.625rem;
    gap: 0.375rem;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
  }

  :global(.top-action-signout span) {
    line-height: 1;
  }

  .site-watermark {
    position: fixed;
    left: 50%;
    bottom: 0.5rem;
    transform: translateX(-50%);
    z-index: 80;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: var(--app-text-muted);
    background: transparent;
    padding: 0.125rem 0.375rem;
    border-radius: 0.375rem;
    text-decoration: none;
    opacity: 0.3;
    transition:
      opacity 120ms ease,
      transform 120ms ease;
    pointer-events: auto;
  }

  .site-watermark:hover {
    opacity: 1;
    transform: translateX(-50%) translateY(-1px);
  }

  .site-watermark .repo {
    font-weight: 600;
  }

  .site-watermark .ver {
    color: var(--app-text-muted);
    font-weight: 400;
    font-size: 0.6875rem;
  }
</style>

<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { IconifyIcon } from "@iconify/types";
  import {
    ICON_BROWSER_ITEMS,
    ICON_DROP_MIME,
    ICON_DROP_TEXT_PREFIX,
    loadIconData,
  } from "./iconCatalog";

  const ICON_BATCH_SIZE = 64;

  let search = $state("");
  let loadLimit = $state(ICON_BATCH_SIZE);
  let loadedIcons = $state<Record<string, IconifyIcon>>({});
  const loadingIconIds = new Set<string>();

  const filteredIcons = $derived.by(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return ICON_BROWSER_ITEMS;
    }

    return ICON_BROWSER_ITEMS.filter((item) => {
      return (
        item.label.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    });
  });

  const visibleIcons = $derived.by(() => {
    const query = search.trim();
    if (query.length > 0) {
      return filteredIcons;
    }
    return filteredIcons.slice(0, loadLimit);
  });

  const canLoadMore = $derived.by(() => {
    const query = search.trim();
    if (query.length > 0) {
      return false;
    }
    return loadLimit < filteredIcons.length;
  });

  $effect(() => {
    const query = search.trim();
    if (query.length > 0) {
      loadLimit = ICON_BATCH_SIZE;
      return;
    }
    loadLimit = Math.max(loadLimit, ICON_BATCH_SIZE);
  });

  $effect(() => {
    for (const item of visibleIcons) {
      if (loadedIcons[item.id] || loadingIconIds.has(item.id)) {
        continue;
      }
      loadingIconIds.add(item.id);
      void loadIconData(item.id).then((iconData) => {
        loadingIconIds.delete(item.id);
        if (!iconData) {
          return;
        }
        loadedIcons = {
          ...loadedIcons,
          [item.id]: iconData,
        };
      });
    }
  });

  function handleLoadMore() {
    loadLimit += ICON_BATCH_SIZE;
  }

  function handleDragStart(event: DragEvent, iconId: string) {
    if (!event.dataTransfer) {
      return;
    }

    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(ICON_DROP_MIME, iconId);
    event.dataTransfer.setData(
      "text/plain",
      `${ICON_DROP_TEXT_PREFIX}${iconId}`,
    );
  }
</script>

<aside
  class="icon-browser"
  aria-label="Icon browser"
  data-icon-browser-panel="true"
>
  <div class="browser-header">Icons</div>
  <input
    class="search"
    type="search"
    placeholder="Search icons"
    bind:value={search}
  />

  {#if filteredIcons.length === 0}
    <p class="empty">No icons found.</p>
  {:else}
    <div class="icon-grid">
      {#each visibleIcons as item (item.id)}
        <button
          type="button"
          class="icon-item"
          draggable="true"
          title={`Drag ${item.label}`}
          aria-label={`Drag ${item.label}`}
          ondragstart={(event) => handleDragStart(event, item.id)}
        >
          {#if loadedIcons[item.id]}
            <Icon icon={loadedIcons[item.id]} width="20" height="20" />
          {:else}
            <span class="icon-placeholder" aria-hidden="true"></span>
          {/if}
        </button>
      {/each}

      {#if canLoadMore}
        <button type="button" class="load-more" onclick={handleLoadMore}>
          Load more
        </button>
      {/if}
    </div>
  {/if}

  <p class="license-note">
    Icons: Lucide (ISC)
    <a
      href="https://github.com/lucide-icons/lucide/blob/main/LICENSE"
      target="_blank"
      rel="noreferrer">License</a
    >
  </p>
</aside>

<style>
  .icon-browser {
    position: fixed;
    left: 50%;
    bottom: 7rem;
    transform: translateX(-50%);
    z-index: var(--z-static-layers);
    width: min(16.5rem, 42vw);
    max-height: min(70vh, 32rem);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 0.125rem solid var(--border-1);
    border-radius: 0.75rem;
    background: var(--surface-1);
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  .browser-header {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--app-text);
  }

  .search {
    width: 100%;
    border: 0.0625rem solid var(--border-1);
    border-radius: 0.5rem;
    background: var(--button-bg);
    color: var(--button-text);
    padding: 0.375rem 0.5rem;
    font-size: 0.8125rem;
    outline: none;
  }

  .search:focus {
    border-color: var(--border-2);
  }

  .icon-grid {
    overflow: auto;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.375rem;
    padding-right: 0.125rem;
    scrollbar-width: thin;
    scrollbar-color: var(--border-2) transparent;
  }

  .icon-grid::-webkit-scrollbar {
    width: 0.5rem;
  }

  .icon-grid::-webkit-scrollbar-track {
    background: transparent;
  }

  .icon-grid::-webkit-scrollbar-thumb {
    background: var(--border-2);
    border-radius: 62.4375rem;
    border: 0.125rem solid transparent;
    background-clip: content-box;
  }

  .icon-grid::-webkit-scrollbar-thumb:hover {
    background: var(--button-bg-hover);
    background-clip: content-box;
  }

  .icon-item {
    border: 0.0625rem solid var(--border-1);
    background: var(--button-bg);
    color: var(--button-text);
    border-radius: 0.5rem;
    width: 2.25rem;
    height: 2.25rem;
    cursor: grab;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .icon-item:active {
    cursor: grabbing;
  }

  .icon-item:hover {
    background: var(--button-bg-hover);
    border-color: var(--border-2);
  }

  .icon-placeholder {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border-radius: 0.25rem;
    background: var(--border-1);
  }

  .load-more {
    grid-column: 1 / -1;
    border: 0.0625rem solid var(--border-1);
    background: var(--button-bg);
    color: var(--button-text);
    border-radius: 0.5rem;
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .load-more:hover {
    background: var(--button-bg-hover);
    border-color: var(--border-2);
  }

  .empty {
    margin: 0;
    font-size: 0.75rem;
    color: var(--app-text-muted);
  }

  .license-note {
    margin: 0;
    font-size: 0.6875rem;
    color: var(--app-text-muted);
    text-align: center;
  }

  .license-note a {
    color: var(--app-text-muted);
  }

  .license-note a:hover {
    color: var(--app-text);
  }
</style>

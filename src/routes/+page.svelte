<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  interface BoardMeta {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }

  let boards: BoardMeta[] = [];
  let isLoading = true;
  let isCreating = false;
  let deletingBoardId: string | null = null;
  let newBoardName = "";

  async function loadBoards() {
    isLoading = true;
    try {
      const response = await fetch("/api/boards");
      if (!response.ok) {
        throw new Error("Failed to load boards");
      }

      const payload = (await response.json()) as { boards: BoardMeta[] };
      boards = payload.boards;
    } catch (error) {
      console.error(error);
    } finally {
      isLoading = false;
    }
  }

  async function createBoard() {
    if (isCreating) {
      return;
    }

    isCreating = true;
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create board");
      }

      const payload = (await response.json()) as {
        board: { id: string };
      };
      newBoardName = "";
      await goto(`/whiteboard/${payload.board.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      isCreating = false;
    }
  }

  async function deleteBoardById(boardMeta: BoardMeta) {
    if (deletingBoardId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete board \"${boardMeta.name}\"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    deletingBoardId = boardMeta.id;
    try {
      const response = await fetch(`/api/boards/${boardMeta.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete board");
      }

      boards = boards.filter((board) => board.id !== boardMeta.id);
    } catch (error) {
      console.error(error);
    } finally {
      deletingBoardId = null;
    }
  }

  function formatUpdatedDate(isoDate: string): string {
    return new Date(isoDate).toLocaleString();
  }

  onMount(() => {
    void loadBoards();
  });
</script>

<main class="explorer-page">
  <header class="explorer-header">
    <h1>Whiteboards</h1>
    <p>Choose a board like a file explorer, or create a new one.</p>
  </header>

  <section class="create-row">
    <input
      type="text"
      placeholder="New board name"
      bind:value={newBoardName}
      onkeydown={(event) => {
        if (event.key === "Enter") {
          void createBoard();
        }
      }}
    />
    <button
      type="button"
      disabled={isCreating}
      onclick={() => void createBoard()}
    >
      {isCreating ? "Creating..." : "Create board"}
    </button>
  </section>

  <section class="board-list" aria-busy={isLoading}>
    {#if isLoading}
      <p class="empty-state">Loading boards...</p>
    {:else if boards.length === 0}
      <p class="empty-state">No boards yet. Create your first board.</p>
    {:else}
      {#each boards as boardMeta}
        <div class="board-row">
          <a class="board-link" href={`/whiteboard/${boardMeta.id}`}>
            <div class="board-name">{boardMeta.name}</div>
            <div class="board-date">
              Updated {formatUpdatedDate(boardMeta.updatedAt)}
            </div>
          </a>
          <button
            type="button"
            class="delete-button"
            disabled={deletingBoardId === boardMeta.id}
            onclick={() => void deleteBoardById(boardMeta)}
          >
            {deletingBoardId === boardMeta.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      {/each}
    {/if}
  </section>
</main>

<style>
  .explorer-page {
    max-width: 920px;
    margin: 0 auto;
    padding: 40px 20px;
    color: var(--app-text);
  }

  .explorer-header {
    margin-bottom: 18px;
  }

  .explorer-header h1 {
    margin: 0;
    font-size: 30px;
  }

  .explorer-header p {
    margin: 6px 0 0;
    color: var(--app-text-muted);
  }

  .create-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    margin-bottom: 16px;
  }

  .create-row input {
    border: 1px solid var(--border-1);
    border-radius: 10px;
    background: var(--surface-1);
    color: var(--app-text);
    padding: 10px 12px;
    font-size: 14px;
  }

  .create-row button {
    border: 1px solid var(--border-1);
    border-radius: 10px;
    background: var(--button-bg);
    color: var(--button-text);
    padding: 10px 14px;
    font-size: 14px;
    cursor: pointer;
  }

  .board-list {
    border: 1px solid var(--border-1);
    border-radius: 12px;
    background: var(--surface-1);
    overflow: hidden;
  }

  .board-row {
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--border-1);
  }

  .board-row:last-child {
    border-bottom: none;
  }

  .board-link {
    display: flex;
    flex: 1;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    color: var(--app-text);
    text-decoration: none;
  }

  .board-link:hover {
    background: var(--surface-2);
  }

  .delete-button {
    margin-right: 10px;
    border: 1px solid var(--border-1);
    border-radius: 8px;
    background: var(--button-bg);
    color: var(--button-text);
    padding: 6px 10px;
    font-size: 13px;
    cursor: pointer;
  }

  .delete-button:hover:enabled {
    background: var(--button-bg-hover);
  }

  .delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .board-name {
    font-weight: 600;
  }

  .board-date {
    color: var(--app-text-muted);
    font-size: 13px;
  }

  .empty-state {
    margin: 0;
    padding: 16px;
    color: var(--app-text-muted);
  }
</style>

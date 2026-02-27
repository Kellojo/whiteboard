<script lang="ts">
  import Icon from "@iconify/svelte";
  import backIcon from "@iconify-icons/lucide/arrow-left";
</script>

<section class="empty-whiteboard-page">
  <h1>Select a board</h1>
  <p>Open a board from the explorer on the home page first.</p>
  <a href="/">
    <Icon icon={backIcon} width="16" height="16" />
    Go to board explorer
  </a>
</section>

<style>
  .empty-whiteboard-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 8px;
    color: var(--app-text);
    background: var(--app-bg);
  }

  h1,
  p {
    margin: 0;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--accent);
  }
</style>

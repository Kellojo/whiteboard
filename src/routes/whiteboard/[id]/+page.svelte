<script lang="ts">
  import Whiteboard from "$lib/whiteboard/ui/Whiteboard.svelte";

  let { data } = $props<{ data: { boardId: string } }>();
</script>

<Whiteboard boardId={data.boardId} />

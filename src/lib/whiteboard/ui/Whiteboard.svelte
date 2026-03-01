<script lang="ts">
  import Icon from "@iconify/svelte";
  import arrowUpIcon from "@iconify-icons/lucide/arrow-up";
  import arrowDownIcon from "@iconify-icons/lucide/arrow-down";
  import chevronsUpIcon from "@iconify-icons/lucide/chevrons-up";
  import chevronsDownIcon from "@iconify-icons/lucide/chevrons-down";
  import { flip } from "svelte/animate";
  import { get } from "svelte/store";
  import { onMount, tick } from "svelte";
  import { fade } from "svelte/transition";
  import type { BoardJSON } from "../domain/Board";
  import { BoardController } from "../application/BoardController";
  import type { EditableTextTarget } from "../application/BoardController";
  import { SerializationService } from "../application/SerializationService";
  import { VideoElement } from "../domain/VideoElement";
  import type { CanvasElementJSON, Point } from "../domain/types";
  import { board, selectedElementIds, viewport } from "../stores";
  import CanvasRenderer from "./CanvasRenderer.svelte";
  import IconBrowser from "./IconBrowser.svelte";
  import InlineTextEditor from "./InlineTextEditor.svelte";
  import SelectedOverlay from "./SelectedOverlay.svelte";
  import VideoModeToolbar from "./VideoModeToolbar.svelte";
  import Toolbar, { type CreateKind } from "./Toolbar.svelte";
  import { createIconSvgData } from "./iconCatalog";

  let { boardId = null }: { boardId?: string | null } = $props();

  const controller = new BoardController(board, viewport, selectedElementIds);
  const THEME_STORAGE_KEY = "whiteboard-theme";

  let cursorWorld: Point = { x: 0, y: 0 };
  let themeMode = $state<"light" | "dark">("dark");
  let boardName = $state("Untitled board");
  let boardNameDraft = $state("");
  let isEditingBoardName = $state(false);
  let boardNameInput = $state<HTMLInputElement | null>(null);
  let iconBrowserOpen = $state(false);
  let freeDrawMode = $state(false);
  let freeDrawColor = $state(controller.getFreeDrawColor());
  let freeDrawStrokeWidth = $state(controller.getFreeDrawStrokeWidth());
  let snapEnabled = $state(true);
  let isBoardLoading = $state(false);
  let autosaveTimer = $state<ReturnType<typeof setTimeout> | null>(null);
  let hasLoadedRemoteBoard = $state(false);
  let lastSavedSignature = $state("");
  let copiedSnapshots: CanvasElementJSON[] = [];
  let selectedOverlay = $state<{
    x: number;
    y: number;
    style: NonNullable<ReturnType<BoardController["getSelectedStyleState"]>>;
  } | null>(null);
  let textEditor = $state<EditableTextTarget | null>(null);
  let layerItems = $state<ReturnType<BoardController["getLayerItems"]>>([]);
  let videoOverlays = $state<
    {
      id: string;
      embedUrl: string;
      left: number;
      top: number;
      width: number;
      height: number;
      zIndex: number;
      interactive: boolean;
    }[]
  >([]);
  let interactiveVideoId = $state<string | null>(null);
  let selectedVideoControl = $state<{
    id: string;
    x: number;
    y: number;
    interactive: boolean;
  } | null>(null);

  function handleCursorWorldChange(point: Point) {
    cursorWorld = point;
  }

  function setTheme(mode: "light" | "dark") {
    themeMode = mode;
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }

  function toggleTheme() {
    setTheme(themeMode === "dark" ? "light" : "dark");
  }

  function getCurrentPayloadText(): string {
    return SerializationService.exportBoard(get(board), {
      viewport: get(viewport),
    });
  }

  async function persistBoardIfChanged(): Promise<void> {
    if (!boardId || !hasLoadedRemoteBoard) {
      return;
    }

    const payloadText = getCurrentPayloadText();
    if (payloadText === lastSavedSignature) {
      return;
    }

    const payload = JSON.parse(payloadText) as BoardJSON;
    const response = await fetch(`/api/boards/${boardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });

    if (response.ok) {
      lastSavedSignature = payloadText;
    }
  }

  async function handleBack() {
    try {
      if (textEditor) {
        commitTextEditor();
      }
      await persistBoardIfChanged();
    } catch (error) {
      console.error(error);
    }
    window.location.assign("/");
  }

  async function loadBoardFromServer(id: string) {
    isBoardLoading = true;
    try {
      const response = await fetch(`/api/boards/${id}`);
      if (!response.ok) {
        throw new Error("Failed to load board");
      }

      const result = (await response.json()) as {
        board: { name: string; payload: BoardJSON };
      };
      const payloadText = JSON.stringify(result.board.payload);
      boardName = result.board.name;
      const imported = SerializationService.importBoard(payloadText);
      board.set(imported.board);
      viewport.set(imported.viewport ?? { zoom: 1, offsetX: 0, offsetY: 0 });
      selectedElementIds.set(new Set());
      hasLoadedRemoteBoard = true;
      lastSavedSignature = payloadText;
    } catch (error) {
      console.error(error);
    } finally {
      isBoardLoading = false;
    }
  }

  function queueAutosave() {
    if (!boardId || !hasLoadedRemoteBoard) {
      return;
    }

    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
    }

    autosaveTimer = setTimeout(async () => {
      autosaveTimer = null;
      try {
        await persistBoardIfChanged();
      } catch (error) {
        console.error(error);
      }
    }, 700);
  }

  function handleCreate(kind: CreateKind) {
    freeDrawMode = false;
    controller.setFreeDrawEnabled(false);
    const currentViewport = get(viewport);
    const centerWorld = {
      x: window.innerWidth / 2 / currentViewport.zoom - currentViewport.offsetX,
      y:
        window.innerHeight / 2 / currentViewport.zoom - currentViewport.offsetY,
    };
    controller.createElement(kind, centerWorld);
  }

  function handleDelete() {
    controller.deleteSelection();
  }

  function handleToggleFreeDrawMode() {
    freeDrawMode = !freeDrawMode;
    controller.setFreeDrawEnabled(freeDrawMode);
  }

  function handleSetFreeDrawColor(color: string) {
    freeDrawColor = color;
    controller.setFreeDrawColor(color);
  }

  function handleSetFreeDrawStrokeWidth(width: number) {
    freeDrawStrokeWidth = width;
    controller.setFreeDrawStrokeWidth(width);
  }

  function startBoardNameEdit() {
    boardNameDraft = boardName;
    isEditingBoardName = true;
    tick().then(() => {
      boardNameInput?.focus();
      boardNameInput?.select();
    });
  }

  function cancelBoardNameEdit() {
    isEditingBoardName = false;
    boardNameDraft = boardName;
  }

  async function commitBoardNameEdit() {
    if (!isEditingBoardName) {
      return;
    }

    const trimmed = boardNameDraft.trim();
    const nextName = trimmed.length > 0 ? trimmed : "Untitled board";
    isEditingBoardName = false;

    if (nextName === boardName) {
      return;
    }

    if (!boardId) {
      boardName = nextName;
      return;
    }

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename board");
      }

      const result = (await response.json()) as {
        board?: { name?: string };
      };
      boardName = result.board?.name?.trim() || nextName;
      boardNameDraft = boardName;
    } catch (error) {
      console.error(error);
    }
  }

  function handleToggleIconBrowser() {
    iconBrowserOpen = !iconBrowserOpen;
  }

  function handleGlobalPointerDown(event: PointerEvent) {
    if (!iconBrowserOpen) {
      return;
    }

    if (!(event.target instanceof Element)) {
      iconBrowserOpen = false;
      return;
    }

    if (
      event.target.closest("[data-icon-browser-panel='true']") ||
      event.target.closest("[data-icon-browser-toggle='true']")
    ) {
      return;
    }

    iconBrowserOpen = false;
  }

  function handleToggleSnapping() {
    snapEnabled = !snapEnabled;
    controller.setSnappingEnabled(snapEnabled);
  }

  function handleExport() {
    const boardState = get(board);
    const payload = SerializationService.exportBoard(boardState, {
      viewport: get(viewport),
    });
    const blob = new Blob([payload], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `whiteboard-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(href);
  }

  async function handleImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const payload = await file.text();
    const imported = SerializationService.importBoard(payload);
    board.set(imported.board);
    if (imported.viewport) {
      viewport.set(imported.viewport);
    }
    selectedElementIds.set(new Set());
    input.value = "";
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLElement && event.target.isContentEditable) {
      return;
    }
    if (event.target instanceof HTMLInputElement) {
      return;
    }
    if (event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.key === "Escape" && interactiveVideoId) {
      interactiveVideoId = null;
      return;
    }

    if (textEditor) {
      return;
    }

    const isCopy =
      event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "c";
    const isDelete = event.key === "Delete";

    if (isCopy) {
      copiedSnapshots = controller.copySelectionSnapshots();
      if (copiedSnapshots.length > 0) {
        event.preventDefault();
      }
    }

    if (isDelete) {
      const hasSelection = get(selectedElementIds).size > 0;
      if (hasSelection) {
        event.preventDefault();
        controller.deleteSelection();
      }
    }
  }

  onMount(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const unsubscribeBoard = board.subscribe(() => {
      if (hasLoadedRemoteBoard) {
        queueAutosave();
      }
    });
    const unsubscribeViewport = viewport.subscribe(() => {
      if (hasLoadedRemoteBoard) {
        queueAutosave();
      }
    });

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("paste", handlePaste);
    window.addEventListener("pointerdown", handleGlobalPointerDown);

    if (boardId) {
      void loadBoardFromServer(boardId);
    }

    return () => {
      unsubscribeBoard();
      unsubscribeViewport();
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
        autosaveTimer = null;
      }
      if (textEditor) {
        commitTextEditor();
      }
      void persistBoardIfChanged();
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
    };
  });

  async function handlePaste(event: ClipboardEvent) {
    if (textEditor) {
      return;
    }

    const files = extractImageFilesFromClipboard(event);
    if (files.length > 0) {
      event.preventDefault();
      await addImageFilesAt(files, cursorWorld);
      return;
    }

    const plainText = event.clipboardData?.getData("text/plain") ?? "";
    if (plainText.trim().length > 0) {
      const createdVideo = controller.addYouTubeVideoElement(
        plainText,
        cursorWorld,
      );
      if (createdVideo) {
        event.preventDefault();
        return;
      }
    }

    if (copiedSnapshots.length > 0) {
      event.preventDefault();
      controller.pasteSnapshotsAt(copiedSnapshots, cursorWorld);
      return;
    }

    if (plainText.trim().length > 0) {
      event.preventDefault();
      controller.addTextElement(plainText, cursorWorld);
    }
  }

  function getVideoOverlayItems() {
    const dpr = window.devicePixelRatio || 1;
    const scale = $viewport.zoom / dpr;

    return $board
      .getAllElements()
      .map((element, index) => ({ element, index }))
      .flatMap(({ element, index }) => {
        const snapshot = element.toJSON();
        if (snapshot.type !== "video") {
          return [];
        }

        if (element.isSelected) {
          return [];
        }

        const embedUrl = VideoElement.toEmbedUrl(snapshot.videoUrl ?? "");
        if (!embedUrl) {
          return [];
        }

        const interactive = interactiveVideoId === element.id;
        const shouldRender = !element.isSelected || interactive;
        if (!shouldRender) {
          return [];
        }

        return [
          {
            id: element.id,
            embedUrl,
            left: (element.x + $viewport.offsetX) * scale,
            top: (element.y + $viewport.offsetY) * scale,
            width: Math.max(120, element.width * scale),
            height: Math.max(80, element.height * scale),
            zIndex: 10 + index,
            interactive,
          },
        ];
      });
  }

  async function handleImageDrop(files: File[], worldPoint: Point) {
    await addImageFilesAt(files, worldPoint);
  }

  async function handleIconDrop(iconId: string, worldPoint: Point) {
    const iconSvg = await createIconSvgData(iconId);
    if (!iconSvg) {
      return;
    }

    const scale = 3;
    const iconColor = "#111827";
    controller.addImageElement(
      iconSvg.dataUrl,
      worldPoint,
      {
        width: iconSvg.width * scale,
        height: iconSvg.height * scale,
      },
      {
        iconId,
        iconColor,
      },
    );
  }

  async function addImageFilesAt(files: File[], worldPoint: Point) {
    for (const file of files) {
      const imageDataUrl = await fileToDataUrl(file);
      const naturalSize = await readImageSize(imageDataUrl);
      controller.addImageElement(imageDataUrl, worldPoint, naturalSize);
    }
  }

  function extractImageFilesFromClipboard(event: ClipboardEvent): File[] {
    const items = event.clipboardData?.items;
    if (!items) {
      return [];
    }

    const files: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
    return files;
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  }

  function readImageSize(
    dataUrl: string,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => reject(new Error("Failed to decode image"));
      image.src = dataUrl;
    });
  }

  function getSelectedOverlayState() {
    if (textEditor) {
      return null;
    }

    const element = controller.getSingleSelectedElement();
    if (!element) {
      return null;
    }

    const style = controller.getSelectedStyleState();
    if (!style) {
      return null;
    }

    if (
      !style.controls.fillColor &&
      !style.controls.borderColor &&
      !style.controls.textColor &&
      !style.controls.iconColor &&
      !style.controls.textAlign &&
      !style.controls.fontSize &&
      !style.controls.fontWeight
    ) {
      return null;
    }

    const dpr = window.devicePixelRatio || 1;
    const centerX =
      ((element.x + element.width / 2 + $viewport.offsetX) * $viewport.zoom) /
      dpr;
    const topY = ((element.y + $viewport.offsetY) * $viewport.zoom) / dpr;

    return {
      x: centerX,
      y: Math.max(10, topY - 56),
      style,
    };
  }

  function getSelectedVideoControlState() {
    const element = controller.getSingleSelectedElement();
    if (!element) {
      return null;
    }

    if (element.toJSON().type !== "video") {
      return null;
    }

    const dpr = window.devicePixelRatio || 1;
    const centerX =
      ((element.x + element.width / 2 + $viewport.offsetX) * $viewport.zoom) /
      dpr;
    const topY = ((element.y + $viewport.offsetY) * $viewport.zoom) / dpr;

    return {
      id: element.id,
      x: centerX,
      y: Math.max(10, topY - 56),
      interactive: interactiveVideoId === element.id,
    };
  }

  function toggleVideoPlayMode(id: string) {
    interactiveVideoId = interactiveVideoId === id ? null : id;
  }

  $effect(() => {
    $board;
    $viewport;
    $selectedElementIds;
    const nextSelectedOverlay = getSelectedOverlayState();
    const nextSelectedVideoControl = getSelectedVideoControlState();

    selectedOverlay = nextSelectedOverlay;
    selectedVideoControl = nextSelectedVideoControl;
    layerItems = controller.getLayerItems();
    videoOverlays = getVideoOverlayItems();

    if (
      interactiveVideoId &&
      $selectedElementIds.size > 0 &&
      !$selectedElementIds.has(interactiveVideoId)
    ) {
      interactiveVideoId = null;
    }
  });

  function handleCanvasDoubleClick(worldPoint: Point) {
    const hit = controller.getElementAt(worldPoint);
    if (hit?.toJSON().type === "video") {
      controller.selectSingleElement(hit.id);
      tick().then(() => {
        interactiveVideoId = hit.id;
      });
      return;
    }

    const target = controller.getEditableTextTargetAt(worldPoint);
    if (!target) {
      return;
    }

    textEditor = {
      id: target.id,
      text: target.text,
      kind: target.kind,
      x: target.x,
      y: target.y,
      width: target.width,
      height: target.height,
      fontSize: target.fontSize,
      fillColor: target.fillColor,
      borderColor: target.borderColor,
      textColor: target.textColor,
      textAlign: target.textAlign,
      fontWeight: target.fontWeight,
    };
  }

  function commitTextEditor() {
    if (!textEditor) {
      return;
    }
    controller.updateElementText(textEditor.id, textEditor.text);
    textEditor = null;
  }

  function cancelTextEditor() {
    textEditor = null;
  }

  function updateTextEditorText(text: string) {
    if (!textEditor) {
      return;
    }

    textEditor = {
      ...textEditor,
      text,
    };
  }
</script>

<section class="whiteboard-shell">
  {#if isEditingBoardName}
    <input
      class="board-title board-title-input"
      bind:this={boardNameInput}
      bind:value={boardNameDraft}
      maxlength="80"
      onblur={commitBoardNameEdit}
      onkeydown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void commitBoardNameEdit();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          cancelBoardNameEdit();
        }
      }}
    />
  {:else}
    <button
      type="button"
      class="board-title board-title-button"
      title="Click to rename board"
      onclick={startBoardNameEdit}
    >
      {boardName}
    </button>
  {/if}

  {#if isBoardLoading}
    <div class="board-loading">Loading board...</div>
  {/if}

  <Toolbar
    onBack={boardId ? handleBack : undefined}
    onCreate={handleCreate}
    onDelete={handleDelete}
    {freeDrawMode}
    {freeDrawColor}
    {freeDrawStrokeWidth}
    onToggleFreeDrawMode={handleToggleFreeDrawMode}
    onSetFreeDrawColor={handleSetFreeDrawColor}
    onSetFreeDrawStrokeWidth={handleSetFreeDrawStrokeWidth}
    {iconBrowserOpen}
    onToggleIconBrowser={handleToggleIconBrowser}
    {snapEnabled}
    onToggleSnapping={handleToggleSnapping}
    onExport={handleExport}
    onImport={handleImport}
    {themeMode}
    onToggleTheme={toggleTheme}
  />
  {#if iconBrowserOpen}
    <IconBrowser />
  {/if}
  <div class="board-area">
    <CanvasRenderer
      board={$board}
      viewport={$viewport}
      {controller}
      onCursorWorldChange={handleCursorWorldChange}
      onImageDrop={handleImageDrop}
      onIconDrop={handleIconDrop}
      onDoubleClick={handleCanvasDoubleClick}
    />
  </div>

  {#each videoOverlays as video (video.id)}
    <div
      class="video-overlay"
      style:left={`${video.left}px`}
      style:top={`${video.top}px`}
      style:width={`${video.width}px`}
      style:height={`${video.height}px`}
      style:z-index={`${video.zIndex}`}
      class:interactive={video.interactive}
    >
      <iframe
        class="video-frame"
        src={video.embedUrl}
        title="Embedded video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    </div>
  {/each}

  {#if $selectedElementIds.size > 0}
    <aside class="layers-panel" transition:fade={{ duration: 140 }}>
      <header class="layers-header">Layers</header>

      {#if layerItems.length === 0}
        <p class="layers-empty">No layers yet.</p>
      {:else}
        <div class="layers-list">
          {#each layerItems as layer (layer.id)}
            <div
              class="layer-row"
              class:selected={layer.isSelected}
              in:fade={{ duration: 110 }}
              out:fade={{ duration: 90 }}
              animate:flip={{ duration: 180 }}
            >
              <button
                type="button"
                class="layer-main"
                title={`${layer.type} layer`}
                onclick={() => controller.selectSingleElement(layer.id)}
              >
                <span class="layer-title">{layer.title}</span>
                <span class="layer-type">{layer.type}</span>
              </button>

              <div class="layer-actions">
                <button
                  type="button"
                  title="Send to back"
                  disabled={!layer.canMoveBackward}
                  onclick={(event) => {
                    event.stopPropagation();
                    controller.sendLayerToBack(layer.id);
                  }}
                >
                  <Icon icon={chevronsDownIcon} width="14" height="14" />
                </button>
                <button
                  type="button"
                  title="Move backward"
                  disabled={!layer.canMoveBackward}
                  onclick={(event) => {
                    event.stopPropagation();
                    controller.moveLayerBackward(layer.id);
                  }}
                >
                  <Icon icon={arrowDownIcon} width="14" height="14" />
                </button>
                <button
                  type="button"
                  title="Move forward"
                  disabled={!layer.canMoveForward}
                  onclick={(event) => {
                    event.stopPropagation();
                    controller.moveLayerForward(layer.id);
                  }}
                >
                  <Icon icon={arrowUpIcon} width="14" height="14" />
                </button>
                <button
                  type="button"
                  title="Bring to front"
                  disabled={!layer.canMoveForward}
                  onclick={(event) => {
                    event.stopPropagation();
                    controller.bringLayerToFront(layer.id);
                  }}
                >
                  <Icon icon={chevronsUpIcon} width="14" height="14" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </aside>
  {/if}

  {#if textEditor}
    <InlineTextEditor
      editor={textEditor}
      viewport={$viewport}
      onChange={updateTextEditorText}
      onCommit={commitTextEditor}
      onCancel={cancelTextEditor}
    />
  {/if}

  {#if selectedOverlay}
    <SelectedOverlay overlay={selectedOverlay} {controller} />
  {/if}

  {#if selectedVideoControl}
    <VideoModeToolbar
      control={selectedVideoControl}
      onToggle={toggleVideoPlayMode}
    />
  {/if}
</section>

<style>
  .whiteboard-shell {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--app-bg);
  }

  .board-area {
    flex: 1;
    min-height: 0;
  }

  .board-loading {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: var(--z-static-status);
    border: 0.125rem solid var(--border-1);
    background: var(--surface-1);
    color: var(--app-text-muted);
    border-radius: 0.625rem;
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  .layers-panel {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: var(--z-static-layers);
    width: min(20rem, 32vw);
    max-height: calc(100vh - 2rem);
    overflow: auto;
    border: 0.125rem solid var(--border-1);
    background: var(--surface-1);
    border-radius: 0.75rem;
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  .layers-header {
    position: sticky;
    top: 0;
    z-index: var(--z-board-content);
    padding: 1rem;
    font-size: 1rem;
    font-weight: 600;
    border-bottom: 0.0625rem solid var(--border-1);
    background: var(--surface-1);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  .layers-empty {
    margin: 0;
    padding: 0.75rem;
    font-size: 0.75rem;
    color: var(--app-text-muted);
  }

  .layers-list {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .layer-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.375rem;
    border: 0.0625rem solid var(--border-1);
    border-radius: 0.5rem;
    background: var(--backgroundLight);
  }

  .layer-row.selected {
    border-color: var(--accent);
  }

  .layer-main {
    border: none;
    background: transparent;
    color: var(--app-text);
    padding: 0.5rem;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .layer-title {
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .layer-type {
    font-size: 0.6875rem;
    color: var(--app-text-muted);
    text-transform: capitalize;
  }

  .layer-actions {
    display: grid;
    grid-template-columns: repeat(2, 1.75rem);
    grid-template-rows: repeat(2, 1.75rem);
    gap: 0.25rem;
    padding: 0.375rem;
  }

  .layer-actions button {
    border: 0.0625rem solid var(--border-1);
    background: var(--button-bg);
    color: var(--button-text);
    border-radius: 0.375rem;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .layer-actions button:hover:enabled {
    background: var(--button-bg-hover);
    border-color: var(--border-2);
  }

  .layer-actions button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .board-title {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-static-title);
    max-width: min(70vw, 42.5rem);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 0.125rem solid var(--border-1);
    background: var(--surface-1);
    color: var(--app-text);
    border-radius: 0.625rem;
    padding: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    box-shadow: var(--shadow-l);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
  }

  .board-title-button {
    cursor: text;
    text-align: center;
  }

  .board-title-input {
    outline: none;
    text-align: center;
  }

  .board-title-input:focus {
    border-color: var(--border-2);
  }

  .video-overlay {
    position: absolute;
    overflow: hidden;
    border-radius: 0.625rem;
    border: 0.0625rem solid var(--border-2);
    background: #000;
    box-shadow: var(--shadow-m);
    pointer-events: none;
  }

  .video-overlay.interactive {
    pointer-events: auto;
  }

  .video-frame {
    border: none;
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: block;
  }

  .video-overlay.interactive .video-frame {
    pointer-events: auto;
  }
</style>

<script lang="ts">
  import Icon from "@iconify/svelte";
  import minusIcon from "@iconify-icons/lucide/minus";
  import plusIcon from "@iconify-icons/lucide/plus";
  import alignLeftIcon from "@iconify-icons/lucide/align-left";
  import alignCenterIcon from "@iconify-icons/lucide/align-center";
  import alignRightIcon from "@iconify-icons/lucide/align-right";
  import { get } from "svelte/store";
  import { onMount, tick } from "svelte";
  import type { BoardJSON } from "../domain/Board";
  import { BoardController } from "../application/BoardController";
  import { SerializationService } from "../application/SerializationService";
  import type { CanvasElementJSON, Point, TextAlign } from "../domain/types";
  import { board, selectedElementIds, viewport } from "../stores";
  import CanvasRenderer from "./CanvasRenderer.svelte";
  import Toolbar, { type CreateKind } from "./Toolbar.svelte";

  let { boardId = null }: { boardId?: string | null } = $props();

  const controller = new BoardController(board, viewport, selectedElementIds);
  const THEME_STORAGE_KEY = "whiteboard-theme";

  let cursorWorld: Point = { x: 0, y: 0 };
  let themeMode = $state<"light" | "dark">("dark");
  let boardName = $state("Untitled board");
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
  let textEditor = $state<{
    id: string;
    text: string;
    kind: "text" | "sticky";
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fillColor: string;
    borderColor: string;
    textColor: string;
    textAlign: TextAlign;
  } | null>(null);
  let textEditorRef = $state<HTMLTextAreaElement | null>(null);
  let textEditorStyle = $state<{
    left: number;
    top: number;
    width: number;
    height: number;
    fontSize: number;
    textAlign: TextAlign;
    color: string;
    background: string;
    borderColor: string;
    borderWidth: number;
    paddingX: number;
    paddingTop: number;
    lineHeight: number;
  } | null>(null);

  const fillSwatches = [
    "transparent",
    "#ffffff",
    "#fef08a",
    "#dbeafe",
    "#dcfce7",
    "#fee2e2",
    "#f5f3ff",
  ];

  const borderSwatches = [
    "transparent",
    "#111827",
    "#374151",
    "#2563eb",
    "#16a34a",
    "#ca8a04",
    "#dc2626",
  ];

  const textAlignOptions = [
    { label: "Align left", icon: alignLeftIcon, value: "left" },
    { label: "Align center", icon: alignCenterIcon, value: "center" },
    { label: "Align right", icon: alignRightIcon, value: "right" },
  ] satisfies { label: string; icon: object; value: TextAlign }[];
  const inlineEditorFontCalibration = 0.98;

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
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("paste", handlePaste);
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

    if (copiedSnapshots.length > 0) {
      event.preventDefault();
      controller.pasteSnapshotsAt(copiedSnapshots, cursorWorld);
      return;
    }

    const plainText = event.clipboardData?.getData("text/plain") ?? "";
    if (plainText.trim().length > 0) {
      event.preventDefault();
      controller.addTextElement(plainText, cursorWorld);
    }
  }

  async function handleImageDrop(files: File[], worldPoint: Point) {
    await addImageFilesAt(files, worldPoint);
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
      !style.fillColor &&
      !style.borderColor &&
      !style.textAlign &&
      style.fontSize === null
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

  $effect(() => {
    $board;
    $viewport;
    $selectedElementIds;
    selectedOverlay = getSelectedOverlayState();
  });

  function handleCanvasDoubleClick(worldPoint: Point) {
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

  function getTextEditorStyle() {
    if (!textEditor) {
      return null;
    }

    const dpr = window.devicePixelRatio || 1;
    const scale = $viewport.zoom / dpr;
    const borderWidth = Math.max(1, scale);
    const calibratedFontSize =
      Math.max(1, Number(textEditor.fontSize) * scale) *
      inlineEditorFontCalibration;
    const lineHeight = calibratedFontSize * 1.3;
    const leadingCompensation = (lineHeight - calibratedFontSize) / 2;
    return {
      left: (textEditor.x + $viewport.offsetX) * scale,
      top: (textEditor.y + $viewport.offsetY) * scale,
      width: Math.max(24, textEditor.width * scale),
      height: Math.max(24, textEditor.height * scale),
      fontSize: calibratedFontSize,
      textAlign: textEditor.textAlign,
      color: textEditor.textColor,
      background: textEditor.fillColor,
      borderColor: textEditor.borderColor,
      borderWidth,
      paddingX: Math.max(0, 8 * scale - borderWidth),
      paddingTop: Math.max(
        0,
        (textEditor.kind === "sticky" ? 8 : 6) * scale -
          borderWidth -
          leadingCompensation,
      ),
      lineHeight,
    };
  }

  $effect(() => {
    textEditorStyle = textEditor ? getTextEditorStyle() : null;
    if (textEditor) {
      tick().then(() => {
        textEditorRef?.focus();
      });
    }
  });
</script>

<section class="whiteboard-shell">
  <div class="board-title" title={boardName}>{boardName}</div>

  {#if isBoardLoading}
    <div class="board-loading">Loading board...</div>
  {/if}

  <Toolbar
    onBack={boardId ? handleBack : undefined}
    onCreate={handleCreate}
    onDelete={handleDelete}
    onExport={handleExport}
    onImport={handleImport}
    {themeMode}
    onToggleTheme={toggleTheme}
  />
  <div class="board-area">
    <CanvasRenderer
      board={$board}
      viewport={$viewport}
      {controller}
      onCursorWorldChange={handleCursorWorldChange}
      onImageDrop={handleImageDrop}
      onDoubleClick={handleCanvasDoubleClick}
    />
  </div>

  {#if textEditor}
    <textarea
      bind:this={textEditorRef}
      class="inline-text-editor"
      style:left={`${textEditorStyle?.left ?? 24}px`}
      style:top={`${textEditorStyle?.top ?? 24}px`}
      style:width={`${textEditorStyle?.width ?? 220}px`}
      style:height={`${textEditorStyle?.height ?? 100}px`}
      style:font-size={`${textEditorStyle?.fontSize ?? 16}px`}
      style:text-align={textEditorStyle?.textAlign ?? "left"}
      style:color={textEditorStyle?.color ?? "var(--app-text)"}
      style:background={textEditorStyle?.background ?? "var(--surface-1)"}
      style:border-color={textEditorStyle?.borderColor ?? "var(--border-2)"}
      style:border-width={`${textEditorStyle?.borderWidth ?? 1}px`}
      style:padding-left={`${textEditorStyle?.paddingX ?? 8}px`}
      style:padding-right={`${textEditorStyle?.paddingX ?? 8}px`}
      style:padding-top={`${textEditorStyle?.paddingTop ?? 6}px`}
      style:line-height={`${textEditorStyle?.lineHeight ?? 20.8}px`}
      bind:value={textEditor.text}
      onblur={commitTextEditor}
      onkeydown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelTextEditor();
          return;
        }

        if (
          event.key === "Enter" &&
          (event.ctrlKey || event.metaKey) &&
          !event.shiftKey
        ) {
          event.preventDefault();
          commitTextEditor();
        }
      }}
    ></textarea>
  {/if}

  {#if selectedOverlay}
    <div
      class="selected-toolbar"
      style:left={`${selectedOverlay.x}px`}
      style:top={`${selectedOverlay.y}px`}
    >
      {#if selectedOverlay.style.fontSize !== null}
        <div class="mini-group font-size-group">
          <button
            type="button"
            disabled={!selectedOverlay.style.canDecreaseFontSize}
            title="Decrease font size"
            onclick={() => controller.decreaseSelectedFontSize()}
          >
            <Icon icon={minusIcon} width="14" height="14" />
          </button>
          <span class="font-size-value">{selectedOverlay.style.fontSize}</span>
          <button
            type="button"
            disabled={!selectedOverlay.style.canIncreaseFontSize}
            title="Increase font size"
            onclick={() => controller.increaseSelectedFontSize()}
          >
            <Icon icon={plusIcon} width="14" height="14" />
          </button>
        </div>
      {/if}

      {#if selectedOverlay.style.textAlign}
        <div class="mini-group">
          {#each textAlignOptions as option}
            <button
              type="button"
              title={option.label}
              class:active={selectedOverlay.style.textAlign === option.value}
              onclick={() => controller.setSelectedTextAlign(option.value)}
            >
              <Icon icon={option.icon} width="14" height="14" />
            </button>
          {/each}
        </div>
      {/if}

      {#if selectedOverlay.style.borderColor}
        <div class="mini-group">
          {#each borderSwatches as color}
            <button
              type="button"
              class="swatch"
              class:transparent-swatch={color === "transparent"}
              class:active={selectedOverlay.style.borderColor === color}
              style:background={color}
              title={`Border ${color}`}
              onclick={() => controller.setSelectedBorderColor(color)}
            ></button>
          {/each}
        </div>
      {/if}

      {#if selectedOverlay.style.fillColor}
        <div class="mini-group">
          {#each fillSwatches as color}
            <button
              type="button"
              class="swatch"
              class:transparent-swatch={color === "transparent"}
              class:active={selectedOverlay.style.fillColor === color}
              style:background={color}
              title={`Background ${color}`}
              onclick={() => controller.setSelectedFillColor(color)}
            ></button>
          {/each}
        </div>
      {/if}
    </div>
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
    z-index: 100;
    border: 1px solid var(--border-1);
    background: var(--surface-1);
    color: var(--app-text-muted);
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 12px;
  }

  .board-title {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 90;
    max-width: min(70vw, 680px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid var(--border-1);
    background: var(--surface-1);
    color: var(--app-text);
    border-radius: 10px;
    padding: 6px 12px;
    font-size: 1rem;
    font-weight: 600;
    box-shadow: var(--shadow-s);
  }

  .selected-toolbar {
    position: absolute;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface-1);
    border: 1px solid var(--border-1);
    border-radius: 10px;
    padding: 6px;
    box-shadow: var(--shadow-m);
  }

  .mini-group {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-right: 6px;
    border-right: 1px solid var(--border-1);
  }

  .mini-group:last-child {
    border-right: none;
    padding-right: 0;
  }

  .mini-group button {
    border: 1px solid var(--border-1);
    background: var(--button-bg);
    color: var(--button-text);
    border-radius: 6px;
    min-width: 24px;
    height: 24px;
    font-size: 12px;
    cursor: pointer;
  }

  .mini-group button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .font-size-group {
    gap: 4px;
  }

  .font-size-value {
    min-width: 28px;
    text-align: center;
    font-size: 12px;
    color: var(--app-text-muted);
  }

  .mini-group button.active {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .swatch {
    width: 22px;
    min-width: 22px;
    height: 22px;
    padding: 0;
  }

  .transparent-swatch {
    position: relative;
    background-image: linear-gradient(
        45deg,
        var(--border-1) 25%,
        transparent 25%
      ),
      linear-gradient(-45deg, var(--border-1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--border-1) 75%),
      linear-gradient(-45deg, transparent 75%, var(--border-1) 75%);
    background-size: 10px 10px;
    background-position:
      0 0,
      0 5px,
      5px -5px,
      -5px 0;
  }

  .transparent-swatch::after {
    content: "";
    position: absolute;
    left: 3px;
    top: 10px;
    width: 14px;
    height: 2px;
    background: var(--danger);
    transform: rotate(-35deg);
    border-radius: 999px;
  }

  .inline-text-editor {
    position: absolute;
    z-index: 60;
    resize: none;
    box-sizing: border-box;
    border: 1px solid;
    border-radius: 0;
    padding: 6px 8px 0 8px;
    line-height: 1.3;
    outline: none;
    font-family: Inter, system-ui, sans-serif;
    color: var(--app-text);
  }
</style>

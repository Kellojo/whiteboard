<script lang="ts">
  import { onMount } from "svelte";
  import type { BoardController } from "../application/BoardController";
  import type { Board } from "../domain/Board";
  import type { Point, Rect } from "../domain/types";
  import type { ViewportState } from "../stores";
  import { ICON_DROP_MIME, ICON_DROP_TEXT_PREFIX } from "./iconCatalog";

  let {
    board,
    viewport,
    controller,
    onCursorWorldChange,
    onImageDrop,
    onIconDrop,
    onDoubleClick,
  }: {
    board: Board;
    viewport: ViewportState;
    controller: BoardController;
    onCursorWorldChange: (point: Point) => void;
    onImageDrop: (files: File[], worldPoint: Point) => void;
    onIconDrop: (iconId: string, worldPoint: Point) => void | Promise<void>;
    onDoubleClick: (worldPoint: Point) => void;
  } = $props();

  let canvas: HTMLCanvasElement;
  let isPointerDown = false;
  let lastClickTimestamp = 0;
  let lastClickPoint: Point | null = null;

  const handleSize = 10;

  function getThemeColor(variableName: string, fallback: string): string {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
    return value || fallback;
  }

  onMount(() => {
    let frame = 0;
    const render = () => {
      draw();
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  });

  function draw() {
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    resizeCanvasIfNeeded();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    drawBackgroundGrid(ctx);

    ctx.save();
    ctx.setTransform(
      viewport.zoom,
      0,
      0,
      viewport.zoom,
      viewport.offsetX * viewport.zoom,
      viewport.offsetY * viewport.zoom,
    );

    for (const element of board.getAllElements()) {
      element.draw(ctx);
    }

    drawOverlayRect(
      ctx,
      controller.getSelectionRect(),
      getThemeColor("--accent", "#2563eb"),
    );
    drawResizeHandles(ctx);
    ctx.restore();
  }

  function drawResizeHandles(ctx: CanvasRenderingContext2D) {
    const handles = controller.getResizeHandles();
    if (!handles.length) {
      return;
    }

    const size = handleSize / Math.max(0.0001, viewport.zoom);
    for (const handle of handles) {
      ctx.save();
      ctx.fillStyle = getThemeColor("--handle-fill", "#ffffff");
      ctx.strokeStyle = getThemeColor("--accent", "#2563eb");
      ctx.lineWidth = 1 / Math.max(0.0001, viewport.zoom);
      ctx.fillRect(handle.x - size / 2, handle.y - size / 2, size, size);
      ctx.strokeRect(handle.x - size / 2, handle.y - size / 2, size, size);
      ctx.restore();
    }
  }

  function drawOverlayRect(
    ctx: CanvasRenderingContext2D,
    rect: Rect | null,
    strokeStyle: string,
  ) {
    if (!rect) {
      return;
    }
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1 / Math.max(0.0001, viewport.zoom);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  function drawBackgroundGrid(ctx: CanvasRenderingContext2D) {
    const spacing = 40 * viewport.zoom;
    if (spacing < 14) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = getThemeColor("--canvas-grid", "#f3f4f6");
    ctx.lineWidth = 1;

    for (
      let x = (viewport.offsetX * viewport.zoom) % spacing;
      x < canvas.width;
      x += spacing
    ) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (
      let y = (viewport.offsetY * viewport.zoom) % spacing;
      y < canvas.height;
      y += spacing
    ) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  function resizeCanvasIfNeeded() {
    const parent = canvas.parentElement;
    if (!parent) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.floor(parent.clientWidth * dpr);
    const targetHeight = Math.floor(parent.clientHeight * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
    }
  }

  function screenPoint(event: { clientX: number; clientY: number }) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (window.devicePixelRatio || 1),
      y: (event.clientY - rect.top) * (window.devicePixelRatio || 1),
    };
  }

  function handlePointerDown(event: PointerEvent) {
    const point = screenPoint(event);
    const worldPoint = controller.toWorld(point);
    onCursorWorldChange(worldPoint);

    const now = Date.now();
    const withinTime = now - lastClickTimestamp <= 450;
    const withinDistance =
      lastClickPoint !== null &&
      Math.hypot(point.x - lastClickPoint.x, point.y - lastClickPoint.y) <= 28;

    const nativeDoubleClick = event.detail >= 2;

    if (nativeDoubleClick || (withinTime && withinDistance)) {
      console.log("[CanvasRenderer] double-click detected", {
        nativeDoubleClick,
        withinTime,
        withinDistance,
        worldPoint,
      });
      onDoubleClick(worldPoint);
      lastClickTimestamp = 0;
      lastClickPoint = null;
      return;
    }

    lastClickTimestamp = now;
    lastClickPoint = point;

    isPointerDown = true;
    canvas.setPointerCapture(event.pointerId);
    controller.onPointerDown(point, {
      additiveSelection: event.shiftKey,
      isPanGesture: event.altKey || event.button === 1,
    });
  }

  function handlePointerMove(event: PointerEvent) {
    const point = screenPoint(event);
    onCursorWorldChange(controller.toWorld(point));
    if (!isPointerDown) {
      return;
    }
    controller.onPointerMove(point);
  }

  function handlePointerUp(event: PointerEvent) {
    if (!isPointerDown) {
      return;
    }
    isPointerDown = false;
    controller.onPointerUp({ additiveSelection: event.shiftKey });
    canvas.releasePointerCapture(event.pointerId);
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    controller.onWheelZoom(screenPoint(event), event.deltaY);
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) {
      return;
    }
    const hasIconPayload =
      event.dataTransfer.types.includes(ICON_DROP_MIME) ||
      event.dataTransfer.types.includes("text/plain");
    if (hasIconPayload) {
      event.dataTransfer.dropEffect = "copy";
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) {
      return;
    }

    const iconId =
      event.dataTransfer.getData(ICON_DROP_MIME) ||
      (() => {
        const plainText = event.dataTransfer?.getData("text/plain") ?? "";
        if (!plainText.startsWith(ICON_DROP_TEXT_PREFIX)) {
          return "";
        }
        return plainText.slice(ICON_DROP_TEXT_PREFIX.length);
      })();

    if (iconId) {
      const point = screenPoint({
        clientX: event.clientX,
        clientY: event.clientY,
      });
      const worldPoint = controller.toWorld(point);
      onCursorWorldChange(worldPoint);
      onIconDrop(iconId, worldPoint);
      return;
    }

    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!files.length) {
      return;
    }

    const point = screenPoint({
      clientX: event.clientX,
      clientY: event.clientY,
    });
    const worldPoint = controller.toWorld(point);
    onCursorWorldChange(worldPoint);
    onImageDrop(files, worldPoint);
  }

  function handleNativeDoubleClick(event: MouseEvent) {
    const point = screenPoint({
      clientX: event.clientX,
      clientY: event.clientY,
    });
    const worldPoint = controller.toWorld(point);
    console.log("[CanvasRenderer] native dblclick event", { worldPoint });
    onCursorWorldChange(worldPoint);
    onDoubleClick(worldPoint);
  }
</script>

<div class="canvas-host">
  <canvas
    bind:this={canvas}
    style:cursor="default"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
    onwheel={handleWheel}
    oncontextmenu={handleContextMenu}
    ondragover={handleDragOver}
    ondrop={handleDrop}
    ondblclick={handleNativeDoubleClick}
  ></canvas>
</div>

<style>
  .canvas-host {
    width: 100%;
    height: 100%;
    background: var(--canvas-bg);
    overflow: hidden;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
</style>

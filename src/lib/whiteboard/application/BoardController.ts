import { get, type Writable } from "svelte/store";
import { Board } from "../domain/Board";
import type { CanvasElement } from "../domain/CanvasElement";
import { elementFromJSON } from "../domain/elementFactory";
import { EllipseElement } from "../domain/EllipseElement";
import { ImageElement } from "../domain/ImageElement";
import { RectangleElement } from "../domain/RectangleElement";
import { StickyNoteElement } from "../domain/StickyNoteElement";
import { TextElement } from "../domain/TextElement";
import { VideoElement } from "../domain/VideoElement";
import type { CanvasElementJSON, Point, TextAlign } from "../domain/types";
import type { ViewportState } from "../stores";

type InteractionMode =
  | "idle"
  | "panning"
  | "moving"
  | "box-select"
  | "resizing";
type ResizeHandle = "nw" | "ne" | "sw" | "se";

interface ResizeHandlePosition {
  handle: ResizeHandle;
  x: number;
  y: number;
}

interface BoundsSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CreatableElement =
  | "rectangle"
  | "ellipse"
  | "text"
  | "heading"
  | "sticky";
const FONT_SIZE_STEPS = [
  10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48,
] as const;

export interface SelectedStyleState {
  controls: {
    fillColor: boolean;
    borderColor: boolean;
    textColor: boolean;
    textAlign: boolean;
    fontSize: boolean;
  };
  fillColor: string | null;
  borderColor: string | null;
  textColor: string | null;
  textAlign: TextAlign | null;
  fontSize: number | null;
  canDecreaseFontSize: boolean;
  canIncreaseFontSize: boolean;
}

export interface EditableTextTarget {
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
}

export interface LayerItem {
  id: string;
  type: string;
  title: string;
  isSelected: boolean;
  canMoveForward: boolean;
  canMoveBackward: boolean;
}

export class BoardController {
  private mode: InteractionMode = "idle";
  private dragStartWorld: Point | null = null;
  private dragStartScreen: Point | null = null;
  private lastWorld: Point | null = null;
  private lastScreen: Point | null = null;
  private boxSelectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private activeResize: {
    id: string;
    handle: ResizeHandle;
    initial: BoundsSnapshot;
  } | null = null;

  constructor(
    private readonly boardStore: Writable<Board>,
    private readonly viewportStore: Writable<ViewportState>,
    private readonly selectedElementIdsStore: Writable<Set<string>>,
  ) {}

  getSelectionRect() {
    return this.boxSelectionRect;
  }

  getResizeHandles(): ResizeHandlePosition[] {
    const selected = get(this.boardStore).getSelectedElements();
    if (selected.length !== 1) {
      return [];
    }

    const element = selected[0];
    const x1 = element.x;
    const y1 = element.y;
    const x2 = element.x + element.width;
    const y2 = element.y + element.height;

    return [
      { handle: "nw", x: x1, y: y1 },
      { handle: "ne", x: x2, y: y1 },
      { handle: "sw", x: x1, y: y2 },
      { handle: "se", x: x2, y: y2 },
    ];
  }

  toWorld(screen: Point): Point {
    const viewport = get(this.viewportStore);
    return {
      x: screen.x / viewport.zoom - viewport.offsetX,
      y: screen.y / viewport.zoom - viewport.offsetY,
    };
  }

  onWheelZoom(screen: Point, deltaY: number): void {
    this.viewportStore.update((viewport) => {
      const before = {
        x: screen.x / viewport.zoom - viewport.offsetX,
        y: screen.y / viewport.zoom - viewport.offsetY,
      };
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const nextZoom = Math.min(4, Math.max(0.2, viewport.zoom * zoomFactor));
      return {
        zoom: nextZoom,
        offsetX: screen.x / nextZoom - before.x,
        offsetY: screen.y / nextZoom - before.y,
      };
    });
  }

  onPointerDown(
    screen: Point,
    options: { additiveSelection: boolean; isPanGesture: boolean },
  ): void {
    const board = get(this.boardStore);
    const world = this.toWorld(screen);
    this.dragStartWorld = world;
    this.dragStartScreen = screen;
    this.lastWorld = world;
    this.lastScreen = screen;

    if (options.isPanGesture) {
      this.mode = "panning";
      return;
    }

    const resizeHandle = this.getResizeHandleAt(world);
    if (resizeHandle) {
      const selected = board.getSelectedElements();
      if (selected.length === 1) {
        const element = selected[0];
        this.activeResize = {
          id: element.id,
          handle: resizeHandle,
          initial: {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
          },
        };
        this.mode = "resizing";
        return;
      }
    }

    const hit = board.hitTest(world);
    if (hit) {
      const selectedIds = new Set(get(this.selectedElementIdsStore));
      if (options.additiveSelection) {
        if (selectedIds.has(hit.id)) {
          selectedIds.delete(hit.id);
        } else {
          selectedIds.add(hit.id);
        }
      } else if (!selectedIds.has(hit.id)) {
        selectedIds.clear();
        selectedIds.add(hit.id);
      }
      this.selectedElementIdsStore.set(selectedIds);
      this.syncSelectionFlags();
      this.mode = "moving";
      return;
    }

    if (!options.additiveSelection) {
      this.selectedElementIdsStore.set(new Set());
      this.syncSelectionFlags();
    }
    this.mode = "box-select";
    this.boxSelectionRect = { x: world.x, y: world.y, width: 0, height: 0 };
  }

  onPointerMove(screen: Point): void {
    if (
      !this.dragStartWorld ||
      !this.dragStartScreen ||
      !this.lastWorld ||
      !this.lastScreen
    ) {
      return;
    }

    const board = get(this.boardStore);
    const world = this.toWorld(screen);
    const worldDelta = {
      x: world.x - this.lastWorld.x,
      y: world.y - this.lastWorld.y,
    };
    const screenDelta = {
      x: screen.x - this.lastScreen.x,
      y: screen.y - this.lastScreen.y,
    };

    if (this.mode === "panning") {
      this.viewportStore.update((viewport) => ({
        ...viewport,
        offsetX: viewport.offsetX + screenDelta.x / viewport.zoom,
        offsetY: viewport.offsetY + screenDelta.y / viewport.zoom,
      }));
    }

    if (this.mode === "moving") {
      for (const element of board.getSelectedElements()) {
        element.move(worldDelta.x, worldDelta.y);
      }
      this.boardStore.update((current) => current);
    }

    if (this.mode === "resizing" && this.activeResize) {
      const target = board
        .getAllElements()
        .find((element) => element.id === this.activeResize?.id);
      if (target) {
        const resized = resizeFromHandle(
          this.activeResize.initial,
          world,
          this.activeResize.handle,
          target instanceof ImageElement,
        );
        target.x = resized.x;
        target.y = resized.y;
        target.width = resized.width;
        target.height = resized.height;
        this.boardStore.update((current) => current);
      }
    }

    if (this.mode === "box-select") {
      this.boxSelectionRect = rectFromPoints(this.dragStartWorld, world);
    }

    this.lastWorld = world;
    this.lastScreen = screen;
  }

  onPointerUp(options: { additiveSelection: boolean }): void {
    const board = get(this.boardStore);

    if (this.mode === "box-select" && this.boxSelectionRect) {
      const selectedIds = options.additiveSelection
        ? new Set(get(this.selectedElementIdsStore))
        : new Set<string>();
      for (const element of board.getAllElements()) {
        if (rectIntersectsElement(this.boxSelectionRect, element)) {
          selectedIds.add(element.id);
        }
      }
      this.selectedElementIdsStore.set(selectedIds);
      this.syncSelectionFlags();
    }

    this.mode = "idle";
    this.dragStartWorld = null;
    this.dragStartScreen = null;
    this.lastWorld = null;
    this.lastScreen = null;
    this.boxSelectionRect = null;
    this.activeResize = null;
  }

  createElement(type: CreatableElement, position: Point): void {
    this.boardStore.update((board) => {
      if (type === "rectangle") {
        board.addElement(
          new RectangleElement({
            id: crypto.randomUUID(),
            x: position.x - 80,
            y: position.y - 50,
            width: 160,
            height: 100,
          }),
        );
      }

      if (type === "ellipse") {
        board.addElement(
          new EllipseElement({
            id: crypto.randomUUID(),
            x: position.x - 80,
            y: position.y - 50,
            width: 160,
            height: 100,
          }),
        );
      }

      if (type === "text") {
        board.addElement(
          new TextElement({
            id: crypto.randomUUID(),
            x: position.x - 60,
            y: position.y - 15,
            width: 120,
            height: 30,
            text: "Text",
          }),
        );
      }

      if (type === "heading") {
        board.addElement(
          new TextElement({
            id: crypto.randomUUID(),
            x: position.x - 220,
            y: position.y - 30,
            width: 440,
            height: 60,
            text: "Heading",
            fontSize: 36,
            fillColor: "transparent",
            borderColor: "transparent",
          }),
        );
      }

      if (type === "sticky") {
        const size = 160;
        board.addElement(
          new StickyNoteElement({
            id: crypto.randomUUID(),
            x: position.x - size / 2,
            y: position.y - size / 2,
            width: size,
            height: size,
            text: "Sticky note",
          }),
        );
      }

      return board;
    });
  }

  addImageElement(
    imageDataUrl: string,
    position: Point,
    naturalSize?: { width: number; height: number },
  ): void {
    const naturalWidth = naturalSize?.width ?? 320;
    const naturalHeight = naturalSize?.height ?? 240;
    const maxWidth = 360;
    const maxHeight = 280;
    const scale = Math.min(
      1,
      maxWidth / Math.max(1, naturalWidth),
      maxHeight / Math.max(1, naturalHeight),
    );
    const width = Math.max(40, naturalWidth * scale);
    const height = Math.max(40, naturalHeight * scale);

    this.boardStore.update((board) => {
      board.addElement(
        new ImageElement({
          id: crypto.randomUUID(),
          x: position.x - width / 2,
          y: position.y - height / 2,
          width,
          height,
          imageDataUrl,
        }),
      );
      return board;
    });
  }

  addTextElement(text: string, position: Point): void {
    const normalizedText = text.replace(/\r\n/g, "\n").trim();
    if (!normalizedText) {
      return;
    }

    const lines = normalizedText.split("\n");
    const maxLineLength = Math.max(1, ...lines.map((line) => line.length));
    const width = Math.min(420, Math.max(140, maxLineLength * 9 + 24));
    const height = Math.min(320, Math.max(44, lines.length * 26 + 18));

    this.boardStore.update((board) => {
      board.addElement(
        new TextElement({
          id: crypto.randomUUID(),
          x: position.x - width / 2,
          y: position.y - height / 2,
          width,
          height,
          text: normalizedText,
        }),
      );
      return board;
    });
  }

  addYouTubeVideoElement(url: string, position: Point): boolean {
    const embedUrl = VideoElement.toEmbedUrl(url);
    if (!embedUrl) {
      return false;
    }

    const width = 420;
    const height = 236;

    this.boardStore.update((board) => {
      board.addElement(
        new VideoElement({
          id: crypto.randomUUID(),
          x: position.x - width / 2,
          y: position.y - height / 2,
          width,
          height,
          videoUrl: url.trim(),
        }),
      );
      return board;
    });

    return true;
  }

  copySelectionSnapshots(): CanvasElementJSON[] {
    return get(this.boardStore)
      .getSelectedElements()
      .map((element) => ({ ...element.toJSON(), isSelected: false }));
  }

  getEditableTextTargetAt(point: Point): EditableTextTarget | null {
    const hit = get(this.boardStore).hitTest(point);
    if (!(hit instanceof TextElement) && !(hit instanceof StickyNoteElement)) {
      return null;
    }

    return {
      id: hit.id,
      text: hit.text,
      kind: hit instanceof StickyNoteElement ? "sticky" : "text",
      x: hit.x,
      y: hit.y,
      width: hit.width,
      height: hit.height,
      fontSize: hit.fontSize,
      fillColor: hit.fillColor,
      borderColor: hit.borderColor,
      textColor: hit.textColor,
      textAlign: hit instanceof StickyNoteElement ? "center" : hit.textAlign,
    };
  }

  getElementById(id: string): CanvasElement | null {
    return (
      get(this.boardStore)
        .getAllElements()
        .find((element) => element.id === id) ?? null
    );
  }

  getElementAt(point: Point): CanvasElement | null {
    return get(this.boardStore).hitTest(point) ?? null;
  }

  getLayerItems(): LayerItem[] {
    const elements = get(this.boardStore).getAllElements();
    const total = elements.length;

    return elements
      .map((element, index) => {
        const snapshot = element.toJSON();
        const type = snapshot.type;
        const videoTitle =
          type === "video" && typeof snapshot.videoUrl === "string"
            ? "YouTube video"
            : "";
        const rawText =
          (type === "text" || type === "sticky") &&
          typeof snapshot.text === "string"
            ? snapshot.text.trim()
            : "";
        const title =
          rawText.length > 0
            ? rawText.slice(0, 30)
            : videoTitle.length > 0
              ? videoTitle
              : `${type.charAt(0).toUpperCase()}${type.slice(1)}`;

        return {
          id: element.id,
          type,
          title,
          isSelected: element.isSelected,
          canMoveForward: index < total - 1,
          canMoveBackward: index > 0,
        };
      })
      .reverse();
  }

  selectSingleElement(id: string): void {
    this.selectedElementIdsStore.set(new Set([id]));
    this.syncSelectionFlags();
  }

  moveLayerForward(id: string): void {
    this.boardStore.update((board) => {
      board.moveElementBy(id, 1);
      return board;
    });
  }

  moveLayerBackward(id: string): void {
    this.boardStore.update((board) => {
      board.moveElementBy(id, -1);
      return board;
    });
  }

  bringLayerToFront(id: string): void {
    this.boardStore.update((board) => {
      board.moveElementToFront(id);
      return board;
    });
  }

  sendLayerToBack(id: string): void {
    this.boardStore.update((board) => {
      board.moveElementToBack(id);
      return board;
    });
  }

  updateElementText(id: string, text: string): void {
    this.boardStore.update((board) => {
      const target = board
        .getAllElements()
        .find((element) => element.id === id);
      if (!target) {
        return board;
      }
      if ("text" in target) {
        target.text = text;
      }
      return board;
    });
  }

  getSingleSelectedElement(): CanvasElement | null {
    const selected = get(this.boardStore).getSelectedElements();
    return selected.length === 1 ? selected[0] : null;
  }

  getSelectedStyleState(): SelectedStyleState | null {
    const selected = this.getSingleSelectedElement();
    if (!selected) {
      return null;
    }

    const controls = selected.getStyleControlOptions();
    const fillColor =
      "fillColor" in selected && typeof selected.fillColor === "string"
        ? selected.fillColor
        : null;
    const borderColor =
      "borderColor" in selected && typeof selected.borderColor === "string"
        ? selected.borderColor
        : null;
    const textColor =
      "textColor" in selected && typeof selected.textColor === "string"
        ? selected.textColor
        : null;
    const hasTextAlign =
      "textAlign" in selected &&
      (selected.textAlign === "left" ||
        selected.textAlign === "center" ||
        selected.textAlign === "right");
    const textAlign: TextAlign | null = hasTextAlign
      ? (selected.textAlign as TextAlign)
      : null;
    const fontSize =
      "fontSize" in selected && typeof selected.fontSize === "number"
        ? selected.fontSize
        : null;
    const hasFillColor = fillColor !== null;
    const hasBorderColor = borderColor !== null;
    const hasTextColor = textColor !== null;
    const hasFontSize = fontSize !== null;

    return {
      controls: {
        fillColor: controls.fillColor && hasFillColor,
        borderColor: controls.borderColor && hasBorderColor,
        textColor: controls.textColor && hasTextColor,
        textAlign: controls.textAlign && hasTextAlign,
        fontSize: controls.fontSize && hasFontSize,
      },
      fillColor,
      borderColor,
      textColor,
      textAlign,
      fontSize,
      canDecreaseFontSize: this.canAdjustFontSize(selected, "decrease"),
      canIncreaseFontSize: this.canAdjustFontSize(selected, "increase"),
    };
  }

  decreaseSelectedFontSize(): void {
    this.applyStyleToSingleSelected((element) => {
      if (!("fontSize" in element) || typeof element.fontSize !== "number") {
        return;
      }
      const current = element.fontSize;
      const lower = [...FONT_SIZE_STEPS]
        .reverse()
        .find((size) => size < current);
      if (lower) {
        element.fontSize = lower;
      }
    });
  }

  increaseSelectedFontSize(): void {
    this.applyStyleToSingleSelected((element) => {
      if (!("fontSize" in element) || typeof element.fontSize !== "number") {
        return;
      }
      const current = element.fontSize;
      const higher = FONT_SIZE_STEPS.find((size) => size > current);
      if (higher) {
        element.fontSize = higher;
      }
    });
  }

  setSelectedFillColor(fillColor: string): void {
    this.applyStyleToSingleSelected((element) => {
      if ("fillColor" in element) {
        element.fillColor = fillColor;
      }
    });
  }

  setSelectedBorderColor(borderColor: string): void {
    this.applyStyleToSingleSelected((element) => {
      if ("borderColor" in element) {
        element.borderColor = borderColor;
      }
    });
  }

  setSelectedTextColor(textColor: string): void {
    this.applyStyleToSingleSelected((element) => {
      if ("textColor" in element) {
        element.textColor = textColor;
      }
    });
  }

  setSelectedTextAlign(textAlign: TextAlign): void {
    this.applyStyleToSingleSelected((element) => {
      if (!element.getStyleControlOptions().textAlign) {
        return;
      }
      if ("textAlign" in element) {
        element.textAlign = textAlign;
      }
    });
  }

  pasteSnapshotsAt(snapshots: CanvasElementJSON[], cursor: Point): void {
    if (!snapshots.length) {
      return;
    }

    const minX = Math.min(...snapshots.map((item) => item.x));
    const minY = Math.min(...snapshots.map((item) => item.y));
    const pastedIds = new Set<string>();

    this.boardStore.update((board) => {
      for (const snapshot of snapshots) {
        const clone = {
          ...snapshot,
          id: crypto.randomUUID(),
          x: cursor.x + (snapshot.x - minX),
          y: cursor.y + (snapshot.y - minY),
          isSelected: true,
        };
        const element = elementFromJSON(clone);
        board.addElement(element);
        pastedIds.add(element.id);
      }
      board.setSelectionByIds(pastedIds);
      return board;
    });

    this.selectedElementIdsStore.set(pastedIds);
  }

  deleteSelection(): void {
    const selectedIds = get(this.selectedElementIdsStore);
    this.boardStore.update((board) => {
      for (const id of selectedIds) {
        board.removeElement(id);
      }
      return board;
    });
    this.selectedElementIdsStore.set(new Set());
  }

  private syncSelectionFlags(): void {
    const selectedIds = get(this.selectedElementIdsStore);
    this.boardStore.update((board) => {
      board.setSelectionByIds(selectedIds);
      return board;
    });
  }

  private applyStyleToSingleSelected(
    updater: (element: CanvasElement) => void,
  ): void {
    this.boardStore.update((board) => {
      const selected = board.getSelectedElements();
      if (selected.length !== 1) {
        return board;
      }
      updater(selected[0]);
      return board;
    });
  }

  private getResizeHandleAt(point: Point): ResizeHandle | null {
    const viewport = get(this.viewportStore);
    const hitRadius = 10 / Math.max(0.0001, viewport.zoom);
    for (const handle of this.getResizeHandles()) {
      if (
        Math.abs(handle.x - point.x) <= hitRadius &&
        Math.abs(handle.y - point.y) <= hitRadius
      ) {
        return handle.handle;
      }
    }
    return null;
  }

  private canAdjustFontSize(
    element: CanvasElement,
    direction: "decrease" | "increase",
  ): boolean {
    if (!("fontSize" in element) || typeof element.fontSize !== "number") {
      return false;
    }

    const fontSize = element.fontSize;

    if (direction === "decrease") {
      return [...FONT_SIZE_STEPS].some((size) => size < fontSize);
    }

    return FONT_SIZE_STEPS.some((size) => size > fontSize);
  }
}

function rectFromPoints(start: Point, end: Point) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function rectIntersectsElement(
  rect: { x: number; y: number; width: number; height: number },
  element: CanvasElement,
): boolean {
  const elementRight = element.x + element.width;
  const elementBottom = element.y + element.height;
  const rectRight = rect.x + rect.width;
  const rectBottom = rect.y + rect.height;

  return !(
    rect.x > elementRight ||
    rectRight < element.x ||
    rect.y > elementBottom ||
    rectBottom < element.y
  );
}

function resizeFromHandle(
  initial: BoundsSnapshot,
  point: Point,
  handle: ResizeHandle,
  preserveAspectRatio = false,
): BoundsSnapshot {
  if (preserveAspectRatio) {
    return resizeFromHandleWithAspectRatio(initial, point, handle);
  }

  let left = initial.x;
  let right = initial.x + initial.width;
  let top = initial.y;
  let bottom = initial.y + initial.height;
  const minSize = 12;

  if (handle === "nw" || handle === "sw") {
    left = Math.min(point.x, right - minSize);
  }
  if (handle === "ne" || handle === "se") {
    right = Math.max(point.x, left + minSize);
  }
  if (handle === "nw" || handle === "ne") {
    top = Math.min(point.y, bottom - minSize);
  }
  if (handle === "sw" || handle === "se") {
    bottom = Math.max(point.y, top + minSize);
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function resizeFromHandleWithAspectRatio(
  initial: BoundsSnapshot,
  point: Point,
  handle: ResizeHandle,
): BoundsSnapshot {
  const minSize = 12;
  const initialWidth = Math.max(minSize, initial.width);
  const initialHeight = Math.max(minSize, initial.height);
  const aspectRatio = initialWidth / initialHeight;

  let anchorX = initial.x;
  let anchorY = initial.y;
  let horizontalSign = 1;
  let verticalSign = 1;

  if (handle === "nw") {
    anchorX = initial.x + initial.width;
    anchorY = initial.y + initial.height;
    horizontalSign = -1;
    verticalSign = -1;
  }
  if (handle === "ne") {
    anchorX = initial.x;
    anchorY = initial.y + initial.height;
    horizontalSign = 1;
    verticalSign = -1;
  }
  if (handle === "sw") {
    anchorX = initial.x + initial.width;
    anchorY = initial.y;
    horizontalSign = -1;
    verticalSign = 1;
  }
  if (handle === "se") {
    anchorX = initial.x;
    anchorY = initial.y;
    horizontalSign = 1;
    verticalSign = 1;
  }

  const rawWidth = Math.abs(point.x - anchorX);
  const rawHeight = Math.abs(point.y - anchorY);

  let width = Math.min(rawWidth, rawHeight * aspectRatio);
  let height = width / aspectRatio;

  if (width < minSize) {
    width = minSize;
    height = width / aspectRatio;
  }
  if (height < minSize) {
    height = minSize;
    width = height * aspectRatio;
  }

  const left = horizontalSign > 0 ? anchorX : anchorX - width;
  const right = horizontalSign > 0 ? anchorX + width : anchorX;
  const top = verticalSign > 0 ? anchorY : anchorY - height;
  const bottom = verticalSign > 0 ? anchorY + height : anchorY;

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

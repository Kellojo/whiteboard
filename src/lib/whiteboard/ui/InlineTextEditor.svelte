<script lang="ts">
  import { tick } from "svelte";
  import type { EditableTextTarget } from "../application/BoardController";
  import type { ViewportState } from "../stores";

  let {
    editor,
    viewport,
    onChange,
    onCommit,
    onCancel,
  }: {
    editor: EditableTextTarget;
    viewport: ViewportState;
    onChange: (text: string) => void;
    onCommit: () => void;
    onCancel: () => void;
  } = $props();

  let textareaRef = $state<HTMLTextAreaElement | null>(null);
  let editorStyle = $state<{
    left: number;
    top: number;
    width: number;
    height: number;
    fontSize: number;
    textAlign: EditableTextTarget["textAlign"];
    color: string;
    background: string;
    borderColor: string;
    borderWidth: number;
    paddingX: number;
    paddingTop: number;
    lineHeight: number;
  } | null>(null);

  const inlineEditorFontCalibration = 0.98;
  let textMeasureContext: CanvasRenderingContext2D | null | undefined;

  function getTextMeasureContext(): CanvasRenderingContext2D | null {
    if (textMeasureContext !== undefined) {
      return textMeasureContext;
    }
    if (typeof document === "undefined") {
      textMeasureContext = null;
      return textMeasureContext;
    }
    textMeasureContext = document.createElement("canvas").getContext("2d");
    return textMeasureContext;
  }

  function measureWrappedLineCount(
    text: string,
    fontSize: number,
    maxWidth: number,
  ): number {
    const context = getTextMeasureContext();
    if (!context || maxWidth <= 0) {
      return Math.max(1, text.split("\n").length);
    }

    context.font = `${fontSize}px Inter, system-ui, sans-serif`;
    const paragraphs = text.split("\n");
    let lineCount = 0;

    for (const paragraph of paragraphs) {
      if (!paragraph.length) {
        lineCount += 1;
        continue;
      }

      const words = paragraph.split(" ");
      let line = "";

      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width <= maxWidth) {
          line = candidate;
        } else {
          if (line) {
            lineCount += 1;
          }
          line = word;
        }
      }

      lineCount += line ? 1 : 0;
    }

    return Math.max(1, lineCount);
  }

  function resolveEditorBackground(fillColor: string): string {
    const normalized = fillColor.trim().toLowerCase();
    if (
      normalized === "transparent" ||
      normalized === "rgba(0, 0, 0, 0)" ||
      normalized === "rgba(0,0,0,0)"
    ) {
      return "var(--surface-1)";
    }
    return fillColor;
  }

  function getTextEditorStyle() {
    const dpr = window.devicePixelRatio || 1;
    const scale = viewport.zoom / dpr;
    const borderWidth = Math.max(1, scale);
    const calibratedFontSize =
      Math.max(1, Number(editor.fontSize) * scale) *
      inlineEditorFontCalibration;
    const lineHeight = calibratedFontSize * 1.3;
    const leadingCompensation = (lineHeight - calibratedFontSize) / 2;
    const width = Math.max(24, editor.width * scale);
    const height = Math.max(24, editor.height * scale);
    const paddingX = Math.max(0, 8 * scale - borderWidth);
    const defaultPaddingTop = Math.max(
      0,
      (editor.kind === "sticky" ? 8 : 6) * scale -
        borderWidth -
        leadingCompensation,
    );

    let paddingTop = defaultPaddingTop;
    if (editor.kind === "sticky") {
      const maxTextWidth = Math.max(0, width - borderWidth * 2 - paddingX * 2);
      const lineCount = measureWrappedLineCount(
        editor.text,
        calibratedFontSize,
        maxTextWidth,
      );
      const innerHeight = Math.max(0, height - borderWidth * 2);
      const totalTextHeight = lineCount * lineHeight;
      paddingTop = Math.max(
        0,
        (innerHeight - totalTextHeight) / 2 - leadingCompensation,
      );
    }

    return {
      left: (editor.x + viewport.offsetX) * scale,
      top: (editor.y + viewport.offsetY) * scale,
      width,
      height,
      fontSize: calibratedFontSize,
      textAlign: editor.textAlign,
      color: editor.textColor,
      background: resolveEditorBackground(editor.fillColor),
      borderColor: editor.borderColor,
      borderWidth,
      paddingX,
      paddingTop,
      lineHeight,
    };
  }

  $effect(() => {
    editor;
    viewport;
    editorStyle = getTextEditorStyle();
    tick().then(() => {
      textareaRef?.focus();
    });
  });
</script>

<textarea
  bind:this={textareaRef}
  class="inline-text-editor"
  style:left={`${editorStyle?.left ?? 24}px`}
  style:top={`${editorStyle?.top ?? 24}px`}
  style:width={`${editorStyle?.width ?? 220}px`}
  style:height={`${editorStyle?.height ?? 100}px`}
  style:font-size={`${editorStyle?.fontSize ?? 16}px`}
  style:text-align={editorStyle?.textAlign ?? "left"}
  style:color={editorStyle?.color ?? "var(--app-text)"}
  style:background={editorStyle?.background ?? "var(--surface-1)"}
  style:border-color={editorStyle?.borderColor ?? "var(--border-2)"}
  style:border-width={`${editorStyle?.borderWidth ?? 1}px`}
  style:padding-left={`${editorStyle?.paddingX ?? 8}px`}
  style:padding-right={`${editorStyle?.paddingX ?? 8}px`}
  style:padding-top={`${editorStyle?.paddingTop ?? 6}px`}
  style:line-height={`${editorStyle?.lineHeight ?? 20.8}px`}
  value={editor.text}
  oninput={(event) =>
    onChange((event.currentTarget as HTMLTextAreaElement).value)}
  onblur={onCommit}
  onkeydown={(event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey
    ) {
      event.preventDefault();
      onCommit();
    }
  }}
></textarea>

<style>
  .inline-text-editor {
    position: absolute;
    z-index: var(--z-overlay);
    resize: none;
    box-sizing: border-box;
    border: 0.0625rem solid;
    border-radius: 0;
    padding: 0.375rem 0.5rem 0 0.5rem;
    line-height: 1.3;
    outline: none;
    font-family: Inter, system-ui, sans-serif;
    color: var(--app-text);
  }
</style>

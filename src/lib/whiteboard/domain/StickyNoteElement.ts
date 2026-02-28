import { CanvasElement } from "./CanvasElement";
import type { CanvasElementJSON, Point, TextAlign } from "./types";

export class StickyNoteElement extends CanvasElement {
  text: string;
  fontSize: number;
  fillColor: string;
  borderColor: string;
  textAlign: TextAlign;

  constructor(
    params: ConstructorParameters<typeof CanvasElement>[0] & {
      text?: string;
      fontSize?: number;
      fillColor?: string;
      borderColor?: string;
      textAlign?: TextAlign;
    },
  ) {
    super(params);
    this.text = params.text ?? "Sticky note";
    this.fontSize = params.fontSize ?? 16;
    this.fillColor = params.fillColor ?? "#fef08a";
    this.borderColor = params.borderColor ?? "#854d0e";
    this.textAlign = "center";
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 1;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    if (this.isSelected) {
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    ctx.fillStyle = "#1f2937";
    ctx.font = `${this.fontSize}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    const textX = this.x + this.width / 2;
    const maxLineWidth = Math.max(0, this.width - 16);
    const lines = wrapLines(ctx, this.text, maxLineWidth);
    const lineHeight = Math.max(12, this.fontSize * 1.3);
    const totalTextHeight = lines.length * lineHeight;
    const contentHeight = Math.max(0, this.height - 16);
    const startY =
      this.y + 8 + Math.max(0, (contentHeight - totalTextHeight) / 2);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], textX, startY + i * lineHeight, maxLineWidth);
    }
    ctx.restore();
  }

  override getStyleControlOptions() {
    return {
      ...super.getStyleControlOptions(),
      textAlign: false,
    };
  }

  contains(point: Point): boolean {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height
    );
  }

  toJSON(): CanvasElementJSON {
    return {
      type: "sticky",
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      isSelected: this.isSelected,
      text: this.text,
      fontSize: this.fontSize,
      fillColor: this.fillColor,
      borderColor: this.borderColor,
      textAlign: this.textAlign,
    };
  }

  static fromJSON(json: CanvasElementJSON): StickyNoteElement {
    return new StickyNoteElement(json);
  }
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (maxWidth <= 0) {
    return [""];
  }

  const result: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      result.push("");
      continue;
    }

    const words = paragraph.split(" ");
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        if (line) {
          result.push(line);
        }
        line = word;
      }
    }

    result.push(line);
  }

  return result.length > 0 ? result : [""];
}

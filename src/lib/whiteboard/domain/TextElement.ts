import { CanvasElement } from "./CanvasElement";
import type { CanvasElementJSON, Point, TextAlign } from "./types";

export class TextElement extends CanvasElement {
  text: string;
  fontSize: number;
  fillColor: string;
  borderColor: string;
  textColor: string;
  textAlign: TextAlign;

  constructor(
    params: ConstructorParameters<typeof CanvasElement>[0] & {
      text?: string;
      fontSize?: number;
      fillColor?: string;
      borderColor?: string;
      textColor?: string;
      textAlign?: TextAlign;
    },
  ) {
    super(params);
    this.text = params.text ?? "Text";
    this.fontSize = params.fontSize ?? 18;
    this.fillColor = params.fillColor ?? "#ffffff";
    this.borderColor = params.borderColor ?? "#6b7280";
    this.textColor = params.textColor ?? "#111827";
    this.textAlign = params.textAlign ?? "left";
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 1;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.font = `${this.fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = this.textColor;
    ctx.textBaseline = "top";
    ctx.textAlign = this.textAlign;
    const textX =
      this.textAlign === "left"
        ? this.x + 8
        : this.textAlign === "center"
          ? this.x + this.width / 2
          : this.x + this.width - 8;
    const maxLineWidth = Math.max(0, this.width - 16);
    const lines = wrapLines(ctx, this.text, maxLineWidth);
    const lineHeight = Math.max(12, this.fontSize * 1.3);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], textX, this.y + 6 + i * lineHeight, maxLineWidth);
    }
    if (this.isSelected) {
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    ctx.restore();
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
      type: "text",
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
      textColor: this.textColor,
      textAlign: this.textAlign,
    };
  }

  static fromJSON(json: CanvasElementJSON): TextElement {
    return new TextElement(json);
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

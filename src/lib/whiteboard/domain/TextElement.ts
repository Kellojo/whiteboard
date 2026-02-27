import { CanvasElement } from "./CanvasElement";
import type { CanvasElementJSON, Point, TextAlign } from "./types";

export class TextElement extends CanvasElement {
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
    this.text = params.text ?? "Text";
    this.fontSize = params.fontSize ?? 18;
    this.fillColor = params.fillColor ?? "#ffffff";
    this.borderColor = params.borderColor ?? "#6b7280";
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
    ctx.fillStyle = "#111827";
    ctx.textBaseline = "top";
    ctx.textAlign = this.textAlign;
    const textX =
      this.textAlign === "left"
        ? this.x + 8
        : this.textAlign === "center"
          ? this.x + this.width / 2
          : this.x + this.width - 8;
    ctx.fillText(this.text, textX, this.y + 6, Math.max(0, this.width - 16));
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
      textAlign: this.textAlign,
    };
  }

  static fromJSON(json: CanvasElementJSON): TextElement {
    return new TextElement(json);
  }
}

import { CanvasElement } from "./CanvasElement";
import type { CanvasElementJSON, Point, TextAlign } from "./types";

export class StickyNoteElement extends CanvasElement {
  text: string;
  fillColor: string;
  borderColor: string;
  textAlign: TextAlign;

  constructor(
    params: ConstructorParameters<typeof CanvasElement>[0] & {
      text?: string;
      fillColor?: string;
      borderColor?: string;
      textAlign?: TextAlign;
    },
  ) {
    super(params);
    this.text = params.text ?? "Sticky note";
    this.fillColor = params.fillColor ?? "#fef08a";
    this.borderColor = params.borderColor ?? "#854d0e";
    this.textAlign = params.textAlign ?? "left";
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
    ctx.font = "16px Inter, system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = this.textAlign;
    const textX =
      this.textAlign === "left"
        ? this.x + 8
        : this.textAlign === "center"
          ? this.x + this.width / 2
          : this.x + this.width - 8;
    ctx.fillText(
      this.text,
      textX,
      this.y + 8,
      Math.max(0, this.width - 16),
    );
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
      type: "sticky",
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      isSelected: this.isSelected,
      text: this.text,
      fillColor: this.fillColor,
      borderColor: this.borderColor,
      textAlign: this.textAlign,
    };
  }

  static fromJSON(json: CanvasElementJSON): StickyNoteElement {
    return new StickyNoteElement(json);
  }
}

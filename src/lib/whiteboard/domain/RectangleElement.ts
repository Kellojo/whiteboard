import { CanvasElement } from "./CanvasElement";
import type { CanvasElementJSON, Point } from "./types";

export class RectangleElement extends CanvasElement {
  fillColor: string;
  borderColor: string;

  constructor(
    params: ConstructorParameters<typeof CanvasElement>[0] & {
      fillColor?: string;
      borderColor?: string;
    },
  ) {
    super(params);
    this.fillColor = params.fillColor ?? "#dbeafe";
    this.borderColor = params.borderColor ?? "#1e3a8a";
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
      type: "rectangle",
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      isSelected: this.isSelected,
      fillColor: this.fillColor,
      borderColor: this.borderColor,
    };
  }

  static fromJSON(json: CanvasElementJSON): RectangleElement {
    return new RectangleElement(json);
  }
}

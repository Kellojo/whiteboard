import { CanvasElement } from "./CanvasElement";
import type { CanvasElementJSON, Point } from "./types";

export class EllipseElement extends CanvasElement {
  fillColor: string;
  borderColor: string;

  constructor(
    params: ConstructorParameters<typeof CanvasElement>[0] & {
      fillColor?: string;
      borderColor?: string;
    },
  ) {
    super(params);
    this.fillColor = params.fillColor ?? "#dcfce7";
    this.borderColor = params.borderColor ?? "#166534";
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      Math.abs(this.width) / 2,
      Math.abs(this.height) / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    if (this.isSelected) {
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  contains(point: Point): boolean {
    const rx = Math.abs(this.width) / 2;
    const ry = Math.abs(this.height) / 2;
    if (rx === 0 || ry === 0) {
      return false;
    }
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const normX = (point.x - cx) / rx;
    const normY = (point.y - cy) / ry;
    return normX * normX + normY * normY <= 1;
  }

  toJSON(): CanvasElementJSON {
    return {
      type: "ellipse",
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

  static fromJSON(json: CanvasElementJSON): EllipseElement {
    return new EllipseElement(json);
  }
}

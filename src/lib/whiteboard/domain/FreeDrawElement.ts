import { CanvasElement } from "./CanvasElement";
import type { CanvasElementJSON, Point } from "./types";

export class FreeDrawElement extends CanvasElement {
  points: Point[];
  strokeWidth: number;
  strokeColor: string;

  get borderColor(): string {
    return this.strokeColor;
  }

  set borderColor(color: string) {
    this.strokeColor = color;
  }

  constructor(
    params: ConstructorParameters<typeof CanvasElement>[0] & {
      points?: Point[];
      strokeWidth?: number;
      strokeColor?: string;
    },
  ) {
    super(params);
    this.points =
      params.points && params.points.length >= 2
        ? params.points.map((point) => ({ x: point.x, y: point.y }))
        : [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 },
          ];
    this.strokeWidth = Math.max(1, params.strokeWidth ?? 3);
    this.strokeColor = params.strokeColor ?? "#9ca3af";
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.points.length < 2) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    const first = this.toAbsolutePoint(this.points[0]);
    ctx.moveTo(first.x, first.y);
    for (let index = 1; index < this.points.length; index += 1) {
      const point = this.toAbsolutePoint(this.points[index]);
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    if (this.isSelected) {
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    ctx.restore();
  }

  contains(point: Point): boolean {
    if (this.points.length < 2) {
      return false;
    }

    const hitPadding = Math.max(12, this.strokeWidth * 2 + 4);
    const minX = this.x - hitPadding;
    const minY = this.y - hitPadding;
    const maxX = this.x + this.width + hitPadding;
    const maxY = this.y + this.height + hitPadding;

    if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
      return false;
    }

    for (let index = 1; index < this.points.length; index += 1) {
      const previous = this.toAbsolutePoint(this.points[index - 1]);
      const current = this.toAbsolutePoint(this.points[index]);
      if (distanceToSegment(point, previous, current) <= hitPadding) {
        return true;
      }
    }

    return false;
  }

  toJSON(): CanvasElementJSON {
    return {
      type: "freedraw",
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      isSelected: this.isSelected,
      points: this.points.map((point) => ({ x: point.x, y: point.y })),
      strokeWidth: this.strokeWidth,
      strokeColor: this.strokeColor,
    };
  }

  static fromJSON(json: CanvasElementJSON): FreeDrawElement {
    const points =
      Array.isArray(json.points) && json.points.length >= 2
        ? json.points
            .filter(
              (point): point is Point =>
                typeof point?.x === "number" && typeof point?.y === "number",
            )
            .map((point) => ({ x: point.x, y: point.y }))
        : undefined;

    return new FreeDrawElement({
      ...json,
      points,
      strokeWidth: json.strokeWidth,
      strokeColor: json.strokeColor,
      width: Math.max(1, json.width),
      height: Math.max(1, json.height),
    });
  }

  private toAbsolutePoint(point: Point): Point {
    return {
      x: this.x + point.x * this.width,
      y: this.y + point.y * this.height,
    };
  }
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const projection =
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  const t = Math.max(0, Math.min(1, projection));
  const nearestX = start.x + t * dx;
  const nearestY = start.y + t * dy;

  return Math.hypot(point.x - nearestX, point.y - nearestY);
}

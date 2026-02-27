import type { CanvasElementJSON, Point } from "./types";

export abstract class CanvasElement {
  readonly id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isSelected: boolean;

  constructor(params: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    isSelected?: boolean;
  }) {
    this.id = params.id;
    this.x = params.x;
    this.y = params.y;
    this.width = params.width;
    this.height = params.height;
    this.rotation = params.rotation ?? 0;
    this.isSelected = params.isSelected ?? false;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract contains(point: Point): boolean;
  abstract toJSON(): CanvasElementJSON;

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  static fromJSON(_json: CanvasElementJSON): CanvasElement {
    throw new Error("Use element factory to deserialize");
  }
}

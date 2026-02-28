import type { CanvasElementJSON, Point } from "./types";

export interface StyleControlOptions {
  fillColor: boolean;
  borderColor: boolean;
  textColor: boolean;
  textAlign: boolean;
  fontSize: boolean;
  fontWeight: boolean;
}

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

  getStyleControlOptions(): StyleControlOptions {
    const element = this as unknown as Record<string, unknown>;
    const textAlignValue = element.textAlign;

    return {
      fillColor: typeof element.fillColor === "string",
      borderColor: typeof element.borderColor === "string",
      textColor: typeof element.textColor === "string",
      textAlign:
        textAlignValue === "left" ||
        textAlignValue === "center" ||
        textAlignValue === "right",
      fontSize: typeof element.fontSize === "number",
      fontWeight:
        element.fontWeight === "normal" || element.fontWeight === "bold",
    };
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  static fromJSON(_json: CanvasElementJSON): CanvasElement {
    throw new Error("Use element factory to deserialize");
  }
}

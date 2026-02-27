export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TextAlign = "left" | "center" | "right";

export interface CanvasElementJSON {
  type: string;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isSelected?: boolean;
  text?: string;
  fontSize?: number;
  fillColor?: string;
  borderColor?: string;
  textAlign?: TextAlign;
}

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
export type FontWeight = "normal" | "bold";

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
  textColor?: string;
  textAlign?: TextAlign;
  fontWeight?: FontWeight;
  imageDataUrl?: string;
  iconId?: string;
  iconColor?: string;
  videoUrl?: string;
}

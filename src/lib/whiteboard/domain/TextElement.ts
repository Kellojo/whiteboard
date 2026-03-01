import { CanvasElement } from "./CanvasElement";
import { drawMarkdownText } from "./markdownCanvas";
import { resolveThemeAwareTextColor } from "../themeTextColor";
import type { CanvasElementJSON, FontWeight, Point, TextAlign } from "./types";

export class TextElement extends CanvasElement {
  text: string;
  fontSize: number;
  fillColor: string;
  borderColor: string;
  textColor: string;
  textAlign: TextAlign;
  fontWeight: FontWeight;

  constructor(
    params: ConstructorParameters<typeof CanvasElement>[0] & {
      text?: string;
      fontSize?: number;
      fillColor?: string;
      borderColor?: string;
      textColor?: string;
      textAlign?: TextAlign;
      fontWeight?: FontWeight;
    },
  ) {
    super(params);
    this.text = params.text ?? "Text";
    this.fontSize = params.fontSize ?? 18;
    this.fillColor = params.fillColor ?? "transparent";
    this.borderColor = params.borderColor ?? "transparent";
    this.textColor = params.textColor ?? "#111827";
    this.textAlign = params.textAlign ?? "left";
    this.fontWeight = params.fontWeight ?? "normal";
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 1;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    const renderedTextColor = resolveThemeAwareTextColor(
      this.textColor,
      this.fillColor,
    );

    drawMarkdownText(ctx, {
      text: this.text,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      fontSize: this.fontSize,
      fontWeight: this.fontWeight,
      textAlign: this.textAlign,
      textColor: renderedTextColor,
      paddingX: 8,
      paddingTop: 6,
    });
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
      fontWeight: this.fontWeight,
    };
  }

  static fromJSON(json: CanvasElementJSON): TextElement {
    return new TextElement(json);
  }
}

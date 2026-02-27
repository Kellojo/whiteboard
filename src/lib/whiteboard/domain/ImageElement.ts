import { CanvasElement } from "./CanvasElement";
import type { CanvasElementJSON, Point } from "./types";

export class ImageElement extends CanvasElement {
  imageDataUrl: string;
  private image: HTMLImageElement | null = null;
  private loaded = false;

  constructor(
    params: ConstructorParameters<typeof CanvasElement>[0] & {
      imageDataUrl?: string;
    },
  ) {
    super(params);
    this.imageDataUrl = params.imageDataUrl ?? "";
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.ensureImage();

    ctx.save();
    if (this.loaded && this.image) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeStyle = "#9ca3af";
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

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
      type: "image",
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      isSelected: this.isSelected,
      imageDataUrl: this.imageDataUrl,
    };
  }

  static fromJSON(json: CanvasElementJSON): ImageElement {
    return new ImageElement({
      ...json,
      imageDataUrl: json.imageDataUrl ?? "",
    });
  }

  private ensureImage() {
    if (this.image || !this.imageDataUrl) {
      return;
    }

    this.image = new Image();
    this.image.onload = () => {
      this.loaded = true;
    };
    this.image.src = this.imageDataUrl;
  }
}

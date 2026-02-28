import { CanvasElement } from "./CanvasElement";
import type { CanvasElementJSON, Point } from "./types";

export class VideoElement extends CanvasElement {
  videoUrl: string;

  constructor(
    params: ConstructorParameters<typeof CanvasElement>[0] & {
      videoUrl?: string;
    },
  ) {
    super(params);
    this.videoUrl = params.videoUrl ?? "";
  }

  static extractYouTubeVideoId(input: string): string | null {
    const value = input.trim();
    if (!value) {
      return null;
    }

    const withProtocol = /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`;

    try {
      const url = new URL(withProtocol);
      const host = url.hostname.toLowerCase();

      if (host.includes("youtu.be")) {
        const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }

      if (
        host.includes("youtube.com") ||
        host.includes("youtube-nocookie.com")
      ) {
        const direct = url.searchParams.get("v") ?? "";
        if (/^[a-zA-Z0-9_-]{11}$/.test(direct)) {
          return direct;
        }

        const pathParts = url.pathname.split("/").filter(Boolean);
        const key = pathParts[0] ?? "";
        const candidate = pathParts[1] ?? "";
        if (
          (key === "embed" || key === "shorts" || key === "live") &&
          /^[a-zA-Z0-9_-]{11}$/.test(candidate)
        ) {
          return candidate;
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  static toEmbedUrl(input: string): string | null {
    const id = VideoElement.extractYouTubeVideoId(input);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = "#111827";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    const iconWidth = Math.min(44, Math.max(24, this.width * 0.18));
    const iconHeight = Math.min(52, Math.max(28, this.height * 0.24));
    const iconX = this.x + this.width / 2 - iconWidth / 2;
    const iconY = this.y + this.height / 2 - iconHeight / 2;

    ctx.fillStyle = "#9ca3af";
    ctx.beginPath();
    ctx.moveTo(iconX, iconY);
    ctx.lineTo(iconX, iconY + iconHeight);
    ctx.lineTo(iconX + iconWidth, iconY + iconHeight * 0.5);
    ctx.closePath();
    ctx.fill();

    if (this.isSelected) {
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    } else {
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
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
      type: "video",
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      isSelected: this.isSelected,
      videoUrl: this.videoUrl,
    };
  }

  static fromJSON(json: CanvasElementJSON): VideoElement {
    return new VideoElement({
      ...json,
      videoUrl: json.videoUrl ?? "",
    });
  }
}

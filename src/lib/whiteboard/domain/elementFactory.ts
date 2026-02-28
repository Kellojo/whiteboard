import type { CanvasElement } from "./CanvasElement";
import { EllipseElement } from "./EllipseElement";
import { FreeDrawElement } from "./FreeDrawElement";
import { ImageElement } from "./ImageElement";
import { RectangleElement } from "./RectangleElement";
import { StickyNoteElement } from "./StickyNoteElement";
import { TextElement } from "./TextElement";
import { VideoElement } from "./VideoElement";
import type { CanvasElementJSON } from "./types";

export function elementFromJSON(json: CanvasElementJSON): CanvasElement {
  switch (json.type) {
    case "rectangle":
      return RectangleElement.fromJSON(json);
    case "ellipse":
      return EllipseElement.fromJSON(json);
    case "text":
      return TextElement.fromJSON(json);
    case "sticky":
      return StickyNoteElement.fromJSON(json);
    case "image":
      return ImageElement.fromJSON(json);
    case "video":
      return VideoElement.fromJSON(json);
    case "freedraw":
      return FreeDrawElement.fromJSON(json);
    default:
      throw new Error(`Unknown element type: ${json.type}`);
  }
}

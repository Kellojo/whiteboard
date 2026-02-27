import type { CanvasElement } from "./CanvasElement";
import type { Point } from "./types";

export interface BoardJSON {
  elements: ReturnType<CanvasElement["toJSON"]>[];
  viewport?: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
}

export class Board {
  private elements: CanvasElement[] = [];

  getAllElements(): CanvasElement[] {
    return this.elements;
  }

  setElements(elements: CanvasElement[]): void {
    this.elements = elements;
  }

  addElement(element: CanvasElement): void {
    this.elements.push(element);
  }

  removeElement(id: string): void {
    this.elements = this.elements.filter((element) => element.id !== id);
  }

  clearSelection(): void {
    for (const element of this.elements) {
      element.isSelected = false;
    }
  }

  setSelectionByIds(ids: Set<string>): void {
    for (const element of this.elements) {
      element.isSelected = ids.has(element.id);
    }
  }

  getSelectedElements(): CanvasElement[] {
    return this.elements.filter((element) => element.isSelected);
  }

  hitTest(point: Point): CanvasElement | undefined {
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const candidate = this.elements[i];
      if (candidate.contains(point)) {
        return candidate;
      }
    }
    return undefined;
  }
}

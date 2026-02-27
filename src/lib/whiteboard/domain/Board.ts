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

  moveElementBy(id: string, delta: number): boolean {
    const fromIndex = this.elements.findIndex((element) => element.id === id);
    if (fromIndex === -1) {
      return false;
    }

    const toIndex = Math.max(
      0,
      Math.min(this.elements.length - 1, fromIndex + delta),
    );
    if (toIndex === fromIndex) {
      return false;
    }

    const [element] = this.elements.splice(fromIndex, 1);
    this.elements.splice(toIndex, 0, element);
    return true;
  }

  moveElementToFront(id: string): boolean {
    const fromIndex = this.elements.findIndex((element) => element.id === id);
    if (fromIndex === -1 || fromIndex === this.elements.length - 1) {
      return false;
    }

    const [element] = this.elements.splice(fromIndex, 1);
    this.elements.push(element);
    return true;
  }

  moveElementToBack(id: string): boolean {
    const fromIndex = this.elements.findIndex((element) => element.id === id);
    if (fromIndex <= 0) {
      return false;
    }

    const [element] = this.elements.splice(fromIndex, 1);
    this.elements.unshift(element);
    return true;
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

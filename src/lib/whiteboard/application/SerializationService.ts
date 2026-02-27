import { Board, type BoardJSON } from "../domain/Board";
import { elementFromJSON } from "../domain/elementFactory";

export class SerializationService {
  static exportBoard(
    board: Board,
    options?: { viewport?: { zoom: number; offsetX: number; offsetY: number } },
  ): string {
    const serialized: BoardJSON = {
      elements: board.getAllElements().map((element) => element.toJSON()),
      viewport: options?.viewport,
    };
    return JSON.stringify(serialized, null, 2);
  }

  static importBoard(payload: string): {
    board: Board;
    viewport?: { zoom: number; offsetX: number; offsetY: number };
  } {
    const parsed = JSON.parse(payload) as BoardJSON;
    if (!Array.isArray(parsed.elements)) {
      throw new Error("Invalid board payload: elements array missing");
    }

    const board = new Board();
    board.setElements(parsed.elements.map((json) => elementFromJSON(json)));
    return {
      board,
      viewport: parsed.viewport,
    };
  }
}

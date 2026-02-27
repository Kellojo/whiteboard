import { Board, type BoardJSON } from "../domain/Board";
import { elementFromJSON } from "../domain/elementFactory";

export class SerializationService {
  static exportBoard(board: Board): string {
    const serialized: BoardJSON = {
      elements: board.getAllElements().map((element) => element.toJSON()),
    };
    return JSON.stringify(serialized, null, 2);
  }

  static importBoard(payload: string): Board {
    const parsed = JSON.parse(payload) as BoardJSON;
    if (!Array.isArray(parsed.elements)) {
      throw new Error("Invalid board payload: elements array missing");
    }

    const board = new Board();
    board.setElements(parsed.elements.map((json) => elementFromJSON(json)));
    return board;
  }
}

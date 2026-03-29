import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { readBoardById } from "$lib/server/boardsStore";
import { embedImagesIntoPayload } from "$lib/server/imageStore";

export const GET: RequestHandler = async ({ params }) => {
  const board = await readBoardById(params.id);
  if (!board) {
    return json({ message: "Board not found" }, { status: 404 });
  }

  try {
    const payloadWithEmbedded = await embedImagesIntoPayload(
      JSON.parse(JSON.stringify(board.payload)),
    );
    return json({
      board: { id: board.id, name: board.name, payload: payloadWithEmbedded },
    });
  } catch (err) {
    console.error("export embed error", err);
    return json({ message: "Failed to export board" }, { status: 500 });
  }
};

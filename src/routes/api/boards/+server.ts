import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createBoard, listBoards } from "$lib/server/boardsStore";

export const GET: RequestHandler = async () => {
  const boards = await listBoards();
  return json({ boards });
};

export const POST: RequestHandler = async ({ request }) => {
  let name: string | undefined;
  try {
    const body = (await request.json()) as { name?: string };
    name = body.name;
  } catch {
    name = undefined;
  }

  const board = await createBoard(name);
  return json(
    {
      board: {
        id: board.id,
        name: board.name,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      },
    },
    { status: 201 },
  );
};

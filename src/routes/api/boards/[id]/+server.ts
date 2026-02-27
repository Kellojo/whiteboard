import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  deleteBoard,
  readBoardById,
  renameBoard,
  saveBoardPayload,
} from "$lib/server/boardsStore";
import type { BoardJSON } from "$lib/whiteboard/domain/Board";

export const GET: RequestHandler = async ({ params }) => {
  const board = await readBoardById(params.id);
  if (!board) {
    return json({ message: "Board not found" }, { status: 404 });
  }

  return json({
    board: {
      id: board.id,
      name: board.name,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      payload: board.payload,
    },
  });
};

export const PUT: RequestHandler = async ({ params, request }) => {
  let body: { payload?: BoardJSON; name?: string };
  try {
    body = (await request.json()) as { payload?: BoardJSON; name?: string };
  } catch {
    return json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body.payload ||
    typeof body.payload !== "object" ||
    !Array.isArray(body.payload.elements)
  ) {
    return json({ message: "Missing payload.elements" }, { status: 400 });
  }

  const updated = await saveBoardPayload(params.id, body.payload, body.name);
  if (!updated) {
    return json({ message: "Board not found" }, { status: 404 });
  }

  return json({
    board: {
      id: updated.id,
      name: updated.name,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.name !== "string") {
    return json({ message: "Missing name" }, { status: 400 });
  }

  const renamed = await renameBoard(params.id, body.name);
  if (!renamed) {
    return json({ message: "Board not found" }, { status: 404 });
  }

  return json({
    board: {
      id: renamed.id,
      name: renamed.name,
      createdAt: renamed.createdAt,
      updatedAt: renamed.updatedAt,
    },
  });
};

export const DELETE: RequestHandler = async ({ params }) => {
  const deleted = await deleteBoard(params.id);
  if (!deleted) {
    return json({ message: "Board not found" }, { status: 404 });
  }

  return json({ ok: true });
};

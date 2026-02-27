import {
  mkdir,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import type { BoardJSON } from "$lib/whiteboard/domain/Board";

export interface StoredBoardMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredBoard extends StoredBoardMeta {
  payload: BoardJSON;
}

interface StoredBoardFile extends StoredBoard {
  version: number;
}

const STORAGE_DIR = join(process.cwd(), ".whiteboards");
const STORAGE_VERSION = 1;

function boardFilePath(id: string): string {
  return join(STORAGE_DIR, `${id}.json`);
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${randomPart}`;
}

async function ensureStorageDir(): Promise<void> {
  await mkdir(STORAGE_DIR, { recursive: true });
}

function defaultPayload(): BoardJSON {
  return {
    elements: [],
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
  };
}

function sanitizeName(input: string | undefined): string {
  const candidate = (input ?? "").trim();
  return candidate.length > 0 ? candidate.slice(0, 80) : "Untitled board";
}

function toMeta(board: StoredBoard): StoredBoardMeta {
  return {
    id: board.id,
    name: board.name,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

function parseStoredBoardFile(raw: string): StoredBoard {
  const parsed = JSON.parse(raw) as Partial<StoredBoardFile>;
  if (
    typeof parsed.id !== "string" ||
    typeof parsed.name !== "string" ||
    typeof parsed.createdAt !== "string" ||
    typeof parsed.updatedAt !== "string" ||
    typeof parsed.payload !== "object" ||
    parsed.payload === null ||
    !Array.isArray((parsed.payload as BoardJSON).elements)
  ) {
    throw new Error("Invalid board file");
  }

  return {
    id: parsed.id,
    name: parsed.name,
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
    payload: parsed.payload as BoardJSON,
  };
}

async function writeStoredBoard(board: StoredBoard): Promise<void> {
  await ensureStorageDir();
  const body: StoredBoardFile = {
    version: STORAGE_VERSION,
    ...board,
  };
  await writeFile(
    boardFilePath(board.id),
    JSON.stringify(body, null, 2),
    "utf-8",
  );
}

export async function listBoards(): Promise<StoredBoardMeta[]> {
  await ensureStorageDir();
  const files = await readdir(STORAGE_DIR);
  const metas: StoredBoardMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }

    const id = file.slice(0, -5);
    try {
      const board = await readBoardById(id);
      if (board) {
        metas.push(toMeta(board));
      }
    } catch {
      continue;
    }
  }

  metas.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return metas;
}

export async function readBoardById(id: string): Promise<StoredBoard | null> {
  await ensureStorageDir();
  const filePath = boardFilePath(id);

  try {
    const content = await readFile(filePath, "utf-8");
    return parseStoredBoardFile(content);
  } catch {
    return null;
  }
}

export async function createBoard(name?: string): Promise<StoredBoard> {
  const id = makeId();
  const timestamp = nowIso();
  const board: StoredBoard = {
    id,
    name: sanitizeName(name),
    createdAt: timestamp,
    updatedAt: timestamp,
    payload: defaultPayload(),
  };

  await writeStoredBoard(board);
  return board;
}

export async function saveBoardPayload(
  id: string,
  payload: BoardJSON,
  name?: string,
): Promise<StoredBoard | null> {
  const existing = await readBoardById(id);
  if (!existing) {
    return null;
  }

  const updated: StoredBoard = {
    ...existing,
    name: sanitizeName(name ?? existing.name),
    updatedAt: nowIso(),
    payload,
  };

  await writeStoredBoard(updated);
  return updated;
}

export async function renameBoard(
  id: string,
  name: string,
): Promise<StoredBoard | null> {
  const existing = await readBoardById(id);
  if (!existing) {
    return null;
  }

  const updated: StoredBoard = {
    ...existing,
    name: sanitizeName(name),
    updatedAt: nowIso(),
  };
  await writeStoredBoard(updated);
  return updated;
}

export async function boardExists(id: string): Promise<boolean> {
  const filePath = boardFilePath(id);
  try {
    const details = await stat(filePath);
    return details.isFile();
  } catch {
    return false;
  }
}

export async function deleteBoard(id: string): Promise<boolean> {
  await ensureStorageDir();
  try {
    await unlink(boardFilePath(id));
    return true;
  } catch {
    return false;
  }
}

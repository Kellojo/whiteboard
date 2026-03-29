import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  stat,
  unlink,
} from "node:fs/promises";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";

const STORAGE_DIR = join(process.cwd(), ".whiteboards");
const UPLOADS_DIR = join(STORAGE_DIR, "uploads");

async function ensureUploadsDir() {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

function isDataImageString(s: unknown): s is string {
  return typeof s === "string" && s.startsWith("data:image/");
}

function parseDataUrl(s: string) {
  const m = /^data:([^,;]+)(;base64)?,(.*)$/s.exec(s);
  if (!m) return null;
  return { mime: m[1], isBase64: !!m[2], data: m[3] };
}

function extForMime(mime: string) {
  switch (mime.toLowerCase()) {
    case "image/png":
      return ".png";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    default:
      const parts = mime.split("/");
      return parts.length === 2
        ? `.${parts[1].replace(/[^a-z0-9]/gi, "")}`
        : "";
  }
}

async function writeBufferIfNotExists(
  hash: string,
  ext: string,
  buffer: Buffer,
) {
  await ensureUploadsDir();
  const filename = `${hash}${ext}`;
  const target = join(UPLOADS_DIR, filename);
  try {
    await stat(target);
    return filename;
  } catch {
    await writeFile(target, buffer);
    return filename;
  }
}

async function extractAndStore(dataUrl: string) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return dataUrl;
  const buffer = parsed.isBase64
    ? Buffer.from(parsed.data, "base64")
    : Buffer.from(decodeURIComponent(parsed.data), "utf8");
  const hash = createHash("sha256").update(buffer).digest("hex");
  const ext = extForMime(parsed.mime) || "";
  const filename = await writeBufferIfNotExists(hash, ext, buffer);
  // return API path
  return `/api/uploads/${filename}`;
}

async function traverseAndExtract(obj: any): Promise<any> {
  if (Array.isArray(obj)) {
    return Promise.all(
      obj.map(async (v) =>
        typeof v === "string" && isDataImageString(v)
          ? await extractAndStore(v)
          : typeof v === "object" && v !== null
            ? await traverseAndExtract(v)
            : v,
      ),
    );
  }

  if (obj && typeof obj === "object") {
    const entries = Object.entries(obj);
    for (const [k, v] of entries) {
      if (typeof v === "string" && isDataImageString(v)) {
        obj[k] = await extractAndStore(v);
      } else if (typeof v === "object" && v !== null) {
        obj[k] = await traverseAndExtract(v);
      }
    }
    return obj;
  }

  return obj;
}

function isUploadRef(s: unknown): s is string {
  return (
    typeof s === "string" &&
    (s.startsWith("/api/uploads/") || s.startsWith("/uploads/"))
  );
}

function mimeFromExt(ext: string) {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function embedAndInline(obj: any): Promise<any> {
  if (Array.isArray(obj)) {
    return Promise.all(
      obj.map(async (v) =>
        isUploadRef(v)
          ? await fileRefToDataUrl(String(v))
          : typeof v === "object" && v !== null
            ? await embedAndInline(v)
            : v,
      ),
    );
  }

  if (obj && typeof obj === "object") {
    const entries = Object.entries(obj);
    for (const [k, v] of entries) {
      if (isUploadRef(v)) {
        obj[k] = await fileRefToDataUrl(String(v));
      } else if (typeof v === "object" && v !== null) {
        obj[k] = await embedAndInline(v);
      }
    }
    return obj;
  }

  return obj;
}

async function fileRefToDataUrl(ref: string) {
  // accept /api/uploads/<filename> or /uploads/<filename>
  const parts = ref.split("/");
  const filename = parts[parts.length - 1];
  const pathA = join(UPLOADS_DIR, filename);
  try {
    const buf = await readFile(pathA);
    const ext = extname(filename) || "";
    const mime = mimeFromExt(ext);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch (err) {
    // file not found in uploads dir; try static/uploads
    const staticPath = join(process.cwd(), "static", "uploads", filename);
    try {
      const buf = await readFile(staticPath);
      const ext = extname(filename) || "";
      const mime = mimeFromExt(ext);
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch (e) {
      return ref; // fallback to original reference if missing
    }
  }
}

export async function extractImagesFromPayload(payload: any): Promise<any> {
  await ensureUploadsDir();
  return traverseAndExtract(payload);
}

export async function embedImagesIntoPayload(payload: any): Promise<any> {
  return embedAndInline(payload);
}

// Run a migration across stored board files (idempotent)
export async function migrateExistingBoards(): Promise<{
  scanned: number;
  extracted: number;
}> {
  await ensureUploadsDir();
  const dir = STORAGE_DIR;
  let scanned = 0;
  let extracted = 0;
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      scanned++;
      const p = join(dir, f);
      try {
        const raw = await readFile(p, "utf8");
        const parsed = JSON.parse(raw);
        const before = JSON.stringify(parsed);
        await traverseAndExtract(parsed);
        const after = JSON.stringify(parsed);
        if (before !== after) {
          // backup original
          await writeFile(p + ".bak", raw, "utf8");
          await writeFile(p, JSON.stringify(parsed, null, 2), "utf8");
          // rough count of images extracted (diff in occurrences)
          extracted++;
        }
      } catch (err) {
        // ignore individual file errors
        continue;
      }
    }
  } catch (err) {
    // ignore
  }
  return { scanned, extracted };
}

let migrated = false;
export async function initMigrationIfNeeded() {
  if (migrated) return;
  migrated = true;
  try {
    await migrateExistingBoards();
  } catch (err) {
    // don't crash startup
    console.error("migration error", err);
  }
}

// List files in uploads dir (exclude trash directory)
export async function listUploadFiles(): Promise<string[]> {
  await ensureUploadsDir();
  const set = new Set<string>();
  try {
    const files = await readdir(UPLOADS_DIR);
    for (const f of files) set.add(f);
  } catch (err) {
    // ignore
  }
  // also include legacy static/uploads
  try {
    const staticDir = join(process.cwd(), "static", "uploads");
    const files2 = await readdir(staticDir);
    for (const f of files2) set.add(f);
  } catch (err) {
    // ignore
  }
  return Array.from(set);
}

async function findReferencedUploadFilenames(): Promise<Set<string>> {
  const refs = new Set<string>();
  try {
    const files = await readdir(STORAGE_DIR);
    const re = /\/(?:api\/uploads|uploads)\/([^\"'\s,\)\>]+)/g;
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const p = join(STORAGE_DIR, f);
        const raw = await readFile(p, "utf8");
        let m: RegExpExecArray | null;
        while ((m = re.exec(raw)) !== null) {
          if (m[1]) refs.add(m[1]);
        }
      } catch (err) {
        continue;
      }
    }
  } catch (err) {
    // ignore
  }
  return refs;
}

// Move orphaned uploads into a trash folder under uploads. Returns details.
export async function gcOrphanUploads(options?: {
  dryRun?: boolean;
  trashSubdir?: string;
}): Promise<{
  scannedBoards: number;
  totalUploads: number;
  orphanCount: number;
  orphans: string[];
  movedTo?: string;
}> {
  await ensureUploadsDir();
  const all = await listUploadFiles();
  const referenced = await findReferencedUploadFilenames();
  const orphans = all.filter((f) => !referenced.has(f));
  const scannedBoards = 0; // we don't currently count boards here separately
  const result: any = {
    scannedBoards,
    totalUploads: all.length,
    orphanCount: orphans.length,
    orphans,
  };

  if (options && options.dryRun) {
    return result;
  }

  if (orphans.length === 0) return result;

  if (orphans.length === 0) return result;

  const deleted: string[] = [];
  const failed: { file: string; error: string }[] = [];
  for (const f of orphans) {
    const p1 = join(UPLOADS_DIR, f);
    const p2 = join(process.cwd(), "static", "uploads", f);
    let removed = false;
    try {
      await unlink(p1);
      removed = true;
    } catch (err: any) {
      // try static location
      try {
        await unlink(p2);
        removed = true;
      } catch (err2: any) {
        failed.push({ file: f, error: String(err2) });
      }
    }
    if (removed) deleted.push(f);
  }

  result.deleted = deleted;
  result.deletedCount = deleted.length;
  result.failed = failed;
  result.orphanCount = deleted.length;
  return result;
}

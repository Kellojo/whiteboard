import { join, extname } from "path";
import { stat, readdir, readFile } from "fs/promises";

function mimeFromExt(ext) {
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

async function findFileById(dir, id) {
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (f === id) return join(dir, f);
      if (f.startsWith(id + ".")) return join(dir, f);
    }
  } catch (err) {
    // ignore
  }
  return null;
}

export async function GET({ params }) {
  const { id } = params;
  const cwd = process.cwd();
  const candidates = [
    join(cwd, ".whiteboards", "uploads"),
    join(cwd, "static", "uploads"),
  ];

  for (const dir of candidates) {
    const found = await findFileById(dir, id);
    if (found) {
      try {
        const s = await stat(found);
        if (!s.isFile()) continue;
        const data = await readFile(found);
        const ext = extname(found) || "";
        const mime = mimeFromExt(ext);

        const headers = new Headers();
        headers.set("Content-Type", mime);
        headers.set("Content-Length", String(data.length));
        // Long cache; content is served by ID derived from file name
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new Response(data, { status: 200, headers });
      } catch (err) {
        console.error("read upload file error", err);
        return new Response("Failed to read file", { status: 500 });
      }
    }
  }

  return new Response("Not found", { status: 404 });
}

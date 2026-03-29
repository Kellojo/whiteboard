import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

export async function POST({ request }) {
  try {
    const form = await request.formData();
    const file = form.get("file") as Blob | null;
    const filename = String(form.get("filename") ?? "upload");
    const width = Number(form.get("width") ?? 0) || 0;
    const height = Number(form.get("height") ?? 0) || 0;

    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
      });
    }

    const uploadsDir = join(process.cwd(), ".whiteboards", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // try to preserve extension from filename
    const ext = extname(filename) || "";
    const id = randomUUID();
    const targetName = `${id}${ext || ""}`;
    const targetPath = join(uploadsDir, targetName);

    await writeFile(targetPath, buffer);

    const url = `/api/uploads/${id}`;

    return new Response(JSON.stringify({ id, url, width, height }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload error", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
    });
  }
}

import type { LinkPreview } from "$lib/whiteboard/domain/LinkPreview";
import { json, type RequestHandler } from "@sveltejs/kit";
import { getLinkPreview } from "link-preview-js";

export const GET: RequestHandler = async ({ request }) => {
  let url: string | undefined;
  try {
    url = new URL(request.url).searchParams.get("url") ?? undefined;
  } catch {
    url = undefined;
  }

  if (!url) {
    return json({ message: "Missing url parameter" }, { status: 400 });
  }

  const preview = await getLinkPreviewData(url);
  if (!preview) {
    return json({ message: "Failed to fetch link preview" }, { status: 500 });
  }

  return json(preview, { status: 201 });
};

async function getLinkPreviewData(url: string): Promise<LinkPreview | null> {
  try {
    const preview: any = await getLinkPreview(url, {
      timeout: 5000,
    });

    return {
      url: url,
      title: preview.title,
      description: preview.description,
      image:
        preview.images && preview.images.length > 0
          ? preview.images[0]
          : undefined,
    };
  } catch (error) {
    console.error("Error fetching link preview:", error);
    return null;
  }
}

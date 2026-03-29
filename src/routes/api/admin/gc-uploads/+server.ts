import { json } from "@sveltejs/kit";
import { gcOrphanUploads } from "$lib/server/imageStore";

export async function POST({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = !!body.dryRun;
    const res = await gcOrphanUploads({ dryRun });
    return json({ ok: true, dryRun, result: res });
  } catch (err) {
    return json({ ok: false, error: String(err) }, { status: 500 });
  }
}

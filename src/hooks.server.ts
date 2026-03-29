import { initMigrationIfNeeded, gcOrphanUploads } from "$lib/server/imageStore";

// ensure migration runs when server starts (module load)
void initMigrationIfNeeded();

// Schedule daily orphan GC (runs once a day). Guard so we don't schedule multiple times
let _gcScheduled = false;
function scheduleDailyGc() {
  console.log("Scheduling daily GC of orphan uploads");
  if (_gcScheduled) return;
  _gcScheduled = true;
  const DAY = 24 * 60 * 60 * 1000;
  // initial delayed run to avoid startup contention
  setTimeout(() => {
    void gcOrphanUploads().catch((e) =>
      console.error("gcOrphanUploads error", e),
    );
    setInterval(() => {
      void gcOrphanUploads().catch((e) =>
        console.error("gcOrphanUploads error", e),
      );
    }, DAY);
  }, 60 * 1000);
}

scheduleDailyGc();

import { building } from "$app/environment";
import { redirect, type Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { getAuth } from "$lib/auth";

function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/whiteboard") ||
    pathname.startsWith("/api/boards")
  );
}

export const handle: Handle = async ({ event, resolve }) => {
  const auth = await getAuth();

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  event.locals.user = session?.user ?? null;
  event.locals.session = session?.session ?? null;

  const path = event.url.pathname;

  if (!event.locals.user && isProtectedPath(path)) {
    if (path.startsWith("/api/")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw redirect(303, "/auth/login");
  }

  if (
    event.locals.user &&
    (path === "/auth/login" || path === "/auth/signup")
  ) {
    throw redirect(303, "/");
  }

  return svelteKitHandler({
    event,
    resolve,
    auth: {
      handler: auth.handler,
      options: {
        ...auth.options,
        baseURL: event.url.origin,
      },
    },
    building,
  });
};

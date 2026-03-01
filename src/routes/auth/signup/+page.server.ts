import { configuredOidcProviders, emailPasswordAuthEnabled } from "$lib/auth";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(303, "/");
  }

  return {
    providers: configuredOidcProviders,
    emailPasswordAuthEnabled,
  };
};

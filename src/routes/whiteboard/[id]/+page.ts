import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const response = await fetch(`/api/boards/${params.id}`);

  if (response.status === 404) {
    throw error(404, "Whiteboard not found");
  }

  if (!response.ok) {
    throw error(500, "Failed to load whiteboard");
  }

  return {
    boardId: params.id,
  };
};

import searchIndex from "../virtual/searchIndex.mjs";

export const GET = (): Response =>
  new Response(JSON.stringify(searchIndex), {
    headers: {
      "Content-Type": "application/json",
    },
  });

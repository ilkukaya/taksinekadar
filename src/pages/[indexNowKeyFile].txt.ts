import type { APIRoute } from "astro";

/**
 * IndexNow requires the key to be served, verbatim, at https://site/{key}.txt. The path
 * itself IS the key, so this only produces a route at all when INDEXNOW_KEY is set —
 * with no key, getStaticPaths returns zero paths and nothing is generated (no fake file).
 */
export function getStaticPaths() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return [];
  return [{ params: { indexNowKeyFile: key } }];
}

export const GET: APIRoute = () => {
  return new Response(process.env.INDEXNOW_KEY ?? "", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

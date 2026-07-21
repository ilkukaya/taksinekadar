import type { APIRoute } from "astro";

/** Populated from env at build time — never a hardcoded/fabricated publisher ID. */
export const GET: APIRoute = () => {
  const pubId = import.meta.env.PUBLIC_ADSENSE_PUB_ID;
  const body = pubId
    ? `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`
    : "# AdSense henüz yapılandırılmadı.\n";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

import type { APIRoute } from "astro";
import { SITE } from "../config/site";

export const GET: APIRoute = () => {
  const manifest = {
    name: SITE.name,
    short_name: SITE.namePlain,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: SITE.language,
    theme_color: SITE.themeColor,
    background_color: SITE.backgroundColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
};

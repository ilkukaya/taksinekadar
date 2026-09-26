import type { APIRoute } from "astro";
import { SITE } from "../config/site";

/**
 * Everything public is crawlable. AI search / answer-engine crawlers are listed explicitly
 * (GEO): being cited by ChatGPT search, Perplexity, Gemini, Copilot or Claude is a traffic
 * source for a fact-lookup site like this one, and /llms.txt gives them a curated summary.
 */
const AI_AND_SEARCH_BOTS = [
  "Googlebot",
  "Bingbot",
  "YandexBot",
  "DuckDuckBot",
  "Applebot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "meta-externalagent",
  "Amazonbot",
  "MistralAI-User",
];

export const GET: APIRoute = () => {
  const body = `# ${SITE.name} — ${SITE.url}
User-agent: *
Allow: /
Disallow: /404/

${AI_AND_SEARCH_BOTS.map((bot) => `User-agent: ${bot}`).join("\n")}
Allow: /

Sitemap: ${SITE.url}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

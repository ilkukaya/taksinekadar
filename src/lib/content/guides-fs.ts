import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { PROJECT_ROOT } from "../utils/paths";

/**
 * `astro:content` is a virtual module only resolvable inside Astro's own Vite pipeline —
 * plain `tsx` scripts (sitemap/build-report generation) can't import it. This reads the
 * same source markdown directly so those scripts see the same guides Astro renders.
 */
export type GuideFrontmatter = {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  sourceName: string;
  sourceUrl?: string;
  editorNote: string;
  relatedGuides: string[];
};

export type GuideFsEntry = {
  id: string;
  data: GuideFrontmatter;
};

const GUIDES_DIR = join(PROJECT_ROOT, "src/content/rehber");

export function getAllGuidesFromDisk(): GuideFsEntry[] {
  return readdirSync(GUIDES_DIR)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => {
      const raw = readFileSync(join(GUIDES_DIR, filename), "utf-8");
      const { data } = matter(raw);
      return {
        id: filename.replace(/\.md$/, ""),
        data: data as GuideFrontmatter,
      };
    });
}

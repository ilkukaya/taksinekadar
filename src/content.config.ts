import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const rehber = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/rehber" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sourceName: z.string(),
    sourceUrl: z.string().url().optional(),
    editorNote: z.string(),
    relatedGuides: z.array(z.string()).default([]),
  }),
});

export const collections = { rehber };

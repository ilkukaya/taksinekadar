export type FaqEntry = { question: string; answer: string };

/** Caller must render every entry as visible on-page text — schema.org/Google policy requires
 * FAQPage markup to match visible content 1:1, never hidden or answer-only-in-schema. */
export function buildFaqPageSchema(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

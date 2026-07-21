import { canonicalUrl } from "../../config/site";

export type CollectionPageInput = {
  name: string;
  description: string;
  path: string;
  /** Only pass items that are ALSO rendered as a visible list on the page (spec §26). */
  itemList?: { name: string; path: string }[];
};

export function buildCollectionPageSchema(input: CollectionPageInput) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: canonicalUrl(input.path),
  };

  if (input.itemList && input.itemList.length > 0) {
    schema.mainEntity = {
      "@type": "ItemList",
      itemListElement: input.itemList.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: canonicalUrl(item.path),
      })),
    };
  }

  return schema;
}

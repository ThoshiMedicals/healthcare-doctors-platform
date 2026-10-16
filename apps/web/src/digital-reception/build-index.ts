export type SearchSourcePage = {
  id: string;
  clinicId: string;
  path: string;
  title: string;
  description: string;
  section: string;
  headings: string[];
  bodyText: string;
  related: string[];
  indexable: boolean;
};

export type SearchDocumentDraft = {
  clinicId: string;
  pageId: string;
  path: string;
  title: string;
  description: string;
  headings: string[];
  section: string;
  related: string[];
  bodyText: string;
  shard: string;
};

/**
 * Builds Digital Reception index rows from already published page records.
 * This function does not read the golden HTML package.
 */
export function buildSearchDocuments(pages: readonly SearchSourcePage[]): SearchDocumentDraft[] {
  return pages
    .filter((page) => page.indexable && page.path !== "404.html" && page.path !== "updates/article.html")
    .map((page) => ({
      clinicId: page.clinicId,
      pageId: page.id,
      path: page.path,
      title: page.title,
      description: page.description,
      headings: page.headings,
      section: page.section,
      related: page.related,
      bodyText: page.bodyText,
      shard: page.section || "general",
    }));
}

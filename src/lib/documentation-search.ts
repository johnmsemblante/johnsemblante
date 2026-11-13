import type { DocumentationGuide } from "@/content/admin-documentation";

export function normalizeDocumentation(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
export function searchDocumentation(guides: readonly DocumentationGuide[], query: string, category = "all") {
  const tokens = normalizeDocumentation(query).trim().split(/\s+/).filter(Boolean);
  return guides.filter(guide => {
    if (category !== "all" && guide.category !== category) return false;
    const content = normalizeDocumentation([guide.title, guide.summary, guide.category, ...guide.tags,
      ...guide.sections.flatMap(section => [section.heading, ...(section.paragraphs ?? []), ...(section.steps ?? [])]),
      ...(guide.links ?? []).map(link => link.label)].join(" "));
    return tokens.every(token => content.includes(token));
  }).sort((a, b) => {
    const score = (guide: DocumentationGuide) => tokens.reduce((sum, token) => sum + (normalizeDocumentation(guide.title).includes(token) ? 2 : 0) + (guide.tags.some(tag => normalizeDocumentation(tag).includes(token)) ? 1 : 0), 0);
    return score(b) - score(a);
  });
}

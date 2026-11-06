import { effectiveStatus, postFromData, type ManagedPost } from "./blog-model";

type WireValue = { stringValue?: string; integerValue?: string; timestampValue?: string; nullValue?: unknown; arrayValue?: { values?: WireValue[] } };
function decode(field: WireValue): unknown {
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.arrayValue !== undefined) return (field.arrayValue.values ?? []).map(decode);
  return null;
}

/** Anonymous reads only: this build never receives admin credentials or reads drafts. */
export async function fetchPublicBlogSnapshot(projectId: string, fetcher: typeof fetch = fetch, now = Date.now()): Promise<ManagedPost[]> {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) throw new Error("Invalid public Firebase project ID for blog export.");
  const result = new Map<string, ManagedPost>();
  const cutoff = now - 60000;
  for (const status of ["published", "scheduled"] as const) {
    let offset = 0;
    for (;;) {
      const filters = [{ fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: status } } }, ...(status === "scheduled" ? [
        { fieldFilter: { field: { fieldPath: "releaseAt" }, op: "GREATER_THAN_OR_EQUAL", value: { integerValue: "0" } } },
        { fieldFilter: { field: { fieldPath: "releaseAt" }, op: "LESS_THAN_OR_EQUAL", value: { integerValue: String(cutoff) } } },
      ] : [])];
      const response = await fetcher(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`, {
        method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "blogPosts" }], where: { compositeFilter: { op: "AND", filters } }, orderBy: [{ field: { fieldPath: status === "published" ? "publishedAt" : "releaseAt" }, direction: "DESCENDING" }], limit: 200, offset } }),
      });
      if (!response.ok) throw new Error(`Public blog export failed (HTTP ${response.status}). Check Firestore rules, indexes and network; the build was stopped.`);
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error("Invalid public blog export response.");
      const documents = rows.flatMap(row => row.document ? [row.document as { name: string; fields: Record<string, WireValue> }] : []);
      for (const document of documents) {
        const slug = document.name.split("/").at(-1)!;
        const value = Object.fromEntries(Object.entries(document.fields).map(([key, field]) => [key, decode(field)]));
        const post = postFromData(slug, value);
        if (!post) throw new Error(`Public blog export contains an invalid article: ${slug}. Correct it before rebuilding.`);
        if (effectiveStatus(post, cutoff) === "published") result.set(slug, post);
      }
      if (documents.length < 200) break;
      offset += documents.length;
    }
  }
  return [...result.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
}

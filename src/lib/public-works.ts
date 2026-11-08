import { validateWork, type PublicWork } from "./work-model";
type Wire = { stringValue?: string; integerValue?: string; booleanValue?: boolean; mapValue?: { fields?: Record<string, Wire> }; arrayValue?: { values?: Wire[] } };
function decode(v: Wire): unknown { if (v.stringValue !== undefined) return v.stringValue; if (v.integerValue !== undefined) return Number(v.integerValue); if (v.booleanValue !== undefined) return v.booleanValue; if (v.arrayValue) return (v.arrayValue.values ?? []).map(decode); if (v.mapValue) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k,v]) => [k,decode(v)])); return null; }
export async function fetchPublicWorks(projectId: string, fetcher: typeof fetch = fetch): Promise<PublicWork[]> {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) throw new Error("Invalid Firebase project ID.");
  const result: PublicWork[] = []; let pageToken = "";
  do {
    const response = await fetcher(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/publicWorks?pageSize=200${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`, { cache: "no-store", credentials: "omit" });
    if (!response.ok) throw new Error("Public Works could not be refreshed. Check access rules and your connection.");
    const body = await response.json();
    for (const document of body.documents ?? []) { const data = Object.fromEntries(Object.entries(document.fields ?? {}).map(([k,v]) => [k,decode(v as Wire)])) as unknown as PublicWork; if (data.slug !== document.name.split("/").at(-1) || typeof data.deleted !== "boolean" || (!data.deleted && (!data.project || data.project.slug !== data.slug || data.project.publication !== "published" || validateWork(data.project)))) throw new Error("Invalid public project record."); result.push(data); }
    pageToken = body.nextPageToken ?? "";
  } while (pageToken);
  return result;
}

import { pageIds, validatePage, type PageId, type PageRecord } from "./page-model";
type Wire = { stringValue?: string; integerValue?: string; mapValue?: { fields?: Record<string, Wire> }; arrayValue?: { values?: Wire[] } };
function decode(v: Wire): unknown {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.arrayValue) return (v.arrayValue.values ?? []).map(decode);
  if (v.mapValue) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k,v]) => [k,decode(v)]));
  return null;
}
export async function fetchPublicPages(project: string, fetcher: typeof fetch = fetch): Promise<Partial<Record<PageId, PageRecord>>> {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project)) throw new Error("Invalid Firebase project ID.");
  const records: Partial<Record<PageId, PageRecord>> = {};
  await Promise.all(pageIds.map(async id => {
    const response = await fetcher(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/pages/${id}`, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(20000) });
    if (response.status === 404) return;
    if (!response.ok) throw new Error(`Page ${id} could not be refreshed. Deploy the Pages Firestore rules first and check your connection (see docs/pages-admin.md).`);
    const body = await response.json();
    const record = Object.fromEntries(Object.entries(body.fields ?? {}).map(([k,v]) => [k,decode(v as Wire)]));
    if (!validatePage(record)) throw new Error(`Invalid page record: ${id}.`);
    records[id] = record;
  }));
  return records;
}

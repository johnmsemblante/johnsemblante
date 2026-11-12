import { parseVenture, type PublicVenture } from "./venture-model";
export async function fetchPublicVentures(project: string, fetcher: typeof fetch = fetch): Promise<PublicVenture[]> {
  if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project))throw new Error("Invalid Firebase project ID.");
  const records:PublicVenture[]=[];let token="";
  do {
    const response=await fetcher(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/publicVentures?pageSize=100${token?`&pageToken=${encodeURIComponent(token)}`:""}`,{cache:"no-store",credentials:"omit",signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error("Public ventures could not be refreshed. Deploy the Ventures Firestore rules and check your connection.");
    const body=await response.json();
    for(const doc of body.documents??[]){const f=doc.fields??{},slug=f.slug?.stringValue,deleted=f.deleted?.booleanValue,content=f.content?.stringValue;if(slug!==doc.name.split('/').at(-1)||typeof deleted!=="boolean"||(!deleted&&!parseVenture(content,slug)))throw new Error("Invalid public venture record.");records.push({slug,deleted,...(!deleted?{content}:{})});}
    token=body.nextPageToken??"";
  }while(token);
  return records;
}

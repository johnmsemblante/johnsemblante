import { doc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";
import { validateWork, type WorkRecord } from "./work-model";
import type { Project } from "@/content/site";
export async function writeWork(db: Firestore, project: Project, revision: number | null, remove = false) {
  const problem = validateWork(project); if (problem && !remove) throw new Error(problem);
  const ref = doc(db,"managedWorks",project.slug), publicRef = doc(db,"publicWorks",project.slug);
  await runTransaction(db, async tx => {
    const existing = await tx.get(ref);
    if ((existing.exists() ? existing.data().revision : null) !== revision) throw new Error("This work changed in another tab. Copy your edits and reopen it before trying again.");
    if (remove) tx.delete(ref);
    else tx.set(ref, { project, revision: (revision ?? 0) + 1, updatedAt: serverTimestamp() });
    tx.set(publicRef, !remove && project.publication === "published" ? {slug:project.slug, deleted:false, project} : {slug:project.slug, deleted:true});
  });
  return { project, revision: (revision ?? 0) + 1 } satisfies WorkRecord;
}

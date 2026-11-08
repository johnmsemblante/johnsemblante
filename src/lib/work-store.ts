import { doc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";
import { validateWork, type WorkRecord } from "./work-model";
import type { Project } from "@/content/site";
export async function writeWork(db: Firestore, project: Project, revision: number | null, remove = false, options: { originalSlug?: string | null; reservedSlugs?: string[] } = {}) {
  const problem = validateWork(project); if (problem && !remove) throw new Error(problem);
  const originalSlug = options.originalSlug === undefined ? project.slug : options.originalSlug;
  const renaming = !remove && !!originalSlug && originalSlug !== project.slug;
  if (!remove && (renaming || originalSlug === null) && options.reservedSlugs?.includes(project.slug)) throw new Error("That URL slug is already reserved. Choose another slug.");
  const ref = doc(db,"managedWorks",project.slug), publicRef = doc(db,"publicWorks",project.slug);
  const originalRef = doc(db, "managedWorks", originalSlug || project.slug);
  const originalPublicRef = doc(db, "publicWorks", originalSlug || project.slug);
  await runTransaction(db, async tx => {
    const existing = await tx.get(originalRef);
    if ((existing.exists() ? existing.data().revision : null) !== revision) throw new Error("This work changed in another tab. Copy your edits and reopen it before trying again.");
    if (renaming || originalSlug === null) {
      const target = renaming ? await tx.get(ref) : existing;
      const visibility = await tx.get(publicRef);
      if (target.exists() || visibility.exists()) throw new Error("That URL slug is already in use. Choose another slug.");
    }
    // A source-only project may have been deleted/drafted in another tab.
    if (revision === null && originalSlug) {
      const visibility = await tx.get(originalPublicRef);
      if (visibility.exists()) throw new Error("This work changed in another tab. Copy your edits and reopen it before trying again.");
    }
    if (remove) tx.delete(ref);
    else tx.set(ref, { project, revision: renaming ? 1 : (revision ?? 0) + 1, updatedAt: serverTimestamp() });
    tx.set(publicRef, !remove && project.publication === "published" ? {slug:project.slug, deleted:false, project} : {slug:project.slug, deleted:true});
    if (renaming) {
      if (existing.exists()) tx.delete(originalRef);
      tx.set(originalPublicRef, { slug: originalSlug, deleted: true });
    }
  });
  return { project, revision: renaming ? 1 : (revision ?? 0) + 1 } satisfies WorkRecord;
}

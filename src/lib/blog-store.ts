"use client";

import { doc, getDocFromServer, runTransaction, serverTimestamp, Timestamp, type Firestore } from "firebase/firestore";
import { postFromData, scheduleMillis, slugCandidate, slugForTitle, validatePost, type ManagedPost, type PostInput } from "./blog-model";

export async function saveManagedPost(db: Firestore, input: PostInput, saved: ManagedPost | null, reservedSlugs: string[], options: { slug?: string } = {}): Promise<ManagedPost> {
  const base = options.slug ?? saved?.slug ?? slugForTitle(input.title);
  const problem = validatePost({ ...input, slug: base });
  if (problem) throw new Error(problem);
  const slug = await runTransaction(db, async transaction => {
    const original = saved ? doc(db, "blogPosts", saved.slug) : null;
    const previous = original ? await transaction.get(original) : null;
    if (saved && (!previous?.exists() || previous.data().revision !== saved.revision)) throw new Error("revision-conflict");
    const renaming = !!saved && base !== saved.slug;
    let selected = base;
    let reference = doc(db, "blogPosts", selected);
    let current = saved && !renaming ? previous! : await transaction.get(reference);
    if (renaming || (!saved && options.slug !== undefined)) {
      if (current.exists() || reservedSlugs.includes(selected)) throw new Error("slug-in-use");
    } else if (!saved) {
      let attempt = 0;
      while (current.exists() || reservedSlugs.includes(selected)) {
        if (++attempt > 20) throw new Error("slug-conflict");
        selected = slugCandidate(base, attempt);
        reference = doc(db, "blogPosts", selected);
        current = await transaction.get(reference);
      }
    }
    const prior = previous ?? current;
    let publishedAt: ReturnType<typeof serverTimestamp> | Timestamp | null = null;
    if (input.status === "scheduled") publishedAt = Timestamp.fromMillis(scheduleMillis(input.scheduledFor));
    if (input.status === "published") {
      const existing = prior.exists() ? postFromData(saved?.slug ?? selected, prior.data()) : null;
      const alreadyPublic = existing && existing.publishedAt && (existing.status === "published" || (existing.status === "scheduled" && Date.parse(existing.publishedAt) <= Date.now()));
      publishedAt = alreadyPublic ? (prior.data()!.publishedAt instanceof Timestamp ? prior.data()!.publishedAt : Timestamp.fromDate(new Date(existing.publishedAt))) : serverTimestamp();
    }
    const { scheduledFor: _schedule, ...fields } = input;
    transaction.set(reference, { ...fields, slug: selected, category: input.categories[0], schemaVersion: 2, publishedAt, releaseAt: input.status === "scheduled" ? scheduleMillis(input.scheduledFor) : 0, revision: renaming ? 1 : (saved?.revision ?? 0) + 1, createdAt: prior.exists() ? prior.data().createdAt : serverTimestamp(), updatedAt: serverTimestamp(), ...(renaming ? { renamedFrom: saved!.slug } : {}) });
    if (renaming) transaction.delete(original!);
    return selected;
  });
  try {
    const snapshot = await getDocFromServer(doc(db, "blogPosts", slug));
    const post = snapshot.exists() ? postFromData(slug, snapshot.data()) : null;
    if (!post) throw new Error("saved-record-unavailable");
    return post;
  } catch { throw new Error("save-unconfirmed"); }
}

export async function deleteManagedPost(db: Firestore, saved: ManagedPost) {
  await runTransaction(db, async transaction => {
    const reference = doc(db, "blogPosts", saved.slug);
    const current = await transaction.get(reference);
    if (!current.exists() || current.data().revision !== saved.revision) throw new Error("revision-conflict");
    transaction.delete(reference);
  });
}

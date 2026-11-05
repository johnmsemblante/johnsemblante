"use client";

import { doc, getDocFromServer, runTransaction, serverTimestamp, Timestamp, type Firestore } from "firebase/firestore";
import { postFromData, scheduleMillis, slugCandidate, slugForTitle, type ManagedPost, type PostInput } from "./blog-model";

export async function saveManagedPost(db: Firestore, input: PostInput, saved: ManagedPost | null, reservedSlugs: string[]): Promise<ManagedPost> {
  const slug = await runTransaction(db, async transaction => {
    const base = saved?.slug ?? slugForTitle(input.title);
    let selected = base;
    let reference = doc(db, "blogPosts", selected);
    let current = await transaction.get(reference);
    if (saved) {
      if (!current.exists() || current.data().revision !== saved.revision) throw new Error("revision-conflict");
    } else {
      let attempt = 0;
      while (current.exists() || reservedSlugs.includes(selected)) {
        if (++attempt > 20) throw new Error("slug-conflict");
        selected = slugCandidate(base, attempt);
        reference = doc(db, "blogPosts", selected);
        current = await transaction.get(reference);
      }
    }
    let publishedAt: ReturnType<typeof serverTimestamp> | Timestamp | null = null;
    if (input.status === "scheduled") publishedAt = Timestamp.fromMillis(scheduleMillis(input.scheduledFor));
    if (input.status === "published") {
      const existing = current.exists() ? postFromData(selected, current.data()) : null;
      const alreadyPublic = existing && existing.publishedAt && (existing.status === "published" || (existing.status === "scheduled" && Date.parse(existing.publishedAt) <= Date.now()));
      publishedAt = alreadyPublic ? (current.data()!.publishedAt instanceof Timestamp ? current.data()!.publishedAt : Timestamp.fromDate(new Date(existing.publishedAt))) : serverTimestamp();
    }
    const { scheduledFor: _schedule, ...fields } = input;
    transaction.set(reference, { ...fields, slug: selected, category: input.categories[0], schemaVersion: 2, publishedAt, releaseAt: input.status === "scheduled" ? scheduleMillis(input.scheduledFor) : 0, revision: (saved?.revision ?? 0) + 1, createdAt: current.exists() ? current.data().createdAt : serverTimestamp(), updatedAt: serverTimestamp() });
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

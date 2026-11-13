"use client";

import { useEffect, useRef, useState } from "react";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseMessage } from "@/lib/firebase-client";
import { jobFromSaved, type Job } from "@/lib/jobs-model";
import { useAdmin } from "./admin-gate";
import { useAdminActivity, useAdminMessage } from "./use-admin-feedback";
import { notifyAdmin } from "@/lib/admin-feedback";

export function useSavedJobs() {
  const { user, db } = useAdmin();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useAdminMessage("error");
  const [actionError, setActionError] = useAdminMessage("error");
  const [pending, setPending] = useState<Set<string>>(new Set());
  useAdminActivity(loading || pending.size > 0, loading ? "Loading saved jobs…" : "Updating your saved jobs…");
  const actions = useRef(new Set<string>());
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true; setLoading(true); setJobs([]); setLoadError("");
    const stop = onSnapshot(query(collection(db, "admins", user.uid, "savedJobs"), orderBy("savedAt", "desc"), limit(100)), snapshot => {
      setJobs(snapshot.docs.flatMap(item => { const job = jobFromSaved(item.data()); return job?.sourceId === item.id ? [job] : []; }));
      setLoading(false); setLoadError("");
    }, cause => { setJobs([]); setLoading(false); setLoadError(firebaseMessage(cause)); });
    return () => { alive.current = false; stop(); };
  }, [db, user.uid]);

  async function toggle(job: Job) {
    if (loading || loadError || actions.current.has(job.sourceId)) return;
    actions.current.add(job.sourceId); setPending(new Set(actions.current)); setActionError("");
    try {
      const reference = doc(db, "admins", user.uid, "savedJobs", job.sourceId);
      const removing = jobs.some(saved => saved.sourceId === job.sourceId);
      if (removing) await deleteDoc(reference);
      else await setDoc(reference, { ...job, savedAt: serverTimestamp() });
      if (alive.current) notifyAdmin(removing ? "Job removed from your saved list." : "Job saved to your private shortlist.");
    } catch (cause) { if (alive.current) setActionError(firebaseMessage(cause)); }
    finally { actions.current.delete(job.sourceId); if (alive.current) setPending(new Set(actions.current)); }
  }
  return { jobs, loading, error: loadError || actionError, writable: !loading && !loadError, pending, toggle };
}

"use client";

import { useEffect, useRef, useState } from "react";
import { emptyResume, readResumeBackup, resumeStorageKey, type Resume } from "@/lib/resume-model";

/** One account-scoped local draft; competing tabs must be resolved before saving. */
export function useResumeDraft(uid: string) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [saving, setSaving] = useState(true);
  const [status, setStatus] = useState("Loading your browser draft…");
  const [conflict, setConflict] = useState(false);
  const lastStored = useRef<string | null>(null);
  const key = resumeStorageKey(uid);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      lastStored.current = raw;
      setResume(raw ? readResumeBackup(raw) : emptyResume());
      setStatus(raw ? "Draft restored from this browser." : "Your draft saves only in this browser.");
    } catch {
      setResume(emptyResume()); setSaving(false);
      setStatus("The saved draft could not be loaded. Local saving is paused. Export a backup of any new work before leaving.");
    }
    const changed = (event: StorageEvent) => {
      if ((event.key === key || event.key === null) && event.storageArea === localStorage) {
        setConflict(true); setStatus("Another tab changed or cleared this draft. Choose which version to keep before local saving continues.");
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [key]);
  useEffect(() => {
    if (!resume || !saving || conflict) return;
    try {
      if (localStorage.getItem(key) !== lastStored.current) {
        setConflict(true); setStatus("Another tab changed this draft. Choose which version to keep before local saving continues."); return;
      }
      const raw = JSON.stringify(resume);
      localStorage.setItem(key, raw); lastStored.current = raw;
      setStatus("Saved on this browser · no cloud sync");
    } catch {
      setSaving(false); setStatus("Browser storage is unavailable or full. Your edits remain in this tab. Export a JSON backup before leaving.");
    }
  }, [resume, saving, conflict, key]);

  function resolveConflict(loadStored: boolean) {
    try {
      const raw = localStorage.getItem(key);
      if (loadStored) setResume(raw ? readResumeBackup(raw) : emptyResume());
      lastStored.current = raw; setConflict(false);
    } catch { setStatus("The saved draft could not be read. Export this version as a backup, or choose Keep this version to replace the stored draft."); }
  }
  function toggleSaving(enabled: boolean) {
    try {
      if (!enabled) { localStorage.removeItem(key); lastStored.current = null; }
      else lastStored.current = localStorage.getItem(key);
      setSaving(enabled); setConflict(false);
      setStatus(enabled ? "Local saving enabled." : "Local saving is off; the stored copy was removed. Export a backup before leaving.");
    } catch { setStatus("Browser storage could not be changed. Check browser permissions and export a backup before leaving."); }
  }
  function clearDraft() {
    let removed = true;
    try { localStorage.removeItem(key); lastStored.current = null; }
    catch { removed = false; }
    setResume(emptyResume()); setSaving(false); setConflict(false);
    setStatus(removed ? "Draft cleared from this tab and browser storage. Local saving is off." : "Draft cleared from this tab, but browser permissions prevented removing the stored copy. Clear this site’s browser data to remove it. Local saving is off.");
  }
  return { resume, setResume, saving, status, conflict, resolveConflict, toggleSaving, clearDraft };
}

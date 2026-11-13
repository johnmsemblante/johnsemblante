"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { clearAdminFeedback, dismissAdminNotice, getAdminFeedback, getServerAdminFeedback, notifyAdmin, subscribeAdminFeedback, type AdminNotice } from "@/lib/admin-feedback";

function FeedbackNotice({ notice }: { notice: AdminNotice }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (notice.kind === "error" || paused) return;
    const timeout = window.setTimeout(() => dismissAdminNotice(notice.id), Math.max(8000, Math.min(20000, notice.message.length * 55)));
    return () => window.clearTimeout(timeout);
  }, [notice.id, notice.kind, notice.message, paused]);
  return <div className={`admin-feedback-notice is-${notice.kind}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
    <div role={notice.kind === "error" ? "alert" : "status"} aria-atomic="true"><strong>{notice.kind === "error" ? "Needs attention" : notice.kind === "success" ? "Update complete" : "Notice"}</strong><p>{notice.message}</p></div>
    <button type="button" aria-label="Dismiss notification" onClick={() => dismissAdminNotice(notice.id)}>×</button>
  </div>;
}

export function AdminFeedback() {
  const state = useSyncExternalStore(subscribeAdminFeedback, getAdminFeedback, getServerAdminFeedback);
  const [target, setTarget] = useState<HTMLElement | null>(null), [bottom, setBottom] = useState(24);
  useEffect(() => {
    // Native modal dialogs occupy the top layer. Put feedback inside the active
    // dialog so it stays visible and its dismiss buttons remain keyboard usable.
    const locate = () => {
      const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
      const next = dialogs.item(dialogs.length - 1) || document.body;
      setTarget(current => current === next ? current : next);
    };
    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    return () => { observer.disconnect(); clearAdminFeedback(); };
  }, []);
  useEffect(() => {
    let pending = 0;
    const invalid = () => {
      if (pending) return;
      pending = window.setTimeout(() => { pending = 0; notifyAdmin("Check the highlighted fields before saving. Your changes have not been saved.", "error"); }, 0);
    };
    document.addEventListener("invalid", invalid, true);
    return () => { clearTimeout(pending); document.removeEventListener("invalid", invalid, true); };
  }, []);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const toolbar = target?.querySelector<HTMLElement>(".page-editor-actions, form > .actions");
      const rect = toolbar?.getBoundingClientRect();
      setBottom(rect && rect.top > innerHeight / 2 && rect.top < innerHeight && rect.bottom > innerHeight - 160 ? Math.max(24, innerHeight - rect.top + 12) : 24);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("resize", schedule);
    document.addEventListener("scroll", schedule, true);
    const observer = new ResizeObserver(schedule);
    if (target) observer.observe(target);
    const toolbar = target?.querySelector(".page-editor-actions, form > .actions");
    if (toolbar) observer.observe(toolbar);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", schedule); document.removeEventListener("scroll", schedule, true); };
  }, [target, state.notices.length]);
  if (!target) return null;
  const activity = [...state.activities].sort((a, b) => b.priority - a.priority || b.id - a.id)[0];
  return createPortal(<div className="admin-feedback-layer">
    {activity && <div className="admin-activity-bar" role="progressbar" aria-label={activity.label}><span /><span className="admin-feedback-sr" role="status">{activity.label}</span></div>}
    <section className="admin-feedback-toasts" aria-label="Admin notifications" style={{ bottom: `max(${bottom}px, env(safe-area-inset-bottom))` }}>{state.notices.map(notice => <FeedbackNotice key={notice.id} notice={notice} />)}</section>
  </div>, target);
}

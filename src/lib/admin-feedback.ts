"use client";

export type AdminNoticeKind = "success" | "error" | "info";
export type AdminNotice = { id: number; kind: AdminNoticeKind; message: string };
type Activity = { id: number; label: string; priority: number };
type Feedback = { activities: Activity[]; notices: AdminNotice[] };
const empty: Feedback = { activities: [], notices: [] };
let state = empty, nextId = 0;
const listeners = new Set<() => void>();
function update(next: Feedback) { state = next; listeners.forEach(listener => listener()); }
export const getAdminFeedback = () => state;
export const getServerAdminFeedback = () => empty;
export function subscribeAdminFeedback(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function beginAdminActivity(label: string, priority = 0) {
  const id = ++nextId;
  update({ ...state, activities: [...state.activities, { id, label, priority }] });
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    update({ ...state, activities: state.activities.filter(activity => activity.id !== id) });
  };
}
export function notifyAdmin(message: string, kind: AdminNoticeKind = "success") {
  if (!message.trim()) return;
  const id = ++nextId;
  update({ ...state, notices: [...state.notices, { id, kind, message }].slice(-4) });
  return id;
}
export function dismissAdminNotice(id: number) { update({ ...state, notices: state.notices.filter(notice => notice.id !== id) }); }
export function clearAdminNotices() { update({ ...state, notices: [] }); }
export function clearAdminFeedback() { update(empty); }

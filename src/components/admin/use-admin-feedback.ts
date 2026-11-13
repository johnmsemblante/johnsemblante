"use client";

import { useEffect, useRef, useState } from "react";
import { beginAdminActivity, notifyAdmin, type AdminNoticeKind } from "@/lib/admin-feedback";

/** Each state update also reports the outcome, including a repeated identical error. */
export function useAdminMessage(kind: AdminNoticeKind): [string, (message: string) => void] {
  const [value, setValue] = useState("");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return [value, message => { if (!mounted.current) return; setValue(message); if (message) notifyAdmin(message, kind); }];
}
/** Cleanup also ends activity when navigating away or closing an editor. */
export function useAdminActivity(active: boolean, label: string, priority = 0) {
  useEffect(() => { if (active) return beginAdminActivity(label, priority); }, [active, label, priority]);
}

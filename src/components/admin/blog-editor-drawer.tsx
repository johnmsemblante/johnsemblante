"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Native modal supplies focus containment and makes the post library inert. */
export function BlogEditorDrawer({ title, busy, onClose, children, editorLabel = "article", returnFocusId = "new-blog-post", side = "right" }: {
  title: string; busy: boolean; onClose: () => void; children: ReactNode; editorLabel?: string; returnFocusId?: string; side?: "left" | "right";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    heading.current?.focus();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      else document.getElementById(returnFocusId)?.focus();
    };
  }, [returnFocusId]);
  return <dialog ref={dialog} className={`admin-blog-drawer${side === "left" ? " page-editor-drawer" : ""}`} aria-labelledby="blog-editor-heading" aria-modal="true" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => {
    if (event.target !== event.currentTarget || busy) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}>
    <div className="blog-drawer-header"><h2 ref={heading} tabIndex={-1} id="blog-editor-heading">{title}</h2><button type="button" className="blog-drawer-close" disabled={busy} onClick={onClose} aria-label={`Close ${editorLabel} editor`}>Close <span aria-hidden="true">×</span></button></div>
    <div className="blog-drawer-body">{children}</div>
  </dialog>;
}

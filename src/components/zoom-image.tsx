"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  src: string; alt: string; width: number; height: number;
  className?: string; loading?: "lazy" | "eager";
};

/** Native dialog provides modal focus containment and Escape handling. */
export function ZoomImage({ className, ...image }: Props) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const title = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);

  function close() { dialog.current?.close(); setOpen(false); }

  return <>
    <button ref={trigger} type="button" className={`zoom-image-trigger ${className ?? ""}`} aria-label={`Enlarge image: ${image.alt}`} aria-haspopup="dialog" onClick={() => { setZoom(false); setFailed(false); setOpen(true); }}>
      <img {...image} />
      <span className="zoom-image-hint" aria-hidden="true">Enlarge ↗</span>
    </button>
    {open && createPortal(<dialog ref={dialog} className="image-viewer" aria-labelledby={title} onCancel={event => { event.preventDefault(); close(); }} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="image-viewer-panel">
        <div className="image-viewer-toolbar">
          <p id={title}>{image.alt}</p>
          <button type="button" disabled={failed} aria-pressed={zoom} onClick={() => setZoom(value => !value)}>{zoom ? "Fit to screen" : "Zoom in"}</button>
          <button type="button" autoFocus onClick={close} aria-label="Close image viewer">Close ×</button>
        </div>
        <div className={`image-viewer-stage${zoom ? " is-zoomed" : ""}`} tabIndex={0} role="region" aria-label="Image area; scroll to explore when zoomed">
          {failed ? <p role="alert">This image could not load. Close the viewer and try again.</p> : <img src={image.src} alt={image.alt} onError={() => setFailed(true)} />}
        </div>
        <p className="image-viewer-help">{zoom ? "Scroll to explore the image. Select Fit to screen to see it all." : "Viewing the original available image. Select Zoom in for more detail."} Press Escape to close.</p>
      </div>
    </dialog>, document.body)}
  </>;
}

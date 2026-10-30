"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type GalleryImage = { src: string; alt: string; caption?: string };
type Props = GalleryImage & {
  width: number; height: number;
  className?: string; loading?: "lazy" | "eager";
  gallery?: GalleryImage[];
};

/** Native dialog contains focus and restores it to the opening thumbnail. */
export function ZoomImage({ className, gallery, caption, ...image }: Props) {
  const images = gallery?.some(item => item.src === image.src) ? gallery : [{ ...image, caption }];
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const title = useId();
  const current = images[index] ?? images[0];
  const grouped = images.length > 1;

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

  useEffect(() => {
    if (!open) return;
    const active = strip.current?.children[index] as HTMLElement | undefined;
    if (active && strip.current) {
      strip.current.scrollLeft = active.offsetLeft - strip.current.clientWidth / 2 + active.clientWidth / 2;
    }
    stage.current?.scrollTo(0, 0);
  }, [open, index, zoom]);

  function select(next: number) {
    setIndex((next + images.length) % images.length);
    setZoom(false);
    setFailed(false);
  }
  function close() { dialog.current?.close(); setOpen(false); }

  return <>
    <button ref={trigger} type="button" className={`zoom-image-trigger ${className ?? ""}`} aria-label={`Enlarge image: ${image.alt}`} aria-haspopup="dialog" onClick={() => { select(images.findIndex(item => item.src === image.src)); setOpen(true); }}>
      <img {...image} />
      <span className="zoom-image-hint" aria-hidden="true">Enlarge ↗</span>
    </button>
    {open && createPortal(<dialog ref={dialog} className="image-viewer" aria-label="Image gallery" aria-describedby={title} onCancel={event => { event.preventDefault(); close(); }} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => {
      if (!grouped || zoom || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault(); select(index + (event.key === "ArrowRight" ? 1 : -1));
      }
    }}>
      <div className="image-viewer-toolbar">
        <span className="image-viewer-count">{grouped ? `${index + 1} / ${images.length}` : "Image preview"}</span>
        <button type="button" disabled={failed} aria-pressed={zoom} onClick={() => setZoom(value => !value)}>{zoom ? "Fit to screen" : "Zoom in"}</button>
        <button type="button" className="image-viewer-close" autoFocus onClick={close} aria-label="Close image viewer">×</button>
      </div>
      <div className="image-viewer-main" onClick={event => { if (event.target === event.currentTarget) close(); }}>
        {grouped && <button type="button" className="image-viewer-arrow previous" aria-label="Previous image" onClick={() => select(index - 1)}>‹</button>}
        <div ref={stage} className={`image-viewer-stage${zoom ? " is-zoomed" : ""}`} tabIndex={0} role="region" aria-label="Image area; scroll to explore when zoomed" onClick={event => { if (event.target === event.currentTarget) close(); }}>
          {failed ? <p role="alert">This image could not load. Try another image or reopen the viewer.</p> : <img key={current.src} src={current.src} alt={current.alt} onError={() => setFailed(true)} />}
        </div>
        {grouped && <button type="button" className="image-viewer-arrow next" aria-label="Next image" onClick={() => select(index + 1)}>›</button>}
      </div>
      <div className="image-viewer-caption" aria-live="polite" aria-atomic="true"><p id={title}>{current.caption ?? current.alt}</p></div>
      {grouped && <div ref={strip} className="image-viewer-thumbnails" role="group" aria-label="Gallery thumbnails">
        {images.map((item, itemIndex) => <button key={item.src} type="button" aria-label={`View image ${itemIndex + 1}: ${item.caption ?? item.alt}`} aria-current={itemIndex === index ? "true" : undefined} onClick={() => select(itemIndex)}><img src={item.src} alt="" /></button>)}
      </div>}
      <p className="image-viewer-help">{zoom ? "Scroll to explore · Fit to screen to resume keyboard navigation" : grouped ? "Use arrow keys or select a thumbnail" : "Zoom in to explore the details"} · Esc to close</p>
    </dialog>, document.body)}
  </>;
}

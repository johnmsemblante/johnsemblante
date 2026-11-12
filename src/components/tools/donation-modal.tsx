"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import type { DonationMethod } from "@/lib/donation-methods";

export function DonationModal({ methods, onClose, returnFocusRef }: {
  methods: DonationMethod[];
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [selected, setSelected] = useState(methods[0]?.id);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const active = methods.find(method => method.id === selected) ?? methods[0];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    closeButton.current?.focus();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      const target = returnFocusRef?.current ?? opener;
      if (target instanceof HTMLElement && target.isConnected) target.focus({ preventScroll: true });
    };
  }, [returnFocusRef]);

  return createPortal(<dialog
    ref={dialog}
    className="donation-modal"
    aria-labelledby={titleId}
    aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClose={onClose}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], [tabindex='0']")]
        .filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}
  >
    <div className="donation-modal-header">
      <div><h2 id={titleId}><span aria-hidden="true">♡</span> Support Free Tools</h2><p>by John Semblante</p></div>
      <button ref={closeButton} type="button" className="donation-close" aria-label="Close donation dialog" onClick={onClose}>×</button>
    </div>
    <div className="donation-modal-body">
      <p id={descriptionId}>Enjoying this tool? I build these free utilities to make everyday online tasks a little easier.</p>
      <p>If you'd like to support my work, any contribution helps me maintain the tools and create more useful features.</p>
      <p>No pressure at all. Everything stays free!</p>
      {methods.length > 1 && <div className="donation-methods" role="group" aria-label="Donation payment method">
        {methods.map(method => <button key={method.id} type="button" aria-pressed={method.id === active?.id} onClick={() => {
          setSelected(method.id); setQrLoaded(false); setQrFailed(false);
        }}>{method.label}</button>)}
      </div>}
      {active && <section className="donation-payment" aria-label={`${active.label} contribution`}>
        <h3>{active.label}</h3>
        {active.id === "gcash" ? <>
          {active.displayName && <p className="donation-recipient">Recipient · {active.displayName}</p>}
          {qrFailed ? <p role="alert">The GCash QR image is unavailable. Please try again later.</p> : <>
            <img className="donation-qr" src={active.qrImagePath} alt="Official GCash receiving QR code" width={320} height={320} onLoad={() => setQrLoaded(true)} onError={() => setQrFailed(true)} />
            <p>{active.instructions || "Open your GCash app to scan this QR code, or save the image and import it using your app’s QR scanner. Confirm the recipient and amount in GCash before sending."}</p>
            {active.allowDownload && qrLoaded && <a className="button secondary donation-save" href={active.qrImagePath} download>Save GCash QR image</a>}
          </>}
        </> : <>
          <p>Continue to {active.label} to make a contribution. This opens an external payment site in a new tab.</p>
          <a className="button donation-external" href={active.url} target="_blank" rel="noopener noreferrer">Continue to {active.label} <span aria-hidden="true">↗</span></a>
        </>}
      </section>}
      <footer className="donation-modal-footer">
        <p>Thank you for helping keep these tools free!</p>
        <button type="button" className="button secondary" onClick={onClose}>Maybe Later</button>
      </footer>
    </div>
  </dialog>, document.body);
}

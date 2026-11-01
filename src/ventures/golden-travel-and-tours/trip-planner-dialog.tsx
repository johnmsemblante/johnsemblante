"use client";

import { useEffect, useRef, useState } from "react";
import { TripEstimator } from "./trip-estimator";

export function TripPlannerDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("requestquote")) {
      dialog.current?.showModal();
      setOpen(true);
      closeButton.current?.focus({ preventScroll: true });
    }
  }, []);

  function show() {
    dialog.current?.showModal();
    setOpen(true);
    closeButton.current?.focus({ preventScroll: true });
  }

  return <>
    <button id="trip-estimator" ref={trigger} type="button" className="button trip-planner-trigger" aria-haspopup="dialog" aria-controls="trip-planner-dialog" onClick={show}>
      Request a travel quote <span aria-hidden="true">↗</span>
    </button>
    <dialog id="trip-planner-dialog" ref={dialog} className="trip-planner-dialog" aria-labelledby="trip-planner-title" onClose={() => {
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    }}>
      <div className="trip-dialog-header">
        <div><p className="eyebrow">Golden Travel and Tours</p><h2 id="trip-planner-title">Let’s plan your Cebu trip.</h2></div>
        <button ref={closeButton} type="button" className="trip-dialog-close" onClick={() => dialog.current?.close()} aria-label="Close trip planner">Close <span aria-hidden="true">×</span></button>
      </div>
      <div className="trip-dialog-body"><TripEstimator /></div>
    </dialog>
    <noscript>Please use our contact link to plan your trip. The popup needs JavaScript.</noscript>
  </>;
}

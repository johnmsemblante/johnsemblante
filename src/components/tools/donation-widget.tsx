"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { DonationMethod } from "@/lib/donation-methods";
import { DonationModal } from "./donation-modal";

export function ToolDonationWidget({ methods, eligiblePaths }: { methods: DonationMethod[]; eligiblePaths: string[] }) {
  const pathname = usePathname();
  const path = `${pathname.replace(/\/+$/, "")}/`;
  if (!methods.length || !eligiblePaths.includes(path)) return null;
  return <DonationWidget key={path} methods={methods} />;
}

export function DonationWidget({ methods }: { methods: DonationMethod[] }) {
  const [open, setOpen] = useState(false);
  const [overlapsControl, setOverlapsControl] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!methods.length) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      const button = trigger.current;
      if (!button) return;
      const bounds = button.getBoundingClientRect();
      const controls = document.querySelectorAll<HTMLElement>("main a, main button, main input, main select, main textarea, main summary");
      setOverlapsControl([...controls].some(control => {
        if (control.closest("[data-tool-donation]")) return false;
        const rect = control.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.left < bounds.right && rect.right > bounds.left && rect.top < bounds.bottom && rect.bottom > bounds.top;
      }));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
    const observer = new ResizeObserver(schedule);
    const main = document.querySelector("main");
    if (main) observer.observe(main);
    if (trigger.current) observer.observe(trigger.current);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [methods]);

  if (!methods.length) return null;
  return <div data-tool-donation>
    <button
      ref={trigger}
      type="button"
      className="donation-trigger"
      style={{ visibility: overlapsControl && !open ? "hidden" : "visible" }}
      aria-label="Support Free Tools"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
    >
      <span aria-hidden="true" className="donation-heart">♡</span>
      <span className="donation-label-desktop">Support Free Tools</span>
      <span className="donation-label-mobile">Support</span>
    </button>
    {open && <DonationModal methods={methods} returnFocusRef={trigger} onClose={() => setOpen(false)} />}
  </div>;
}

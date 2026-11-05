"use client";
import { useEffect, useId, useRef, useState } from "react";

export type FilterOption = { value: string; label: string; count?: number; disabled?: boolean };
export function ProjectFilterDropdown({ label, options, selected, open, disabled, onOpen, onClose, onToggle, onClear }: {
  label: string; options: FilterOption[]; selected: string[]; open: boolean; disabled?: boolean;
  onOpen: () => void; onClose: () => void; onToggle: (value: string) => void; onClear: () => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const [above, setAbove] = useState(false);
  useEffect(() => {
    if (!open) return;
    const position = () => { const bounds = trigger.current?.getBoundingClientRect(); if (bounds) setAbove(window.innerHeight - bounds.bottom < Math.min(410, window.innerHeight * .55) && bounds.top > window.innerHeight - bounds.bottom); };
    position(); window.addEventListener("resize", position);
    if (moveFocus.current) { panel.current?.querySelector<HTMLInputElement>('input[type="checkbox"]:not(:disabled)')?.focus(); moveFocus.current = false; }
    const outside = (event: Event) => { if (!root.current?.contains(event.target as Node)) onClose(); };
    const outsideFocus = (event: FocusEvent) => {
      // A pointer press on non-focusable label text can transiently focus the document body.
      // Actual outside pointer presses are handled separately; only dismiss for real outside controls here.
      if (event.target === document.body || event.target === document.documentElement) return;
      outside(event);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outsideFocus);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", outsideFocus); window.removeEventListener("resize", position); };
  }, [open, onClose]);
  function closeAndFocus() { onClose(); trigger.current?.focus(); }
  return <div className="portfolio-filter-dropdown" ref={root} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); closeAndFocus(); }
  }}>
    <button ref={trigger} id={`${id}-trigger`} className="portfolio-filter-trigger" type="button" aria-expanded={open} aria-controls={`${id}-panel`} disabled={disabled} onClick={() => open ? onClose() : onOpen()} onKeyDown={event => {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); if (open) panel.current?.querySelector<HTMLInputElement>('input[type="checkbox"]:not(:disabled)')?.focus(); else { moveFocus.current = true; onOpen(); } }
    }}><span>{label}{selected.length ? ` (${selected.length})` : ""}</span><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></button>
    <div ref={panel} id={`${id}-panel`} className="portfolio-filter-panel" data-above={above} hidden={!open} role="group" aria-labelledby={`${id}-trigger`} onKeyDown={event => {
      if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox" || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const inputs = Array.from(panel.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:not(:disabled)') || []);
      const at = inputs.indexOf(event.target);
      const next = event.key === "Home" ? 0 : event.key === "End" ? inputs.length - 1 : (at + (event.key === "ArrowDown" ? 1 : -1) + inputs.length) % inputs.length;
      inputs[next]?.focus();
    }}>
      <div className="portfolio-filter-panel-heading"><span>{label}</span><button type="button" onClick={onClear} aria-label={`Clear ${label.toLowerCase()} selections`}>Clear</button></div>
      <div className="portfolio-filter-options">{options.map((option, index) => <label key={option.value} htmlFor={`${id}-${index}`} className={option.disabled ? "is-unavailable" : undefined}><input id={`${id}-${index}`} type="checkbox" value={option.value} checked={selected.includes(option.value)} disabled={option.disabled} onChange={() => { if (!option.disabled) onToggle(option.value); }} /><span>{option.label}</span>{option.count !== undefined && <small aria-label={`${option.count} matching projects`}>{option.count}</small>}</label>)}{!options.length && <p>No verified options in this collection.</p>}</div>
      <button className="portfolio-filter-done" type="button" onClick={closeAndFocus}>Done</button>
    </div>
  </div>;
}

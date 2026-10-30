"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type NavigationLink = { label: string; href: string };

export function HeaderNavigation({ links, label = "Main navigation" }: { links: NavigationLink[]; label?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const reset = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", reset);
    return () => desktop.removeEventListener("change", reset);
  }, []);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <div ref={root} className="header-navigation" data-open={open} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <button ref={toggle} type="button" className="menu-toggle" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(value => !value)}>
      <span className="menu-toggle-icon" aria-hidden="true"><span /><span /><span /></span>
    </button>
    <nav id={menuId} aria-label={label}>
      {links.map(({ label: text, href }) => {
        const active = href.startsWith("/") && `${pathname.replace(/\/$/, "")}/`.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => {
          setOpen(false);
          if (href.startsWith("#")) {
            document.getElementById(href.slice(1))?.focus({ preventScroll: true });
          }
        }}>{text}</Link>;
      })}
    </nav>
  </div>;
}

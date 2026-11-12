"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type NavigationItem = { label: string; href: string };
type NavigationLink = NavigationItem & { groups?: { label?: string; href?: string; links: NavigationItem[] }[] };

export function HeaderNavigation({ links, label = "Main navigation" }: { links: NavigationLink[]; label?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const submenuToggles = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => { setOpen(false); setExpanded(null); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const reset = () => { setExpanded(null); if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", reset);
    return () => desktop.removeEventListener("change", reset);
  }, []);
  useEffect(() => {
    if (!open && expanded === null) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) { setOpen(false); setExpanded(null); }
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (expanded !== null) {
        setExpanded(null); submenuToggles.current.get(expanded)?.focus();
      } else { setOpen(false); toggle.current?.focus(); }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, expanded]);

  const path = `${pathname.replace(/\/+$/, "")}/`;
  function closeMenus(href: string) {
    setOpen(false); setExpanded(null);
    if (href.startsWith("#")) document.getElementById(href.slice(1))?.focus({ preventScroll: true });
  }
  function renderLink(item: NavigationItem, className?: string) {
    return <Link key={item.href} className={className} href={item.href} aria-current={item.href === path ? "page" : undefined} onClick={() => closeMenus(item.href)}>{item.label}</Link>;
  }

  return <div ref={root} className="header-navigation" data-open={open} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setOpen(false); setExpanded(null); }
  }}>
    <button ref={toggle} type="button" className="menu-toggle" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls={menuId} onClick={() => { setOpen(value => !value); setExpanded(null); }}>
      <span className="menu-toggle-icon" aria-hidden="true"><span /><span /><span /></span>
    </button>
    <nav id={menuId} aria-label={label}>
      {links.map((item, index) => {
        if (!item.groups) return renderLink(item);
        const submenuId = `${menuId}-submenu-${index}`;
        return <div key={item.href} className="nav-dropdown" data-expanded={expanded === index}>
          <div className="nav-dropdown-heading">
            {renderLink(item)}
            <button type="button" className="nav-submenu-toggle" ref={node => {
              if (node) submenuToggles.current.set(index, node); else submenuToggles.current.delete(index);
            }} aria-label={`Toggle ${item.label} submenu`} aria-expanded={expanded === index} aria-controls={submenuId} onClick={() => setExpanded(value => value === index ? null : index)}>
              <span className="nav-submenu-chevron" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" focusable="false">
                  <path d="M4 6 8 10 12 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </div>
          <div id={submenuId} className="nav-submenu" hidden={expanded !== index}>
            {item.groups.map((group, groupIndex) => <div className="nav-submenu-group" key={group.href ?? groupIndex}>
              {group.label && (group.href ? renderLink({ label: group.label, href: group.href }, "nav-submenu-label") : <p className="nav-submenu-label">{group.label}</p>)}
              {group.links.map(link => renderLink(link))}
            </div>)}
          </div>
        </div>;
      })}
    </nav>
  </div>;
}

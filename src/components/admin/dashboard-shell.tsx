"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { activeAdminLink, adminLinks } from "@/lib/admin-navigation";
import { AdminIcon } from "./admin-icon";

export function DashboardShell({ children, name, email, busy, error, logout }: {
  children: ReactNode; name: string | null; email: string | null; busy: boolean; error: string; logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  const initials = (name || email || "Admin").split(/[\s@]+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <div className="dashboard-frame">
    <header className="dashboard-topbar">
      <Link className="dashboard-logo" href="/adminauth/" aria-label="Dashboard overview">js<span>.</span></Link>
      <div className="dashboard-title"><span>Dashboard</span><small>John Semblante / Private workspace</small></div>
      <div className="dashboard-account"><span className="dashboard-avatar" aria-hidden="true">{initials}</span><span>{name || "Administrator"}<small>{email}</small></span></div>
      <button ref={toggle} className="dashboard-menu-toggle" type="button" aria-expanded={open} aria-controls={menuId} aria-label={open ? "Close admin navigation" : "Open admin navigation"} onClick={() => setOpen(value => !value)}><AdminIcon name={open ? "close" : "menu"} /></button>
    </header>
    <aside id={menuId} className="dashboard-sidebar" data-open={open}>
      <div><p className="dashboard-nav-caption">Workspace</p><nav aria-label="Admin applications"><ul>{adminLinks.map(link => <li key={link.href}><Link href={link.href} aria-current={activeAdminLink(pathname, link.href) ? "page" : undefined} onClick={() => setOpen(false)}><AdminIcon name={link.icon} /><span>{link.label}</span></Link></li>)}</ul></nav></div>
      <div className="dashboard-sidebar-footer"><Link className="dashboard-site-link" href="/" target="_blank" rel="noopener noreferrer">View website ↗</Link><button type="button" className="dashboard-logout" data-admin-signout="true" disabled={busy} onClick={logout}><AdminIcon name="logout" /><span>{busy ? "Signing out…" : "Logout"}</span></button></div>
    </aside>
    <main id="admin-main" tabIndex={-1} className="dashboard-main">{error && <p role="alert" className="form-error">{error}</p>}{children}</main>
  </div>;
}

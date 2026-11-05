"use client";

import Link from "next/link";
import { AdminGate } from "./admin-gate";

export function AdminHome() {
  return <AdminGate><section className="admin-card"><p className="eyebrow">Private workspace</p><h1>Welcome back.</h1><p>Create articles, edit existing posts, and choose when they are published.</p><Link className="button" href="/adminauth/blog/">Manage blog posts <span aria-hidden="true">→</span></Link></section></AdminGate>;
}

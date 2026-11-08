"use client";

import Link from "next/link";
import { useAdmin } from "./admin-gate";
import { AdminIcon } from "./admin-icon";
import { BlogRefreshControl } from "./blog-refresh-control";

export function AdminHome() {
  const { user } = useAdmin();
  const name = user.displayName?.trim().split(/\s+/)[0];
  return <>
    <div className="admin-heading"><div><p className="eyebrow">Your workspace</p><h1>Overview</h1><p>{name ? `Welcome back, ${name}.` : "Welcome back."} Choose an application to get started.</p></div></div>
    <div className="dashboard-apps">
      <Link href="/adminauth/blog/" className="dashboard-app-card"><span className="dashboard-app-icon"><AdminIcon name="blog" /></span><p className="eyebrow">Publishing</p><h2>Blog Management</h2><p>Create and edit articles, manage drafts, and schedule your next post.</p><span className="dashboard-app-action">Manage blog posts <AdminIcon name="arrow" /></span></Link>
      <Link href="/adminauth/works/" className="dashboard-app-card"><span className="dashboard-app-icon"><AdminIcon name="works" /></span><p className="eyebrow">Portfolio</p><h2>Works</h2><p>Add, edit and publish projects in your portfolio.</p><span className="dashboard-app-action">Manage works <AdminIcon name="arrow" /></span></Link>
      <Link href="/adminauth/jobs/" className="dashboard-app-card"><span className="dashboard-app-icon"><AdminIcon name="jobs" /></span><p className="eyebrow">Career opportunities</p><h2>Job Finder</h2><p>Discover real opportunities, filter listings, and keep a private shortlist.</p><span className="dashboard-app-action">Explore jobs <AdminIcon name="arrow" /></span></Link>
    </div>
    <BlogRefreshControl />
  </>;
}

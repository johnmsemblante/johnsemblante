"use client";
import { useEffect, useState } from "react";
import { subscribeSitePublish } from "@/lib/site-publish";

export function SitePublishControl() {
  const [message, setMessage] = useState("");
  useEffect(() => subscribeSitePublish(() => setMessage("Content saved. The next automated check will pick up public changes. You can close this page; clean URLs and SEO HTML update after deployment.")), []);
  return <section className="admin-card" aria-labelledby="site-publish-title">
    <h2 id="site-publish-title">Automatic website publishing</h2>
    <p>GitHub checks for public changes every five minutes and builds the site when needed. Builds and GitHub scheduling delays add to that wait.</p>
    <p role="status" className="admin-notice">{message}</p>
    <a className="text-link" href="https://github.com/johnmsemblante/johnsemblante/actions/workflows/publish-site.yml" target="_blank" rel="noopener noreferrer">View builds or run publishing now on GitHub</a>
    <p className="form-note">No computer is needed. GitHub also provides a Run workflow button you can use from your phone. Search engines and social platforms may keep their own cached previews.</p>
  </section>;
}

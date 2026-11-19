import type { DocumentationGuide } from "./admin-documentation";

const updated = "2026-11-19";

export const technicalGuides: DocumentationGuide[] = [
  {
    id: "pencil-drawing", title: "How the homepage portrait is drawn", category: "Interface", updated,
    summary: "Follow one pencil stroke from its fitted path to the graphite pixels on screen.",
    tags: ["Canvas 2D", "SVG", "requestAnimationFrame", "portrait", "sketch"],
    sections: [
      { heading: "Libraries and artwork", paragraphs: ["React manages the component lifecycle. The browser supplies Canvas 2D, SVG path measurement and requestAnimationFrame. The renderer loads on demand after the transparent 640 × 827 homepage sketch decodes and enters view."] },
      { heading: "From path to pencil tip", paragraphs: ["The contour paths are fitted to features in the source portrait. getTotalLength and getPointAtLength sample each SVG curve into points. Elapsed time determines how far the pencil travels along a stroke. Between strokes it follows a short lifted arc without adding marks. The tip and the end of the visible mark use the same interpolated point."] },
      { heading: "Graphite and shading", paragraphs: ["An offscreen canvas compares each source pixel with a blurred neighbourhood to isolate graphite texture. One mask reveals this fine detail as the eyes, brows and nearby contours take shape. A second mask uses overlapping hatch passes to bring in the original tones across the hair, skin and jacket. A short blend hands off to the original accessible image."] },
      { heading: "Tuning and checking", steps: ["Change stroke order, duration and shading regions in portrait-sketch.ts. Keep coordinates in the source image space.", "Reload Home and check the pencil tip against an eye, a cheek contour and a lapel. Scroll away and back to test pause and resume.", "Enable reduced motion and reload. The finished image should appear immediately."] },
    ],
    sources: ["src/lib/portrait-sketch.ts", "src/components/hero-portrait.tsx", "src/app/portrait-hero.css", "docs/hero-portrait.md"],
  },
  {
    id: "global-cursor", title: "How the site-wide cursor follows the mouse", category: "Interface", updated,
    summary: "A native SVG cursor marks the exact position while CSS eases a separate ring behind it.",
    tags: ["CSS", "React", "pointer events", "ventures", "accessibility"],
    sections: [
      { heading: "One mount for every route", paragraphs: ["The Next.js root layout mounts PortfolioCursor once for the portfolio, standalone venture layouts and admin routes. A mouse pointer event sets a flag on the body and moves a decorative fixed-position ring with translate3d. The CSS cursor image supplies the dot, so its hotspot stays on the target even while the ring catches up."] },
      { heading: "Input and accessibility", paragraphs: ["Media queries check hover, pointer precision, reduced motion and forced colours. Keyboard input and window blur clear the mouse flag. The ring ignores pointer events. Check a venture link, an editable field and the homepage portrait when changing these selectors."] },
    ],
    sources: ["src/app/layout.tsx", "src/components/portfolio-cursor.tsx", "src/components/portfolio-cursor.css"],
  },
  {
    id: "static-publishing", title: "From source and published content to Firebase Hosting", category: "Architecture", updated,
    summary: "Trace the Next.js static export through the production workflow.",
    tags: ["App Router", "GitHub Actions", "snapshots", "deployment", "SEO"],
    sections: [
      { heading: "Build inputs", paragraphs: ["The App Router defines layouts and pages in src/app. The content sync scripts read published Blog, Works, Pages and Ventures data before Next.js builds. The export includes initial page HTML and metadata that can be read by crawlers before browser JavaScript runs."] },
      { heading: "Release and verification", paragraphs: ["A push to main runs the publish workflow. It validates configuration, installs dependencies, syncs content, builds the static site, writes a public deployment receipt and deploys to the live Firebase Hosting channel. Scheduled runs compare a content fingerprint to avoid redundant builds.", "When a content change appears in the browser but the initial HTML still shows the old value, check the sync, build and deployment steps for the same run. Run the live SEO audit to check the sitemap, redirects and canonical pages."] },
    ],
    sources: ["next.config.ts", ".github/workflows/publish-site.yml", "scripts/content-deployment.cjs", "scripts/check-live-seo.mjs"],
  },
  {
    id: "dashboard-access", title: "How admin routes share navigation and access control", category: "Architecture", updated,
    summary: "Follow a direct admin link through the layout, sign-in gate and dashboard shell.",
    tags: ["Firebase Authentication", "Firestore", "noindex", "permissions"],
    sections: [
      { heading: "Route and data access", paragraphs: ["The adminauth layout wraps every child page in AdminGate and sets noindex metadata. Firebase Authentication identifies the signed-in user. The gate controls when the dashboard is shown. Firestore rules enforce access to protected records and writes. Static assets, including guide text, are publicly downloadable, so guide examples must contain only public-safe information."] },
      { heading: "Adding a section", steps: ["Create its page under src/app/adminauth so it inherits the existing layout.", "Register its path in admin-navigation.ts. The sidebar and the sign-in return destination check use this registry. Add an Overview card when the section is a dashboard destination.", "Verify signed-out access, the active navigation item, keyboard access and the exported noindex metadata."] },
    ],
    sources: ["src/app/adminauth/layout.tsx", "src/components/admin/admin-gate.tsx", "src/lib/admin-navigation.ts", "src/components/admin/dashboard-shell.tsx", "firestore.rules"],
  },
  {
    id: "pdf-tools", title: "How the PDF editor previews and exports a file", category: "Browser tools", updated,
    summary: "PDF.js renders the pages and pdf-lib writes text and signature overlays into the download.",
    tags: ["pdfjs-dist", "pdf-lib", "canvas", "browser memory"],
    sections: [
      { heading: "Preview and export", paragraphs: ["The editor loads the selected document in the browser. PDF.js renders the selected page for placement. The editor tracks overlays separately from the source file. At download time, pdf-lib writes the overlays into a copy and returns the resulting PDF. Text overlays are embedded as transparent images.", "The build prepares the PDF.js assets locally. When investigating a broken preview, verify the local worker assets match the installed renderer. For placement changes, check the exported PDF as well as the editor preview."] },
    ],
    sources: ["src/components/pdf-editor.tsx", "src/lib/pdf-editor-model.ts", "src/lib/pdf-editor-export.ts", "scripts/prepare-pdf-assets.cjs", "docs/pdf-editor.md"],
  },
];

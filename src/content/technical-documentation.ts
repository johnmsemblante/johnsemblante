import type { DocumentationGuide } from "./admin-documentation";

const updated = "2026-11-19";

export const technicalGuides: DocumentationGuide[] = [
  {
    id: "negosyo-model", title: "How the startup planner models profit and cash", category: "Browser tools", updated: "2026-11-20",
    summary: "Trace a supplier quote through startup funding, break-even and cash recovery.",
    tags: ["Negosyo", "centavos", "working capital", "local storage"],
    sections: [
      {heading: "Calculation and storage", paragraphs: ["A three-field estimate divides monthly bills by contribution per sale in centavos and rounds up. Its figures can seed a detailed plan. The six-step client wizard holds versioned plans locally. The template model validates editable amounts and imported JSON. The financial module converts prices to centavos and computes weighted contribution separately from monthly cash receipts and payments.", "Opening inventory and deposits count towards launch funding. Monthly sales generate replenishment costs. Reserves cover the maximum cumulative cash deficit in the selected period, and loan principal only affects the cash forecast."]},
      {heading: "Check a change", steps: ["Run the calculator unit tests and build the static export.", "Review an incomplete plan, switch the cost method, reload a saved plan and print a populated report at phone and desktop widths."]},
    ], sources: ["src/lib/negosyo/plan.ts", "src/lib/negosyo/finance.ts", "src/components/negosyo/calculator.tsx", "docs/negosyo-calculator.md"],
  },
  {
    id: "particle-formation", title: "How particles form the homepage portrait", category: "Interface", updated: "2026-11-20",
    summary: "Follow a grain from the edge of the hero to its location on the face, through to the full-sketch reveal.",
    tags: ["Canvas 2D", "portrait", "particles", "requestAnimationFrame", "crossfade"],
    sections: [
      { heading: "Sampling the sketch", paragraphs: ["React loads the Canvas 2D renderer when the decoded portrait enters view. getImageData reads the transparent cutout. A seeded sampler chooses a point in each grid cell, skips the background and uses the sampled brightness and opacity to set each grain's tone and size."] },
      { heading: "Assembly and reveal", paragraphs: ["A transparent canvas fills the hero. A ResizeObserver maps the portrait bounds into canvas coordinates. Each grain can start anywhere in the hero, with a smooth bias toward its destination. The paths overlap across the centerlines. The target expands gently around the portrait center during the second half of assembly. The motion-enabled stylesheet hides the source image from the first paint. When the last grain arrives, the renderer stops requesting frames and starts an 850ms crossfade to the original sketch."] },
      { heading: "Preview and tune", steps: ["Reload Home and follow the grains into the hair, eyes and shoulders.", "Wait for the whole sketch to appear, then move across the face to check that it stays fully visible.", "Tune formation duration and sampling interval in portrait-particles.ts. Enable reduced motion to review the source sketch."] },
    ],
    sources: ["src/lib/portrait-particles.ts", "src/components/hero-portrait.tsx", "src/app/portrait-hero.css", "docs/hero-portrait.md"],
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

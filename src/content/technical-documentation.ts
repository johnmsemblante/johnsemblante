import type { DocumentationGuide } from "./admin-documentation";

const updated = "2026-11-19";

export const technicalGuides: DocumentationGuide[] = [
  {
    "id": "interactive-workspace-renderer",
    "title": "How Digital HQ renders and loads",
    "category": "Interface",
    "updated": "2026-11-27",
    "summary": "Review React Three Fiber scene ownership, source-managed navigation, character loading and fallback cleanup.",
    "tags": [
      "Three.js",
      "React Three Fiber",
      "WebGL",
      "Digital HQ",
      "quality",
      "performance",
      "Classic"
    ],
    "sections": [
      {
        "heading": "Release boundary",
        "paragraphs": [
          "feature/digital-hq-interactive-portfolio replaces the old office presentation locally. feature/interactive-office preserves the previous implementation. Production main and the existing Firebase workflow are unchanged. Only the owner-authorized digital-hq test channel may receive the dedicated preview build. The preview script checks branch/source commit, enables the temporary character explicitly and derives a Hosting-only noindex configuration. Live publication remains prohibited. See docs/digital-hq-preview.md."
        ]
      },
      {
        "heading": "HTML first and one URL",
        "paragraphs": [
          "HomeExperience renders either the original Classic slot or the Digital HQ presentation, with one H1. The mode store retains portfolio-home-mode and catches unavailable local storage. PortfolioFrame hides the conventional shell only for the interactive root route. SiteWordmark is the same original logo component in both modes. Metadata, JSON-LD and canonical routes are shared.",
          "Eight real anchors arrive in the initial HTML. The real-scene AVIF/WebP preview is reserved for a renderer failure or a no-JavaScript visit. After hydration and remembered-mode resolution, Interactive automatically imports the Canvas without an entry button. Classic and unrelated routes do not request the Three.js/Fiber chunks. Phase 1 panels adapt public snapshot data and link to existing full pages. No game engine or duplicated tool/form logic is embedded."
        ]
      },
      {
        "heading": "Scene and animation lifetime",
        "paragraphs": [
          "objects.ts defines identities, physical models, transforms, projected anchors, camera views, hover and selection intents, character states, source names and canonical destinations. environment.ts builds original bevelled procedural assets, batches geometry per material/object and generates small seeded canvas textures. The hero tracks unpressed mouse movement and eases the camera offset back to center on exit. Camera buttons handle manual rotation and zoom. lighting.ts is shared with the preview renderer. background-config.ts supplies the local architectural matte URL to the HTML composition and renderer capture; background.ts builds curved foliage and the shadow receiver. Construction yields between scene groups and detailed rows, checks cancellation, and prewarms shaders with compileAsync before revealing the Canvas. The room/city plate sits behind the transparent canvas. The desktop uses a satin clearcoat and subtle wood grain relief. Its metallic apron and warm edge share the beveled outline. The open laptop has a seat-facing screen and uses two local WebP maps from the owner-supplied laptop sheet. Missing maps leave the laptop geometry available. The fallback renderer shares the live geometry, textures, camera and studio reflection map. The lighting module builds the map locally and disposes it with the scene.",
          "canvas.ts owns a demand-driven React Three Fiber Canvas, bounded perspective camera interpolation, raycast object selection, projected HTML labels and quality tiers. Visible startup has a 25-second timeout with a Retry 3D fallback. The timeout pauses while hidden. Hidden/offscreen scenes stop. Low quality and reduced motion settle on demand; a visible animated rig keeps frames running at higher tiers. One shadow-casting key light is used. Disposal releases model buffers, materials, textures, skeletons, animation bindings and the canvas context.",
          "character.ts loads local GLB assets and creates one AnimationMixer per model. Named supported clips crossfade and return to idle; unknown actions use idle. The temporary skinned preview supports seated idle, a wave and introduction. Development/explicit preview gating prevents silently shipping it. See the character asset contract before configuring a production GLB."
        ]
      },
      {
        "heading": "Maintain and verify",
        "steps": [
          "Edit source configuration without creating admin collections. Regenerate previews using scripts/render-digital-hq-preview.cjs with an installed Playwright package. Match preview coordinates to the generated scene metadata. Preserve both production and development preview variants.",
          "Run test:digital-hq, relevant existing tests, handbook/dashboard tests, TypeScript and build:prepared. Use scripts/check-digital-hq-browser.cjs on the export for four-size screenshots, keyboard focus, mode persistence, context loss and route isolation. Compare metadata and local Lighthouse metrics with the baseline; do not describe lab scores as field Web Vitals."
        ]
      }
    ],
    "sources": [
      "docs/digital-hq.md",
      "docs/digital-hq-background.md",
      "docs/digital-hq-character.md",
      "docs/production-classic.md",
      "src/components/digital-hq/canvas.tsx",
      "src/components/digital-hq/character.ts",
      "scripts/render-digital-hq-preview.cjs"
    ]
  },
  {
    id: "chat-storage", title: "How visitor chat and the inbox work", category: "Integrations", updated: "2026-11-24",
    summary: "Review anonymous chat sessions, private threads, delivery and availability.",
    tags: ["Firestore", "Firebase Auth", "chat", "rules", "Spark"],
    sections: [
      { heading: "Browser sessions and rules", paragraphs: ["The portfolio widget uses a separate Firebase app with Anonymous sign-in. The inbox uses the existing verified admin session. Only a visitor's own anonymous session and approved administrators can read its chat history.", "A batch writes each message and updates the inbox activity together. Rules check sender identity, timestamps, content limits and the visitor send interval."] },
      { heading: "Availability and release", paragraphs: ["The inbox refreshes the public availability record while visible and enabled. The widget listens while open and expires stale availability locally. Enable Anonymous sign-in and deploy the Firestore rules before the Hosting release."] },
    ], sources: ["docs/visitor-chat.md", "src/lib/chat-store.ts", "firestore.rules"],
  },
  {
    id: "neon-dash-engine", title: "How Neon Dash runs in the browser", category: "Browser tools", updated: "2026-11-23",
    summary: "Review the simulation, rendering, and publishing boundaries.",
    tags: ["Canvas", "TypeScript", "Web Audio", "game"],
    sections: [
      { heading: "World themes and unlocks", paragraphs: ["The world catalogue drives previews, cached scenery, and completed-distance thresholds. The progression receipt credits distance and wallet together. Older saves retain cosmetics and scores without using best score as cumulative distance. World themes do not change hitboxes or obstacle timing."] },
      { heading: "Daily and lifetime activity", paragraphs: ["One run receipt updates stats and unlocks at game over. UTC-seeded objectives use completed-run counters. Claims validate the date, objective and claim ID, then save wallet and claim together before reporting success. Achievement timestamps are stored with existing browser progression."] },
      { heading: "Idle frames and audio", paragraphs: ["The scheduler requests continuous frames only during a run and redraws static scenes on change. A gesture unlocks the shared Web Audio gain bus; settings are validated with the existing V2 save. Canvas rendering failures route to reload without altering storage."] },
      { heading: "Simulation and rendering", paragraphs: ["A fixed timestep advances grounded movement, buffered jumps, slide hitboxes, hazards and energy coins. The game route loads the Canvas renderer separately. City layers are cached, simulation objects are culled, and HUD updates are throttled."] },
      { heading: "Release verification", steps: ["Run the Neon Dash engine tests and export the site.", "Open the game via Free Tools and verify keyboard and touch play, pausing, low-motion rendering, sound, and best-score persistence."] },
    ], sources: ["docs/neon-dash.md", "src/lib/neon-dash/engine.ts", "src/lib/neon-dash/art.ts"],
  },
  {
    id: "portfolio-manifest", title: "How home-screen installation works", category: "Interface", updated: "2026-11-23",
    summary: "Review the static manifest and launcher icons after a Hosting release.",
    tags: ["PWA", "manifest", "standalone", "Firebase Hosting"],
    sections: [
      { heading: "Static installation metadata", paragraphs: ["Next.js exports the web app manifest and links it in page metadata. The manifest tells supported browsers to launch the homepage in standalone mode using the portfolio icons. No service worker intercepts requests."] },
      { heading: "Verify the release", steps: ["Check the live homepage manifest link and confirm the manifest and both launcher icons load over HTTPS.", "Install from Safari on iPhone and Chrome on Android, then launch from the home-screen icon."] },
    ], sources: ["docs/pwa.md", "src/app/manifest.webmanifest", "public/pwa-icon-192.png", "public/pwa-icon-512.png"],
  },
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
    id: "homepage-portrait", title: "How the homepage portrait loads", category: "Interface", updated: "2026-11-27",
    summary: "Understand how the homepage serves a static responsive portrait.",
    tags: ["portrait", "responsive image", "AVIF", "WebP"],
    sections: [
      { heading: "Responsive artwork", paragraphs: ["Classic Mode renders a picture element with 400px and 640px AVIF candidates and a transparent WebP fallback. The portrait has a priority option; the homepage Classic slot disables explicit preload so Interactive does not download it. Width and height reserve space when Classic displays the artwork. Digital HQ has its own real-scene preview and dynamically loaded Fiber renderer."] },
    ],
    sources: ["src/components/hero-portrait.tsx", "src/app/portrait-hero.css", "docs/hero-portrait.md"],
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

export const aboutDevelopment = {
  heading: { scope: "about_ai_heading", label: "AI workflow heading", value: "How I use AI in development" },
  background: { scope: "about_ai_background", label: "AI learning journey", value: "I began with ChatGPT for everyday questions, research and drafting. At work I moved to Cursor, where I learned to ground questions in the project itself. With relevant files in context, I could spend less time repeating background and more time checking whether an answer matched the code." },
  practice: { scope: "about_ai_practice", label: "Claude workflow and review", value: "When my team shifted to Claude, I started building task-specific subagents for recurring work. I now use Claude for repeatable workflows and bring the same project-context habits I learned in Cursor. AI helps me investigate and draft changes; I still review the code and verify the behavior before calling a change done." },
  link: { scope: "about_ai_examples", label: "Development examples link text", value: "See what I built" },
};

export const workDevelopment = {
  heading: { scope: "work_builds_heading", label: "Independent builds heading", value: "What I build beyond WordPress" },
  portfolioTitle: { scope: "work_builds_portfolio_title", label: "Portfolio project title", value: "This portfolio, built with Next.js" },
  portfolio: { scope: "work_builds_portfolio", label: "Portfolio project description", value: "I built the site you’re browsing with Next.js and TypeScript. It combines a public portfolio, browser-based tools and an admin workspace for updating content. The public pages are statically exported to Firebase Hosting. If you need a service site that you can maintain after launch, this is an example of how I can structure one." },
  appTitle: { scope: "work_builds_app_title", label: "Desktop prototype title", value: "Claude workflow desktop app (nearing its first beta)" },
  app: { scope: "work_builds_app", label: "Desktop prototype description", value: "I turned a set of Claude subagents into an Electron desktop prototype for my own development workflow. It gives recurring tasks such as ticket triage, WordPress maintenance and project setup a dedicated starting point, so I don’t have to write the same prompt each time. Some actions ask for confirmation before proceeding. Version one is nearing beta testing and is not a public download." },
  contact: { scope: "work_builds_contact", label: "Project inquiry link text", value: "Tell me what you need built or improved" },
};

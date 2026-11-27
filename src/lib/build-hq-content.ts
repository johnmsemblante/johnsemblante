import type { Project } from "@/content/site";
import { profile, socialAccounts } from "@/content/profile";
import { site } from "@/content/site";
import { publishedTools } from "@/config/tool-ventures";
import type { Venture } from "@/ventures/types";
import { industries, industryPath } from "@/content/industries";
import type { HQContent } from "@/components/digital-hq/objects";

export function buildHQContent(projects: Project[], ventures: Venture[], writing: { title: string; slug: string; excerpt: string; category: string; featuredImage?: string }[]): HQContent {
  return {
    about: { description: profile.introduction, cards: [{ title: "A little more about me", description: profile.biography, href: "/about/", image: profile.aboutPortrait }, ...socialAccounts.filter(a => a.name === "LinkedIn").map(a => ({ title: a.name, description: a.handle, href: a.url }))] },
    work: { description: "A selection of websites and interfaces I’ve built. Explore the portfolio by industry, or take a closer look at a project.", cards: [...projects.slice(0, 3).map(p => ({ title: p.title, description: p.summary, href: `/work/${p.slug}/`, image: p.image?.src, meta: p.technologies.join(" · ") })), ...industries.filter(i => projects.some(p => p.industries.includes(i.slug))).slice(0, 3).map(i => ({ title: i.label, description: "Explore this industry", href: industryPath(i.slug) }))] },
    ventures: { description: "Ideas that grew beyond the screen. A few independent ventures, each with its own story.", cards: ventures.map(v => ({ title: v.name, description: v.description, href: `/ventures/${v.slug}/`, image: v.logo?.src, meta: v.category })) },
    tools: { description: "Small, useful things for everyday work. Free browser-based tools, built and maintained alongside my portfolio.", cards: publishedTools.filter(t => t.category !== "Free browser game").map(t => ({ title: t.shortName ?? t.name, description: t.description, href: t.route, image: t.iconImage })) },
    arcade: { description: publishedTools.find(t => t.id === "neon-dash")!.description, cards: publishedTools.filter(t => t.id === "neon-dash").map(t => ({ title: t.name, description: "A little side quest. Jump, slide, collect energy, and see how far you can go.", href: t.route, image: t.iconImage, meta: "Free browser game" })) },
    blog: { description: "Notes from the work: development, lessons learned, and things worth sharing.", cards: writing.map(p => ({ title: p.title, description: p.excerpt, href: `/blog/${p.slug}/`, image: p.featuredImage, meta: p.category })) },
    skills: { description: "The tools and technologies behind my day-to-day work. See my About page for experience and a closer look at the toolkit.", cards: [{ title: "Development", description: profile.languages.join(" · "), href: "/about/" }, { title: "Specialties", description: profile.skills.join(" · "), href: "/about/" }, { title: "Workflow", description: profile.tools.join(" · "), href: "/about/" }] },
    contact: { description: "Have a website in mind, a problem to solve, or an idea to explore? Pull up a chair. Tell me what you’re working on.", cards: [{ title: "Discuss your project", description: "Use the existing contact form to share your project and requirements.", href: "/contact/" }, { title: site.email, description: "Send me an email", href: `mailto:${site.email}` }, { title: "Cebu, Philippines", description: profile.title, href: "/about/" }] },
  };
}

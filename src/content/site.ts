import { portfolioProjects } from "./projects";
import type { IndustrySlug } from "./industries";
import { professionalTitle } from "./profile";
export const site = {
  name: "John Semblante",
  url: "https://johnmsemblanteapp.web.app",
  socialImage: "/images/seo/john-semblante-social.png",
  description: `John Clark Semblante's portfolio as a ${professionalTitle} in Cebu, Philippines. Explore website projects, experience and remote opportunities.`,
  // Public email link. Change delivery recipients separately in the Formspree dashboard.
  email: "johnmsemblante@gmail.com",
  // Public form ID, not an API secret. Recipient is configured in Formspree.
  contactFormEndpoint: "https://formspree.io/f/xwllnvev",
  phone: "+639770928769",
  phoneDisplay: "0977 092 8769",
};

export type Project = {
  slug: string; title: string; summary: string; role: string;
  industries: IndustrySlug[];
  projectType: "client" | "venture" | "concept";
  publication: "published" | "draft";
  status: "archived" | "live" | "planned" | "in-progress";
  description?: string; objectives?: string[]; features?: string[]; contributions?: string[];
  tags?: string[]; capabilities?: string[];
  gallery?: { src: string; alt: string; caption?: string; width?: number; height?: number }[];
  seo?: { title?: string; description?: string };
  caseStudyUrl?: string;
  technologies: string[]; challenge?: string; approach?: string; outcome?: string;
  year?: number; website?: string;
  image?: { src: string; alt: string };
};
export const projects: Project[] = portfolioProjects.filter(project => project.publication === "published");

import { portfolioProjects } from "./projects";
export const site = {
  name: "John Semblante",
  url: "https://johnmsemblanteapp.web.app",
  description: "John Semblante’s web development portfolio and independent ventures.",
  // Public contact and form recipient. After changing, confirm the new FormSubmit activation email and redeploy.
  email: "johnmsemblante@gmail.com",
  phone: "+639770928769",
  phoneDisplay: "0977 092 8769",
};

export type Project = {
  slug: string; title: string; summary: string; role: string;
  technologies: string[]; challenge?: string; approach?: string; outcome?: string;
  year?: number; website?: string;
  image?: { src: string; alt: string };
};
export const projects: Project[] = portfolioProjects;

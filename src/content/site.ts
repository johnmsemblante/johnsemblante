import { portfolioProjects } from "./projects";
export const site = {
  name: "John Semblante",
  url: "https://johnsemblante.com",
  description: "John Semblante’s web development portfolio and independent ventures.",
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

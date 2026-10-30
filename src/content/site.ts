import { portfolioProjects } from "./projects";
export const site = {
  name: "John Semblante",
  url: "https://johnmsemblanteapp.web.app",
  description: "Senior WordPress and front-end developer in Cebu. Custom websites, WooCommerce development, and website fixes. Discuss your project with John Semblante.",
  // Public email link. Change delivery recipients separately in the Formspree dashboard.
  email: "johnmsemblante@gmail.com",
  // Public form ID, not an API secret. Recipient is configured in Formspree.
  contactFormEndpoint: "https://formspree.io/f/xwllnvev",
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

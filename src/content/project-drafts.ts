import type { Project } from "./site";

// Planning data only. Do not import this file into public pages or client components.
// Publish only after an original demo, usable assets and verified implementation details exist.
type ConceptDraft = Pick<Project, "slug" | "title" | "industries" | "projectType" | "publication" | "status"> & { brief: string };
export const proposedProjectDrafts: ConceptDraft[] = [
  { slug: "smilecraft-dental-studio", title: "SmileCraft Dental Studio", industries: ["dental"], projectType: "concept", publication: "draft", status: "planned", brief: "Fictional dental landing page. Not built; no live URL or WordPress claim." },
  { slug: "haven-property-group", title: "Haven Property Group", industries: ["real-estate"], projectType: "concept", publication: "draft", status: "planned", brief: "Fictional real estate website. Not built; no client relationship or results." },
  { slug: "wellspring-medical-clinic", title: "WellSpring Medical Clinic", industries: ["healthcare"], projectType: "concept", publication: "draft", status: "planned", brief: "Fictional healthcare website. Not built; no clinical or business claims." },
  { slug: "coastline-boutique-resort", title: "Coastline Boutique Resort", industries: ["hospitality"], projectType: "concept", publication: "draft", status: "planned", brief: "Fictional hospitality website. Not built; no bookings or testimonials." },
  { slug: "northstar-legal-group", title: "Northstar Legal Group", industries: ["professional-services"], projectType: "concept", publication: "draft", status: "planned", brief: "Fictional professional services website. Not built; no legal-client relationships." },
];

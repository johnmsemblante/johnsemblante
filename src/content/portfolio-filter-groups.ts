import type { Project } from "./site";

export const portfolioIndustryGroups = [
  { value: "dental", label: "Dental & Orthodontics", aliases: ["dentistry", "dentist", "orthodontic", "orthodontics"] },
  { value: "healthcare", label: "Healthcare & Wellness", aliases: ["medical", "health care", "healthcare-medical", "healthcare-wellness", "wellness"] },
  { value: "real-estate", label: "Real Estate & Property", aliases: ["real estates", "property", "properties", "real-estate-property"] },
  { value: "home-services", label: "Home Services & Construction", aliases: ["construction", "home-services-construction", "building"] },
  { value: "professional-services", label: "Legal & Professional Services", aliases: ["legal", "professional service", "legal-professional-services"] },
  { value: "ecommerce", label: "E-commerce & Retail", aliases: ["e-commerce", "ecommerce-retail", "retail", "shop", "store"] },
  { value: "hospitality-travel", label: "Hospitality & Travel", aliases: ["travel", "tourism", "travel-tourism", "hospitality"] },
  { value: "food-beverage", label: "Food & Beverage", aliases: ["food", "beverage"] },
  { value: "education", label: "Education & Childcare", aliases: ["education-childcare", "childcare", "child care", "learning"] },
  { value: "other", label: "Other Industries", aliases: ["other-industries"] },
] as const;
export type PortfolioIndustry = typeof portfolioIndustryGroups[number]["value"];
export const projectTypeOptions = [
  { value: "client-project", label: "Client Project", projectType: "client" },
  { value: "personal-venture", label: "Personal Venture", projectType: "venture" },
  { value: "concept-demo", label: "Concept / Demo", projectType: "concept" },
] as const;

export const filterValue = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export function normalizeIndustry(value: string): PortfolioIndustry | undefined {
  const key = filterValue(value);
  return portfolioIndustryGroups.find(group => [group.value, group.label, ...group.aliases].some(alias => filterValue(alias) === key))?.value;
}

// Preserve every legacy association. Additional groups use only the existing business descriptions.
export function projectIndustryGroups(project: Project): PortfolioIndustry[] {
  const groups = new Set<PortfolioIndustry>(project.industries.map(value => normalizeIndustry(value) || "other"));
  if (["northcroft", "perth-scaffolding", "trinity-floors", "impact-hygiene"].includes(project.slug)) groups.add("home-services");
  if (project.slug === "roar-fitness") groups.add("healthcare");
  if (["nexus-appliances", "georges-bike-shop"].includes(project.slug)) groups.add("ecommerce");
  if (project.slug === "active-kids-group") groups.add("education");
  if (!groups.size) groups.add("other");
  return [...groups];
}

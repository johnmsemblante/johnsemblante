import type { Project } from "./site";

const entries = [
  ["e-dee-monnen", "E Dee Monnen", 2024, "edeemonnen.jpg", "https://edeemonnen.com/", "An author website featuring Jumping Over the Moon and the writing of E. Dee Monnen.", ["UI", "WordPress"]],
  ["sharon-kramer-books", "Sharon Kramer Books", 2024, "sharoon.jpg", "https://sharonkramerbooks.com/", "An author website presenting Chester Jester Finds His Smile and Sharon Kramer’s books.", ["UI", "WordPress"]],
  ["impact-hygiene", "Impact Hygiene", 2023, "impacthygiene.jpg", "https://impacthygiene.net/", "A business website introducing commercial restroom hygiene services.", ["UI", "WordPress"]],
  ["roar-fitness", "Roar Fitness", 2022, "roarfitness.jpg", "https://roar.com.au/", "A fitness website introducing a brand with a focus on its community.", ["UI", "WordPress"]],
  ["nexus-appliances", "Nexus Appliances", 2019, "nexusappliances.jpg", "https://nexusappliances.com.ng/", "A website showcasing home appliances for the kitchen and laundry.", ["UI", "WordPress"]],
  ["perth-cosmetic-surgery", "Perth Cosmetic Surgery", 2019, "perthcosmetics.jpg", "https://perthcosmeticsurgery.com.au/", "A practice website introducing facial plastic and cosmetic surgery services in Subiaco.", ["UI", "WordPress"]],
  ["active-kids-group", "Active Kids Group", 2018, "activekidsgroups.jpg", "https://activekidsgroup.com.au/", "A childcare website introducing Sydney centres and their approach to learning.", ["UI", "WordPress"]],
  ["georges-bike-shop", "Georges Bike Shop", 2018, "georgebike.jpg", "https://georgesbikeshop.com.au/", "A bike-shop website featuring bikes and scooters in Balcatta, Perth.", ["WordPress"]],
  ["northcroft", "Northcroft", 2018, "northcroft.jpg", "https://northcroft.sg/", "A corporate website introducing construction-industry services and project expertise.", ["UI", "WordPress"]],
  ["perth-scaffolding", "Perth Scaffolding", 2018, "perthscafolding.jpg", "https://perthscaffolding.com.au/", "A business website for residential and industrial scaffolding services.", ["UI", "WordPress"]],
  ["trinity-floors", "Trinity Floors", 2018, "trinityfloors.jpg", "https://trinityfloors.com/", "A flooring-company website presenting commercial and residential flooring services.", ["UI", "WordPress"]],
  ["loonglist", "Loonglist", 2016, "loonglist.jpg", "https://loonglist.com/", "An ecommerce influencer-marketing platform connecting brands and creators.", ["UI", "WordPress"]],
  ["spinning-leaf-films", "Spinning Leaf Films", 2016, "spinningleaffilms.jpg", "https://spinningleaffilms.com/", "A filmmaking website introducing a team focused on storytelling.", ["UI", "WordPress"]],
  ["parkwood-chiropractic", "Parkwood Chiropractic", 2014, "parkwood.jpg", "https://parkwoodfamilychiropractic.com/", "A practice website introducing chiropractic care and massage services.", ["UI", "WordPress"]],
] satisfies [string, string, number, string, string, string, string[]][];

// These are historical portfolio entries, not newly verified client engagements.
// Detailed scope and outcomes are intentionally absent until supplied.
export const portfolioProjects: Project[] = entries.map(([slug, title, year, image, website, summary, technologies]) => ({
  slug, title, year, website, summary, technologies,
  role: technologies.includes("UI") ? "UI / WordPress" : "WordPress",
  image: { src: `/images/projects/${image}`, alt: `${title} website as shown in John’s original portfolio` },
}));

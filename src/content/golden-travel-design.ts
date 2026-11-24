import type { Project } from "./site";

const assets = "/images/projects/golden-travel-figma";
const file = "/design/kHDg2ocA4BW67mVil1QpWu/Travel-and-Tours?node-id=0-1";

export const goldenTravelFigmaUrl = `https://www.figma.com${file}&t=Q6Pexs1i7c8Cr989-1`;
export const goldenTravelFigmaEmbed = `https://embed.figma.com${file}&embed-host=share`;

export const goldenTravelDesign: Project = {
  slug: "golden-travel-and-tours-website-design",
  title: "Golden Travel and Tours Website Design",
  summary: "I designed the original standalone Golden Travel and Tours website in Figma, from discovering Cebu destinations and comparing tour packages to reaching the booking form.",
  role: "Website design and UI",
  industries: ["travel"],
  technologies: ["Figma", "UI"],
  tags: ["Website design", "User interface design", "Cebu tourism"],
  projectType: "venture",
  publication: "published",
  status: "archived",
  description: "Golden Travel and Tours needed a website that could introduce Cebu to first-time visitors and give travelers enough detail to choose a tour. I designed six desktop screens in Figma for the standalone site. The original domain expired, so the design is preserved here through screenshots and the shared Figma file.",
  challenge: "A traveler might arrive looking for inspiration, comparing package lengths, or ready to ask about a date. I needed a layout that served each of those needs and made it easy to move from one to the next.",
  approach: "I opened with destination photography, then used a consistent card layout so visitors could scan the package options. On the package detail screen, I grouped inclusions, exclusions and activities for closer comparison. A repeated orange booking button led to a dedicated screen with a calendar and a short form.",
  contributions: ["Designed the six desktop screens in Figma.", "Structured the flow from destination discovery to booking.", "Designed the page hierarchy, package cards and booking calls to action."],
  image: { src: `${assets}/cover.webp`, alt: "Original Golden Travel desktop homepage with a Cebu beach hero and orange booking button" },
  gallery: [
    { src: `${assets}/homepage.webp`, width: 1120, height: 2336, alt: "Homepage layout with a Cebu beach hero, destination photography and package previews", caption: "Homepage. Introduces Cebu and leads visitors into the available tours." },
    { src: `${assets}/packages.webp`, width: 1120, height: 1584, alt: "Tours listing with a three-column grid of package cards", caption: "Package listing. A consistent card layout makes the tour options easier to scan." },
    { src: `${assets}/package-detail.webp`, width: 1120, height: 1768, alt: "Sample three-day tour detail with sections for inclusions, exclusions and activities", caption: "Package detail. Groups the information travelers need before deciding whether to book." },
    { src: `${assets}/booking.webp`, width: 1120, height: 1008, alt: "Booking screen with a highlighted calendar and traveler inquiry form", caption: "Booking. Places date selection and the inquiry fields in one view." },
    { src: `${assets}/not-found.webp`, width: 1120, height: 662, alt: "Dark page-not-found screen with a branded 404 and a Back to Home button", caption: "404 page. Gives visitors a clear route back to the homepage." },
    { src: `${assets}/coming-soon.webp`, width: 1120, height: 662, alt: "Dark coming-soon screen with the Golden Travel logo and social links", caption: "Coming soon. Keeps the venture visible while the site is under construction." },
  ],
  seo: {
    title: "Golden Travel and Tours Figma Website Design",
    description: "See John Semblante’s Figma website design for Golden Travel and Tours, including Cebu destination discovery, tour package pages, and the booking interface.",
  },
};

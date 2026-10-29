export type VentureImage = { src: string; alt: string; width: number; height: number };
export type Venture = {
  slug: string; name: string; category: string; description: string;
  theme: "coffee" | "travel"; title: string; tagline: string; canonicalBase?: string;
  logo?: VentureImage; hero?: VentureImage; storyImage?: VentureImage;
  story?: string;
  offerings?: { title: string; description: string; price?: number; image?: VentureImage }[];
  offeringsNote?: string;
  artwork?: VentureImage[];
  vehicles?: { name: string; image: VentureImage }[];
  ordering?: { title: string; steps: string[]; note?: string };
  contact?: { label: string; url: string };
  phones?: { label: string; url: string }[];
  socials?: { label: string; url: string }[];
  questions?: { question: string; answer: string }[];
};

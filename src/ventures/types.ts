export type Venture = {
  slug: string; name: string; category: string; description: string;
  theme: "coffee" | "travel"; title: string; tagline: string; canonicalBase?: string;
  /** Add only approved venture details. Empty sections render explicit pending states. */
  story?: string;
  offerings?: { title: string; description: string }[];
  questions?: { question: string; answer: string }[];
};

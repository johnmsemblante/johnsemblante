import type { Venture } from "../types";

const base = "/ventures/golden-travel-and-tours";

export const goldenTravel: Venture = {

  slug: "golden-travel-and-tours", name: "Golden Travel and Tours", category: "Travel & rentals",

  description: "Cebu travel, tours, and car rentals. Explore vehicle options, airport and pier transfers, personal tours, and sightseeing, then contact Golden Travel for a tailored quote.",

  theme: "travel", title: "Discover. Experience. Enjoy.", tagline: "Travel, tours & rentals in Cebu",

  logo: { src: `${base}/logo.webp`, alt: "Golden Travel and Tours logo", width: 1024, height: 824 },

  hero: { src: `${base}/logo.webp`, alt: "Golden Travel and Tours mountain, palm tree, and airplane brand mark", width: 1024, height: 824 },

  storyImage: { src: `${base}/suv.webp`, alt: "Representative SUV graphic from Golden Travel’s materials", width: 413, height: 270 },

  story: "Golden Travel and Tours brings together travel, tours, and rentals in Cebu. The venture’s materials feature sedan, SUV, and van options alongside transfers, sightseeing, personal tours, and wedding or honeymoon transport. Tell the team about your itinerary to discuss suitable arrangements.",

  offerings: [

    { title: "Car rentals", description: "Discuss sedan, SUV, or van options for your itinerary. Confirm the vehicle, availability, and rental arrangements with the team." },

    { title: "Airport & pier transfers", description: "Ask about transport between your arrival or departure point and your destination." },

    { title: "Personal tours & sightseeing", description: "Share your destinations and schedule to discuss a trip around Cebu." },

    { title: "Weddings & honeymoons", description: "Inquire about transport arrangements for your celebration or getaway." },

  ],

  offeringsNote: "Rates and vehicle availability are quoted directly. The vehicle graphics are representative images from the supplied brand materials, not a guarantee of a specific model.",

  vehicles: [

    { name: "Sedan", image: { src: `${base}/sedan.webp`, alt: "Representative sedan from Golden Travel’s materials", width: 413, height: 270 } },

    { name: "SUV", image: { src: `${base}/suv.webp`, alt: "Representative SUV from Golden Travel’s materials", width: 413, height: 270 } },

    { name: "Van", image: { src: `${base}/van.webp`, alt: "Representative van from Golden Travel’s materials", width: 413, height: 270 } },

  ],

  contact: { label: "Request a travel quote", url: "https://www.facebook.com/goldentravelandtours.go" },

  phones: [{ label: "0956 254 1515", url: "tel:+639562541515" }, { label: "0912 141 5168", url: "tel:+639121415168" }],

  socials: [{ label: "Facebook · Golden Travel and Tours", url: "https://www.facebook.com/goldentravelandtours.go" }],

  ordering: { title: "Your itinerary is the starting point.", steps: ["Share your travel dates, pickup and drop-off points, destinations, and group size.", "Tell the team whether you need a transfer, rental, sightseeing, or other travel arrangements.", "Confirm the vehicle, availability, quote, and booking terms directly before making travel plans."] },

  questions: [

    { question: "What vehicle options can I ask about?", answer: "The supplied materials feature sedan, SUV, and van options. Confirm the specific model, capacity, and availability with the team." },

    { question: "Can I request airport or pier transfers?", answer: "Airport and pier transfers are among the services in the venture’s materials. Send your schedule and pickup or drop-off points for a quote." },

    { question: "Where can I find rates?", answer: "Contact Golden Travel and Tours with your itinerary for a quote. No sample rates or unconfirmed package prices are published here." },

  ],

};

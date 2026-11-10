import type { Venture } from "../types";

const base = "/ventures/golden-travel-and-tours";

export const goldenTravel: Venture = {

  slug: "golden-travel-and-tours", name: "Golden Travel and Tours", category: "Travel & rentals",

  description: "Plan Cebu tours, car rentals, and airport or pier transfers with Golden Travel and Tours. Share your dates, route, and group size to request a quote.",

  theme: "travel", title: "Where in Cebu would you like to go?", tagline: "Travel, tours & rentals in Cebu",

  logo: { src: `${base}/logo.webp`, alt: "Golden Travel and Tours logo", width: 1024, height: 824 },

  hero: { src: `${base}/logo.webp`, alt: "Golden Travel and Tours mountain, palm tree, and airplane brand mark", width: 1024, height: 824 },

  storyImage: { src: `${base}/suv.webp`, alt: "Representative SUV graphic from Golden Travel’s materials", width: 413, height: 270 },

  story: "Planning an airport pickup, a day around the city, or a trip outside Cebu City? Share your pickup point, destinations, travel dates, and group size. Golden Travel and Tours will help you review transport options and confirm the route, vehicle availability, and quotation before you book.",

  offerings: [

    { title: "Car rentals", description: "Discuss sedan, SUV, or van options for your itinerary. Confirm the vehicle, availability, and rental arrangements with the team." },

    { title: "Airport & pier transfers", description: "Ask about transport between your arrival or departure point and your destination." },

    { title: "Personal tours & sightseeing", description: "Share your destinations and schedule to discuss a trip around Cebu." },

    { title: "Weddings & honeymoons", description: "Inquire about transport arrangements for your celebration or getaway." },

  ],

  offeringsNote: "Share your dates, route, and group size for a quote. Vehicle images are representative; the team will confirm the model and availability.",

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

    { question: "What vehicle options can I ask about?", answer: "Ask about sedan, SUV, and van options. Send your group size and itinerary so the team can confirm the model, seating, and availability." },

    { question: "Can I request airport or pier transfers?", answer: "Yes. Send your arrival or departure schedule, pickup and drop-off locations, and group size to request a transfer quote." },

    { question: "Where can I find rates?", answer: "Message the team with your dates, destinations, and group size. Confirm the total, what is included, and booking terms before making arrangements." },

  ],

};

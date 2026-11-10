export type TripReference = { id: string; name: string; amount: number; date: string; stops: string[]; note: string };
// Public historical reference amounts only. No private conversation or supplier terms.
export const tripReferences: TripReference[] = [
  { id: "city", name: "City & Uphill", amount: 5500, date: "2026-05-27", stops: ["Sirao Flower Garden", "Temple of Leah", "Taoist Temple", "Basilica del Sto. Niño", "Magellan’s Cross", "Fort San Pedro", "Yap Ancestral House", "Cebu Heritage Monument"], note: "An eight-hour tour was discussed; confirm applicable hours, vehicle and pickup area." },
  { id: "oslob", name: "Oslob", amount: 7000, date: "2026-05-27", stops: ["Oslob whale shark watching", "Sumilon Sandbar", "Tumalog Falls", "Cuartel Ruins", "Boljoon Church", "Carcar"], note: "Confirm trip duration and current attraction access. Boats and activities are not priced here." },
  { id: "moalboal", name: "Moalboal", amount: 7000, date: "2026-05-27", stops: ["Moalboal sardines, turtles and coral viewing", "Kawasan / canyoneering", "Carcar"], note: "Optional freediving and activity charges require a separate quotation. Confirm trip duration." },
  { id: "mountain", name: "Mountain Tour", amount: 7000, date: "2026-05-27", stops: ["Buwakan ni Alejandra", "Sirao Flower Garden", "La Vie in the Sky", "Temple of Leah", "Little Kyoto"], note: "An eight-hour tour was discussed; confirm applicable hours and vehicle." },
  { id: "safari", name: "Marco Polo → Cebu Safari → Marco Polo", amount: 6000, date: "2026-09-06", stops: ["Cebu Safari"], note: "Previous return van quotation for approximately 10 passengers; this does not establish vehicle capacity or include admission." },
  { id: "simala", name: "Marco Polo → Simala → Naga → Marco Polo", amount: 6000, date: "2026-09-14", stops: ["Simala", "Naga"], note: "Previous eight-hour van quotation. ₱350/hour overtime was discussed for that booking; current overtime terms require confirmation." },
];
export const estimateNotice = "This budget is an estimate. Request a confirmed quotation before booking. Historical prices may change without prior notice with fuel prices, vehicle choice, travel date, pickup location, additional stops, waiting time, and other trip requirements. Final pricing and availability require confirmation. Charges not expressly confirmed as included are excluded.";
export function referenceFor(id: string) { return tripReferences.find(item => item.id === id); }
export function needsCustomQuote(id: string, modified: boolean, vehicle: string, multiDay: boolean) {
  return !referenceFor(id) || modified || multiDay || vehicle === "Sedan" || vehicle === "SUV";
}

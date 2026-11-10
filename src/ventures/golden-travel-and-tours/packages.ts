export type TourPackage = {
  id: string; name: string; stops: string[];
  // Populate only when the owner supplies a rate for this exact itinerary.
  fixedRate?: { amount: number; confirmedOn: string; conditions: string };
};
// Itineraries supplied directly by the owner on 1 November 2026, matching the July list.
// No corresponding complete rate list was supplied.
export const tourPackages: TourPackage[] = [
  { id: "package-1", name: "Package 1: Cebu City Tour", stops: ["Magellan’s Cross", "Basilica del Sto. Niño", "Heritage of Cebu Monument", "Yap San Diego Ancestral House", "Museo Sugbo", "Fort San Pedro", "Taoist Temple", "Temple of Leah", "Sirao Flower Garden", "Tops"] },
  { id: "package-2", name: "Package 2: Top Hills Tour", stops: ["Taoist Temple", "Temple of Leah", "Tops Lookout", "Terrazas de Flores", "Sirao Flower Garden", "Florentinos", "Adventure Cafe", "Buwakan ni Alejandra", "JVR Island in the Sky", "West 35 Eco-Mountain Resort"] },
  { id: "package-3", name: "Package 3: South + Top Hills Tour", stops: ["Simala", "Taoist Temple", "Sirao Flower Garden", "Tops", "Temple of Leah", "Carcar Pasalubong Center"] },
  { id: "package-4", name: "Package 4: South + City Tour", stops: ["Simala", "Magellan’s Cross", "Basilica del Sto. Niño", "Heritage of Cebu Monument", "Yap San Diego Ancestral House", "Museo Sugbo", "Fort San Pedro", "Carcar Pasalubong Center"] },
  { id: "package-a", name: "Package A: Barili, Moalboal & Kawasan", stops: ["Barili Milk Station", "Moalboal / Pescador Island hopping", "Kawasan: canyoneering or falls only", "Carcar Pasalubong Center"] },
  { id: "package-b", name: "Package B: Oslob, Sumilon, Tumalog & Simala", stops: ["Oslob whale shark watching", "Sumilon Sandbar", "Tumalog Falls", "Simala", "Carcar Pasalubong Center"] },
  { id: "package-c", name: "Package C: Oslob, Kawasan & Moalboal", stops: ["Oslob whale shark watching", "Kawasan: canyoneering or falls only", "Moalboal / Pescador Island hopping", "Carcar Pasalubong Center"] },
  { id: "package-d", name: "Package D: Oslob, Tumalog & Osmeña Peak", stops: ["Oslob whale shark watching", "Tumalog Falls", "Osmeña Peak", "Carcar Pasalubong Center"] },
  { id: "package-e", name: "Package E: Simala, Kawasan & Moalboal", stops: ["Simala Church", "Kawasan: canyoneering or falls only", "Moalboal / Pescador Island hopping", "Carcar Pasalubong Center"] },
  { id: "package-f", name: "Package F: Oslob, Sumilon & Kawasan", stops: ["Oslob whale shark watching", "Sumilon Island hopping, sandbar and snorkeling", "Kawasan: canyoneering or falls only", "Carcar Pasalubong Center"] },
  { id: "package-g", name: "Package G: Oslob, Kawasan & Simala", stops: ["Oslob whale shark watching", "Kawasan: canyoneering or falls only", "Simala", "Carcar Pasalubong Center"] },
  { id: "package-h", name: "Package H: Cebu Safari & Adventure Park", stops: ["Cebu Safari and Adventure Park"] },
];
export function selectedPackage(mode: string, id: string) {
  return mode === "packages" ? tourPackages.find(item => item.id === id) : undefined;
}

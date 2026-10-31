import type { Venture } from "../types";
const base = "/ventures/lazy-barista";
// Supplied Menu.png and Fresh Menu.png; prices confirmed by John on 2026-10-29.
export const lazyBarista: Venture = {
  slug: "lazy-barista", name: "Lazy Barista", category: "Coffee",
  description: "Espresso drinks, creamy coffee favorites, and chocolate with a laid-back Cebuano twist. Explore the Lazy Barista menu and message the team to order.",
  theme: "coffee", title: "Brewed with zero urgency.", tagline: "Your coffee. Your pace.",
  logo: { src: `${base}/logo.webp`, alt: "Lazy Barista logo", width: 1280, height: 1280 },
  hero: { src: `${base}/logo.webp`, alt: "Lazy Barista’s illustrated coffee-cup mascot", width: 1280, height: 1280 },
  storyImage: { src: `${base}/cover.webp`, alt: "Lazy Barista — Brewed with zero urgency", width: 3280, height: 1248 },
  story: "Brewed with zero urgency. Lazy Barista pairs espresso and chocolate drinks with names that speak to everyday Cebuano moods: Huwat Sa, Kapoya, Hahay, Taymsa, Unya Sa, and Kana Nlng. Pick a drink, take a pause, and enjoy it at your own pace.",
  offerings: [
    { title: "Huwat Sa", image: {"src": "/ventures/lazy-barista/huwat-sa.webp", "alt": "Huwat Sa drink from the Lazy Barista menu", "width": 703, "height": 654}, description: "Creamy espresso with milk and whipped cream.", price: 120 },
    { title: "Kapoya", image: {"src": "/ventures/lazy-barista/kapoya.webp", "alt": "Kapoya drink from the Lazy Barista menu", "width": 712, "height": 654}, description: "A sweet vanilla espresso mix for your coffee break.", price: 115 },
    { title: "Hahay", image: {"src": "/ventures/lazy-barista/hahay.webp", "alt": "Hahay drink from the Lazy Barista menu", "width": 703, "height": 650}, description: "Iced espresso with an airy finish.", price: 100 },
    { title: "Taymsa", image: {"src": "/ventures/lazy-barista/taymsa.webp", "alt": "Taymsa drink from the Lazy Barista menu", "width": 712, "height": 641}, description: "A simple, strong espresso and milk combination.", price: 115 },
    { title: "Unya Sa", image: {"src": "/ventures/lazy-barista/unya-sa.webp", "alt": "Unya Sa drink from the Lazy Barista menu", "width": 712, "height": 720}, description: "A cool, strong espresso mix.", price: 115 },
    { title: "Kana Nlng", image: {"src": "/ventures/lazy-barista/kana-nlng.webp", "alt": "Kana Nlng drink from the Lazy Barista menu", "width": 682, "height": 720}, description: "A thick chocolate drink for a change from coffee.", price: 120 },
    { title: "Hasula", image: {"src": "/ventures/lazy-barista/hasula.webp", "alt": "Hasula drink from the Lazy Barista menu", "width": 682, "height": 720}, description: "Perfect green fix for your hasula to do list. a drink that matcha-s your not today energy", price: 120 },
  ],
  offeringsNote: "Oat milk add-on: +₱30. Message the team to confirm availability before ordering.",
  artwork: [
    { src: `${base}/menu.webp`, alt: "Original Lazy Barista menu: Huwat Sa ₱120, Kapoya ₱115, Hahay ₱100, Taymsa ₱115; oat milk +₱30", width: 2448, height: 3168 },
    { src: `${base}/new-drinks.webp`, alt: "New additions: Unya Sa ₱115 and Kana Nlng ₱120", width: 2448, height: 3168 },
  ],
  ordering: { title: "Your next coffee break starts here.", steps: ["Message Lazy Barista on Facebook with your name and mobile number.", "Include your address, drink names, and quantities. Separate multiple drinks with commas.", "State your preferred payment method: GCash or BPI.", "Confirm availability, total, and fulfillment details with the team before payment."], note: "Message the team to confirm your drinks, total, and fulfillment arrangements before payment." },
  contact: { label: "Message to order", url: "https://www.facebook.com/lazybaristaph" },
  phones: [{ label: "0947 812 7822", url: "tel:+639478127822" }, { label: "0926 639 5178", url: "tel:+639266395178" }],
  socials: [{ label: "Facebook · @lazybaristaph", url: "https://www.facebook.com/lazybaristaph" }, { label: "Instagram · @lazybaristaph", url: "https://www.instagram.com/lazybaristaph/" }],
  questions: [
    { question: "How do I order?", answer: "Message Lazy Barista on Facebook with your name, mobile number, address, drink names and quantities, and preferred payment method. The team will confirm the order details." },
    { question: "Is oat milk available?", answer: "The menu lists an oat milk add-on for ₱30. Confirm availability when you order." },
    { question: "How can I pay?", answer: "GCash and BPI are listed payment options. Confirm the order total and payment details with the team before paying." },
  ],
};

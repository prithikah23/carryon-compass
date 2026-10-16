import type { Activity, Category, Formality, Item, Trip, Warmth } from "./types";
import { emptyOverrides } from "./types";

type Row = [string, string, Category, string, number, number, Warmth, Formality, Activity[], number, number?];

// id, name, category, color, weight g, volume L, warmth, formality, suitable, max wears, liquid mL
const ROWS: Row[] = [
  ["s-tee-white", "Merino t-shirt (white)", "top", "#f4f1ea", 150, 0.8, "light", "casual", ["city", "hiking"], 3],
  ["s-tee-black", "Merino t-shirt (black)", "top", "#1f2326", 150, 0.8, "light", "casual", ["city", "hiking", "dinner"], 3],
  ["s-tee-grey", "Merino t-shirt (grey)", "top", "#8a8f94", 150, 0.8, "light", "casual", ["city", "hiking"], 3],
  ["s-base", "Long-sleeve base layer", "top", "#3d4a5c", 200, 1.0, "medium", "casual", ["hiking", "cold nights"], 4],
  ["s-linen", "Linen button-up shirt", "top", "#e8dcc4", 220, 1.2, "light", "smart", ["city", "dinner", "business", "beach"], 2],
  ["s-blouse", "Dinner blouse", "top", "#7a2e3b", 160, 0.8, "light", "formal", ["dinner", "business"], 2],
  ["s-hikepants", "Hiking pants", "bottom", "#5b6150", 350, 1.5, "medium", "casual", ["hiking", "rain", "cold nights"], 5],
  ["s-jeans", "Black jeans", "bottom", "#22252b", 650, 2.0, "medium", "smart", ["city", "dinner"], 6],
  ["s-leggings", "Leggings", "bottom", "#2a2a30", 200, 0.8, "medium", "casual", ["hiking", "city", "cold nights"], 3],
  ["s-shorts", "Shorts", "bottom", "#c9b48a", 180, 0.8, "light", "casual", ["beach", "hiking", "city"], 3],
  ["s-dress", "Black midi dress", "dress", "#16181c", 300, 1.2, "light", "formal", ["dinner", "city", "business"], 3],
  ["s-fleece", "Fleece", "outer", "#2f5d62", 350, 3.0, "medium", "casual", ["hiking", "cold nights", "city"], 10],
  ["s-puffer", "Down puffer jacket", "outer", "#1d3a52", 380, 5.0, "warm", "casual", ["hiking", "cold nights", "city"], 20],
  ["s-shell", "Rain shell", "outer", "#b5532f", 280, 1.5, "light", "casual", ["rain", "hiking", "city"], 20],
  ["s-cardigan", "Cardigan", "outer", "#b9a58a", 300, 1.8, "medium", "smart", ["city", "dinner", "cold nights"], 6],
  ["s-trail", "Trail runners", "shoes", "#4a5a4a", 750, 4.5, "medium", "casual", ["hiking", "rain", "city"], 99],
  ["s-sneakers", "White sneakers", "shoes", "#f2f2f0", 650, 4.0, "medium", "smart", ["city", "dinner"], 99],
  ["s-sandals", "Sandals", "shoes", "#8b5a3c", 300, 1.5, "light", "casual", ["beach", "city", "dinner"], 99],
  ["s-beanie", "Beanie", "accessory", "#4b4f58", 60, 0.3, "warm", "casual", ["hiking", "cold nights"], 99],
  ["s-gloves", "Gloves", "accessory", "#2b2f36", 70, 0.3, "warm", "casual", ["hiking", "cold nights"], 99],
  ["s-scarf", "Scarf", "accessory", "#9c6b4e", 120, 0.6, "warm", "smart", ["city", "dinner", "cold nights"], 99],
  ["s-sunhat", "Sun hat", "accessory", "#d8c8a0", 90, 0.8, "light", "casual", ["hiking", "beach", "city"], 99],
  ["s-sunglasses", "Sunglasses", "accessory", "#2a2a2a", 30, 0.2, "light", "casual", ["hiking", "beach", "city"], 99],
  ["s-underwear", "Underwear (5)", "basics", "#d9d4cc", 200, 0.6, "light", "casual", [], 99],
  ["s-socks", "Hiking socks (3 pairs)", "basics", "#6d7466", 210, 0.8, "medium", "casual", [], 99],
  ["s-sunscreen", "Sunscreen", "toiletry", "#f0d27a", 110, 0.15, "light", "casual", [], 99, 90],
  ["s-shampoo", "Shampoo", "toiletry", "#9fc7c0", 95, 0.12, "light", "casual", [], 99, 80],
  ["s-moisturizer", "Moisturizer", "toiletry", "#efe6da", 65, 0.08, "light", "casual", [], 99, 50],
  ["s-toothpaste", "Toothpaste", "toiletry", "#cfe3ef", 90, 0.1, "light", "casual", [], 99, 75],
  ["s-toothbrush", "Toothbrush kit", "toiletry", "#a7c4a0", 60, 0.2, "light", "casual", [], 99],
  ["s-charger", "Phone charger", "tech", "#e9e9e9", 120, 0.3, "light", "casual", [], 99],
  ["s-powerbank", "Power bank", "tech", "#3a3a3a", 250, 0.3, "light", "casual", [], 99],
  ["s-wallet", "Travel wallet with passport", "documents", "#5a3e2b", 150, 0.3, "light", "casual", [], 99],
];

export function sampleItems(): Item[] {
  return ROWS.map(([id, name, category, color, weightG, volumeL, warmth, formality, suitable, maxWears, ml]) => ({
    id,
    name,
    category,
    color,
    weightG,
    volumeL,
    warmth,
    formality,
    suitable,
    maxWears,
    ...(category === "toiletry" ? { liquid: ml != null, containerMl: ml ?? 0 } : {}),
    sample: true,
  }));
}

export const SAMPLE_TRIP_ID = "sample-trip";

export function sampleTrip(): Trip {
  return {
    id: SAMPLE_TRIP_ID,
    name: "Buenos Aires > Atacama > Patagonia > Santiago",
    carryOnL: 40,
    personalL: 18,
    carryOnEmptyKg: 2.3,
    personalEmptyKg: 0.6,
    limitType: "combined",
    combinedKg: 10,
    carryOnKg: 7,
    personalKg: 3,
    legs: [
      { id: "s-leg-1", destination: "Buenos Aires", start: "2026-09-16", end: "2026-09-19", low: 12, high: 20, rain: "some", activities: ["city", "dinner"] },
      { id: "s-leg-2", destination: "Atacama", start: "2026-09-20", end: "2026-09-22", low: 2, high: 24, rain: "none", activities: ["hiking", "cold nights"] },
      { id: "s-leg-3", destination: "Patagonia", start: "2026-09-23", end: "2026-09-24", low: -1, high: 9, rain: "some", activities: ["hiking", "rain", "cold nights"] },
      { id: "s-leg-4", destination: "Santiago", start: "2026-09-25", end: "2026-09-26", low: 8, high: 22, rain: "none", activities: ["city", "dinner"] },
    ],
    souvenirKg: 1,
    souvenirL: 4,
    souvenirBag: "carryOn",
    laundry: false,
    wearHeaviest: true,
    overrides: emptyOverrides(),
    checked: [],
    sample: true,
    createdAt: 0,
  };
}

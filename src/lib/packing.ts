import { CATALOG, catalogItem } from "./catalog";
import type { Item, BagId } from "./types";
export const CLIMATES = ["Hot", "Warm", "Mild", "Cool", "Freezing"] as const;
export type Climate = (typeof CLIMATES)[number];
export type PackingActivity = "city" | "hiking" | "beach" | "dinner";
export interface Stop {
  id: string;
  name: string;
  days: number;
  climate: Climate;
  rain: "none" | "some" | "lots";
  coldNights: boolean;
  activities: PackingActivity[];
}
export interface PackItem {
  item: Item;
  bag: BagId | "worn";
  reason: string;
  packed: boolean;
  essential: boolean;
  impact: number;
}
export interface PackingTrip {
  id: string;
  stops: Stop[];
  carryOnL: number;
  personalL: number;
  limitKg: number;
  souvenirKg: number;
  entries: PackItem[];
  sample: boolean;
}
const names = [
  "T-shirt",
  "Merino t-shirt",
  "Long-sleeve shirt",
  "Linen shirt",
  "Polo shirt",
  "Blouse",
  "Casual dress",
  "Jeans",
  "Chinos",
  "Hiking pants",
  "Leggings",
  "Shorts",
  "Swimwear",
  "Puffer jacket",
  "Fleece",
  "Rain shell",
  "Cardigan",
  "Thermal base layer",
  "Sneakers",
  "Trail runners",
  "Sandals",
  "Hiking boots",
  "Loafers",
  "Socks",
  "Underwear",
  "Sun hat",
  "Beanie",
  "Scarf",
  "Gloves",
  "Sunglasses",
  "Travel towel",
  "Sunscreen",
  "Phone charger",
  "Power bank",
  "Travel adapter",
  "Headphones",
];
const EXTRA_SYNONYMS: Record<string, string> = {
  "Hair straightener": "flat iron curler curling wand hair tool styling",
  "Makeup bag": "makeup cosmetics cosmetic pouch beauty",
  "Neck pillow": "travel pillow comfort flight",
  "Evening dress": "dress dinner outfit formal going out",
  "Jewelry case": "jewellery jewelry earrings necklace",
};
const extra = (
  name: string,
  category: Item["category"],
  weightG: number,
  volumeL: number,
  formality: Item["formality"] = "casual",
): Item => ({
  id: name,
  catalogId: name.toLowerCase().replaceAll(" ", "-"),
  name,
  category,
  weightG,
  volumeL,
  color: "#476b75",
  warmth: "light",
  formality,
  suitable: ["city"],
  maxWears: 99,
});
export const TRAVEL_CATALOG: Item[] = [
  ...CATALOG.filter((e) => names.includes(e.name)).map((e) => catalogItem(e, e.catalogId)),
  extra("Sleepwear", "basics", 250, 0.9),
  extra("Toiletry kit", "toiletry", 450, 1),
  extra("Passport", "documents", 40, 0.05),
  extra("Wallet", "documents", 100, 0.15),
  extra("Hair straightener", "tech", 450, 0.8),
  extra("Makeup bag", "toiletry", 350, 0.7),
  extra("Neck pillow", "accessory", 250, 1.2),
  extra("Evening dress", "dress", 300, 0.6, "smart"),
  extra("Jewelry case", "accessory", 150, 0.3),
];
export function findItems(q: string) {
  const words = q.toLowerCase().trim().split(/\s+/);
  return TRAVEL_CATALOG.filter((i) =>
    words.every((w) =>
      `${i.name} ${CATALOG.find((c) => c.catalogId === i.catalogId)?.synonyms ?? EXTRA_SYNONYMS[i.name] ?? ""}`
        .toLowerCase()
        .includes(w),
    ),
  );
}
export type AirlinePreset = {
  name: string;
  carryOnL: 30 | 40 | 45;
  personalL: 12 | 18 | 25;
  limitKg: number;
  note: string;
};
/** Typical cabin allowances (economy). Estimates only — airlines change rules. */
export const AIRLINES: AirlinePreset[] = [
  { name: "Air Canada", carryOnL: 40, personalL: 18, limitKg: 10, note: "No set weight limit; bags must fit the sizer. 10 kg is a comfortable target." },
  { name: "Delta", carryOnL: 45, personalL: 18, limitKg: 12, note: "No published weight limit; size only. 12 kg is a realistic safe target." },
  { name: "American Airlines", carryOnL: 45, personalL: 18, limitKg: 12, note: "No published weight limit; size only. 12 kg is a realistic safe target." },
  { name: "United", carryOnL: 45, personalL: 18, limitKg: 12, note: "No published weight limit; size only. 12 kg is a realistic safe target." },
  { name: "British Airways", carryOnL: 45, personalL: 18, limitKg: 23, note: "Up to 23 kg per bag; you still have to lift it into the overhead bin." },
  { name: "Lufthansa", carryOnL: 40, personalL: 12, limitKg: 8, note: "8 kg for the carry-on in economy, often weighed at the gate." },
  { name: "Qatar Airways", carryOnL: 40, personalL: 12, limitKg: 7, note: "7 kg combined in economy, often weighed at check-in." },
  { name: "Emirates", carryOnL: 40, personalL: 12, limitKg: 7, note: "7 kg in economy, often weighed at check-in." },
  { name: "Singapore Airlines", carryOnL: 40, personalL: 12, limitKg: 7, note: "7 kg in economy, often weighed at check-in." },
  { name: "Ryanair", carryOnL: 40, personalL: 12, limitKg: 10, note: "10 kg carry-on with Priority; the free bag is a small 40×20×25 cm item." },
  { name: "easyJet", carryOnL: 40, personalL: 12, limitKg: 15, note: "Large cabin bag up to 15 kg with Up Front or Plus; free bag is under-seat only." },
];
export const souvenirVolume = (kg: number) => kg * 4;
export function buildPackingTrip(input: Omit<PackingTrip, "entries">): PackingTrip {
  const entries: PackItem[] = [];
  const days = input.stops.reduce((s, l) => s + l.days, 0);
  const add = (name: string, reason: string, count = 1, essential = false, impact = 1) => {
    const item = TRAVEL_CATALOG.find((i) => i.name === name);
    if (!item) return;
    for (let n = 0; n < count; n++)
      entries.push({
        item: { ...item, id: `${input.id}-${item.catalogId}-${n}` },
        bag: "carryOn",
        reason,
        packed: false,
        essential,
        impact,
      });
  };
  const destinations = (stops: Stop[]) => stops.map((s) => s.name).join(" and ");
  const all = `Reused across ${destinations(input.stops)}`;
  add(
    "Underwear",
    `Daily basics for ${days} days; wash and rewear after 7 days`,
    Math.min(7, days),
    true,
    5,
  );
  add(
    "Socks",
    `Daily basics for ${days} days; wash and rewear after 7 days`,
    Math.min(7, days),
    true,
    5,
  );
  add(
    "T-shirt",
    `${Math.min(5, Math.ceil(days / 2))} tops rotated across ${days} days`,
    Math.min(5, Math.ceil(days / 2)),
    false,
    2,
  );
  const hiking = input.stops.filter((s) => s.activities.includes("hiking"));
  const dinner = input.stops.filter((s) => s.activities.includes("dinner"));
  const beach = input.stops.filter((s) => s.activities.includes("beach"));
  add(hiking.length ? "Hiking pants" : "Chinos", all, 1, false, 3);
  add("Leggings", `Spare bottom · ${all.toLowerCase()}`, 1, false, 1);
  if (days > 7)
    add(dinner.length ? "Chinos" : "Shorts", `Third bottom for ${days} days`, 1, false, 1);
  add("Sleepwear", `For every night of your ${days}-day trip`, 1, true, 5);
  add("Toiletry kit", "Daily essentials kept together", 1, true, 5);
  add("Phone charger", "Keeps your phone charged on every leg", 1, true, 5);
  add("Passport", "Travel document · keep it with you", 1, true, 10);
  add("Wallet", "Money and cards · keep them with you", 1, true, 10);
  const cold = input.stops.filter(
    (s) => s.climate === "Cool" || s.climate === "Freezing" || s.coldNights,
  );
  if (cold.length) {
    add("Fleece", `Needed for cold nights or cool days in ${destinations(cold)}`, 1, false, 4);
    add("Puffer jacket", `Warm protection in ${destinations(cold)}`, 1, false, 4);
  }
  const freezing = input.stops.filter((s) => s.climate === "Freezing");
  if (freezing.length) {
    for (const n of ["Thermal base layer", "Beanie", "Gloves", "Scarf"])
      add(n, `Needed for freezing weather in ${destinations(freezing)}`, 1, false, 4);
  }
  const rain = input.stops.filter((s) => s.rain !== "none");
  if (rain.length) add("Rain shell", `Rain protection in ${destinations(rain)}`, 1, false, 4);
  add(
    hiking.length ? "Trail runners" : "Sneakers",
    hiking.length ? `Hiking and city walking in ${destinations(input.stops)}` : all,
    1,
    false,
    4,
  );
  if (dinner.length)
    add("Linen shirt", `One dressier outfit for dinner in ${destinations(dinner)}`, 1, false, 1);
  if (beach.length) {
    add("Swimwear", `Beach days in ${destinations(beach)}`, 1, false, 1);
    add("Sandals", `Beach and city walking in ${destinations(beach)}`, 1, false, 1);
    add("Sunscreen", `Sun protection in ${destinations(beach)}`, 1, true, 4);
  }
  const sun = input.stops.filter((s) => s.climate === "Hot" || s.climate === "Warm");
  if (sun.length) add("Sun hat", `Sun protection in ${destinations(sun)}`, 1, false, 2);
  const shoe = entries
    .filter((e) => e.item.category === "shoes")
    .sort((a, b) => b.item.weightG - a.item.weightG)[0];
  if (shoe) shoe.bag = "worn";
  const layers = entries
    .filter((e) => e.item.category === "outer" && e.item.name !== "Rain shell")
    .sort((a, b) => b.item.weightG - a.item.weightG);
  for (const e of layers.slice(0, 2)) e.bag = "worn";
  for (const e of entries)
    if (["documents", "tech", "toiletry"].includes(e.item.category)) e.bag = "personal";
  // Keep every copy of an item together in one bag, and fill the carry-on first.
  const vol = (bag: BagId) =>
    entries.filter((e) => e.bag === bag).reduce((s, e) => s + e.item.volumeL, 0);
  const groupOf = (name: string) => entries.filter((x) => x.item.name === name);
  // Change of clothes in the personal item: one single-copy top/bottom if available.
  for (const category of ["top", "bottom"]) {
    const single = entries.find(
      (e) => e.bag === "carryOn" && e.item.category === category && groupOf(e.item.name).length === 1,
    );
    if (single) single.bag = "personal";
  }
  const names = [...new Set(entries.filter((e) => e.bag === "carryOn" && !e.essential).map((e) => e.item.name))];
  names.sort((a, b) => (groupOf(a)[0]?.impact ?? 0) - (groupOf(b)[0]?.impact ?? 0));
  for (const name of names) {
    const grp = groupOf(name);
    const l = grp.reduce((s, e) => s + e.item.volumeL, 0);
    if (
      vol("carryOn") + souvenirVolume(input.souvenirKg) > input.carryOnL &&
      vol("personal") + l <= input.personalL
    )
      for (const e of grp) e.bag = "personal";
  }
  return { ...input, entries };
}
export function totals(trip: PackingTrip, returning = false) {
  const bags = { carryOn: { g: 0, l: 0 }, personal: { g: 0, l: 0 } };
  let wornG = 0;
  for (const e of trip.entries)
    if (e.bag === "worn") wornG += e.item.weightG;
    else {
      bags[e.bag].g += e.item.weightG;
      bags[e.bag].l += e.item.volumeL;
    }
  const reserveG = trip.souvenirKg * 1000,
    reserveL = souvenirVolume(trip.souvenirKg);
  const g = bags.carryOn.g + bags.personal.g;
  return {
    bags,
    wornG,
    reserveG,
    reserveL,
    usedG: g + (returning ? reserveG : 0),
    overG: Math.max(0, g + reserveG - trip.limitKg * 1000),
    overCarryL: Math.max(0, bags.carryOn.l + reserveL - trip.carryOnL),
    overPersonalL: Math.max(0, bags.personal.l - trip.personalL),
    spareG: trip.limitKg * 1000 - g - reserveG,
  };
}
export function suggestedRemovals(trip: PackingTrip): string[] {
  const t = totals(trip);
  if (!t.overG && !t.overCarryL && !t.overPersonalL) return [];
  const candidates = trip.entries.filter((e) => e.bag !== "worn" && !e.essential);
  const solves = (es: PackItem[]) => {
    const g = es.reduce((s, e) => s + e.item.weightG, 0);
    const c = es.filter((e) => e.bag === "carryOn").reduce((s, e) => s + e.item.volumeL, 0);
    const p = es.filter((e) => e.bag === "personal").reduce((s, e) => s + e.item.volumeL, 0);
    return g >= t.overG - 0.001 && c >= t.overCarryL - 0.001 && p >= t.overPersonalL - 0.001;
  };
  let best: PackItem[] = [];
  let score = Infinity;
  const check = (es: PackItem[]) => {
    if (!solves(es)) return;
    const value =
      es.reduce((s, e) => s + e.impact, 0) * 100 +
      es.length +
      es.reduce((s, e) => s + e.item.weightG, 0) / 100000;
    if (value < score) {
      best = es;
      score = value;
    }
  };
  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i];
    if (!a) continue;
    check([a]);
    for (let j = i + 1; j < candidates.length; j++) {
      const b = candidates[j];
      if (!b) continue;
      check([a, b]);
      for (let k = j + 1; k < candidates.length; k++) {
        const c = candidates[k];
        if (c) check([a, b, c]);
      }
    }
  }
  return (
    best.length
      ? best
      : candidates
          .sort((a, b) => a.impact - b.impact || b.item.weightG - a.item.weightG)
          .slice(0, 3)
  ).map((e) => e.item.id);
}
export function newStop(): Stop {
  return {
    id: crypto.randomUUID(),
    name: "",
    days: 3,
    climate: "Mild",
    rain: "none",
    coldNights: false,
    activities: ["city"],
  };
}
export function freshSample(): PackingTrip {
  return buildPackingTrip({
    id: "sample-trip",
    carryOnL: 40,
    personalL: 18,
    limitKg: 10,
    souvenirKg: 1,
    sample: true,
    stops: [
      {
        id: "ba",
        name: "Buenos Aires",
        days: 4,
        climate: "Mild",
        rain: "some",
        coldNights: false,
        activities: ["city", "dinner"],
      },
      {
        id: "at",
        name: "Atacama",
        days: 3,
        climate: "Warm",
        rain: "none",
        coldNights: true,
        activities: ["hiking"],
      },
      {
        id: "pa",
        name: "Patagonia",
        days: 2,
        climate: "Cool",
        rain: "some",
        coldNights: true,
        activities: ["hiking"],
      },
      {
        id: "sa",
        name: "Santiago",
        days: 2,
        climate: "Mild",
        rain: "none",
        coldNights: false,
        activities: ["city", "dinner"],
      },
    ],
  });
}

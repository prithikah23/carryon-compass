import { CATALOG, catalogItem } from "./catalog";
import type { Item, BagId } from "./types";
import type { ClimateResult } from "./climate";
export const CLIMATES = ["Hot", "Warm", "Mild", "Cool", "Freezing"] as const;
export type Climate = (typeof CLIMATES)[number];
export type PackingActivity = "city" | "hiking" | "beach" | "dinner";
export const LAUNDRY_OPTIONS = ["No washing", "Quick sink wash", "Laundry available"] as const;
export type LaundryOption = (typeof LAUNDRY_OPTIONS)[number];
export const PACKING_RULES_VERSION = 5;
export interface Stop {
  id: string;
  name: string;
  days: number;
  climate: Climate;
  rain: "none" | "some" | "lots";
  coldNights: boolean;
  activities: PackingActivity[];
  latitude?: number | undefined;
  longitude?: number | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  weather?: ClimateResult | undefined;
  manualClimateKey?: string | undefined;
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
  rulesVersion?: number;
  weightCheck?: boolean;
  laundry?: LaundryOption;
  startDate?: string;
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
  "Blouse",
  "Flip-flops",
  "Laptop",
];
const EXTRA_SYNONYMS: Record<string, string> = {
  "Hair straightener": "flat iron curler curling wand hair tool styling",
  "Makeup bag": "makeup cosmetics cosmetic pouch beauty",
  "Neck pillow": "travel pillow comfort flight",
  "Evening dress": "dress dinner outfit formal going out",
  "Jewelry case": "jewellery jewelry earrings necklace",
  "Going-out top": "fancy top blouse party dinner night out shirt",
  Heels: "shoes heels pumps dress shoes dinner footwear",
  "Baseball cap": "hat cap sun baseball",
  "Contact lenses": "contacts lenses solution eyes",
  "Laptop charger": "charger laptop cable power",
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
  extra("Going-out top", "top", 180, 0.6, "smart"),
  extra("Heels", "shoes", 500, 1.5, "smart"),
  extra("Baseball cap", "accessory", 90, 0.4),
  extra("Contact lenses", "toiletry", 200, 0.3),
  extra("Laptop charger", "tech", 250, 0.3),
];
export function addedItemReason(item: Item, trip: PackingTrip): string {
  const relevant = trip.stops.filter((s) =>
    item.category === "shoes" || item.category === "dress" || item.category === "top" || item.category === "bottom"
      ? s.activities.some((activity) => item.suitable.includes(activity))
      : true,
  );
  const stops = relevant.length ? relevant : trip.stops;
  return `Your chosen ${item.name.toLowerCase()} for ${stops.map((s) => s.name).join(" and ")} · ${trip.stops.reduce((sum, s) => sum + s.days, 0)} days`;
}
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
  limitKg: number | null;
  note: string;
};
/** Typical cabin allowances (economy). Estimates only — airlines change rules. */
export const AIRLINES: AirlinePreset[] = [
  { name: "Air Canada", carryOnL: 40, personalL: 18, limitKg: null, note: "Usually no carry-on weight limit; you must lift the bag unaided. Fare and route restrictions apply; check yours." },
  { name: "Delta", carryOnL: 45, personalL: 18, limitKg: null, note: "Usually no carry-on weight limit. Route exceptions and fare restrictions may apply; check yours." },
  { name: "American Airlines", carryOnL: 45, personalL: 18, limitKg: null, note: "Usually no carry-on weight limit. Route exceptions and fare restrictions may apply; check yours." },
  { name: "United", carryOnL: 45, personalL: 18, limitKg: null, note: "Usually no carry-on weight limit. Route exceptions and fare restrictions may apply; check yours." },
  { name: "British Airways", carryOnL: 45, personalL: 18, limitKg: 23, note: "Up to 23 kg per bag; you still have to lift it into the overhead bin." },
  { name: "Lufthansa", carryOnL: 40, personalL: 12, limitKg: 8, note: "8 kg for the carry-on in economy, often weighed at the gate." },
  { name: "Qatar Airways", carryOnL: 40, personalL: 12, limitKg: 7, note: "7 kg combined in economy, often weighed at check-in." },
  { name: "Emirates", carryOnL: 40, personalL: 12, limitKg: 7, note: "7 kg in economy, often weighed at check-in." },
  { name: "Singapore Airlines", carryOnL: 40, personalL: 12, limitKg: 7, note: "7 kg in economy, often weighed at check-in." },
  { name: "Ryanair", carryOnL: 40, personalL: 12, limitKg: 10, note: "10 kg carry-on with Priority; the free bag is a small 40×20×25 cm item." },
  { name: "easyJet", carryOnL: 40, personalL: 12, limitKg: 15, note: "Large cabin bag up to 15 kg with Up Front or Plus; free bag is under-seat only." },
];
export const souvenirVolume = (kg: number) => kg * 4;
/** Prefer essentials/tech near you, respect reserved space, and keep copies together. */
export function pickAddedItemBag(trip: PackingTrip, item: Item): BagId {
  const existing = trip.entries.find((e) => e.item.name === item.name && e.bag !== "worn");
  if (existing && existing.bag !== "worn") return existing.bag;
  const preferred: BagId = ["documents", "tech", "toiletry"].includes(item.category) ? "personal" : "carryOn";
  const alternate = preferred === "carryOn" ? "personal" : "carryOn";
  const fits = (bag: BagId) => trip.entries.filter((e) => e.bag === bag).reduce((sum, e) => sum + e.item.volumeL, 0) + item.volumeL + (bag === "carryOn" ? souvenirVolume(trip.souvenirKg) : 0) <= (bag === "carryOn" ? trip.carryOnL : trip.personalL);
  return fits(preferred) ? preferred : fits(alternate) ? alternate : preferred;
}
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
  const all = destinations(input.stops);
  const hiking = input.stops.filter((s) => s.activities.includes("hiking"));
  const dinner = input.stops.filter((s) => s.activities.includes("dinner"));
  const beach = input.stops.filter((s) => s.activities.includes("beach"));
  const city = input.stops.filter((s) => s.activities.includes("city"));
  const cold = input.stops.filter((s) => s.climate === "Cool" || s.climate === "Freezing" || s.coldNights);
  const freezing = input.stops.filter((s) => s.climate === "Freezing");
  const rain = input.stops.filter((s) => s.rain !== "none");
  const sun = input.stops.filter((s) => s.climate === "Hot" || s.climate === "Warm");
  const laundry = input.laundry ?? "Quick sink wash";
  const basics = laundry === "No washing" ? days : Math.min(laundry === "Quick sink wash" ? 5 : 7, days);
  const washReason = laundry === "No washing"
    ? `1 per day for ${days} days, no washing planned`
    : laundry === "Quick sink wash" ? "Sink-wash every few days" : "Laundry available · wash weekly";
  const dailyReason = `${washReason} · trip is ${days} days`;
  add("Underwear", dailyReason, basics, true, 5);
  add("Socks", dailyReason, basics, true, 5);
  // Dressier and long-sleeve tops share the laundry-dependent top allowance.
  const topCount = laundry === "No washing" ? days : Math.min(4, Math.ceil(days / 2));
  const thermalCount = freezing.length ? 1 : 0;
  const dressyCount = dinner.length && topCount > 1 ? 1 : 0;
  const layerCount = cold.length && topCount - dressyCount - thermalCount > 1 ? 1 : 0;
  const topReason = laundry === "No washing" ? washReason : `Worn 2 to 3 times · ${washReason} · ${days} days`;
  add("T-shirt", `${topReason} in ${all}`, Math.max(0, topCount - dressyCount - layerCount - thermalCount), false, 2);
  if (layerCount) add("Long-sleeve shirt", `Cool days or cold nights in ${destinations(cold)} · ${topReason}`, 1, false, 3);
  if (dressyCount) add("Linen shirt", `Dinner out in ${destinations(dinner)} · ${topReason}`, 1, false, 2);
  const bottomCap = laundry === "No washing" ? Math.max(2, Math.ceil(days / 3)) : 2;
  const bottomReason = laundry === "No washing" ? `1 per 3 days for ${days} days, no washing planned` : `Worn 2 to 3 times between washes · ${washReason}`;
  const addBottom = (name: string, reason: string, impact = 3) => {
    if (entries.filter((e) => e.item.category === "bottom").length < bottomCap)
      add(name, `${reason} · ${bottomReason}`, 1, false, impact);
  };
  if (hiking.length) addBottom("Hiking pants", `Hiking in ${destinations(hiking)}`);
  if (beach.length) addBottom("Shorts", `Beach days in ${destinations(beach)}`, 2);
  if (city.length || dinner.length) addBottom("Jeans", `City days${dinner.length ? " and dinner" : ""} in ${destinations(input.stops.filter((s) => s.activities.includes("city") || s.activities.includes("dinner")))}`);
  if (!hiking.length && !city.length && !dinner.length && !beach.length)
    addBottom("Jeans", `Everyday wear in ${all}`);
  // A second bottom is the personal-item backup, not a third daily outfit.
  if (entries.filter((e) => e.item.category === "bottom").length < 2)
    addBottom("Leggings", `Backup outfit for ${all} in case your carry-on is gate-checked`, 1);
  while (entries.filter((e) => e.item.category === "bottom").length < bottomCap)
    addBottom("Chinos", `Extra rotation for ${days} days in ${all}`, 2);
  add("Sleepwear", laundry === "No washing" ? `1 per 4 days for ${days} days, no washing planned in ${all}` : `Rotate over ${days} nights in ${all}`, laundry === "No washing" ? Math.max(1, Math.ceil(days / 4)) : days > 7 ? 2 : 1, true, 5);
  add("Toiletry kit", `Daily washing and grooming for ${days} days in ${all}`, 1, true, 5);
  add("Phone charger", `Phone charging on every leg: ${all}`, 1, true, 5);
  if (days >= 5) add("Power bank", `Backup phone power on travel days between ${all}`, 1, false, 3);
  add("Travel adapter", `Socket adapter for overnight stops in ${all}; check local plug types`, 1, false, 2);
  add("Passport", `Travel document for ${all} · keep it with you`, 1, true, 10);
  add("Wallet", `Money and cards for ${all} · keep them with you`, 1, true, 10);
  if (cold.length) {
    add("Fleece", `Cold nights or cool days in ${destinations(cold)}`, 1, false, 4);
    add("Puffer jacket", `Warm protection in ${destinations(cold)}`, 1, false, 4);
    add("Beanie", `Cold nights or cool days in ${destinations(cold)}`, 1, false, 2);
    add("Scarf", `Warmth in ${destinations(cold)}`, 1, false, 2);
  }
  if (freezing.length)
    for (const name of ["Thermal base layer", "Gloves"])
      add(name, `Freezing weather in ${destinations(freezing)}`, 1, false, 4);
  if (rain.length) add("Rain shell", `Rain protection in ${destinations(rain)}`, 1, false, 4);
  // Prioritize required activity footwear; the worn pair counts toward the cap.
  if (hiking.length) add("Trail runners", `Hiking in ${destinations(hiking)}`, 1, false, 4);
  if (city.length || (!hiking.length && !beach.length))
    add("Sneakers", `Walking in ${destinations(city.length ? city : input.stops)}`, 1, false, 3);
  if (beach.length) {
    add("Swimwear", `Beach days in ${destinations(beach)}`, 1, false, 2);
    add("Sandals", `Beach walking in ${destinations(beach)}`, 1, false, 2);
    add("Sunscreen", `Sun protection on beach days in ${destinations(beach)}`, 1, true, 4);
  }
  if (dinner.length) {
    add("Evening dress", `Dinner out in ${destinations(dinner)}`, 1, false, 1);
    if (entries.filter((e) => e.item.category === "shoes").length < 3)
      add("Heels", `Dinner out in ${destinations(dinner)}`, 1, false, 1);
  }
  if (sun.length || beach.length) {
    const sunnyStops = input.stops.filter((s) => sun.includes(s) || beach.includes(s));
    add("Sunglasses", `Bright days in ${destinations(sunnyStops)}`, 1, false, 2);
    add(hiking.length ? "Baseball cap" : "Sun hat", `Sun protection in ${destinations(sunnyStops)}`, 1, false, 2);
  }
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
    if (single) {
      single.bag = "personal";
      single.reason += " · Backup outfit in case your carry-on is gate-checked";
    }
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
  return { ...input, laundry, rulesVersion: PACKING_RULES_VERSION, entries };
}
/** Change laundry-dependent pieces only; retain other items and surviving checklist/bag edits. */
export function changeLaundry(trip: PackingTrip, laundry: LaundryOption): PackingTrip {
  const previous = buildPackingTrip(trip);
  const next = buildPackingTrip({ ...trip, laundry });
  const affected = (e: PackItem) => ["Underwear", "Socks", "Sleepwear"].includes(e.item.name) || ["top", "bottom"].includes(e.item.category);
  const names = new Set([...previous.entries, ...next.entries].filter(affected).map((e) => e.item.name));
  const entries = trip.entries.filter((e) => !names.has(e.item.name));
  const usedIds = new Set(trip.entries.map((e) => e.item.id));
  for (const name of names) {
    const current = trip.entries.filter((e) => e.item.name === name);
    const target = next.entries.filter((e) => e.item.name === name);
    // An explicitly removed group stays removed, rather than reappearing on a laundry change.
    if (!current.length && previous.entries.some((e) => e.item.name === name)) continue;
    for (let n = 0; n < target.length; n++) {
      const fresh = target[n];
      if (!fresh) continue;
      const saved = current[n];
      let id = `${trip.id}-laundry-${name}-${n}`;
      while (usedIds.has(id)) id += "-new";
      usedIds.add(id);
      entries.push(saved ? { ...saved, reason: fresh.reason } : { ...fresh, item: { ...fresh.item, id }, bag: current[0]?.bag ?? fresh.bag });
    }
  }
  return { ...trip, laundry, rulesVersion: PACKING_RULES_VERSION, entries };
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
    overG: trip.weightCheck === false ? 0 : Math.max(0, g + reserveG - trip.limitKg * 1000),
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
  ).sort((a, b) => b.item.weightG - a.item.weightG).map((e) => e.item.id);
}
export function laundryDifference(trip: PackingTrip) {
  const quick = changeLaundry(trip, "Quick sink wash");
  const weight = (t: PackingTrip) => t.entries.reduce((sum, e) => sum + e.item.weightG, 0);
  return { items: Math.max(0, trip.entries.length - quick.entries.length), weightG: Math.max(0, weight(trip) - weight(quick)) };
}
export type PackingFix = { kind: "remove" | "wear"; id: string; label: string; savedG: number } | { kind: "laundry"; label: string; savedG: number };
export function suggestedFixes(trip: PackingTrip): PackingFix[] {
  const t = totals(trip);
  if (!t.overG && !t.overCarryL && !t.overPersonalL) return [];
  const ids = suggestedRemovals(trip);
  const fixes: PackingFix[] = ids.flatMap((id) => {
    const e = trip.entries.find((entry) => entry.item.id === id);
    return e ? [{ kind: "remove" as const, id, label: `Remove ${e.item.name}`, savedG: e.item.weightG }] : [];
  });
  if ((trip.laundry ?? "Quick sink wash") !== "Quick sink wash") {
    const switched = totals(changeLaundry(trip, "Quick sink wash"));
    const savedG = t.usedG - switched.usedG;
    if (savedG > 0 && (switched.overG < t.overG || switched.overCarryL < t.overCarryL || switched.overPersonalL < t.overPersonalL))
      fixes.push({ kind: "laundry", label: "Switch to Quick sink wash", savedG });
  }
  for (const category of ["shoes", "outer"] as const) {
    const worn = trip.entries.filter((e) => e.bag === "worn" && e.item.category === category);
    if (worn.length >= (category === "shoes" ? 1 : 2)) continue;
    const heaviest = trip.entries.filter((e) => e.bag !== "worn" && e.item.category === category && e.item.name !== "Rain shell").sort((a, b) => b.item.weightG - a.item.weightG)[0];
    if (heaviest) fixes.push({ kind: "wear", id: heaviest.item.id, label: `Wear ${heaviest.item.name} on the plane`, savedG: heaviest.item.weightG });
  }
  return fixes.sort((a, b) => b.savedG - a.savedG);
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
    laundry: "Quick sink wash",
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
export interface OutfitIdea {
  title: string;
  where: string;
  pieces: string[];
}
/** Outfit ideas made only from items currently in the trip, one per stop/activity. */
export function outfitIdeas(trip: PackingTrip): OutfitIdea[] {
  const have = new Set(trip.entries.map((e) => e.item.name));
  const pick = (...opts: string[]) => opts.find((o) => have.has(o));
  const ideas: OutfitIdea[] = [];
  const push = (title: string, where: string, pieces: (string | undefined)[]) => {
    const p = pieces.filter((x): x is string => !!x);
    if (p.length >= 2 && !ideas.some((i) => i.title === title && i.where === where)) ideas.push({ title, where, pieces: p });
  };
  for (const s of trip.stops) {
    const where = s.name || "Your trip";
    const cold = s.coldNights || s.climate === "Cool" || s.climate === "Freezing";
    if (s.activities.includes("city"))
      push("Day in the city", where, [pick("T-shirt"), pick("Jeans", "Chinos", "Leggings"), pick("Sneakers"), s.rain !== "none" ? pick("Rain shell") : pick("Sunglasses")]);
    if (s.activities.includes("hiking"))
      push("Hiking day", where, [pick("T-shirt", "Long-sleeve shirt"), pick("Hiking pants", "Leggings"), pick("Trail runners", "Sneakers"), s.rain !== "none" ? pick("Rain shell") : pick("Baseball cap", "Sun hat"), cold ? pick("Fleece") : undefined]);
    if (s.activities.includes("dinner"))
      push("Dinner out", where, [pick("Evening dress") ?? pick("Going-out top", "Linen shirt"), have.has("Evening dress") ? undefined : pick("Jeans", "Chinos"), pick("Heels", "Sneakers"), cold ? pick("Scarf") : undefined]);
    if (s.activities.includes("beach"))
      push("Beach day", where, [pick("Swimwear"), pick("Shorts", "Linen shirt", "T-shirt"), pick("Sandals", "Flip-flops"), pick("Sun hat", "Sunglasses")]);
    if (cold)
      push("Cold evening", where, [pick("Thermal base layer", "Long-sleeve shirt", "T-shirt"), pick("Fleece"), pick("Puffer jacket"), pick("Beanie"), pick("Jeans", "Hiking pants")]);
  }
  return ideas.slice(0, 6);
}

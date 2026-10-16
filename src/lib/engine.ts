import type { Activity, BagId, Item, Leg, Trip } from "./types";
import { bagLabel, otherBag } from "./types";
import { addDays, fmtVolume, fmtWeight, listJoin, parseDate } from "./format";

/* ------------------------------------------------------------------ */
/* Days                                                                */
/* ------------------------------------------------------------------ */

export interface Day {
  date: string;
  index: number;
  leg: Leg;
  legIndex: number;
  focus: Activity;
  travel: boolean;
  chilly: boolean; // low <= 12
  cold: boolean; // low <= 5
  freezing: boolean; // low <= 3
  rainy: boolean;
  warm: boolean; // high >= 22
  sunny: boolean;
}

const FOCUS_ORDER: Activity[] = ["business", "dinner", "hiking", "beach", "city"];

export function legFocus(leg: Leg): Activity {
  for (const a of FOCUS_ORDER) if (leg.activities.includes(a)) return a;
  return "city";
}

export function sortedLegs(legs: Leg[]): Leg[] {
  return [...legs].sort((a, b) => parseDate(a.start) - parseDate(b.start));
}

export function expandDays(legs: Leg[]): Day[] {
  const days: Day[] = [];
  sortedLegs(legs).forEach((leg, legIndex) => {
    const n = Math.round((parseDate(leg.end) - parseDate(leg.start)) / 86400000);
    for (let i = 0; i <= Math.min(n, 120); i++) {
      days.push({
        date: addDays(leg.start, i),
        index: days.length,
        leg,
        legIndex,
        focus: legFocus(leg),
        travel: i === 0,
        chilly: leg.low <= 12,
        cold: leg.low <= 5,
        freezing: leg.low <= 3,
        rainy: leg.rain !== "none" || leg.activities.includes("rain"),
        warm: leg.high >= 22,
        sunny: leg.high >= 22 && leg.rain === "none",
      });
    }
  });
  const lastDay = days[days.length - 1];
  if (lastDay) lastDay.travel = true;
  return days;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const WARMTH_RANK = { light: 0, medium: 1, warm: 2 } as const;
const CLOTHING = new Set(["top", "bottom", "dress", "outer", "shoes", "accessory"]);
const ESSENTIAL = new Set(["basics", "toiletry", "tech", "documents"]);

export const isClothing = (i: Item) => CLOTHING.has(i.category);
export const isEssential = (i: Item) => ESSENTIAL.has(i.category);
const isBaseLayer = (i: Item) => i.category === "top" && i.suitable.includes("cold nights") && i.warmth !== "light";

function fits(item: Item, day: Day): boolean {
  if (item.warmth === "light" && (item.category === "bottom" || item.category === "shoes") && !day.warm) return false;
  return item.suitable.includes(day.focus);
}

function layerFits(item: Item, day: Day): boolean {
  return item.suitable.includes(day.focus) || item.suitable.includes("cold nights");
}

const byOrder = (items: Item[]) => {
  const order = new Map(items.map((it, i) => [it.id, i]));
  return (a: Item, b: Item) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
};

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

type Role = "outfit" | "base" | "mid" | "warm" | "rain" | "coldAcc" | "sunAcc" | "essential" | "added";

function capacity(item: Item, nDays: number, laundry: boolean) {
  if (!laundry) return item.maxWears;
  return item.maxWears * Math.max(1, Math.ceil(nDays / 4));
}

function greedyCover(
  candidates: Item[],
  days: Day[],
  needs: (day: Day) => boolean,
  ok: (item: Item, day: Day) => boolean,
  cap: (item: Item) => number,
): Item[] {
  const remaining = new Set(days.filter(needs).map((d) => d.index));
  const picked: Item[] = [];
  const pool = [...candidates];
  while (remaining.size && pool.length) {
    let best: Item | null = null;
    let bestGain = 0;
    let bestScore = -1;
    for (const it of pool) {
      let gain = 0;
      for (const d of days) {
        if (gain >= cap(it)) break;
        if (remaining.has(d.index) && ok(it, d)) gain++;
      }
      const score = gain / Math.max(it.weightG, 1);
      if (gain > 0 && score > bestScore) {
        best = it;
        bestGain = gain;
        bestScore = score;
      }
    }
    if (!best || bestGain === 0) break;
    let used = 0;
    for (const d of days) {
      if (used >= cap(best)) break;
      if (remaining.has(d.index) && ok(best, d)) {
        remaining.delete(d.index);
        used++;
      }
    }
    picked.push(best);
    pool.splice(pool.indexOf(best), 1);
  }
  return picked;
}

function recommend(items: Item[], days: Day[], trip: Trip): Map<string, Role> {
  const roles = new Map<string, Role>();
  if (!days.length) return roles;
  const n = days.length;
  const cap = (it: Item) => capacity(it, n, trip.laundry);
  const sorted = [...items];

  for (const it of sorted) if (isEssential(it)) roles.set(it.id, "essential");

  // Tops + bottoms + dresses: cover every day's outfit for its focus activity.
  const tops = sorted.filter((i) => i.category === "top" && !isBaseLayer(i));
  const bottoms = sorted.filter((i) => i.category === "bottom");
  const dresses = sorted.filter((i) => i.category === "dress");
  const topNeed = new Set(days.map((d) => d.index));
  const bottomNeed = new Set(days.map((d) => d.index));
  // Dresses first only where they are lighter than a top + bottom pair.
  for (const dress of greedyCover(dresses, days, () => true, fits, cap)) {
    let used = 0;
    for (const d of days) {
      if (used >= cap(dress)) break;
      if (fits(dress, d) && d.focus !== "hiking" && topNeed.has(d.index)) {
        topNeed.delete(d.index);
        bottomNeed.delete(d.index);
        used++;
      }
    }
    if (used) roles.set(dress.id, "outfit");
  }
  const allTops = tops.length ? tops : sorted.filter((i) => i.category === "top");
  for (const it of greedyCover(allTops, days, (d) => topNeed.has(d.index), fits, cap)) roles.set(it.id, "outfit");
  for (const it of greedyCover(bottoms, days, (d) => bottomNeed.has(d.index), fits, cap)) roles.set(it.id, "outfit");

  const shoes = sorted.filter((i) => i.category === "shoes");
  for (const it of greedyCover(shoes, days, () => true, fits, () => 999)) roles.set(it.id, "outfit");

  const outers = sorted.filter((i) => i.category === "outer");
  if (days.some((d) => d.cold)) {
    const base = sorted.filter(isBaseLayer).sort((a, b) => a.weightG - b.weightG)[0];
    if (base) roles.set(base.id, "base");
  }
  const mids = outers.filter((i) => i.warmth === "medium");
  for (const it of greedyCover(mids, days, (d) => d.chilly, (i, d) => i.suitable.includes(d.focus), () => 999))
    roles.set(it.id, "mid");
  if (!days.some((d) => d.chilly) || ![...roles.values()].includes("mid")) {
    const fallback = mids.filter((i) => days.some((d) => d.chilly && layerFits(i, d))).sort((a, b) => a.weightG - b.weightG)[0];
    if (fallback && days.some((d) => d.chilly)) roles.set(fallback.id, "mid");
  }
  const warms = outers.filter((i) => i.warmth === "warm");
  for (const it of greedyCover(warms, days, (d) => d.freezing, layerFits, () => 999)) roles.set(it.id, "warm");
  const rains = outers.filter((i) => i.suitable.includes("rain"));
  if (days.some((d) => d.rainy) && !rains.some((r) => roles.has(r.id))) {
    const r = rains.sort((a, b) => a.weightG - b.weightG)[0];
    if (r) roles.set(r.id, "rain");
  }

  const accs = sorted.filter((i) => i.category === "accessory");
  if (days.some((d) => d.freezing))
    for (const a of accs) if (a.warmth === "warm" && a.suitable.includes("cold nights")) roles.set(a.id, "coldAcc");
  for (const a of accs)
    if (a.warmth === "light" && days.some((d) => d.sunny && a.suitable.includes(d.focus))) roles.set(a.id, "sunAcc");

  return roles;
}

/* ------------------------------------------------------------------ */
/* Outfits                                                             */
/* ------------------------------------------------------------------ */

export interface OutfitPiece {
  slot: string;
  itemId: string;
  swapped?: boolean;
}

export interface DayOutfit {
  day: Day;
  pieces: OutfitPiece[];
}

function buildOutfits(packed: Item[], days: Day[], trip: Trip, planeIds: Set<string>): DayOutfit[] {
  const wears = new Map<string, number>();
  const w = (i: Item) => wears.get(i.id) ?? 0;
  const ord = byOrder(packed);
  const pick = (cands: Item[], day: Day, formal = false): Item | undefined => {
    if (!cands.length) return undefined;
    const score = (i: Item) => {
      let s = 0;
      if (!fits(i, day)) s += 1000;
      if (w(i) >= capacity(i, days.length, trip.laundry)) s += 100;
      if (formal && i.formality === "casual") s += 3;
      return s + w(i) * 2;
    };
    return [...cands].sort((a, b) => score(a) - score(b) || ord(a, b))[0];
  };
  const of = (cat: string) => packed.filter((i) => i.category === cat);
  const out: DayOutfit[] = [];

  for (const day of days) {
    if (trip.laundry && day.index > 0 && day.index % 4 === 0) wears.clear();
    const formal = day.focus === "dinner" || day.focus === "business";
    const pieces: OutfitPiece[] = [];
    const chosen = new Set<string>();
    const add = (slot: string, it?: Item) => {
      if (!it || chosen.has(it.id)) return;
      chosen.add(it.id);
      pieces.push({ slot, itemId: it.id });
    };

    const nonBaseTops = of("top").filter((i) => !isBaseLayer(i));
    const top = pick(nonBaseTops.length ? nonBaseTops : of("top"), day, formal);
    const bottom = pick(of("bottom"), day, formal);
    const dress = pick(of("dress"), day, formal);
    const dressOk = dress && fits(dress, day) && w(dress) < capacity(dress, days.length, trip.laundry);
    const pairOk = top && bottom && fits(top, day) && fits(bottom, day);
    if (dress && dressOk && (formal || !pairOk) && (!pairOk || w(dress) <= Math.min(w(top!), w(bottom!)))) {
      add("dress", dress);
    } else {
      add("top", top);
      add("bottom", bottom ?? (top ? undefined : dress));
    }

    const plane = day.travel && trip.wearHeaviest;
    if (day.cold) add("layer", pick(of("top").filter(isBaseLayer), day));
    const outers = of("outer");
    if (day.chilly) add("layer", [...outers.filter((i) => i.warmth === "medium")].sort((a, b) => (fits(a, day) ? 0 : 1) - (fits(b, day) ? 0 : 1) || w(a) - w(b) || ord(a, b))[0]);
    if (day.freezing) add("layer", outers.filter((i) => i.warmth === "warm").sort(ord)[0]);
    if (day.rainy) add("layer", outers.filter((i) => i.suitable.includes("rain")).sort((a, b) => a.weightG - b.weightG)[0]);
    if (plane) for (const id of planeIds) {
      const it = packed.find((p) => p.id === id);
      if (it && it.category !== "shoes") add("layer", it);
    }

    const planeShoe = plane ? packed.find((p) => planeIds.has(p.id) && p.category === "shoes") : undefined;
    add("shoes", planeShoe ?? pick(of("shoes"), day));

    for (const a of of("accessory")) {
      if (day.freezing && a.warmth === "warm" && a.suitable.includes("cold nights")) add("accessory", a);
      else if (day.sunny && a.warmth === "light" && a.suitable.includes(day.focus)) add("accessory", a);
    }

    // apply swaps
    const counts: Record<string, number> = {};
    for (const p of pieces) {
      counts[p.slot] = (counts[p.slot] ?? 0) + 1;
      const key = `${day.date}|${p.slot}|${counts[p.slot]}`;
      const sw = trip.overrides.outfitSwaps[key];
      if (sw && packed.some((i) => i.id === sw)) {
        p.itemId = sw;
        p.swapped = true;
      }
    }
    for (const p of pieces) wears.set(p.itemId, (wears.get(p.itemId) ?? 0) + 1);
    out.push({ day, pieces });
  }
  return out;
}

export function swapKey(date: string, pieces: OutfitPiece[], index: number) {
  const slot = pieces[index].slot;
  const nth = pieces.slice(0, index + 1).filter((p) => p.slot === slot).length;
  return `${date}|${slot}|${nth}`;
}

/* ------------------------------------------------------------------ */
/* Plan                                                                */
/* ------------------------------------------------------------------ */

export interface PackedEntry {
  item: Item;
  bag: BagId | "worn";
  reason: string;
  bagReason?: string | undefined;
  usage: number;
  added: boolean;
}

export interface Meter {
  label: string;
  used: number;
  reserve: number;
  limit: number | null;
  over: number; // >0 when over
  status: "fits" | "close" | "over" | "none";
  unit: "g" | "L";
}

export interface BagSummary {
  bag: BagId;
  weightG: number;
  volumeL: number;
  weight: Meter;
  volume: Meter;
}

export interface Fix {
  id: string;
  text: string;
  saves: number;
  action: { type: "remove"; itemId: string } | { type: "move"; itemId: string; to: BagId } | { type: "wearOn" };
}

export interface GateCheck {
  label: string;
  covered: boolean;
  fix?: string;
  action?: { itemId: string };
}

export interface Plan {
  days: Day[];
  entries: PackedEntry[];
  outfits: DayOutfit[];
  bags: Record<BagId, BagSummary>;
  combined: Meter | null;
  planeSavedG: number;
  verdict: { ok: boolean; text: string };
  fixes: Fix[];
  gate: GateCheck[];
  liquids: { items: Item[]; totalMl: number; oversize: Item[] };
  usage: Map<string, number>;
  modified: boolean;
}

function meter(label: string, used: number, reserve: number, limit: number | null, unit: "g" | "L"): Meter {
  if (limit == null || limit <= 0) return { label, used, reserve, limit: null, over: 0, status: "none", unit };
  const over = used + reserve - limit;
  const status = over > 0.0001 ? "over" : limit - used - reserve <= limit * 0.1 ? "close" : "fits";
  return { label, used, reserve, limit, over: Math.max(0, over), status, unit };
}

export function meterText(m: Meter): string {
  const f = m.unit === "g" ? fmtWeight : fmtVolume;
  if (m.status === "over") return `Over by ${f(m.over)}`;
  if (m.status === "close") return `Close to limit · ${f(Math.max(0, (m.limit ?? 0) - m.used - m.reserve))} left`;
  if (m.status === "fits") return `Fits · ${f((m.limit ?? 0) - m.used - m.reserve)} left`;
  return "No limit";
}

function legNames(days: Day[]): string[] {
  return [...new Set(days.map((d) => d.leg.destination || "this leg"))];
}

export function computePlan(trip: Trip, wardrobe: Item[]): Plan {
  const days = expandDays(trip.legs);
  const roles = recommend(wardrobe, days, trip);
  const ov = trip.overrides;
  for (const id of ov.removed) roles.delete(id);
  for (const id of ov.added) if (!roles.has(id) && wardrobe.some((w) => w.id === id)) roles.set(id, "added");
  const packed = wardrobe.filter((i) => roles.has(i.id));

  // Wear on the plane
  const planeIds = new Set<string>();
  if (trip.wearHeaviest && days.length) {
    const shoe = packed.filter((i) => i.category === "shoes").sort((a, b) => b.weightG - a.weightG)[0];
    if (shoe) planeIds.add(shoe.id);
    const outs = packed.filter((i) => i.category === "outer" && !i.suitable.includes("rain")).sort((a, b) => b.weightG - a.weightG);
    if (outs[0]) planeIds.add(outs[0].id);
    const layer = packed
      .filter((i) => !planeIds.has(i.id) && (i.category === "outer" || isBaseLayer(i)) && !i.suitable.includes("rain"))
      .sort((a, b) => WARMTH_RANK[b.warmth] - WARMTH_RANK[a.warmth] || b.weightG - a.weightG)[0];
    if (layer) planeIds.add(layer.id);
  }

  const outfits = buildOutfits(packed, days, trip, planeIds);
  const usage = new Map<string, number>();
  const usageDays = new Map<string, Day[]>();
  for (const o of outfits)
    for (const p of o.pieces) {
      usage.set(p.itemId, (usage.get(p.itemId) ?? 0) + 1);
      usageDays.set(p.itemId, [...(usageDays.get(p.itemId) ?? []), o.day]);
    }

  // Bag assignment
  const bag = new Map<string, BagId>();
  const bagReason = new Map<string, string>();
  const nonWorn = packed.filter((i) => !planeIds.has(i.id));
  for (const it of nonWorn) bag.set(it.id, "carryOn");
  const toPersonal = (it: Item | undefined, why: string) => {
    if (!it) return;
    bag.set(it.id, "personal");
    bagReason.set(it.id, why);
  };
  for (const it of nonWorn) {
    if (it.category === "toiletry") toPersonal(it, it.liquid ? "Easy to pull out at security" : "Gate-check backup");
    if (it.category === "tech") toPersonal(it, "Chargers stay with you");
    if (it.category === "documents") toPersonal(it, "Valuables stay with you");
    if (it.category === "basics") toPersonal(it, "Gate-check backup");
  }
  const gateTop = nonWorn.filter((i) => i.category === "top").sort((a, b) => a.weightG - b.weightG)[0];
  toPersonal(gateTop, "Gate-check backup top");
  const planeLayer = nonWorn.filter((i) => i.category === "outer").sort((a, b) => a.weightG - b.weightG)[0];
  toPersonal(planeLayer, "Light layer for the plane");
  const personalCap = trip.personalL - (trip.souvenirBag === "personal" ? trip.souvenirL : 0);
  const personalVol = () => nonWorn.filter((i) => bag.get(i.id) === "personal").reduce((s, i) => s + i.volumeL, 0);
  for (const it of [planeLayer, gateTop, ...nonWorn.filter((i) => i.category === "basics")]) {
    if (!it || personalVol() <= personalCap) break;
    bag.set(it.id, "carryOn");
    bagReason.set(it.id, "Moved to carry-on because the personal item was full");
  }
  for (const [id, b] of Object.entries(ov.bagMoves)) {
    if (bag.has(id)) {
      bag.set(id, b);
      bagReason.set(id, "Moved by you");
    }
  }

  // Reasons
  const reasonFor = (it: Item): string => {
    const role = roles.get(it.id);
    const ud = usageDays.get(it.id) ?? [];
    const legs = legNames(ud);
    const u = ud.length;
    if (role === "added") return u ? `Added by you · used in ${u} outfit${u === 1 ? "" : "s"}` : "Added by you · not used in any outfit yet";
    if (planeIds.has(it.id)) return `Wear on travel days · saves ${fmtWeight(it.weightG)} in your bags${u ? `, used ${u}×` : ""}`;
    switch (role) {
      case "essential":
        if (it.category === "basics") return `Basics for all ${days.length} days${trip.laundry ? " with laundry" : ""}`;
        if (it.category === "toiletry") return it.liquid ? `Daily essential · ${it.containerMl} mL` : "Daily essential";
        if (it.category === "tech") return "Keeps your phone charged between legs";
        return "Passport and money · keep it on you";
      case "base":
        return `Base layer for cold nights in ${listJoin(legNames(days.filter((d) => d.cold)))}`;
      case "warm":
        return `Warm layer for ${listJoin(legNames(days.filter((d) => d.freezing)))} nights`;
      case "rain":
        return `Rain protection in ${listJoin(legNames(days.filter((d) => d.rainy)))}`;
      case "mid":
        return legs.length > 1 ? `Reused as a layer in ${listJoin(legs)}` : `Layer for chilly days in ${listJoin(legs.length ? legs : legNames(days.filter((d) => d.chilly)))}`;
      case "coldAcc":
        return `Keeps you warm in ${listJoin(legNames(days.filter((d) => d.freezing)))}`;
      case "sunAcc":
        return `Sun protection in ${listJoin(legNames(days.filter((d) => d.sunny)))}`;
      default:
        if (!u) return "Backup piece";
        return legs.length > 1 ? `Covers ${u} outfit${u === 1 ? "" : "s"} across ${legs.length} legs` : `Covers ${u} outfit${u === 1 ? "" : "s"} in ${legs[0]}`;
    }
  };

  const entries: PackedEntry[] = packed.map((it) => ({
    item: it,
    bag: planeIds.has(it.id) ? "worn" : (bag.get(it.id) ?? "carryOn"),
    reason: reasonFor(it),
    bagReason: planeIds.has(it.id) ? "Worn on the plane" : bagReason.get(it.id),
    usage: usage.get(it.id) ?? 0,
    added: roles.get(it.id) === "added",
  }));

  // Totals
  const sum = (b: BagId, key: "weightG" | "volumeL") =>
    entries.filter((e) => e.bag === b).reduce((s, e) => s + e.item[key], 0);
  const mk = (b: BagId): BagSummary => {
    const emptyG = (b === "carryOn" ? trip.carryOnEmptyKg : trip.personalEmptyKg) * 1000;
    const weightG = sum(b, "weightG") + emptyG;
    const volumeL = sum(b, "volumeL");
    const resG = trip.souvenirBag === b ? trip.souvenirKg * 1000 : 0;
    const resL = trip.souvenirBag === b ? trip.souvenirL : 0;
    const wLimit = trip.limitType === "separate" ? (b === "carryOn" ? trip.carryOnKg : trip.personalKg) * 1000 : null;
    return {
      bag: b,
      weightG,
      volumeL,
      weight: meter(`${bagLabel(b)} weight`, weightG, resG, wLimit, "g"),
      volume: meter(`${bagLabel(b)} space`, volumeL, resL, b === "carryOn" ? trip.carryOnL : trip.personalL, "L"),
    };
  };
  const bags = { carryOn: mk("carryOn"), personal: mk("personal") };
  const combined =
    trip.limitType === "combined"
      ? meter("Combined weight", bags.carryOn.weightG + bags.personal.weightG, trip.souvenirKg * 1000, trip.combinedKg * 1000, "g")
      : null;
  const planeSavedG = entries.filter((e) => e.bag === "worn").reduce((s, e) => s + e.item.weightG, 0);

  // Fixes
  const fixes: Fix[] = [];
  const weightMeters: { m: Meter; bag?: BagId }[] = combined
    ? [{ m: combined }]
    : trip.limitType === "separate"
      ? [{ m: bags.carryOn.weight, bag: "carryOn" }, { m: bags.personal.weight, bag: "personal" }]
      : [];
  const removable = entries.filter((e) => e.bag !== "worn" && isClothing(e.item));
  const usedLabel = (e: PackedEntry) =>
    e.usage === 0 ? "not used in any outfit" : e.usage <= 2 ? `used in only ${e.usage} outfit${e.usage === 1 ? "" : "s"}` : `used in ${e.usage} outfits`;
  const addRemoveFixes = (inBag: BagId | undefined, key: "weightG" | "volumeL") => {
    const cands = removable
      .filter((e) => !inBag || e.bag === inBag)
      .sort((a, b) => a.usage - b.usage || b.item[key] - a.item[key])
      .slice(0, 3);
    for (const e of cands) {
      const amt = key === "weightG" ? fmtWeight(e.item.weightG) : fmtVolume(e.item.volumeL);
      fixes.push({
        id: `rm-${e.item.id}`,
        text: `Remove the ${e.item.name.toLowerCase()} to ${key === "weightG" ? "save" : "free"} ${amt} (${usedLabel(e)})`,
        saves: e.item[key],
        action: { type: "remove", itemId: e.item.id },
      });
    }
  };
  const addMoveFixes = (from: BagId, key: "weightG" | "volumeL", over: number) => {
    const to = otherBag(from);
    const room = key === "weightG" ? (bags[to].weight.limit ?? Infinity) - bags[to].weight.used - bags[to].weight.reserve : (bags[to].volume.limit ?? 0) - bags[to].volume.used - bags[to].volume.reserve;
    const cands = entries
      .filter((e) => e.bag === from && e.item[key] <= room)
      .sort((a, b) => Math.abs(a.item[key] - over) - Math.abs(b.item[key] - over))
      .slice(0, 2);
    for (const e of cands)
      fixes.push({
        id: `mv-${e.item.id}`,
        text: `Move the ${e.item.name.toLowerCase()} to your ${bagLabel(to).toLowerCase()} (${key === "weightG" ? fmtWeight(e.item.weightG) : fmtVolume(e.item.volumeL)})`,
        saves: e.item[key],
        action: { type: "move", itemId: e.item.id, to },
      });
  };
  let overText = "";
  for (const { m, bag: b } of weightMeters) {
    if (m.status !== "over") continue;
    overText ||= `You're ${fmtWeight(m.over)} over`;
    if (!trip.wearHeaviest)
      fixes.push({ id: "wear", text: "Turn on “Wear heaviest items on travel days” to take shoes and jackets out of your bags", saves: 1000, action: { type: "wearOn" } });
    if (b) addMoveFixes(b, "weightG", m.over);
    addRemoveFixes(b, "weightG");
  }
  for (const b of ["carryOn", "personal"] as BagId[]) {
    const m = bags[b].volume;
    if (m.status !== "over") continue;
    overText ||= `Your ${bagLabel(b).toLowerCase()} is ${fmtVolume(m.over)} too full`;
    addMoveFixes(b, "volumeL", m.over);
    addRemoveFixes(b, "volumeL");
  }
  const seen = new Set<string>();
  const ranked = fixes.filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true))).sort((a, b) => b.saves - a.saves).slice(0, 4);

  let verdict: Plan["verdict"];
  if (!days.length) verdict = { ok: false, text: "Add at least one leg to your trip to see if your bags fit." };
  else if (!packed.length) verdict = { ok: false, text: "Your wardrobe is empty. Add clothes to get a packing list." };
  else if (overText) verdict = { ok: false, text: `${overText}. Here ${ranked.length === 1 ? "is 1 easy fix" : `are ${ranked.length} easy fixes`}.` };
  else {
    const spareW = weightMeters.length ? Math.min(...weightMeters.map((x) => (x.m.limit ?? 0) - x.m.used - x.m.reserve)) : null;
    const spareL = Math.min(...(["carryOn", "personal"] as BagId[]).map((b) => (bags[b].volume.limit ?? 0) - bags[b].volume.used - bags[b].volume.reserve));
    verdict = { ok: true, text: spareW != null ? `Your bags fit, with ${fmtWeight(spareW)} to spare` : `Your bags fit, with ${fmtVolume(spareL)} of space to spare` };
  }

  // Gate-check backup
  const inPersonal = entries.filter((e) => e.bag === "personal");
  const inCarry = entries.filter((e) => e.bag === "carryOn");
  const checks: { label: string; test: (i: Item) => boolean; noun: string }[] = [
    { label: "One top", test: (i) => i.category === "top" || i.category === "dress", noun: "1 top" },
    { label: "Underwear", test: (i) => i.category === "basics" && /underwear|briefs|knicker/i.test(i.name), noun: "underwear" },
    { label: "Socks", test: (i) => i.category === "basics" && /sock/i.test(i.name), noun: "socks" },
    { label: "Toiletries", test: (i) => i.category === "toiletry", noun: "your toiletries" },
    { label: "Chargers", test: (i) => i.category === "tech", noun: "a charger" },
    { label: "Medication or valuables", test: (i) => i.category === "documents", noun: "your valuables" },
  ];
  const gate: GateCheck[] = checks.map((c) => {
    if (inPersonal.some((e) => c.test(e.item))) return { label: c.label, covered: true };
    const cand = inCarry.filter((e) => c.test(e.item)).sort((a, b) => a.item.weightG - b.item.weightG)[0];
    if (cand) return { label: c.label, covered: false, fix: `Add ${c.noun} to your personal item (${cand.item.name}, ${fmtWeight(cand.item.weightG)})`, action: { itemId: cand.item.id } };
    return { label: c.label, covered: false, fix: `Nothing like this is packed. Add ${c.noun} to your packing list.` };
  });

  const liquidItems = entries.filter((e) => e.item.category === "toiletry" && e.item.liquid).map((e) => e.item);
  const liquids = {
    items: liquidItems,
    totalMl: liquidItems.reduce((s, i) => s + (i.containerMl ?? 0), 0),
    oversize: liquidItems.filter((i) => (i.containerMl ?? 0) > 100),
  };

  const modified = ov.added.length + ov.removed.length + Object.keys(ov.bagMoves).length + Object.keys(ov.outfitSwaps).length > 0;

  return { days, entries, outfits, bags, combined, planeSavedG, verdict, fixes: ranked, gate, liquids, usage, modified };
}

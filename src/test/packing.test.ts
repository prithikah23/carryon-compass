import { describe, it, expect } from "vitest";
import {
  freshSample,
  totals,
  suggestedRemovals,
  findItems,
  TRAVEL_CATALOG,
  buildPackingTrip,
  outfitIdeas,
  changeLaundry,
  suggestedFixes,
  laundryDifference,
  type LaundryOption,
} from "@/lib/packing";
describe("Fresh packing journey rules", () => {
  it("has the expanded travel catalog and synonym search", () => {
    expect(TRAVEL_CATALOG).toHaveLength(52);
    expect(findItems("jacket").map((i) => i.name)).toEqual(
      expect.arrayContaining(["Fleece", "Puffer jacket", "Rain shell"]),
    );
  });
  it("scales basics and reuses layers across the sample stops", () => {
    const trip = freshSample();
    expect(trip.entries.filter((e) => e.item.name === "Underwear")).toHaveLength(5);
    expect(trip.entries.filter((e) => e.item.name === "Socks")).toHaveLength(5);
    expect(trip.entries.filter((e) => e.item.name === "Sleepwear")).toHaveLength(2);
    expect(totals(trip).overG).toBe(0);
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(4);
    expect(trip.entries.filter((e) => e.item.name === "Fleece")).toHaveLength(1);
    expect(trip.entries.find((e) => e.item.name === "Fleece")?.reason).toContain(
      "Atacama and Patagonia",
    );
    expect(totals(trip).overG).toBe(0);
  });
  it("excludes worn weight and accounts for the reserve in both directions", () => {
    const trip = freshSample();
    const a = totals(trip),
      b = totals(trip, true);
    expect(b.usedG - a.usedG).toBe(1000);
    expect(a.overG).toBe(b.overG);
    expect(a.wornG).toBeGreaterThan(0);
    expect(a.usedG + a.wornG).toBe(trip.entries.reduce((s, e) => s + e.item.weightG, 0));
  });
  it("protects essentials and suggests at most three meaningful removals", () => {
    const trip = freshSample();
    trip.limitKg = totals(trip).usedG / 1000 + trip.souvenirKg - 0.2;
    const ids = suggestedRemovals(trip);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.length).toBeLessThanOrEqual(3);
    expect(
      trip.entries
        .filter((e) => ids.includes(e.item.id))
        .every((e) => !e.essential && e.bag !== "worn"),
    ).toBe(true);
    trip.entries = trip.entries.filter((e) => !ids.includes(e.item.id));
    expect(totals(trip).overG).toBe(0);
  });
  it("adds beach needs without cold layers on a short hot trip", () => {
    const trip = buildPackingTrip({
      ...freshSample(),
      id: "beach",
      stops: [
        {
          id: "one",
          name: "Beach",
          days: 2,
          climate: "Hot",
          rain: "none",
          coldNights: false,
          activities: ["beach"],
        },
      ],
    });
    expect(trip.entries.some((e) => e.item.name === "Swimwear")).toBe(true);
    expect(trip.entries.some((e) => e.item.name === "Puffer jacket")).toBe(false);
    expect(trip.entries.filter((e) => e.item.name === "Underwear")).toHaveLength(2);
  });
  it("defaults the 11-day sample to five sink-washed basics", () => {
    const trip = freshSample();
    for (const name of ["Underwear", "Socks"]) {
      const entries = trip.entries.filter((e) => e.item.name === name);
      expect(entries).toHaveLength(5);
      expect(entries[0]?.reason).toContain("Sink-wash every few days");
      expect(entries[0]?.reason).toContain("trip is 11 days");
    }
    expect(trip.laundry).toBe("Quick sink wash");
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(4);
  });
  it("keeps at most three shoe pairs even when all activities are selected", () => {
    const sample = freshSample();
    const trip = buildPackingTrip({ ...sample, stops: sample.stops.map((s) => ({ ...s, activities: ["city", "hiking", "beach", "dinner"] })) });
    const shoes = trip.entries.filter((e) => e.item.category === "shoes");
    expect(shoes).toHaveLength(3);
    expect(shoes.filter((e) => e.bag === "worn")).toHaveLength(1);
    expect(shoes.map((e) => e.item.name)).toEqual(["Trail runners", "Sneakers", "Sandals"]);
  });
  it("includes the freezing-weather base layer within the four-top cap", () => {
    const sample = freshSample();
    const trip = buildPackingTrip({ ...sample, stops: sample.stops.map((s) => ({ ...s, climate: "Freezing" })) });
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(4);
    expect(trip.entries.some((e) => e.item.name === "Thermal base layer")).toBe(true);
  });
  it("does not recommend beach or optional personal items without a matching need", () => {
    const trip = freshSample();
    for (const name of ["Flip-flops", "Swimwear", "Sandals", "Sunscreen", "Laptop", "Laptop charger", "Contact lenses"])
      expect(trip.entries.some((e) => e.item.name === name)).toBe(false);
    expect(trip.entries.find((e) => e.item.name === "Evening dress")?.reason).toBe("Dinner out in Buenos Aires and Santiago");
    expect(trip.entries.every((e) => e.reason.includes("days") || trip.stops.some((s) => e.reason.includes(s.name)))).toBe(true);
  });
  it("fits the regenerated sample including souvenirs at 10 kg and both bag capacities", () => {
    const trip = freshSample();
    expect(trip.limitKg).toBe(10);
    for (const returning of [false, true]) {
      const t = totals(trip, returning);
      expect(t.overG).toBe(0);
      expect(t.overCarryL).toBe(0);
      expect(t.overPersonalL).toBe(0);
    }
  });
  it("updates totals and outfits when an item leaves the worn section", () => {
    const trip = freshSample();
    const shoe = trip.entries.find((e) => e.bag === "worn" && e.item.category === "shoes");
    if (!shoe) throw new Error("Expected a worn shoe pair");
    const before = totals(trip);
    const moved = { ...trip, entries: trip.entries.map((e) => e === shoe ? { ...e, bag: "carryOn" as const } : e) };
    expect(totals(moved).wornG).toBe(before.wornG - shoe.item.weightG);
    expect(totals(moved).usedG).toBe(before.usedG + shoe.item.weightG);
    const removed = { ...moved, entries: moved.entries.filter((e) => e.item.name !== shoe.item.name) };
    expect(outfitIdeas(removed).flatMap((o) => o.pieces)).not.toContain(shoe.item.name);
    expect(totals(removed).bags.carryOn.l).toBeCloseTo(before.bags.carryOn.l);
  });
  const count = (trip: ReturnType<typeof freshSample>, name: string) => trip.entries.filter((e) => e.item.name === name).length;
  it.each([
    ["No washing", 20, 20, 7],
    ["Quick sink wash", 5, 4, 2],
    ["Laundry available", 7, 4, 2],
  ] as const)("applies %s carry-on caps", (laundry, basics, tops, bottoms) => {
    const sample = freshSample();
    const trip = buildPackingTrip({ ...sample, laundry, stops: [{ ...sample.stops[0], id: "long", name: "Paris", days: 20, climate: "Mild", rain: "none", coldNights: false, activities: ["city", "dinner"] }] });
    expect(count(trip, "Underwear")).toBe(basics);
    expect(count(trip, "Socks")).toBe(basics);
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(tops);
    expect(trip.entries.filter((e) => e.item.category === "bottom")).toHaveLength(bottoms);
  });
  it.each(["No washing", "Quick sink wash", "Laundry available"] as LaundryOption[])("does not overpack basics or tops for a two-day %s trip", (laundry) => {
    const sample = freshSample();
    const trip = buildPackingTrip({ ...sample, laundry, stops: [{ ...sample.stops[0], id: "short", name: "Paris", days: 2, climate: "Mild", rain: "none", coldNights: false, activities: ["city"] }] });
    expect(count(trip, "Underwear")).toBe(2);
    expect(count(trip, "Socks")).toBe(2);
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(laundry === "No washing" ? 2 : 1);
    expect(trip.entries.filter((e) => e.item.category === "bottom")).toHaveLength(2);
  });
  it("packs one daily basic without washing for eleven days", () => {
    const trip = buildPackingTrip({ ...freshSample(), laundry: "No washing" });
    expect(count(trip, "Underwear")).toBe(11);
    expect(count(trip, "Socks")).toBe(11);
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(11);
  });
  it("packs four bottoms and three sleepwear sets for eleven no-washing days", () => {
    const trip = buildPackingTrip({ ...freshSample(), laundry: "No washing" });
    expect(trip.entries.filter((e) => e.item.category === "bottom")).toHaveLength(4);
    expect(count(trip, "Sleepwear")).toBe(3);
    expect(new Set(trip.entries.map((e) => e.item.id)).size).toBe(trip.entries.length);
  });
  it("uses minimum two bottoms and one sleepwear set for one day", () => {
    const sample = freshSample();
    const stop = sample.stops[0];
    if (!stop) throw new Error("Expected a sample stop");
    const trip = buildPackingTrip({ ...sample, laundry: "No washing", stops: [{ ...stop, days: 1 }] });
    expect(trip.entries.filter((e) => e.item.category === "bottom")).toHaveLength(2);
    expect(count(trip, "Sleepwear")).toBe(1);
  });
  it("counts hiking clothes within the same eleven daily tops and four bottoms", () => {
    const sample = freshSample();
    const trip = buildPackingTrip({ ...sample, laundry: "No washing", stops: sample.stops.map((s) => ({ ...s, activities: ["hiking"] })) });
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(11);
    expect(trip.entries.filter((e) => e.item.category === "bottom")).toHaveLength(4);
    expect(count(trip, "Hiking pants")).toBe(1);
  });
  it("keeps layers shoes and accessories unchanged across laundry options", () => {
    const quick = freshSample();
    const no = changeLaundry(quick, "No washing");
    const fixed = (trip: typeof quick) => trip.entries.filter((e) => ["outer", "shoes", "accessory"].includes(e.item.category));
    expect(fixed(no)).toEqual(fixed(quick));
  });
  it("calculates the extra clothing and weight against sink washing including sleepwear", () => {
    const no = changeLaundry(freshSample(), "No washing");
    const quick = changeLaundry(no, "Quick sink wash");
    const difference = laundryDifference(no);
    expect(difference.items).toBe(22);
    expect(difference.weightG).toBe(no.entries.reduce((s, e) => s + e.item.weightG, 0) - quick.entries.reduce((s, e) => s + e.item.weightG, 0));
    expect(count(no, "Sleepwear") - count(quick, "Sleepwear")).toBe(1);
  });
  it("reports 1.2 kg over and offers feasible plane wear ranked with the other fixes", () => {
    const trip = changeLaundry(freshSample(), "No washing");
    trip.entries = trip.entries.map((e) => e.bag === "worn" ? { ...e, bag: "carryOn" } : e);
    trip.limitKg = (totals(trip).usedG + 1000 - 1200) / 1000;
    expect(totals(trip).overG).toBeCloseTo(1200);
    const fixes = suggestedFixes(trip);
    expect(fixes.some((f) => f.kind === "wear" && f.savedG === 650)).toBe(true);
    expect(fixes.map((f) => f.savedG)).toEqual(fixes.map((f) => f.savedG).sort((a, b) => b - a));
  });
  it("updates real weight, volume, outfits and preserves worn and packed edits on laundry changes", () => {
    const trip = buildPackingTrip({ ...freshSample(), laundry: "No washing" });
    trip.entries = trip.entries.map((e) => e.item.name === "Underwear" ? { ...e, packed: true, bag: "personal" } : e);
    const before = totals(trip);
    const changed = changeLaundry(trip, "Quick sink wash");
    expect(count(changed, "Underwear")).toBe(5);
    expect(changed.entries.filter((e) => e.item.name === "Underwear").every((e) => e.packed && e.bag === "personal")).toBe(true);
    expect(totals(changed).usedG).toBeLessThan(before.usedG);
    expect(totals(changed).bags.personal.l).toBeLessThan(before.bags.personal.l);
    expect(changed.entries.filter((e) => e.bag === "worn")).toEqual(trip.entries.filter((e) => e.bag === "worn"));
    expect(outfitIdeas(changed).every((o) => o.pieces.every((name) => changed.entries.some((e) => e.item.name === name)))).toBe(true);
    const removed = { ...trip, entries: trip.entries.filter((e) => e.item.name !== "Linen shirt") };
    const afterRemoval = changeLaundry(removed, "Quick sink wash");
    expect(count(afterRemoval, "Linen shirt")).toBe(0);
    expect(outfitIdeas(afterRemoval).flatMap((o) => o.pieces)).not.toContain("Linen shirt");
  });
  it("reports an exact 450 g overage and ranks calculated laundry savings with removal fixes", () => {
    const trip = buildPackingTrip({ ...freshSample(), laundry: "No washing" });
    trip.limitKg = (totals(trip).usedG + 1000 - 450) / 1000;
    expect(totals(trip).overG).toBeCloseTo(450);
    const fixes = suggestedFixes(trip);
    const laundry = fixes.find((fix) => fix.kind === "laundry");
    expect(laundry?.savedG).toBe(totals(trip).usedG - totals(changeLaundry(trip, "Quick sink wash")).usedG);
    expect(laundry?.savedG).toBeGreaterThan(450);
    expect(fixes.map((f) => f.savedG)).toEqual(fixes.map((f) => f.savedG).sort((a, b) => b - a));
    expect(totals(changeLaundry(trip, "Quick sink wash")).overG).toBe(0);
    expect(suggestedFixes(freshSample())).toEqual([]);
  });
  it("keeps entry IDs unique when quantities change after an individual removal", () => {
    const original = changeLaundry(freshSample(), "No washing");
    const first = original.entries.find((e) => e.item.name === "Underwear");
    if (!first) throw new Error("Expected underwear");
    const reduced = { ...original, entries: original.entries.filter((e) => e.item.id !== first.item.id) };
    const changed = changeLaundry(changeLaundry(reduced, "Quick sink wash"), "No washing");
    expect(new Set(changed.entries.map((e) => e.item.id)).size).toBe(changed.entries.length);
    expect(count(changed, "Underwear")).toBe(11);
  });
});

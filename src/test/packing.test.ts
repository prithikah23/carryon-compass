import { describe, it, expect } from "vitest";
import {
  freshSample,
  totals,
  suggestedRemovals,
  findItems,
  TRAVEL_CATALOG,
  buildPackingTrip,
  outfitIdeas,
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
    expect(trip.entries.filter((e) => e.item.name === "Underwear")).toHaveLength(7);
    expect(trip.entries.filter((e) => e.item.name === "Socks")).toHaveLength(7);
    expect(trip.entries.filter((e) => e.item.name === "Sleepwear")).toHaveLength(2);
    expect(totals(trip).overG).toBe(0);
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(5);
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
  it("caps daily quantities and explains rewashing on an 11-day trip", () => {
    const trip = freshSample();
    for (const name of ["Underwear", "Socks"]) {
      const entries = trip.entries.filter((e) => e.item.name === name);
      expect(entries).toHaveLength(7);
      expect(entries[0]?.reason).toContain("Plan to rewash once");
      expect(entries[0]?.reason).toContain("trip is 11 days");
    }
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(5);
  });
  it("keeps at most three shoe pairs even when all activities are selected", () => {
    const sample = freshSample();
    const trip = buildPackingTrip({ ...sample, stops: sample.stops.map((s) => ({ ...s, activities: ["city", "hiking", "beach", "dinner"] })) });
    const shoes = trip.entries.filter((e) => e.item.category === "shoes");
    expect(shoes).toHaveLength(3);
    expect(shoes.filter((e) => e.bag === "worn")).toHaveLength(1);
    expect(shoes.map((e) => e.item.name)).toEqual(["Trail runners", "Sneakers", "Sandals"]);
  });
  it("includes the freezing-weather base layer within the five-top cap", () => {
    const sample = freshSample();
    const trip = buildPackingTrip({ ...sample, stops: sample.stops.map((s) => ({ ...s, climate: "Freezing" })) });
    expect(trip.entries.filter((e) => e.item.category === "top")).toHaveLength(5);
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
});

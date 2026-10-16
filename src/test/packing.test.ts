import { describe, it, expect } from "vitest";
import {
  freshSample,
  totals,
  suggestedRemovals,
  findItems,
  TRAVEL_CATALOG,
  buildPackingTrip,
} from "@/lib/packing";
describe("Fresh packing journey rules", () => {
  it("has forty essentials and synonym search", () => {
    expect(TRAVEL_CATALOG).toHaveLength(40);
    expect(findItems("jacket").map((i) => i.name)).toEqual(
      expect.arrayContaining(["Fleece", "Puffer jacket", "Rain shell"]),
    );
  });
  it("scales basics and reuses layers across the sample stops", () => {
    const trip = freshSample();
    expect(trip.entries.filter((e) => e.item.name === "Underwear")).toHaveLength(7);
    expect(trip.entries.filter((e) => e.item.name === "Socks")).toHaveLength(7);
    expect(trip.entries.filter((e) => e.item.name === "T-shirt")).toHaveLength(5);
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
});

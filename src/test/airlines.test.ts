import { describe, expect, it } from "vitest";
import { AIRLINES, findItems, freshSample, totals, suggestedRemovals } from "@/lib/packing";
describe("airline presets and new catalog items", () => {
  it("Ryanair uses the free under-seat bag and a paid 10 kg cabin allowance", () => {
    const airline = AIRLINES.find((a) => a.name === "Ryanair");
    expect(airline?.personalSize).toBe("40 × 30 × 20 cm");
    expect(airline?.personalL).toBe(24);
    expect(airline?.limitKg).toBe(10);
    expect(airline?.paidCabinBag).toBe(true);
  });
  it("easyJet uses the free under-seat bag and a paid 15 kg cabin allowance", () => {
    const airline = AIRLINES.find((a) => a.name === "easyJet");
    expect(airline?.personalSize).toBe("45 × 36 × 20 cm");
    expect(airline?.personalL).toBe(32);
    expect(airline?.limitKg).toBe(15);
    expect(airline?.paidCabinBag).toBe(true);
  });
  it("Qatar Airways sets a 7 kg limit", () => {
    expect(AIRLINES.find((a) => a.name === "Qatar Airways")?.limitKg).toBe(7);
  });
  for (const name of ["Delta", "Air Canada", "American Airlines", "United"]) {
    it(`${name} has no invented weight limit`, () => {
      expect(AIRLINES.find((a) => a.name === name)?.limitKg).toBeNull();
    });
  }
  it("size-only checking ignores overweight but still detects volume overflow", () => {
    const trip = { ...freshSample(), weightCheck: false, limitKg: 1 };
    expect(totals(trip).overG).toBe(0);
    expect(totals(trip, true).overG).toBe(0);
    expect(suggestedRemovals(trip)).toEqual([]);
    trip.carryOnL = 1;
    expect(totals(trip).overCarryL).toBeGreaterThan(0);
    expect(suggestedRemovals(trip).length).toBeGreaterThan(0);
  });
  it("numeric allowances still enforce weight", () => {
    const trip = { ...freshSample(), weightCheck: true, limitKg: 1 };
    expect(totals(trip).overG).toBeGreaterThan(0);
  });
  it("search finds grooming and comfort items by synonym", () => {
    expect(findItems("flat iron").map((i) => i.name)).toContain("Hair straightener");
    expect(findItems("cosmetics").map((i) => i.name)).toContain("Makeup bag");
    expect(findItems("pillow").map((i) => i.name)).toContain("Neck pillow");
  });
});

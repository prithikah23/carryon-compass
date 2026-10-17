import { describe, expect, it } from "vitest";
import { AIRLINES, findItems, freshSample, totals, suggestedRemovals } from "@/lib/packing";
describe("airline presets and new catalog items", () => {
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

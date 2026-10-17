import { describe, expect, it } from "vitest";
import { AIRLINES, findItems } from "@/lib/packing";
describe("airline presets and new catalog items", () => {
  it("Qatar Airways sets a 7 kg limit", () => {
    expect(AIRLINES.find((a) => a.name === "Qatar Airways")?.limitKg).toBe(7);
  });
  it("Delta uses a 12 kg safe limit", () => {
    expect(AIRLINES.find((a) => a.name === "Delta")?.limitKg).toBe(12);
  });
  it("search finds grooming and comfort items by synonym", () => {
    expect(findItems("flat iron").map((i) => i.name)).toContain("Hair straightener");
    expect(findItems("cosmetics").map((i) => i.name)).toContain("Makeup bag");
    expect(findItems("pillow").map((i) => i.name)).toContain("Neck pillow");
  });
});

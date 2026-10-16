import { describe, expect, it } from "vitest";
import { CATALOG, CATALOG_GROUPS, catalogItem, searchCatalog } from "@/lib/catalog";

describe("Travel catalog", () => {
  it("contains a complete catalog with valid metric defaults", () => {
    expect(CATALOG).toHaveLength(60);
    expect(new Set(CATALOG.map((entry) => entry.catalogId)).size).toBe(60);
    for (const entry of CATALOG) {
      expect(entry.weightG).toBeGreaterThan(0);
      expect(entry.volumeL).toBeGreaterThan(0);
      expect(entry.suitable.length).toBeGreaterThan(0);
      if (entry.liquid) expect(entry.containerMl).toBeGreaterThan(0);
    }
  });
  it("matches names and synonyms across categories", () => {
    expect(searchCatalog("pants").map((item) => item.name)).toEqual(expect.arrayContaining(["Jeans", "Hiking pants", "Linen trousers"]));
    expect(searchCatalog("JACKET").map((item) => item.name)).toEqual(expect.arrayContaining(["Puffer jacket", "Fleece", "Rain shell"]));
    expect(searchCatalog("shoes").map((item) => item.name)).toEqual(expect.arrayContaining(["Sneakers", "Trail runners", "Sandals"]));
    expect(searchCatalog("purple dragon")).toHaveLength(0);
  });
  it("browses categories with empty search", () => {
    for (const group of CATALOG_GROUPS) expect(searchCatalog("", group).every((item) => item.group === group)).toBe(true);
  });
  it("makes independent item copies with all recommendation attributes", () => {
    const entry = CATALOG.find((item) => item.name === "Shampoo");
    if (!entry) throw new Error("Shampoo missing");
    const item = catalogItem(entry, "first");
    expect(item).toMatchObject({ id: "first", category: "toiletry", liquid: true, containerMl: 100, weightG: 110 });
    expect(item).not.toHaveProperty("synonyms");
    expect(item.suitable).not.toBe(entry.suitable);
  });
});
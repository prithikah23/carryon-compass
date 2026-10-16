import type { Activity, Category, Formality, Item, Warmth } from "./types";

export const CATALOG_GROUPS = ["Tops", "Bottoms", "Layers", "Shoes", "Accessories", "Toiletries", "Tech"] as const;
export type CatalogGroup = (typeof CATALOG_GROUPS)[number];
export interface CatalogEntry extends Omit<Item, "id" | "sample"> {
  catalogId: string;
  group: CatalogGroup;
  synonyms: string;
  repeatable: boolean;
}
type Row = [string, number, number, string, Partial<Pick<CatalogEntry, "warmth" | "formality" | "suitable" | "maxWears" | "liquid" | "containerMl" | "repeatable" | "category">>?];
const rows: Record<CatalogGroup, Row[]> = {
  Tops: [
    ["T-shirt", 150, .6, "tee tshirt t shirt shirts", { repeatable: true }],
    ["Merino t-shirt", 160, .6, "wool tee tshirt shirts", { maxWears: 4, repeatable: true }],
    ["Long-sleeve shirt", 220, .8, "long sleeve tee tops", { warmth: "medium", repeatable: true }],
    ["Linen shirt", 180, .7, "button down blouse shirts", { formality: "smart", suitable: ["city", "beach", "dinner"] }],
    ["Oxford shirt", 250, .9, "button down dress shirt shirts", { formality: "smart", suitable: ["city", "business", "dinner"] }],
    ["Tank top", 100, .4, "vest sleeveless singlet", { repeatable: true, suitable: ["city", "beach"] }],
    ["Sports top", 130, .5, "workout gym running athletic shirt", { suitable: ["hiking", "city"], repeatable: true }],
    ["Polo shirt", 200, .7, "collared tee shirts", { formality: "smart", suitable: ["city", "dinner", "business"] }],
    ["Blouse", 160, .6, "dress shirt tops", { formality: "smart", suitable: ["city", "dinner", "business"] }],
    ["Casual dress", 280, 1.1, "sundress dresses outfit", { category: "dress", suitable: ["city", "beach", "dinner"] }],
  ],
  Bottoms: [
    ["Jeans", 650, 1.7, "denim pants trousers", { warmth: "medium", maxWears: 5 }],
    ["Chinos", 400, 1.3, "pants trousers smart", { formality: "smart", suitable: ["city", "dinner", "business"], maxWears: 4 }],
    ["Hiking pants", 320, 1, "trousers trekking pants outdoor", { suitable: ["hiking", "city"], maxWears: 4 }],
    ["Linen trousers", 280, 1, "pants summer bottoms", { formality: "smart", suitable: ["city", "beach", "dinner"] }],
    ["Shorts", 200, .7, "short pants summer", { suitable: ["city", "beach", "hiking"] }],
    ["Leggings", 200, .6, "tights yoga pants workout", { suitable: ["hiking", "city"] }],
    ["Skirt", 220, .8, "skirts bottoms", { formality: "smart", suitable: ["city", "dinner"] }],
    ["Swimwear", 120, .4, "swimsuit bikini swim trunks bathing suit", { suitable: ["beach"] }],
  ],
  Layers: [
    ["Puffer jacket", 400, 2, "jacket down coat insulated", { warmth: "warm", suitable: ["city", "hiking", "cold nights"], maxWears: 10 }],
    ["Fleece", 300, 1.5, "jacket fleece sweater midlayer", { warmth: "medium", suitable: ["city", "hiking", "cold nights"], maxWears: 5 }],
    ["Rain shell", 250, .8, "jacket raincoat waterproof shell", { suitable: ["city", "hiking", "rain"], maxWears: 10 }],
    ["Sweater", 350, 1.5, "jumper pullover knit wool", { warmth: "warm", suitable: ["city", "dinner", "cold nights"], maxWears: 5 }],
    ["Cardigan", 280, 1.2, "sweater knit layer", { warmth: "medium", formality: "smart", suitable: ["city", "dinner", "business"], maxWears: 5 }],
    ["Hoodie", 450, 2, "sweatshirt hooded jumper", { warmth: "medium", suitable: ["city", "cold nights"], maxWears: 5 }],
    ["Blazer", 500, 2, "jacket suit smart coat", { warmth: "medium", formality: "formal", suitable: ["business", "dinner"], maxWears: 8 }],
    ["Thermal base layer", 180, .6, "thermals long underwear top", { category: "top", warmth: "warm", suitable: ["hiking", "cold nights"], repeatable: true }],
  ],
  Shoes: [
    ["Sneakers", 650, 3.5, "shoes trainers tennis footwear", { suitable: ["city"] }],
    ["Trail runners", 600, 3.2, "shoes running hiking trainers footwear", { suitable: ["hiking", "city"] }],
    ["Sandals", 300, 1.5, "shoes summer footwear", { suitable: ["beach", "city"] }],
    ["Flip-flops", 180, .8, "shoes sandals thongs beach footwear", { suitable: ["beach"] }],
    ["Hiking boots", 1100, 4.5, "shoes trekking boots footwear", { warmth: "medium", suitable: ["hiking", "rain", "cold nights"] }],
    ["Loafers", 550, 2.8, "shoes dress flats smart footwear", { formality: "smart", suitable: ["city", "business", "dinner"] }],
  ],
  Accessories: [
    ["Socks", 50, .15, "sock pair hosiery", { category: "basics", repeatable: true, maxWears: 1 }],
    ["Underwear", 50, .15, "briefs panties boxers underpants", { category: "basics", repeatable: true, maxWears: 1 }],
    ["Bra", 80, .25, "bras lingerie", { category: "basics", repeatable: true }],
    ["Sun hat", 90, .5, "cap baseball hat sunhat", { suitable: ["city", "beach", "hiking"] }],
    ["Beanie", 70, .25, "hat wool cap winter", { warmth: "warm", suitable: ["hiking", "cold nights"] }],
    ["Scarf", 150, .5, "shawl wrap neck", { warmth: "medium", suitable: ["city", "cold nights"] }],
    ["Gloves", 80, .25, "mittens winter hands", { warmth: "warm", suitable: ["hiking", "cold nights"] }],
    ["Sunglasses", 35, .15, "shades glasses eyewear", { suitable: ["city", "beach", "hiking"] }],
    ["Belt", 100, .2, "waist leather belt"],
    ["Travel towel", 180, .6, "microfiber towel quick dry", { suitable: ["beach", "hiking"] }],
  ],
  Toiletries: [
    ["Toothbrush", 20, .05, "dental teeth brush"],
    ["Toothpaste", 60, .08, "dental teeth paste", { liquid: true, containerMl: 50 }],
    ["Shampoo", 110, .13, "hair wash", { liquid: true, containerMl: 100 }],
    ["Conditioner", 110, .13, "hair conditioner", { liquid: true, containerMl: 100 }],
    ["Body wash", 110, .13, "shower gel soap", { liquid: true, containerMl: 100 }],
    ["Sunscreen", 110, .13, "sun cream sunblock spf lotion", { liquid: true, containerMl: 100, suitable: ["city", "beach", "hiking"] }],
    ["Deodorant stick", 75, .1, "deodorant antiperspirant solid"],
    ["Moisturizer", 65, .08, "face cream moisturiser lotion", { liquid: true, containerMl: 50 }],
    ["Lip balm", 10, .02, "chapstick lips"],
    ["Razor", 30, .06, "shaver shaving"],
  ],
  Tech: [
    ["Phone", 200, .15, "mobile smartphone cellphone"],
    ["Phone charger", 60, .1, "charging plug usb cable"],
    ["Power bank", 220, .2, "portable battery charger"],
    ["Travel adapter", 120, .2, "plug adaptor universal electrical"],
    ["Headphones", 180, .5, "earbuds earphones headset"],
    ["Laptop", 1300, 1.5, "computer notebook macbook", { suitable: ["business", "city"] }],
    ["E-reader", 180, .2, "kindle ebook reader book"],
    ["Camera", 450, .8, "photography digital camera"],
  ],
};
const categories: Record<CatalogGroup, Category> = { Tops: "top", Bottoms: "bottom", Layers: "outer", Shoes: "shoes", Accessories: "accessory", Toiletries: "toiletry", Tech: "tech" };
export const CATALOG: CatalogEntry[] = CATALOG_GROUPS.flatMap((group) => rows[group].map(([name, weightG, volumeL, synonyms, extra]) => ({
  catalogId: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, group, category: categories[group],
  weightG, volumeL, color: "#476b75", warmth: "light" as Warmth, formality: "casual" as Formality,
  suitable: ["city"] as Activity[], maxWears: group === "Shoes" ? 99 : group === "Tech" || group === "Toiletries" ? 99 : 3,
  synonyms, repeatable: false, ...(group === "Toiletries" ? { liquid: false, containerMl: 0 } : {}), ...extra,
})));
const normalize = (value: string) => value.toLowerCase().replace(/[-']/g, " ").replace(/\s+/g, " ").trim();
export function searchCatalog(query: string, group: CatalogGroup = "Tops") {
  const words = normalize(query).split(" ").filter(Boolean);
  return CATALOG.filter((entry) => words.length ? words.every((word) => normalize(`${entry.name} ${entry.synonyms}`).includes(word)) : entry.group === group);
}
export function catalogItem(entry: CatalogEntry, id: string): Item {
  const { group: _group, synonyms: _synonyms, repeatable: _repeatable, ...item } = entry;
  return { ...item, id, suitable: [...item.suitable] };
}
export type Category =
  | "top"
  | "bottom"
  | "dress"
  | "outer"
  | "shoes"
  | "accessory"
  | "basics"
  | "toiletry"
  | "tech"
  | "documents";

export type Activity = "city" | "hiking" | "beach" | "dinner" | "business" | "rain" | "cold nights";
export type Warmth = "light" | "medium" | "warm";
export type Formality = "casual" | "smart" | "formal";
export type Rain = "none" | "some" | "lots";
export type BagId = "carryOn" | "personal";
export type LimitType = "combined" | "separate" | "none";

export interface Item {
  id: string;
  catalogId?: string | undefined;
  name: string;
  category: Category;
  color: string;
  weightG: number;
  volumeL: number;
  warmth: Warmth;
  formality: Formality;
  suitable: Activity[];
  maxWears: number;
  liquid?: boolean | undefined;
  containerMl?: number | undefined;
  sample?: boolean | undefined;
}

export interface Leg {
  id: string;
  destination: string;
  start: string;
  end: string;
  low: number;
  high: number;
  rain: Rain;
  activities: Activity[];
}

export interface TripOverrides {
  added: string[];
  removed: string[];
  bagMoves: Record<string, BagId>;
  outfitSwaps: Record<string, string>;
}

export interface Trip {
  id: string;
  name: string;
  carryOnL: number;
  personalL: number;
  carryOnEmptyKg: number;
  personalEmptyKg: number;
  limitType: LimitType;
  combinedKg: number;
  carryOnKg: number;
  personalKg: number;
  legs: Leg[];
  souvenirKg: number;
  souvenirL: number;
  souvenirBag: BagId;
  laundry: boolean;
  wearHeaviest: boolean;
  overrides: TripOverrides;
  checked: string[];
  sample?: boolean | undefined;
  createdAt: number;
}

export const CATEGORIES: { value: Category; label: string; plural: string; defaultL: number }[] = [
  { value: "top", label: "Top", plural: "Tops", defaultL: 0.8 },
  { value: "bottom", label: "Bottom", plural: "Bottoms", defaultL: 1.5 },
  { value: "dress", label: "Dress", plural: "Dresses", defaultL: 1.2 },
  { value: "outer", label: "Outer layer", plural: "Outer layers", defaultL: 2.5 },
  { value: "shoes", label: "Shoes", plural: "Shoes", defaultL: 4 },
  { value: "accessory", label: "Accessory", plural: "Accessories", defaultL: 0.4 },
  { value: "basics", label: "Basics", plural: "Basics", defaultL: 0.6 },
  { value: "toiletry", label: "Toiletry", plural: "Toiletries", defaultL: 0.15 },
  { value: "tech", label: "Tech", plural: "Tech", defaultL: 0.3 },
  { value: "documents", label: "Documents", plural: "Documents", defaultL: 0.3 },
];

export const ACTIVITIES: Activity[] = ["city", "hiking", "beach", "dinner", "business", "rain", "cold nights"];

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.value === c)?.label ?? c;
export const categoryPlural = (c: Category) => CATEGORIES.find((x) => x.value === c)?.plural ?? c;
export const bagLabel = (b: BagId) => (b === "carryOn" ? "Carry-on" : "Personal item");
export const otherBag = (b: BagId): BagId => (b === "carryOn" ? "personal" : "carryOn");

export const emptyOverrides = (): TripOverrides => ({ added: [], removed: [], bagMoves: {}, outfitSwaps: {} });

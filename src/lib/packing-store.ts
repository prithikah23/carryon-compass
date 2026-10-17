import { useSyncExternalStore } from "react";
import { freshSample, PACKING_RULES_VERSION, type PackingTrip } from "./packing";
import type { Item } from "./types";
interface State {
  loaded: boolean;
  trip: PackingTrip | null;
  customItems: Item[];
}
const server: State = { loaded: false, trip: null, customItems: [] };
let state: State | null = null;
const listeners = new Set<() => void>();
const KEY = "carry-on-compass:fit:v2";
const CUSTOM_KEY = "carry-on-compass:custom-items:v1";
function readCustomItems(): Item[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "[]");
    return Array.isArray(data) ? data.filter((i): i is Item => !!i && typeof i.name === "string" && Number.isFinite(i.weightG) && Number.isFinite(i.volumeL) && i.custom === true) : [];
  } catch { return []; }
}
/** Older saves could split copies of one item across bags; keep every copy with the first one. */
function mergeCopies(trip: PackingTrip): PackingTrip {
  const bagOf = new Map<string, PackingTrip["entries"][number]["bag"]>();
  const entries = trip.entries.map((e) => {
    const bag = bagOf.get(e.item.name);
    if (bag === undefined) {
      bagOf.set(e.item.name, e.bag);
      return e;
    }
    return bag === e.bag ? e : { ...e, bag };
  });
  return { ...trip, laundry: trip.laundry ?? "Quick sink wash", entries };
}
function get(): State {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : undefined;
    state = {
      loaded: true,
      customItems: readCustomItems(),
      trip:
        data === null
          ? null
          : data &&
              Array.isArray(data.stops) &&
              Array.isArray(data.entries) &&
              Number.isFinite(data.limitKg)
            ? data.sample && data.rulesVersion !== PACKING_RULES_VERSION
              ? freshSample()
              : mergeCopies(data)
            : freshSample(),
    };
  } catch {
    state = { loaded: true, trip: freshSample(), customItems: readCustomItems() };
  }
  return state;
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function usePackingState() {
  return useSyncExternalStore(subscribe, get, () => server);
}
export function savePackingTrip(trip: PackingTrip | null) {
  const customItems = [...get().customItems];
  for (const e of trip?.entries ?? []) {
    if (!e.item.custom) continue;
    const index = customItems.findIndex((i) => i.name.toLowerCase() === e.item.name.toLowerCase());
    if (index < 0) customItems.push(e.item);
    else customItems[index] = e.item;
  }
  state = { loaded: true, trip, customItems };
  try {
    localStorage.setItem(KEY, JSON.stringify(trip));
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customItems));
  } catch {
    /* Keep changes in memory when browser storage is unavailable. */
  }
  listeners.forEach((fn) => fn());
}

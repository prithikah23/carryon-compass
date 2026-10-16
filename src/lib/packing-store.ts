import { useSyncExternalStore } from "react";
import { freshSample, type PackingTrip } from "./packing";
interface State {
  loaded: boolean;
  trip: PackingTrip | null;
}
const server: State = { loaded: false, trip: null };
let state: State | null = null;
const listeners = new Set<() => void>();
const KEY = "carry-on-compass:fit:v2";
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
  return { ...trip, entries };
}
function get(): State {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : undefined;
    state = {
      loaded: true,
      trip:
        data === null
          ? null
          : data &&
              Array.isArray(data.stops) &&
              Array.isArray(data.entries) &&
              Number.isFinite(data.limitKg)
            ? mergeCopies(data)
            : freshSample(),
    };
  } catch {
    state = { loaded: true, trip: freshSample() };
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
  state = { loaded: true, trip };
  try {
    localStorage.setItem(KEY, JSON.stringify(trip));
  } catch {
    /* Keep changes in memory when browser storage is unavailable. */
  }
  listeners.forEach((fn) => fn());
}

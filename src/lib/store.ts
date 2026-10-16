import { useSyncExternalStore } from "react";
import type { Item, Trip, TripOverrides } from "./types";
import { emptyOverrides } from "./types";
import { SAMPLE_TRIP_ID, sampleItems, sampleTrip } from "./sample";

export interface Prefs {
  tourDone: boolean;
  bannerDismissed: boolean;
}

export interface AppState {
  loaded: boolean;
  items: Item[];
  trips: Trip[];
  prefs: Prefs;
}

const KEY = "carry-on-compass:v1";
const SERVER: AppState = { loaded: false, items: [], trips: [], prefs: { tourDone: false, bannerDismissed: false } };

let state: AppState | null = null;
const listeners = new Set<() => void>();

function fresh(): AppState {
  return { loaded: true, items: sampleItems(), trips: [sampleTrip()], prefs: { tourDone: false, bannerDismissed: false } };
}

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      loaded: true,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      trips: Array.isArray(parsed.trips)
        ? parsed.trips.map((t) => ({ ...t, overrides: { ...emptyOverrides(), ...(t.overrides ?? {}) }, checked: t.checked ?? [] }))
        : [],
      prefs: { tourDone: false, bannerDismissed: false, ...(parsed.prefs ?? {}) },
    };
  } catch {
    return fresh();
  }
}

function get(): AppState {
  if (!state) state = load();
  return state;
}

function set(next: AppState) {
  state = next;
  try {
    const { loaded: _l, ...rest } = next;
    window.localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    // storage full or blocked: keep working in memory
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, get, () => SERVER);
}

const update = (fn: (s: AppState) => AppState) => set(fn(get()));

export const actions = {
  saveItem(item: Item) {
    update((s) => ({
      ...s,
      items: s.items.some((i) => i.id === item.id) ? s.items.map((i) => (i.id === item.id ? item : i)) : [...s.items, item],
    }));
  },
  deleteItem(id: string) {
    update((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
  },
  loadSampleWardrobe() {
    update((s) => {
      const ids = new Set(s.items.map((i) => i.id));
      return { ...s, items: [...s.items, ...sampleItems().filter((i) => !ids.has(i.id))] };
    });
  },
  saveTrip(trip: Trip) {
    update((s) => ({
      ...s,
      trips: s.trips.some((t) => t.id === trip.id) ? s.trips.map((t) => (t.id === trip.id ? trip : t)) : [...s.trips, trip],
    }));
  },
  deleteTrip(id: string) {
    update((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) }));
  },
  patchTrip(id: string, fn: (t: Trip) => Trip) {
    update((s) => ({ ...s, trips: s.trips.map((t) => (t.id === id ? fn(t) : t)) }));
  },
  patchOverrides(id: string, fn: (o: TripOverrides) => TripOverrides) {
    actions.patchTrip(id, (t) => ({ ...t, overrides: fn(t.overrides) }));
  },
  setPrefs(p: Partial<Prefs>) {
    update((s) => ({ ...s, prefs: { ...s.prefs, ...p } }));
  },
  resetSample() {
    update((s) => ({
      ...s,
      items: [...sampleItems(), ...s.items.filter((i) => !i.sample)],
      trips: [sampleTrip(), ...s.trips.filter((t) => t.id !== SAMPLE_TRIP_ID)],
      prefs: { tourDone: false, bannerDismissed: false },
    }));
  },
  startFresh() {
    set({ loaded: true, items: [], trips: [], prefs: { tourDone: true, bannerDismissed: true } });
  },
};

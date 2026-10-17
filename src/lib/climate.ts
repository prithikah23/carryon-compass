import { addDays, format, parseISO, isValid } from "date-fns";
import type { Climate, Stop } from "./packing";

export interface Place {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}
export interface ClimateResult {
  key: string;
  source: "forecast" | "past years";
  high: number;
  low: number;
  wetShare: number;
}
export const todayISO = () => format(new Date(), "yyyy-MM-dd");
export function stopDates(start: string, stops: Pick<Stop, "days">[]) {
  let offset = 0;
  return stops.map((s) => {
    const date = parseISO(start);
    if (!isValid(date) || !Number.isInteger(s.days) || s.days < 1) return undefined;
    const from = addDays(date, offset);
    offset += s.days;
    return { start: format(from, "yyyy-MM-dd"), end: format(addDays(from, s.days - 1), "yyyy-MM-dd") };
  });
}
export function climateChips(high: number, low: number, wetShare: number) {
  const climate: Climate = high >= 25 ? "Hot" : high >= 18 ? "Warm" : high >= 10 ? "Mild" : high >= 0 ? "Cool" : "Freezing";
  return { climate, rain: wetShare < 0.15 ? "none" as const : wetShare <= 0.4 ? "some" as const : "lots" as const, coldNights: low <= 5 || high - low >= 15 };
}
export function climateKey(latitude: number, longitude: number, start: string, end: string) {
  return `${latitude},${longitude}:${start}:${end}`;
}
export function usesForecast(start: string, today = todayISO()) {
  const days = Math.round((parseISO(start).getTime() - parseISO(today).getTime()) / 86400000);
  return days >= 0 && days < 14;
}
/** Keep month/day (clamp leap day) while moving the entire interval to a completed past year. */
export function historicalRanges(start: string, end: string, today = todayISO()) {
  const endYear = Number(end.slice(0, 4));
  const currentYear = Number(today.slice(0, 4));
  const lastYear = Math.min(currentYear - 1, endYear - 1);
  const shift = (value: string, years: number) => {
    const date = parseISO(value);
    const year = date.getFullYear() - years;
    const month = date.getMonth();
    const day = Math.min(date.getDate(), new Date(year, month + 1, 0).getDate());
    return format(new Date(year, month, day), "yyyy-MM-dd");
  };
  return [0, 1, 2].map((n) => ({ start: shift(start, endYear - lastYear + n), end: shift(end, endYear - lastYear + n) }));
}
export async function timedRequest<T>(url: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 5000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("Weather service unavailable");
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
export async function searchPlaces(name: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ name, count: "6", language: "en", format: "json" });
  const data = await timedRequest<{ results?: Place[] }>(`https://geocoding-api.open-meteo.com/v1/search?${query}`, signal);
  return data.results ?? [];
}
type Daily = { temperature_2m_max: (number | null)[]; temperature_2m_min: (number | null)[]; precipitation_sum: (number | null)[] };
export async function lookupClimate(latitude: number, longitude: number, start: string, end: string, signal?: AbortSignal): Promise<ClimateResult> {
  const source = usesForecast(start) ? "forecast" : "past years";
  const ranges = source === "forecast" ? [{ start, end }] : historicalRanges(start, end);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 5000);
  try {
    const daily = await Promise.all(ranges.map(async (range) => {
      const query = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), start_date: range.start, end_date: range.end, daily: "temperature_2m_max,temperature_2m_min,precipitation_sum", timezone: "auto" });
      const host = source === "forecast" ? "https://api.open-meteo.com/v1/forecast" : "https://archive-api.open-meteo.com/v1/archive";
      const data = await timedRequest<{ daily?: Daily }>(`${host}?${query}`, controller.signal);
      if (!data.daily) throw new Error("No daily weather");
      return data.daily;
    }));
    const days = daily.flatMap((d) => d.temperature_2m_max.map((high, i) => ({ high, low: d.temperature_2m_min[i], rain: d.precipitation_sum[i] })));
    if (!days.length || days.some((d) => typeof d.high !== "number" || !Number.isFinite(d.high) || typeof d.low !== "number" || !Number.isFinite(d.low) || typeof d.rain !== "number" || !Number.isFinite(d.rain))) throw new Error("Incomplete daily weather");
    return {
      key: climateKey(latitude, longitude, start, end), source,
      high: days.reduce((sum, d) => sum + (d.high ?? 0), 0) / days.length,
      low: days.reduce((sum, d) => sum + (d.low ?? 0), 0) / days.length,
      wetShare: days.filter((d) => (d.rain ?? 0) >= 1).length / days.length,
    };
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
}
import { afterEach, describe, expect, it, vi } from "vitest";
import { climateChips, historicalRanges, lookupClimate, searchPlaces, stopDates, timedRequest, usesForecast } from "@/lib/climate";
import { buildPackingTrip, freshSample } from "@/lib/packing";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("Climate suggestions", () => {
  it.each([[25, "Hot"], [24.9, "Warm"], [18, "Warm"], [17.9, "Mild"], [10, "Mild"], [9.9, "Cool"], [0, "Cool"], [-0.1, "Freezing"]])("maps a high of %s to %s", (high, expected) => {
    expect(climateChips(Number(high), 8, 0).climate).toBe(expected);
  });
  it.each([[0.149, "none"], [0.15, "some"], [0.4, "some"], [0.401, "lots"]])("maps wet share %s to %s", (share, rain) => {
    expect(climateChips(20, 8, Number(share)).rain).toBe(rain);
  });
  it("turns cold nights on at 5 degrees or a 15-degree spread", () => {
    expect(climateChips(15, 5, 0).coldNights).toBe(true);
    expect(climateChips(21, 6, 0).coldNights).toBe(true);
    expect(climateChips(20, 6, 0).coldNights).toBe(false);
  });
  it("derives consecutive inclusive stop dates", () => {
    expect(stopDates("2026-09-20", [{ days: 3 }, { days: 2 }])).toEqual([{ start: "2026-09-20", end: "2026-09-22" }, { start: "2026-09-23", end: "2026-09-24" }]);
  });
  it("selects forecast only within the next 14 days", () => {
    expect(usesForecast("2026-10-17", "2026-10-17")).toBe(true);
    expect(usesForecast("2026-10-31", "2026-10-17")).toBe(true);
    expect(usesForecast("2026-11-01", "2026-10-17")).toBe(false);
    expect(usesForecast("2026-10-16", "2026-10-17")).toBe(false);
  });
  it("uses the last three completed years for a trip a month away", () => {
    expect(historicalRanges("2026-11-17", "2026-11-19", "2026-10-17")).toEqual([2025, 2024, 2023].map((year) => ({ start: `${year}-11-17`, end: `${year}-11-19` })));
    expect(historicalRanges("2028-02-29", "2028-02-29", "2026-10-17")[0]?.start).toBe("2025-02-28");
  });
  it("averages highs, lows and >=1mm rain days across three archive years", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ daily: { temperature_2m_max: [23, 25], temperature_2m_min: [3, 5], precipitation_sum: [0.9, 1] } }) });
    vi.stubGlobal("fetch", fetcher);
    const result = await lookupClimate(-22.9, -68.2, "2030-11-17", "2030-11-18");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls.every(([url]) => String(url).startsWith("https://archive-api.open-meteo.com/"))).toBe(true);
    expect(result).toMatchObject({ high: 24, low: 4, wetShare: 0.5, source: "past years" });
  });
  it("fails rather than averaging missing daily values", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ daily: { temperature_2m_max: [null], temperature_2m_min: [3], precipitation_sum: [0] } }) }));
    await expect(lookupClimate(1, 2, "2030-11-17", "2030-11-17")).rejects.toThrow("Incomplete");
  });
  it("aborts a lookup after five seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("aborted"))))));
    const request = timedRequest("https://api.open-meteo.com");
    const assertion = expect(request).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  });
  it("only sends the place search query and returns coordinates", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [{ id: 1, name: "San Pedro de Atacama", latitude: -22.9, longitude: -68.2 }] }) });
    vi.stubGlobal("fetch", fetcher);
    expect((await searchPlaces("San Pedro de Atacama"))[0]?.latitude).toBe(-22.9);
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("name=San+Pedro+de+Atacama");
  });
  it("preserves saved weather in packing plans and builds the sample with no network", () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const sample = freshSample();
    const weather = { key: "saved", source: "past years" as const, high: 23, low: 3, wetShare: 0 };
    const trip = buildPackingTrip({ ...sample, sample: false, startDate: "2026-11-17", stops: [{ ...sample.stops[1], id: "test", name: "Atacama", days: 3, climate: "Warm", rain: "none", coldNights: true, activities: ["hiking"], weather }] });
    expect(JSON.parse(JSON.stringify(trip)).stops[0].weather).toEqual(weather);
    expect(sample.stops.every((stop) => !!stop.climate)).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
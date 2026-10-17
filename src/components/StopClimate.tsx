import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Chips } from "./FitControls";
import { CLIMATES, type Stop } from "@/lib/packing";
import { climateChips, climateKey, lookupClimate, searchPlaces, type Place } from "@/lib/climate";

export function StopClimate({ stop, dates, patch, invalid, describedBy }: {
  stop: Stop;
  dates?: { start: string; end: string } | undefined;
  patch: (id: string, change: Partial<Stop>) => void;
  invalid: boolean;
  describedBy?: string | undefined;
}) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchState, setSearchState] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [weatherState, setWeatherState] = useState<"idle" | "loading" | "error">("idle");
  const key = dates && stop.latitude !== undefined && stop.longitude !== undefined
    ? climateKey(stop.latitude, stop.longitude, dates.start, dates.end) : "manual";
  const hasWeather = stop.weather?.key === key;
  const manual = stop.manualClimateKey === key;
  const currentKey = useRef(key);
  currentKey.current = key;

  useEffect(() => {
    if (!focused || stop.latitude !== undefined || stop.name.trim().length < 2) {
      setPlaces([]); setSearchState(""); return;
    }
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearchState("Searching places…");
      searchPlaces(stop.name.trim(), controller.signal).then((results) => {
        if (!alive) return;
        setPlaces(results); setActive(-1);
        setSearchState(results.length ? "" : "No places found. Set the climate yourself.");
      }).catch(() => {
        if (alive) { setPlaces([]); setSearchState("Place search unavailable. Set the climate yourself."); }
      });
    }, 300);
    return () => { alive = false; clearTimeout(timer); controller.abort(); };
  }, [focused, stop.name, stop.latitude]);

  useEffect(() => {
    if (!dates || stop.latitude === undefined || stop.longitude === undefined || hasWeather || manual) {
      setWeatherState("idle"); return;
    }
    let alive = true;
    const controller = new AbortController();
    setWeatherState("loading");
    lookupClimate(stop.latitude, stop.longitude, dates.start, dates.end, controller.signal).then((weather) => {
      if (!alive || currentKey.current !== key) return;
      patch(stop.id, { weather, ...climateChips(weather.high, weather.low, weather.wetShare) });
      setWeatherState("idle");
    }).catch(() => { if (alive) setWeatherState("error"); });
    return () => { alive = false; controller.abort(); };
  }, [key, hasWeather, manual, patch, stop.id]);

  const choose = (place: Place) => {
    patch(stop.id, { name: place.name, latitude: place.latitude, longitude: place.longitude, weather: undefined, manualClimateKey: undefined });
    setPlaces([]); setFocused(false); setSearchState("");
  };
  const edit = (change: Partial<Stop>) => patch(stop.id, { ...change, manualClimateKey: key });
  const listId = stop.id + "-places";
  const weather = hasWeather ? stop.weather : undefined;
  return <>
    <div className="relative order-1 min-w-0">
      <Label htmlFor={stop.id + "name"}>Destination</Label>
      <Input
        id={stop.id + "name"} placeholder="e.g. Atacama" value={stop.name}
        role="combobox" aria-autocomplete="list" aria-expanded={focused && places.length > 0}
        aria-controls={listId} aria-activedescendant={active >= 0 && places[active] ? `${listId}-${active}` : undefined}
        autoComplete="off" aria-invalid={invalid} aria-describedby={describedBy}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onChange={(e) => { setPlaces([]); setActive(-1); patch(stop.id, { name: e.target.value, latitude: undefined, longitude: undefined, weather: undefined, manualClimateKey: undefined }); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setFocused(false); setPlaces([]); }
          if (places.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault(); setActive((n) => e.key === "ArrowDown" ? (n + 1) % places.length : (n + places.length - 1) % places.length);
          }
          if (e.key === "Enter" && focused && places[active]) { e.preventDefault(); choose(places[active]); }
        }}
      />
      {focused && places.length > 0 && <div id={listId} role="listbox" aria-label="Place suggestions" className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
        {places.map((place, i) => <Button key={place.id} id={`${listId}-${i}`} role="option" aria-selected={active === i} type="button" variant={active === i ? "secondary" : "ghost"}
          className="h-auto min-h-11 w-full items-start justify-start whitespace-normal text-left"
          onMouseDown={(e) => e.preventDefault()} onClick={() => choose(place)}>
          <span><span className="block font-medium">{place.name}</span><span className="block text-sm text-muted-foreground">{[place.admin1, place.country].filter(Boolean).join(", ")}</span></span>
        </Button>)}
      </div>}
      {searchState && <p role="status" className="mt-1 text-sm text-muted-foreground">{searchState}</p>}
      {dates && <p className="mt-2 text-sm text-muted-foreground">{format(parseISO(dates.start), "MMM d")} to {format(parseISO(dates.end), "MMM d")}</p>}
    </div>
    <div className="order-3 col-span-2 mt-1 space-y-4">
      <Chips label="Climate" options={CLIMATES} value={stop.climate} onChange={(climate) => edit({ climate })} />
      <Chips label="Rain" options={["none", "some", "lots"] as const} value={stop.rain} onChange={(rain) => edit({ rain })} />
      <div className="flex items-center gap-3">
        <Switch className="relative after:absolute after:-inset-y-3 after:inset-x-0 after:content-['']" id={stop.id + "cold"} checked={stop.coldNights} onCheckedChange={(coldNights) => edit({ coldNights })} />
        <Label htmlFor={stop.id + "cold"}>Cold nights</Label>
      </div>
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {manual ? "Set by you" : weatherState === "loading" ? "Looking up the climate…" : weatherState === "error" ? "Couldn't get the weather. Pick the climate yourself." : weather
          ? `${weather.source === "forecast" ? "Forecast for these dates" : "Typical for these dates"}: ${Math.round(weather.low)} to ${Math.round(weather.high)} °C, ${weather.wetShare < 0.15 ? "mostly dry" : weather.wetShare <= 0.4 ? "some rain" : "often rainy"} · Based on ${weather.source}`
          : ""}
      </p>
    </div>
  </>;
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Plus, Trash2, ArrowRight, Check, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StopClimate } from "@/components/StopClimate";
import { stopDates, todayISO } from "@/lib/climate";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Chips, meta } from "@/components/FitControls";
import {
  AIRLINES,
  LAUNDRY_OPTIONS,
  type LaundryOption,
  buildPackingTrip,
  newStop,
  type Stop,
  type PackingActivity,
} from "@/lib/packing";
import { savePackingTrip, usePackingState } from "@/lib/packing-store";
export const Route = createFileRoute("/trips/new")({
  head: () =>
    meta(
      "Plan my trip",
      "Choose destinations, climates and two bags. Build a packing plan with room for souvenirs.",
    ),
  validateSearch: (s: Record<string, unknown>): { airline?: string } =>
    typeof s["airline"] === "string" ? { airline: s["airline"] } : {},
  component: Setup,
});
function Setup() {
  const state = usePackingState();
  if (!state.loaded) return <div className="p-10" role="status">Loading trip setup…</div>;
  return <Builder />;
}
function Builder() {
  const navigate = useNavigate();
  const [stops, setStops] = useState<Stop[]>(() => [newStop()]);
  const [startDate, setStartDate] = useState(todayISO);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dates = stopDates(startDate, stops);
  const preset = AIRLINES.find((a) => a.name === Route.useSearch().airline);
  const [carry, setCarry] = useState<number>(preset?.carryOnL ?? 40);
  const [personal, setPersonal] = useState<number>(preset?.personalL ?? 18);
  const [weightCheck, setWeightCheck] = useState(preset?.limitKg !== null);
  const [limit, setLimit] = useState(String(preset?.limitKg ?? 10));
  const [souvenir, setSouvenir] = useState(1);
  const [laundry, setLaundry] = useState<LaundryOption>("Quick sink wash");
  const [airline, setAirline] = useState(preset?.name ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const patch = useCallback((id: string, change: Partial<Stop>) =>
    setStops((s) => s.map((l) => (l.id === id ? { ...l, ...change } : l))), []);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!stops.length) errs["stops"] = "Add at least one destination.";
    for (const l of stops) {
      if (!l.name.trim()) errs[l.id + "name"] = "Enter a destination.";
      if (!Number.isInteger(l.days) || l.days < 1 || l.days > 90)
        errs[l.id + "days"] = "Enter 1 to 90 whole days.";
    }
    const kg = Number(limit);
    if (weightCheck && (!Number.isFinite(kg) || kg < 1 || kg > 40))
      errs["limit"] = "Enter a combined limit between 1 and 40 kg.";
    if (weightCheck && souvenir >= kg) errs["souvenir"] = "Leave some of the weight allowance for your packing.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const trip = buildPackingTrip({
      id: crypto.randomUUID(),
      startDate,
      stops: stops.map((l, i) => ({ ...l, name: l.name.trim(), startDate: dates[i]?.start, endDate: dates[i]?.end,
        weather: l.weather?.key.endsWith(`:${dates[i]?.start}:${dates[i]?.end}`) ? l.weather : undefined })),
      carryOnL: carry,
      personalL: personal,
      limitKg: weightCheck ? kg : 10,
      weightCheck,
      souvenirKg: souvenir,
      laundry,
      sample: false,
    });
    savePackingTrip(trip);
    toast.success("Your packing plan is ready");
    navigate({ to: "/trips/$tripId", params: { tripId: trip.id } });
  };
  const error = (key: string) =>
    errors[key] ? (
      <p id={key + "-error"} className="mt-2 text-destructive">
        {errors[key]}
      </p>
    ) : null;
  return (
    <div className="craft-setup mx-auto max-w-3xl px-5 py-10">
      <p className="mb-2 font-medium text-primary">YOUR NEXT ADVENTURE</p>
      <h1 className="text-4xl font-semibold">Plan my trip</h1>
      <form onSubmit={submit} noValidate className="mt-8 space-y-8">
        <section>
          <h2 className="mb-4 text-2xl">Where are you going?</h2>
          <div className="mb-6 max-w-sm">
            <Label htmlFor="trip-start">Trip start date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild><Button id="trip-start" type="button" variant="outline" className="mt-1 min-h-11 w-full justify-start font-normal"><CalendarIcon aria-hidden />{format(parseISO(startDate), "MMM d, yyyy")}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={parseISO(startDate)} defaultMonth={parseISO(startDate)} onSelect={(date) => { if (date) { setStartDate(format(date, "yyyy-MM-dd")); setCalendarOpen(false); } }} className="pointer-events-auto [--cell-size:2.75rem]" /></PopoverContent>
            </Popover>
          </div>
          {error("stops")}
          <div className="divide-y">
            {stops.map((l, i) => (
              <fieldset key={l.id} className="py-5 first:pt-0">
                <legend className="sr-only">Destination {i + 1}</legend>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-sans font-semibold">Stop {i + 1}</h3>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove stop ${i + 1}`}
                    onClick={() => setStops((s) => s.filter((x) => x.id !== l.id))}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
                <div className="grid grid-cols-[1fr_90px] gap-3">
                  <StopClimate stop={l} dates={dates[i]} patch={patch} invalid={!!errors[l.id + "name"]} describedBy={errors[l.id + "name"] ? l.id + "name-error" : undefined} />
                  <div className="order-2">
                    <Label htmlFor={l.id + "days"}>Days</Label>
                    <Input
                      id={l.id + "days"}
                      type="number"
                      min={1}
                      max={90}
                      value={Number.isNaN(l.days) ? "" : l.days}
                      onChange={(e) =>
                        patch(l.id, { days: e.target.value === "" ? NaN : Number(e.target.value) })
                      }
                      aria-invalid={!!errors[l.id + "days"]}
                      aria-describedby={errors[l.id + "days"] ? l.id + "days-error" : undefined}
                    />
                    {error(l.id + "days")}
                  </div>
                  <div className="order-4 col-span-2">{error(l.id + "name")}</div>
                </div>
                <div className="mt-4 space-y-4">
                  <fieldset>
                    <legend className="mb-2 font-medium">Activities</legend>
                    <div className="flex flex-wrap gap-2">
                      {(["city", "hiking", "beach", "dinner"] as PackingActivity[]).map((a) => (
                        <Button
                          type="button"
                          key={a}
                          variant={l.activities.includes(a) ? "secondary" : "outline"}
                          aria-pressed={l.activities.includes(a)}
                          className={`min-h-11 border-2 capitalize ${l.activities.includes(a) ? "border-primary" : "border-border"}`}
                          onClick={() =>
                            patch(l.id, {
                              activities: l.activities.includes(a)
                                ? l.activities.filter((x) => x !== a)
                                : [...l.activities, a],
                            })
                          }
                        >
                          {l.activities.includes(a) && <Check aria-hidden className="size-4 shrink-0" />}
                          {a}
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </fieldset>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={stops.length >= 4}
            onClick={() => setStops((s) => [...s, newStop()])}
          >
            <Plus aria-hidden />
            Add destination
          </Button>
        </section>
        <section className="border-t pt-7">
          <Chips label="Can you do laundry on this trip?" options={LAUNDRY_OPTIONS} value={laundry} onChange={setLaundry} />
        </section>
        <section className="border-t pt-7">
          <h2 className="mb-2 text-2xl">Your two bags</h2>
          <p className="mb-5 text-muted-foreground">Typical sizes, check your airline.</p>
          <div className="space-y-5">
            <div className="max-w-sm">
              <Label htmlFor="airline">Flying with (optional)</Label>
              <select
                id="airline"
                value={airline}
                onChange={(e) => {
                  const name = e.target.value;
                  setAirline(name);
                  const a = AIRLINES.find((x) => x.name === name);
                  if (!a) { setWeightCheck(true); }
                  if (a) {
                    setCarry(a.carryOnL);
                    setPersonal(a.personalL);
                    setLimit(String(a.limitKg ?? 10));
                    setWeightCheck(a.limitKg !== null);
                    toast.success(`Bag limits set for ${a.name}`);
                  }
                }}
                aria-describedby="airline-note"
                className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Other / I'll set it myself</option>
                {AIRLINES.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name} · {a.limitKg === null ? "No weight limit" : `${a.limitKg} kg`}
                  </option>
                ))}
              </select>
              <p id="airline-note" className="mt-2 text-muted-foreground">
                {AIRLINES.find((x) => x.name === airline)?.note ??
                  "Pick an airline to fill in its typical bag sizes and weight limit. You can still change them."}
              </p>
              {preset && airline === preset.name && <p className="mt-2 text-muted-foreground">Filled in from {preset.name}. You can change any of these.</p>}
            </div>
            <Chips
              label="Carry-on"
              options={[...new Set([30, 40, 45, carry])].sort((a, b) => a - b).map((litres) => `${litres} L`)}
              value={`${carry} L`}
              onChange={(v) => setCarry(Number.parseFloat(v))}
            />
            <Chips
              label="Personal item"
              options={[...new Set([12, 18, 25, personal])].sort((a, b) => a - b).map((litres) => `${litres} L`)}
              value={`${personal} L`}
              onChange={(v) => setPersonal(Number.parseFloat(v))}
            />
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center"><Checkbox id="weight-check" checked={!weightCheck} onCheckedChange={(v) => setWeightCheck(v !== true)} className="relative size-5 shadow-none after:absolute after:-inset-3 after:content-[''] [&_svg]:size-4" /></div>
              <Label htmlFor="weight-check" className="flex min-h-11 items-center">No weight limit — check volume only</Label>
            </div>
            {weightCheck && <div className="max-w-xs">
              <Label htmlFor="limit">Combined weight limit (kg)</Label>
              <Input
                id="limit"
                inputMode="decimal"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                aria-invalid={!!errors["limit"]}
              />
              {error("limit")}
            </div>}
          </div>
        </section>
        <section className="border-t pt-7">
          <div className="mb-5 flex justify-between">
            <Label id="souvenir" className="text-xl">
              Room for souvenirs
            </Label>
            <span className="font-semibold text-accent">{souvenir.toFixed(1)} kg</span>
          </div>
          <Slider
            aria-labelledby="souvenir"
            aria-valuetext={`${souvenir.toFixed(1)} kilograms reserved for souvenirs`}
            className="min-h-11"
            min={0}
            max={5}
            step={0.1}
            value={[souvenir]}
            onValueChange={(v) => setSouvenir(v[0] ?? 0)}
          />
          {error("souvenir")}
        </section>
        <Button type="submit" size="lg" className="w-full whitespace-normal">
          Build my packing plan
          <ArrowRight aria-hidden />
        </Button>
      </form>
    </div>
  );
}

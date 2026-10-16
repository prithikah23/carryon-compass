import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLoading } from "@/components/common";
import { ActivityPicker } from "@/components/ItemForm";
import { actions, useAppState } from "@/lib/store";
import { addDays, parseDate, toISO, uid } from "@/lib/format";
import { emptyOverrides, type Activity, type BagId, type LimitType, type Rain, type Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trips/new")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => (typeof s.edit === "string" ? { edit: s.edit } : {}),
  head: () => ({
    meta: [
      { title: "Plan a trip — Carry-On Compass" },
      { name: "description", content: "Set your bags, add each leg's weather and activities, and save room for souvenirs." },
      { property: "og:title", content: "Plan a trip — Carry-On Compass" },
      { property: "og:description", content: "Three quick steps to a packing list that fits a carry-on and a personal item." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewTrip,
});

interface LegDraft {
  id: string;
  destination: string;
  start: string;
  end: string;
  low: string;
  high: string;
  rain: Rain;
  activities: Activity[];
}

interface Draft {
  name: string;
  carryOnL: string;
  personalL: string;
  carryOnEmptyKg: string;
  personalEmptyKg: string;
  limitType: LimitType;
  combinedKg: string;
  carryOnKg: string;
  personalKg: string;
  legs: LegDraft[];
  souvenirKg: number;
  souvenirL: number;
  souvenirBag: BagId;
  laundry: boolean;
  wearHeaviest: boolean;
}

const PRESETS = [
  { label: "Strict budget airline", desc: "7 kg combined · 35 L + 15 L", v: { limitType: "combined" as LimitType, combinedKg: "7", carryOnL: "35", personalL: "15" } },
  { label: "Standard", desc: "10 kg combined · 40 L + 18 L", v: { limitType: "combined" as LimitType, combinedKg: "10", carryOnL: "40", personalL: "18" } },
  { label: "Separate limits", desc: "8 kg + 4 kg · 40 L + 20 L", v: { limitType: "separate" as LimitType, carryOnKg: "8", personalKg: "4", carryOnL: "40", personalL: "20" } },
];

function blankLeg(start: string): LegDraft {
  return { id: uid(), destination: "", start, end: addDays(start, 2), low: "10", high: "20", rain: "none", activities: ["city"] };
}

function fromTrip(t: Trip): Draft {
  const s = (n: number) => String(n);
  return {
    name: t.name,
    carryOnL: s(t.carryOnL),
    personalL: s(t.personalL),
    carryOnEmptyKg: s(t.carryOnEmptyKg),
    personalEmptyKg: s(t.personalEmptyKg),
    limitType: t.limitType,
    combinedKg: s(t.combinedKg),
    carryOnKg: s(t.carryOnKg),
    personalKg: s(t.personalKg),
    legs: t.legs.map((l) => ({ ...l, low: s(l.low), high: s(l.high) })),
    souvenirKg: t.souvenirKg,
    souvenirL: t.souvenirL,
    souvenirBag: t.souvenirBag,
    laundry: t.laundry,
    wearHeaviest: t.wearHeaviest,
  };
}

function blankDraft(): Draft {
  const start = toISO(Date.now() + 30 * 86400000);
  return {
    name: "",
    carryOnL: "40",
    personalL: "18",
    carryOnEmptyKg: "2.3",
    personalEmptyKg: "0.6",
    limitType: "combined",
    combinedKg: "10",
    carryOnKg: "7",
    personalKg: "3",
    legs: [blankLeg(start)],
    souvenirKg: 1,
    souvenirL: 4,
    souvenirBag: "carryOn",
    laundry: false,
    wearHeaviest: true,
  };
}

const STEPS = ["Bags", "Legs", "Options"];

function NewTrip() {
  const s = useAppState();
  const { edit } = Route.useSearch();
  if (!s.loaded) return <PageLoading />;
  const existing = edit ? s.trips.find((t) => t.id === edit) : undefined;
  return <Builder key={existing?.id ?? "new"} existing={existing} />;
}

function Builder({ existing }: { existing?: Trip }) {
  const navigate = useNavigate();
  const [d, setD] = useState<Draft>(() => (existing ? fromTrip(existing) : blankDraft()));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const setLeg = (id: string, patch: Partial<LegDraft>) => setD((p) => ({ ...p, legs: p.legs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const num = (v: string) => Number(v.replace(",", "."));
  const validate = (st: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (st === 0) {
      if (!d.name.trim()) e["name"] = "Give your trip a name.";
      const pos = (k: keyof Draft, label: string, max: number, min = 0.1) => {
        const v = num(String(d[k]));
        if (!Number.isFinite(v) || v < min || v > max) e[k] = `Enter ${label} between ${min} and ${max}.`;
      };
      pos("carryOnL", "a volume", 120, 1);
      pos("personalL", "a volume", 60, 1);
      pos("carryOnEmptyKg", "a weight", 10, 0);
      pos("personalEmptyKg", "a weight", 5, 0);
      if (d.limitType === "combined") pos("combinedKg", "a limit", 40, 1);
      if (d.limitType === "separate") {
        pos("carryOnKg", "a limit", 30, 1);
        pos("personalKg", "a limit", 20, 1);
      }
    }
    if (st === 1) {
      if (!d.legs.length) e["legs"] = "Add at least one leg.";
      d.legs.forEach((l) => {
        if (!l.destination.trim()) e[`${l.id}-destination`] = "Enter a destination.";
        if (!l.start) e[`${l.id}-start`] = "Pick a start date.";
        if (!l.end) e[`${l.id}-end`] = "Pick an end date.";
        else if (l.start && parseDate(l.end) < parseDate(l.start)) e[`${l.id}-end`] = "End date must be on or after the start date.";
        else if (l.start && parseDate(l.end) - parseDate(l.start) > 90 * 86400000) e[`${l.id}-end`] = "Keep each leg under 90 days.";
        const lo = num(l.low);
        const hi = num(l.high);
        if (!Number.isFinite(lo) || lo < -40 || lo > 50) e[`${l.id}-low`] = "Enter a low between -40 and 50 °C.";
        if (!Number.isFinite(hi) || hi < -40 || hi > 55) e[`${l.id}-high`] = "Enter a high between -40 and 55 °C.";
        else if (Number.isFinite(lo) && hi < lo) e[`${l.id}-high`] = "High must be at least the low.";
      });
      const sorted = [...d.legs].filter((l) => l.start && l.end).sort((a, b) => parseDate(a.start) - parseDate(b.start));
      for (let i = 1; i < sorted.length; i++) {
        if (parseDate(sorted[i]!.start) <= parseDate(sorted[i - 1]!.end)) {
          e[`${sorted[i]!.id}-start`] = `Overlaps with ${sorted[i - 1]!.destination || "the previous leg"}. Start the day after it ends.`;
        }
      }
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (step < 2) setStep(step + 1);
    else finish();
  };

  const finish = () => {
    const trip: Trip = {
      id: existing?.id ?? uid(),
      name: d.name.trim(),
      carryOnL: num(d.carryOnL),
      personalL: num(d.personalL),
      carryOnEmptyKg: num(d.carryOnEmptyKg),
      personalEmptyKg: num(d.personalEmptyKg),
      limitType: d.limitType,
      combinedKg: num(d.combinedKg),
      carryOnKg: num(d.carryOnKg),
      personalKg: num(d.personalKg),
      legs: d.legs.map((l) => ({ ...l, destination: l.destination.trim(), low: num(l.low), high: num(l.high) })),
      souvenirKg: d.souvenirKg,
      souvenirL: d.souvenirL,
      souvenirBag: d.souvenirBag,
      laundry: d.laundry,
      wearHeaviest: d.wearHeaviest,
      overrides: existing?.overrides ?? emptyOverrides(),
      checked: existing?.checked ?? [],
      sample: existing?.sample,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    actions.saveTrip(trip);
    toast.success(existing ? "Trip updated" : "Trip saved. Here's your plan.");
    navigate({ to: "/trips/$tripId", params: { tripId: trip.id } });
  };

  const field = (k: string, label: string, input: React.ReactNode, hint?: string) => (
    <div>
      <Label htmlFor={k}>{label}</Label>
      {input}
      {hint && !errors[k] && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {errors[k] && (
        <p id={`${k}-err`} className="mt-1 text-sm font-medium text-destructive">
          {errors[k]}
        </p>
      )}
    </div>
  );
  const inp = (k: string, value: string, onChange: (v: string) => void, props: React.ComponentProps<"input"> = {}) => (
    <Input id={k} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-err` : undefined} {...props} />
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/trips" className="mb-4 inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All trips
      </Link>
      <h1 className="text-3xl font-semibold sm:text-4xl">{existing ? "Edit trip" : "Plan my own trip"}</h1>

      <ol className="my-6 grid grid-cols-3 gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <div className={cn("h-2 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
            <p className={cn("mt-2 text-sm font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
              {i < step ? <Check className="mr-1 inline size-4" aria-hidden /> : null}
              Step {i + 1}: {label}
            </p>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 ref={headingRef} tabIndex={-1} className="mb-5 text-2xl font-semibold outline-none">
          {step === 0 ? "Your bags" : step === 1 ? "Where you're going" : "Options"}
        </h2>

        {step === 0 && (
          <div className="space-y-5">
            {field("name", "Trip name", inp("name", d.name, (v) => set("name", v), { placeholder: "e.g. Lisbon > Azores" }))}
            <div>
              <p className="mb-2 text-sm font-medium">Typical limits, check your airline</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setD((prev) => ({ ...prev, ...p.v }));
                      toast.success(`Filled in “${p.label}”`);
                    }}
                    className="min-h-11 rounded-xl border bg-background p-3 text-left hover:bg-secondary"
                  >
                    <span className="block font-semibold">{p.label}</span>
                    <span className="text-sm text-muted-foreground">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("carryOnL", "Carry-on suitcase volume (L)", inp("carryOnL", d.carryOnL, (v) => set("carryOnL", v), { inputMode: "decimal" }))}
              {field("personalL", "Personal item volume (L)", inp("personalL", d.personalL, (v) => set("personalL", v), { inputMode: "decimal" }))}
              {field("carryOnEmptyKg", "Empty carry-on weight (kg)", inp("carryOnEmptyKg", d.carryOnEmptyKg, (v) => set("carryOnEmptyKg", v), { inputMode: "decimal" }), "Most airlines weigh the bag too.")}
              {field("personalEmptyKg", "Empty personal item weight (kg)", inp("personalEmptyKg", d.personalEmptyKg, (v) => set("personalEmptyKg", v), { inputMode: "decimal" }))}
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Weight limit</legend>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                {(
                  [
                    ["combined", "Combined for both bags"],
                    ["separate", "Separate per bag"],
                    ["none", "No weight limit"],
                  ] as [LimitType, string][]
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={d.limitType === v}
                    onClick={() => set("limitType", v)}
                    className={cn("min-h-11 rounded-xl border px-3 font-medium", d.limitType === v ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-secondary")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            {d.limitType === "combined" && field("combinedKg", "Combined limit (kg)", inp("combinedKg", d.combinedKg, (v) => set("combinedKg", v), { inputMode: "decimal" }))}
            {d.limitType === "separate" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {field("carryOnKg", "Carry-on limit (kg)", inp("carryOnKg", d.carryOnKg, (v) => set("carryOnKg", v), { inputMode: "decimal" }))}
                {field("personalKg", "Personal item limit (kg)", inp("personalKg", d.personalKg, (v) => set("personalKg", v), { inputMode: "decimal" }))}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            {errors["legs"] && <p className="font-medium text-destructive">{errors["legs"]}</p>}
            {d.legs.map((l, i) => (
              <fieldset key={l.id} className="rounded-xl border bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <legend className="font-display text-lg font-semibold">Leg {i + 1}</legend>
                  {d.legs.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => set("legs", d.legs.filter((x) => x.id !== l.id))} aria-label={`Remove leg ${i + 1}`}>
                      <Trash2 aria-hidden /> Remove
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">{field(`${l.id}-destination`, "Destination", inp(`${l.id}-destination`, l.destination, (v) => setLeg(l.id, { destination: v }), { placeholder: "e.g. Reykjavik" }))}</div>
                  {field(`${l.id}-start`, "Start date", inp(`${l.id}-start`, l.start, (v) => setLeg(l.id, { start: v }), { type: "date" }))}
                  {field(`${l.id}-end`, "End date", inp(`${l.id}-end`, l.end, (v) => setLeg(l.id, { end: v }), { type: "date" }))}
                  {field(`${l.id}-low`, "Low temperature (°C)", inp(`${l.id}-low`, l.low, (v) => setLeg(l.id, { low: v }), { inputMode: "numeric" }))}
                  {field(`${l.id}-high`, "High temperature (°C)", inp(`${l.id}-high`, l.high, (v) => setLeg(l.id, { high: v }), { inputMode: "numeric" }))}
                  <div>
                    <Label htmlFor={`${l.id}-rain`}>Rain</Label>
                    <Select value={l.rain} onValueChange={(v) => setLeg(l.id, { rain: v as Rain })}>
                      <SelectTrigger id={`${l.id}-rain`} className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="some">Some</SelectItem>
                        <SelectItem value="lots">Lots</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <fieldset className="mt-4">
                  <legend className="mb-2 text-sm font-medium">Activities</legend>
                  <ActivityPicker value={l.activities} onChange={(v) => setLeg(l.id, { activities: v })} />
                </fieldset>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const last = [...d.legs].filter((l) => l.end).sort((a, b) => parseDate(b.end) - parseDate(a.end))[0];
                set("legs", [...d.legs, blankLeg(last ? addDays(last.end, 1) : toISO(Date.now()))]);
              }}
            >
              <Plus aria-hidden /> Add another leg
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <fieldset className="space-y-5">
              <legend className="mb-1 font-medium">Souvenir reserve</legend>
              <p className="text-muted-foreground">Space and weight kept free so you can bring things home.</p>
              <div>
                <div className="mb-2 flex justify-between">
                  <Label id="sv-kg">Weight</Label>
                  <span className="font-semibold">{d.souvenirKg.toFixed(1)} kg</span>
                </div>
                <Slider aria-labelledby="sv-kg" min={0} max={5} step={0.1} value={[d.souvenirKg]} onValueChange={([v]) => set("souvenirKg", v ?? 0)} />
              </div>
              <div>
                <div className="mb-2 flex justify-between">
                  <Label id="sv-l">Space</Label>
                  <span className="font-semibold">{d.souvenirL} L</span>
                </div>
                <Slider aria-labelledby="sv-l" min={0} max={15} step={0.5} value={[d.souvenirL]} onValueChange={([v]) => set("souvenirL", v ?? 0)} />
              </div>
              <div>
                <Label htmlFor="sv-bag">Keep it in</Label>
                <Select value={d.souvenirBag} onValueChange={(v) => set("souvenirBag", v as BagId)}>
                  <SelectTrigger id="sv-bag" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carryOn">Carry-on</SelectItem>
                    <SelectItem value="personal">Personal item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </fieldset>
            <div className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4">
              <div>
                <Label htmlFor="laundry" className="text-base">Laundry available</Label>
                <p className="text-sm text-muted-foreground">Clothes can be rewashed, so you need fewer of them.</p>
              </div>
              <Switch id="laundry" checked={d.laundry} onCheckedChange={(v) => set("laundry", v)} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4">
              <div>
                <Label htmlFor="wear" className="text-base">Wear heaviest items on travel days</Label>
                <p className="text-sm text-muted-foreground">Shoes, jacket and warmest layer go on you, not in your bags.</p>
              </div>
              <Switch id="wear" checked={d.wearHeaviest} onCheckedChange={(v) => set("wearHeaviest", v)} />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
            <ArrowLeft aria-hidden /> Back
          </Button>
          <Button type="button" onClick={next}>
            {step < 2 ? (
              <>
                Next <ArrowRight aria-hidden />
              </>
            ) : existing ? (
              "Save and see plan"
            ) : (
              "Create my plan"
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}

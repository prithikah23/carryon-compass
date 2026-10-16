import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  CircleAlert,
  Droplets,
  Pencil,
  Plane,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, PageLoading, SampleBadge } from "@/components/common";
import { MeterBar } from "@/components/plan/Meters";
import { Tour } from "@/components/plan/Tour";
import { actions, useAppState } from "@/lib/store";
import { computePlan, swapKey, type Fix, type PackedEntry, type Plan } from "@/lib/engine";
import { fmtDay, fmtShort, fmtVolume, fmtWeight } from "@/lib/format";
import { bagLabel, CATEGORIES, categoryPlural, emptyOverrides, otherBag, type BagId, type Item, type Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "Trip plan — Carry-On Compass" },
      { name: "description", content: "Do your bags fit? Packing list, daily outfits, gate-check backup and liquids check for your trip." },
      { property: "og:title", content: "Trip plan — Carry-On Compass" },
      { property: "og:description", content: "A packing list that fits both bags, an outfit for every day, and room for souvenirs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TripPage,
});

function TripPage() {
  const s = useAppState();
  const { tripId } = Route.useParams();
  if (!s.loaded) return <PageLoading />;
  const trip = s.trips.find((t) => t.id === tripId);
  if (!trip)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="We couldn't find that trip."
          actions={
            <>
              <Button asChild>
                <Link to="/trips">See your trips</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/settings">Bring back the sample trip</Link>
              </Button>
            </>
          }
        >
          It may have been deleted. The sample trip can be restored from Settings.
        </EmptyState>
      </div>
    );
  return <TripPlan trip={trip} items={s.items} tourDone={s.prefs.tourDone} bannerDismissed={s.prefs.bannerDismissed} />;
}

function TripPlan({ trip, items, tourDone, bannerDismissed }: { trip: Trip; items: Item[]; tourDone: boolean; bannerDismissed: boolean }) {
  const plan = useMemo(() => computePlan(trip, items), [trip, items]);
  const [returning, setReturning] = useState(false);
  const [tab, setTab] = useState<"plan" | "checklist">("plan");
  const [addOpen, setAddOpen] = useState(false);
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const showTour = !!trip.sample && !tourDone && plan.entries.length > 0 && tab === "plan";

  const ov = (fn: (o: Trip["overrides"]) => Trip["overrides"]) => actions.patchOverrides(trip.id, fn);
  const move = (id: string, to: BagId) => {
    ov((o) => ({ ...o, bagMoves: { ...o.bagMoves, [id]: to } }));
    toast.success(`Moved ${itemById.get(id)?.name} to your ${bagLabel(to).toLowerCase()}`);
  };
  const remove = (id: string) => {
    ov((o) => ({ ...o, removed: [...new Set([...o.removed, id])], added: o.added.filter((x) => x !== id) }));
    toast.success(`Removed ${itemById.get(id)?.name} from the list`);
  };
  const add = (id: string) => {
    ov((o) => ({ ...o, added: [...new Set([...o.added, id])], removed: o.removed.filter((x) => x !== id) }));
    toast.success(`Added ${itemById.get(id)?.name}`);
  };
  const applyFix = (f: Fix) => {
    if (f.action.type === "remove") remove(f.action.itemId);
    else if (f.action.type === "move") move(f.action.itemId, f.action.to);
    else {
      actions.patchTrip(trip.id, (t) => ({ ...t, wearHeaviest: true }));
      toast.success("Heaviest items will be worn on travel days");
    }
  };
  const restore = () => {
    actions.patchTrip(trip.id, (t) => ({ ...t, overrides: emptyOverrides() }));
    toast.success("Recommendation restored");
  };
  const endTour = useCallback(() => actions.setPrefs({ tourDone: true }), []);

  const legs = [...trip.legs].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {trip.sample && (
        <p className="mb-4 rounded-xl bg-warning-soft px-4 py-3 text-foreground">
          Using sample data.{" "}
          <Link to="/trips/new" className="font-semibold text-primary underline underline-offset-4">
            Plan my own trip
          </Link>
        </p>
      )}
      {trip.sample && tourDone && !bannerDismissed && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-secondary px-4 py-3">
          <p className="font-medium text-secondary-foreground">
            Ready to try yours?{" "}
            <Link to="/trips/new" className="text-primary underline underline-offset-4">
              Plan my own trip
            </Link>
          </p>
          <Button variant="ghost" size="icon" aria-label="Dismiss" onClick={() => actions.setPrefs({ bannerDismissed: true })}>
            <X aria-hidden />
          </Button>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold sm:text-3xl">{trip.name}</h1>
            {trip.sample && <SampleBadge />}
          </div>
          {legs.length > 0 && (
            <p className="mt-1 text-muted-foreground">
              {fmtShort(legs[0]!.start)} – {fmtShort(legs[legs.length - 1]!.end)} · {plan.days.length} days · {trip.carryOnL} L carry-on + {trip.personalL} L personal item
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.modified && (
            <Button variant="outline" onClick={restore}>
              <RotateCcw aria-hidden /> Restore recommendation
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/trips/new" search={{ edit: trip.id }}>
              <Pencil aria-hidden /> Edit trip
            </Link>
          </Button>
        </div>
      </div>

      <Verdict plan={plan} onFix={applyFix} />

      <div role="tablist" aria-label="View" className="my-6 inline-flex rounded-xl border bg-card p-1">
        {(["plan", "checklist"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("min-h-11 rounded-lg px-5 font-semibold", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}
          >
            {t === "plan" ? "Plan" : "Checklist"}
          </button>
        ))}
      </div>

      {tab === "checklist" ? (
        <Checklist trip={trip} plan={plan} />
      ) : plan.entries.length === 0 ? (
        <EmptyState
          title={plan.days.length ? "Nothing to pack yet." : "This trip has no legs yet."}
          actions={
            plan.days.length ? (
              <Button asChild>
                <Link to="/wardrobe">Add clothes to your wardrobe</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/trips/new" search={{ edit: trip.id }}>Add a leg</Link>
              </Button>
            )
          }
        >
          {plan.days.length ? "Your wardrobe is empty. Add the clothes you might bring and the plan fills in automatically." : "Add where you're going so we can match outfits to the weather."}
        </EmptyState>
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="bags-h" className="rounded-2xl border bg-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="bags-h" className="text-xl font-semibold">Your bags</h2>
              <div data-tour="return" role="radiogroup" aria-label="Direction" className="inline-flex rounded-xl border bg-background p-1">
                {[
                  [false, "Outbound"],
                  [true, "Return"],
                ].map(([v, label]) => (
                  <button
                    key={String(label)}
                    role="radio"
                    aria-checked={returning === v}
                    onClick={() => setReturning(v as boolean)}
                    className={cn("min-h-11 rounded-lg px-4 font-semibold", returning === v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary")}
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
            <p className="mb-4 text-muted-foreground" aria-live="polite">
              {returning
                ? plan.verdict.ok
                  ? `Coming home with ${fmtWeight(trip.souvenirKg * 1000)} and ${fmtVolume(trip.souvenirL)} of souvenirs: both bags still fit.`
                  : `With ${fmtWeight(trip.souvenirKg * 1000)} and ${fmtVolume(trip.souvenirL)} of souvenirs, your bags won't fit. Try the fixes above.`
                : `The striped part is kept empty for souvenirs in your ${bagLabel(trip.souvenirBag).toLowerCase()}.`}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {(["carryOn", "personal"] as BagId[]).map((b) => (
                <div key={b} className="space-y-4 rounded-xl border bg-background p-4">
                  <h3 className="text-lg font-semibold">{bagLabel(b)}</h3>
                  <MeterBar m={{ ...plan.bags[b].volume, label: "Space" }} returning={returning} />
                  <MeterBar m={{ ...plan.bags[b].weight, label: "Weight" }} returning={returning} />
                </div>
              ))}
            </div>
            {plan.combined && (
              <div className="mt-4 rounded-xl border bg-background p-4">
                <MeterBar m={plan.combined} returning={returning} />
              </div>
            )}
            <p className="mt-3 text-sm text-muted-foreground">Weights include the empty bags ({trip.carryOnEmptyKg} kg + {trip.personalEmptyKg} kg).</p>
          </section>

          <WearOnPlane trip={trip} plan={plan} />

          <div className="grid gap-6 lg:grid-cols-2">
            <GateCheck plan={plan} onMove={(id) => move(id, "personal")} />
            <Liquids plan={plan} />
          </div>

          <PackingList plan={plan} onMove={move} onRemove={remove} onAdd={() => setAddOpen(true)} />

          <Outfits plan={plan} itemById={itemById} trip={trip} />
        </div>
      )}

      <AddItemsDialog open={addOpen} onOpenChange={setAddOpen} items={items} plan={plan} onAdd={add} />
      {showTour && <Tour onDone={endTour} />}
    </div>
  );
}

function Verdict({ plan, onFix }: { plan: Plan; onFix: (f: Fix) => void }) {
  return (
    <section
      data-tour="verdict"
      aria-live="polite"
      className={cn("rounded-2xl border-2 p-5", plan.verdict.ok ? "border-success/40 bg-success-soft" : "border-destructive/30 bg-danger-soft")}
    >
      <p className={cn("flex items-start gap-3 font-display text-2xl font-semibold sm:text-3xl", plan.verdict.ok ? "text-success" : "text-destructive")}>
        {plan.verdict.ok ? <CheckCircle2 className="mt-1 size-7 shrink-0" aria-hidden /> : <AlertTriangle className="mt-1 size-7 shrink-0" aria-hidden />}
        <span>{plan.verdict.text}</span>
      </p>
      {plan.fixes.length > 0 && (
        <ol className="mt-4 space-y-2">
          {plan.fixes.map((f, i) => (
            <li key={f.id} className="flex flex-col gap-2 rounded-xl bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="mr-2 font-semibold">{i + 1}.</span>
                {f.text}
              </span>
              <Button size="sm" onClick={() => onFix(f)}>
                {f.action.type === "remove" ? "Remove it" : f.action.type === "move" ? "Move it" : "Turn on"}
              </Button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function WearOnPlane({ trip, plan }: { trip: Trip; plan: Plan }) {
  const worn = plan.entries.filter((e) => e.bag === "worn");
  return (
    <section data-tour="plane" aria-labelledby="plane-h" className="rounded-2xl border bg-card p-5">
      <h2 id="plane-h" className="flex items-center gap-2 text-xl font-semibold">
        <Plane className="size-5 text-accent" aria-hidden /> Wear on the plane
      </h2>
      {trip.wearHeaviest && worn.length ? (
        <>
          <p className="mt-1 font-semibold text-success">You save {fmtWeight(plan.planeSavedG)} by wearing these.</p>
          <p className="text-sm text-muted-foreground">
            Travel days: {plan.days.filter((d) => d.travel).map((d) => fmtShort(d.date)).join(", ")}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {worn.map((e) => (
              <li key={e.item.id} className="flex items-center gap-2 rounded-full border bg-background px-3 py-2">
                <span className="size-4 rounded-full border" style={{ backgroundColor: e.item.color }} aria-hidden />
                {e.item.name} <span className="text-sm text-muted-foreground">{fmtWeight(e.item.weightG)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">Wearing your shoes and jacket on travel days keeps them out of your bags.</p>
          <Button
            variant="outline"
            onClick={() => {
              actions.patchTrip(trip.id, (t) => ({ ...t, wearHeaviest: true }));
              toast.success("Heaviest items will be worn on travel days");
            }}
          >
            Turn on
          </Button>
        </div>
      )}
    </section>
  );
}

function GateCheck({ plan, onMove }: { plan: Plan; onMove: (id: string) => void }) {
  const all = plan.gate.every((g) => g.covered);
  return (
    <section aria-labelledby="gate-h" className="rounded-2xl border bg-card p-5">
      <h2 id="gate-h" className="flex items-center gap-2 text-xl font-semibold">
        <ShieldCheck className="size-5 text-accent" aria-hidden /> If your carry-on gets gate-checked
      </h2>
      <p className="mt-1 text-muted-foreground">
        {all ? "Your personal item has everything for the first day." : "Your personal item is missing a few first-day things."}
      </p>
      <ul className="mt-3 space-y-2">
        {plan.gate.map((g) => (
          <li key={g.label} className="flex flex-col gap-2 rounded-xl bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2">
              {g.covered ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Covered" />
              ) : (
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-label="Missing" />
              )}
              <span>
                <span className="font-medium">{g.label}</span>
                {!g.covered && g.fix && <span className="block text-sm text-muted-foreground">{g.fix}</span>}
              </span>
            </span>
            {!g.covered && g.action && (
              <Button size="sm" variant="outline" onClick={() => onMove(g.action!.itemId)}>
                Move it
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Liquids({ plan }: { plan: Plan }) {
  const { items, totalMl, oversize } = plan.liquids;
  const pct = Math.min(100, (totalMl / 1000) * 100);
  return (
    <section aria-labelledby="liq-h" className="rounded-2xl border bg-card p-5">
      <h2 id="liq-h" className="flex items-center gap-2 text-xl font-semibold">
        <Droplets className="size-5 text-accent" aria-hidden /> Liquids check
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Common airport rule, check your departure airport.</p>
      {items.length === 0 ? (
        <p className="mt-3 text-muted-foreground">No liquids packed. Mark toiletries as liquid in your wardrobe to check them here.</p>
      ) : (
        <>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">1 L clear bag</span>
              <span>{totalMl} mL of 1,000 mL</span>
            </div>
            <div role="meter" aria-label="Liquids in clear bag" aria-valuemin={0} aria-valuemax={1000} aria-valuenow={totalMl} className="h-3 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full", totalMl > 1000 ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
            </div>
            <p className={cn("mt-1 text-sm font-semibold", totalMl > 1000 ? "text-destructive" : "text-success")}>
              {totalMl > 1000 ? `Over by ${totalMl - 1000} mL` : "Fits in one clear bag"}
            </p>
          </div>
          <ul className="mt-3 divide-y">
            {items.map((i) => {
              const big = oversize.includes(i);
              return (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <span>{i.name}</span>
                  <span className={cn("text-sm", big ? "font-semibold text-destructive" : "text-muted-foreground")}>
                    {i.containerMl} mL{big ? " · over 100 mL, check it or decant" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

function PackingList({
  plan,
  onMove,
  onRemove,
  onAdd,
}: {
  plan: Plan;
  onMove: (id: string, to: BagId) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const groups = CATEGORIES.map((c) => ({ c, list: plan.entries.filter((e) => e.item.category === c.value) })).filter((g) => g.list.length);
  let first = true;
  return (
    <section aria-labelledby="pack-h" className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="pack-h" className="text-xl font-semibold">Packing list</h2>
          <p className="text-muted-foreground">{plan.entries.length} items · every one says why it's here</p>
        </div>
        <Button variant="outline" onClick={onAdd}>
          <Plus aria-hidden /> Add items
        </Button>
      </div>
      <div className="space-y-5">
        {groups.map(({ c, list }) => (
          <div key={c.value}>
            <h3 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">{categoryPlural(c.value)}</h3>
            <ul className="space-y-2">
              {list.map((e) => {
                const tour = first;
                first = false;
                return <PackRow key={e.item.id} e={e} tour={tour} onMove={onMove} onRemove={onRemove} />;
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function PackRow({ e, tour, onMove, onRemove }: { e: PackedEntry; tour: boolean; onMove: (id: string, to: BagId) => void; onRemove: (id: string) => void }) {
  const bagText = e.bag === "worn" ? "Worn on the plane" : bagLabel(e.bag);
  return (
    <li data-tour={tour ? "packing" : undefined} className="flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <span className="mt-1 size-6 shrink-0 rounded-full border" style={{ backgroundColor: e.item.color }} aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold">
            {e.item.name} <span className="font-normal text-muted-foreground">· {fmtWeight(e.item.weightG)} · {fmtVolume(e.item.volumeL)}</span>
          </p>
          <p className="text-muted-foreground">{e.reason}</p>
          <p className="mt-1 text-sm">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 font-semibold",
                e.bag === "personal" ? "bg-secondary text-secondary-foreground" : e.bag === "worn" ? "bg-accent/15 text-foreground" : "bg-muted text-foreground",
              )}
            >
              {bagText}
            </span>
            {e.bagReason && e.bag !== "worn" && <span className="ml-2 text-muted-foreground">{e.bagReason}</span>}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {e.bag !== "worn" && (
          <Button size="sm" variant="outline" onClick={() => onMove(e.item.id, otherBag(e.bag as BagId))} aria-label={`Move ${e.item.name} to ${bagLabel(otherBag(e.bag as BagId)).toLowerCase()}`}>
            <ArrowLeftRight aria-hidden /> Move to other bag
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={() => onRemove(e.item.id)} aria-label={`Remove ${e.item.name} from list`}>
          <X aria-hidden />
        </Button>
      </div>
    </li>
  );
}

function Outfits({ plan, itemById, trip }: { plan: Plan; itemById: Map<string, Item>; trip: Trip }) {
  const packed = plan.entries.map((e) => e.item);
  return (
    <section aria-labelledby="out-h" className="rounded-2xl border bg-card p-5">
      <h2 id="out-h" className="text-xl font-semibold">Day-by-day outfits</h2>
      <p className="mb-4 text-muted-foreground">
        Only packed items, matched to each day's weather and plans. {trip.laundry ? "Laundry resets wears every 4 days." : "No laundry, so wears are spread out."}
      </p>
      <ol className="grid gap-3 md:grid-cols-2">
        {plan.outfits.map((o) => (
          <li key={o.day.date} className="rounded-xl border bg-background p-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-sans text-lg font-semibold">
                {fmtDay(o.day.date)} · {o.day.leg.destination}
              </h3>
              {o.day.travel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-sm font-semibold">
                  <Plane className="size-3" aria-hidden /> Travel day
                </span>
              )}
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {o.day.leg.low} to {o.day.leg.high} °C · {o.day.leg.rain === "none" ? "no rain" : `${o.day.leg.rain} rain`} · <span className="capitalize">{o.day.focus}</span>
            </p>
            <ul className="space-y-2">
              {o.pieces.map((p, idx) => {
                const it = itemById.get(p.itemId);
                if (!it) return null;
                const options = packed.filter((x) => x.category === it.category);
                const key = swapKey(o.day.date, o.pieces, idx);
                const wears = plan.usage.get(it.id) ?? 0;
                return (
                  <li key={key} className="flex items-center gap-2">
                    <span className="size-4 shrink-0 rounded-full border" style={{ backgroundColor: it.color }} aria-hidden />
                    <Select
                      value={it.id}
                      onValueChange={(v) => {
                        actions.patchOverrides(trip.id, (ov) => ({ ...ov, outfitSwaps: { ...ov.outfitSwaps, [key]: v } }));
                        toast.success(`Swapped in ${itemById.get(v)?.name}`);
                      }}
                    >
                      <SelectTrigger className="h-11 flex-1 bg-card" aria-label={`${p.slot} on ${fmtDay(o.day.date)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((x) => (
                          <SelectItem key={x.id} value={x.id}>
                            {x.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="w-16 shrink-0 text-right text-sm text-muted-foreground">worn {wears}×</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AddItemsDialog({
  open,
  onOpenChange,
  items,
  plan,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: Item[];
  plan: Plan;
  onAdd: (id: string) => void;
}) {
  const packedIds = new Set(plan.entries.map((e) => e.item.id));
  const rest = items.filter((i) => !packedIds.has(i.id));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add from your wardrobe</DialogTitle>
          <DialogDescription>The meters and outfits update as soon as you add something.</DialogDescription>
        </DialogHeader>
        {rest.length === 0 ? (
          <p className="text-muted-foreground">
            Everything in your wardrobe is already packed.{" "}
            <Link to="/wardrobe" className="text-primary underline">
              Add more items
            </Link>
          </p>
        ) : (
          <ul className="divide-y">
            {rest.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="font-medium">{i.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {fmtWeight(i.weightG)} · {fmtVolume(i.volumeL)}
                  </span>
                </span>
                <Button size="sm" variant="outline" onClick={() => onAdd(i.id)}>
                  <Plus aria-hidden /> Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Checklist({ trip, plan }: { trip: Trip; plan: Plan }) {
  const checked = new Set(trip.checked);
  const total = plan.entries.length;
  const done = plan.entries.filter((e) => checked.has(e.item.id)).length;
  const toggle = (id: string, on: boolean) =>
    actions.patchTrip(trip.id, (t) => ({ ...t, checked: on ? [...new Set([...t.checked, id])] : t.checked.filter((x) => x !== id) }));
  const groups: { key: PackedEntry["bag"]; label: string }[] = [
    { key: "carryOn", label: "Carry-on" },
    { key: "personal", label: "Personal item" },
    { key: "worn", label: "Wear on the plane" },
  ];
  if (!total) return <EmptyState title="Nothing to check off yet.">Add clothes to your wardrobe to get a packing list.</EmptyState>;
  return (
    <section aria-labelledby="chk-h" className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="chk-h" className="text-xl font-semibold">Packing checklist</h2>
        {done > 0 && (
          <Button variant="ghost" size="sm" onClick={() => actions.patchTrip(trip.id, (t) => ({ ...t, checked: [] }))}>
            Uncheck all
          </Button>
        )}
      </div>
      <div className="my-4">
        <div className="mb-1 flex justify-between text-sm">
          <span className="font-medium">Packed</span>
          <span>
            {done} of {total}
          </span>
        </div>
        <Progress value={(done / total) * 100} aria-label={`${done} of ${total} packed`} />
      </div>
      {done === total && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-success-soft p-3 font-semibold text-success" role="status">
          <CheckCircle2 className="size-5" aria-hidden /> All packed. Have a great trip!
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {groups.map((g) => {
          const list = plan.entries.filter((e) => e.bag === g.key);
          if (!list.length) return null;
          return (
            <div key={g.key}>
              <h3 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {g.label} ({list.filter((e) => checked.has(e.item.id)).length}/{list.length})
              </h3>
              <ul className="space-y-1">
                {list.map((e) => {
                  const id = `chk-${e.item.id}`;
                  return (
                    <li key={e.item.id}>
                      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-secondary">
                        <Checkbox id={id} checked={checked.has(e.item.id)} onCheckedChange={(v) => toggle(e.item.id, v === true)} className="size-5" />
                        <span className={cn(checked.has(e.item.id) && "text-muted-foreground line-through")}>{e.item.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Plus,
  Minus,
  RotateCcw,
  Trash2,
  Search,
  ArrowRight,
  Luggage,
  Backpack,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemIcon } from "@/components/ItemIcon";
import { meta } from "@/components/FitControls";
import {
  findItems,
  freshSample,
  totals,
  suggestedRemovals,
  type PackingTrip,
  type PackItem,
} from "@/lib/packing";
import { usePackingState, savePackingTrip } from "@/lib/packing-store";
import { fmtWeight, fmtVolume } from "@/lib/format";
import { CATEGORIES, bagLabel, type BagId, type Item } from "@/lib/types";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/trips/$tripId")({
  head: () =>
    meta(
      "Packing plan",
      "Will everything fit? Check both bags, keep room for souvenirs and tick off your packing list.",
    ),
  component: PlanPage,
});
function PlanPage() {
  const s = usePackingState();
  if (!s.loaded)
    return (
      <div className="mx-auto max-w-5xl p-10" role="status">
        Loading your trip…
      </div>
    );
  if (!s.trip)
    return (
      <div className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl">Your next trip starts here</h1>
        <Button asChild className="mt-6">
          <Link to="/trips/new">Plan my trip</Link>
        </Button>
      </div>
    );
  return <Plan key={s.trip.id} trip={s.trip} />;
}
function Meter({
  label,
  used,
  reserve,
  limit,
  unit,
  returning,
}: {
  label: string;
  used: number;
  reserve: number;
  limit: number;
  unit: "g" | "L";
  returning: boolean;
}) {
  const format = unit === "g" ? fmtWeight : fmtVolume;
  const over = used + reserve - limit;
  const status =
    over > 0.001
      ? `Over by ${format(over)}`
      : limit - used - reserve <= limit * 0.1
        ? "Close to limit"
        : "Fits";
  return (
    <div>
      <div className="mb-2 flex flex-wrap justify-between gap-2">
        <span className="font-medium">{label}</span>
        <span>
          {format(used + (returning ? reserve : 0))} / {format(limit)}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used + (returning ? reserve : 0)}
        aria-valuetext={`${format(used + (returning ? reserve : 0))} used of ${format(limit)}. ${status}. ${format(reserve)} reserved for souvenirs.`}
        className="flex h-3 overflow-hidden rounded-full bg-muted"
      >
        <span
          className={over > 0 ? "bg-destructive" : "bg-primary"}
          style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
        />
        <span
          className={returning ? "bg-accent" : "stripes"}
          style={{ width: `${Math.max(0, Math.min(100 - (used / limit) * 100, (reserve / limit) * 100))}%` }}
        />
      </div>
      <p
        className={cn(
          "mt-2",
          over > 0 ? "text-destructive" : status === "Fits" ? "text-success" : "text-warning",
        )}
      >
        {status}
      </p>
    </div>
  );
}
function Plan({ trip }: { trip: PackingTrip }) {
  const navigate = useNavigate();
  const [returning, setReturning] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<"start" | "sample" | null>(null);
  const t = totals(trip, returning);
  const fixes = suggestedRemovals(trip);
  const fits = !t.overG && !t.overCarryL && !t.overPersonalL;
  const done = trip.entries.filter((e) => e.packed).length;
  const patch = (id: string, change: Partial<PackItem>) =>
    savePackingTrip({
      ...trip,
      entries: trip.entries.map((e) => (e.item.id === id ? { ...e, ...change } : e)),
    });
  const add = (item: Item, bag: BagId) => {
    savePackingTrip({
      ...trip,
      entries: [
        ...trip.entries,
        {
          item: { ...item, id: crypto.randomUUID() },
          bag,
          reason: "Added by you",
          packed: false,
          essential: false,
          impact: 0,
        },
      ],
    });
    toast.success(`Added ${item.name}`);
  };
  return (
    <div className="mx-auto max-w-5xl px-5 py-9">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold sm:text-4xl">Will everything fit?</h1>
            {trip.sample && (
              <span className="rounded-md bg-secondary px-3 py-1 font-medium text-primary">
                Sample trip
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {trip.stops.map((l) => `${l.name} · ${l.days} days`).join(" → ")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/trips/new">
            Plan my trip
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
      <section
        className={cn("border-y py-6", fits ? "border-success/30" : "border-destructive/30")}
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          {fits ? (
            <CheckCircle2 className="mt-1 size-7 shrink-0 text-success" aria-hidden />
          ) : (
            <AlertTriangle className="mt-1 size-7 shrink-0 text-destructive" aria-hidden />
          )}
          <div>
            <h2
              className={cn("text-2xl font-semibold", fits ? "text-success" : "text-destructive")}
            >
              {fits
                ? `Your bags fit, with ${fmtWeight(t.spareG)} to spare`
                : t.overG
                  ? `You're ${fmtWeight(t.overG)} over. Try removing the items marked below.`
                  : `You're ${fmtVolume(t.overCarryL || t.overPersonalL)} over in your ${t.overCarryL ? "carry-on" : "personal item"}. Try removing the items marked below.`}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {returning
                ? "Souvenirs are included for the way home."
                : `${trip.souvenirKg.toFixed(1)} kg kept free for souvenirs on the way home.`}
            </p>
          </div>
        </div>
        {!fits && (
          <p className="mt-3 text-muted-foreground">
            {t.overCarryL > 0 && `Carry-on space: ${fmtVolume(t.overCarryL)} over. `}
            {t.overPersonalL > 0 && `Personal item space: ${fmtVolume(t.overPersonalL)} over. `}If
            removing the marked items isn’t enough, reduce your reserve or choose a larger
            allowance.
          </p>
        )}
      </section>
      <section className="py-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Your two bags</h2>
          <div
            className="flex gap-1 rounded-lg border bg-card p-1"
            role="group"
            aria-label="Trip direction"
          >
            {[false, true].map((v) => (
              <Button
                key={String(v)}
                variant={returning === v ? "secondary" : "ghost"}
                aria-pressed={returning === v}
                onClick={() => setReturning(v)}
              >
                {v ? "Return" : "Outbound"}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          {(["carryOn", "personal"] as const).map((b) => (
            <div key={b}>
              <h3 className="mb-4 flex items-center gap-2 font-sans text-xl font-semibold">
                {b === "carryOn" ? (
                  <Luggage className="size-5 text-accent" aria-hidden />
                ) : (
                  <Backpack className="size-5 text-accent" aria-hidden />
                )}
                {bagLabel(b)}
              </h3>
              <div className="space-y-4">
                <Meter
                  label={`${bagLabel(b)} space`}
                  used={t.bags[b].l}
                  reserve={b === "carryOn" ? t.reserveL : 0}
                  limit={b === "carryOn" ? trip.carryOnL : trip.personalL}
                  unit="L"
                  returning={returning}
                />
                <p className="flex justify-between">
                  <span>Weight</span>
                  <span>
                    {fmtWeight(t.bags[b].g + (b === "carryOn" && returning ? t.reserveG : 0))}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t pt-5">
          <Meter
            label="Combined weight"
            used={t.usedG - (returning ? t.reserveG : 0)}
            reserve={t.reserveG}
            limit={trip.limitKg * 1000}
            unit="g"
            returning={returning}
          />
          <p className="mt-3 text-muted-foreground">
            {returning ? "Souvenir space is filled." : "Striped space is saved for souvenirs."}{" "}
            Reserve: {trip.souvenirKg.toFixed(1)} kg · {fmtVolume(t.reserveL)}. Weight allowance is
            shared by both bags.
          </p>
        </div>
      </section>
      {t.wornG > 0 && (
        <section className="border-y bg-secondary/40 px-4 py-5">
          <h2 className="flex items-center gap-2 text-xl">
            <Plane className="size-5 text-primary" aria-hidden />
            Wear on the plane
          </h2>
          <p className="mt-2 text-success">You save {fmtWeight(t.wornG)} by wearing these.</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
            {trip.entries
              .filter((e) => e.bag === "worn")
              .map((e) => (
                <li key={e.item.id} className="flex items-center gap-2">
                  <ItemIcon item={e.item} className="size-7" />
                  {e.item.name} · {fmtWeight(e.item.weightG)}
                </li>
              ))}
          </ul>
        </section>
      )}
      <PackingList
        trip={trip}
        fixes={fixes}
        done={done}
        patch={patch}
        onAdd={() => setAddOpen(true)}
      />

      <div className="flex flex-wrap gap-3 border-t pt-5">
        <Button variant="outline" onClick={() => setConfirm("start")}>
          Start over
        </Button>
        <Button variant="outline" onClick={() => setConfirm("sample")}>
          <RotateCcw aria-hidden />
          Reset sample trip
        </Button>
      </div>
      <AddDialog open={addOpen} onOpenChange={setAddOpen} onAdd={add} />
      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm === "start" ? "Start over?" : "Reset sample trip?"}</DialogTitle>
            <DialogDescription className="text-base">
              Your current packing changes and checked items will be replaced.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirm === "start") {
                  savePackingTrip(null);
                  toast.success("Ready for a new trip");
                  navigate({ to: "/trips/new" });
                } else {
                  savePackingTrip(freshSample());
                  setReturning(false);
                  toast.success("Sample trip reset");
                  navigate({ to: "/trips/$tripId", params: { tripId: "sample-trip" } });
                }
                setConfirm(null);
              }}
            >
              {confirm === "start" ? "Start over" : "Reset sample trip"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function AddDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (i: Item, b: BagId) => void;
}) {
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState(false);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [bag, setBag] = useState<BagId>("carryOn");
  const [error, setError] = useState("");
  const results = findItems(query);
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setCustom(false);
          setQuery("");
          setError("");
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add item</DialogTitle>
          <DialogDescription className="text-base">
            Travel essentials and typical weights.
          </DialogDescription>
        </DialogHeader>
        <Label htmlFor="add-search">Search items</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 size-5 text-muted-foreground" aria-hidden />
          <Input
            id="add-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCustom(false);
            }}
            placeholder="Try jacket, pants or shoes"
            className="pl-10"
          />
        </div>
        <Label htmlFor="add-bag">Bag</Label>
        <Select value={bag} onValueChange={(v) => setBag(v as BagId)}>
          <SelectTrigger id="add-bag">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="carryOn">Carry-on</SelectItem>
            <SelectItem value="personal">Personal item</SelectItem>
          </SelectContent>
        </Select>
        {!custom && (
          <>
            <ul className="divide-y">
              {results.map((i) => (
                <li key={i.id}>
                  <Button
                    variant="ghost"
                    className="h-auto min-h-16 w-full justify-start whitespace-normal text-left"
                    aria-label={`Add ${i.name}, ${i.weightG} g`}
                    onClick={() => onAdd(i, bag)}
                  >
                    <ItemIcon item={i} className="size-8" />
                    <span className="flex-1">
                      {i.name}
                      <span className="block font-normal text-muted-foreground">
                        {fmtWeight(i.weightG)}
                      </span>
                    </span>
                    <Plus aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
            {!results.length && <p>No matching essentials.</p>}
            <Button
              variant="outline"
              onClick={() => {
                setCustom(true);
                setName(query);
              }}
            >
              Add as custom item
            </Button>
          </>
        )}
        {custom && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const w = Number(weight);
              if (!name.trim() || !Number.isFinite(w) || w < 1 || w > 10000) {
                setError("Enter a name and a weight from 1 to 10,000 g.");
                return;
              }
              onAdd(
                {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  weightG: w,
                  volumeL: Math.max(0.05, w / 300),
                  category: "accessory",
                  warmth: "light",
                  formality: "casual",
                  suitable: ["city"],
                  maxWears: 99,
                  color: "#476b75",
                },
                bag,
              );
              setCustom(false);
              setQuery("");
              setWeight("");
              setError("");
            }}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="custom-name">Name</Label>
              <Input
                id="custom-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
              />
            </div>
            <div>
              <Label htmlFor="custom-weight">Weight (g)</Label>
              <Input
                id="custom-weight"
                inputMode="numeric"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <p className="text-muted-foreground">
              Volume estimated from weight:{" "}
              {weight && Number(weight) > 0
                ? fmtVolume(Math.max(0.05, Number(weight) / 300))
                : "0 L"}
              .
            </p>
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
            <Button type="submit">Add item</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

type BagTab = "all" | "carryOn" | "personal" | "worn";
const BAG_TABS: { id: BagTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "carryOn", label: "Carry-on" },
  { id: "personal", label: "Personal item" },
  { id: "worn", label: "Worn" },
];

function PackingList({
  trip,
  fixes,
  done,
  patch,
  onAdd,
}: {
  trip: PackingTrip;
  fixes: string[];
  done: number;
  patch: (id: string, change: Partial<PackItem>) => void;
  onAdd: () => void;
}) {
  const [tab, setTab] = useState<BagTab>("all");
  const [open, setOpen] = useState<string | null>(null);
  const shown = trip.entries.filter((e) => tab === "all" || e.bag === tab);
  const pct = trip.entries.length ? Math.round((done / trip.entries.length) * 100) : 0;
  return (
    <section className="py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">Your packing list</h2>
          <p className="mt-1 text-muted-foreground" aria-live="polite">
            {done} of {trip.entries.length} packed
            {done === trip.entries.length && done > 0 ? " · All packed. Have a great trip!" : ""}
          </p>
        </div>
        <Button variant="outline" onClick={onAdd}>
          <Plus aria-hidden />
          Add item
        </Button>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full bg-success transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div
        role="tablist"
        aria-label="Filter by bag"
        className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1"
      >
        {BAG_TABS.map((b) => {
          const count = trip.entries.filter((e) => b.id === "all" || e.bag === b.id).length;
          return (
            <button
              key={b.id}
              role="tab"
              aria-selected={tab === b.id}
              onClick={() => setTab(b.id)}
              className={cn(
                "min-h-11 flex-1 whitespace-nowrap rounded-lg px-3 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                tab === b.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {b.label} <span className="text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 && (
        <p className="py-6 text-center text-muted-foreground">Nothing in this bag yet.</p>
      )}
      {CATEGORIES.map((c) => {
        const list = shown.filter((e) => e.item.category === c.value);
        if (!list.length) return null;
        const g = list.reduce((s, e) => s + e.item.weightG, 0);
        const groups: PackItem[][] = [];
        for (const e of list) {
          const found = groups.find((x) => x[0]!.item.name === e.item.name && x[0]!.bag === e.bag);
          if (found) found.push(e);
          else groups.push([e]);
        }
        const save = (entries: PackItem[]) => savePackingTrip({ ...trip, entries });
        return (
          <div className="mb-5" key={c.value}>
            <h3 className="mb-1 flex justify-between font-sans font-semibold text-muted-foreground">
              <span>{c.plural}</span>
              <span className="font-normal">
                {list.length} · {fmtWeight(g)}
              </span>
            </h3>
            <ul className="divide-y rounded-xl border">
              {groups.map((grp) => {
                const e = grp[0]!;
                const n = grp.length;
                const ids = new Set(grp.map((x) => x.item.id));
                const fixEntry = grp.find((x) => fixes.includes(x.item.id));
                const fix = !!fixEntry;
                const key = `${e.item.name}-${e.bag}`;
                const expanded = open === key;
                const allPacked = grp.every((x) => x.packed);
                const last = grp[n - 1]!;
                const removeOne = (id: string) => {
                  save(trip.entries.filter((x) => x.item.id !== id));
                };
                return (
                  <li key={key} className={cn(fix && "bg-warning-soft")}>
                    <div className="flex items-center gap-2 px-2 sm:px-3">
                      <Checkbox
                        id={key}
                        checked={allPacked}
                        onCheckedChange={(p) =>
                          save(
                            trip.entries.map((x) =>
                              ids.has(x.item.id) ? { ...x, packed: p === true } : x,
                            ),
                          )
                        }
                        className="size-5"
                        aria-label={`Packed ${e.item.name}${n > 1 ? `, all ${n}` : ""}`}
                      />
                      <ItemIcon item={e.item} className="size-7 shrink-0" />
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setOpen(expanded ? null : key)}
                        className="flex min-h-12 min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <span
                          className={cn(
                            "truncate font-medium",
                            allPacked && "line-through text-muted-foreground",
                          )}
                        >
                          {e.item.name}
                          {n > 1 && <span className="text-muted-foreground"> × {n}</span>}
                        </span>
                        {fix && (
                          <span className="shrink-0 rounded bg-warning/15 px-1.5 text-warning">
                            {n > 1 ? "Fewer?" : "Remove?"}
                          </span>
                        )}
                        <span className="ml-auto shrink-0 text-muted-foreground">
                          {fmtWeight(e.item.weightG * n)}
                        </span>
                      </button>
                      {tab === "all" && (
                        <span className="hidden shrink-0 rounded-full bg-secondary px-2 text-primary md:inline">
                          {e.bag === "worn" ? "Worn" : e.bag === "carryOn" ? "Carry-on" : "Personal"}
                        </span>
                      )}
                      {e.bag !== "worn" && (
                        <div
                          className="flex shrink-0 items-center rounded-lg border"
                          role="group"
                          aria-label={`${e.item.name} quantity`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-11"
                            aria-label={n > 1 ? `One fewer ${e.item.name}` : `Remove ${e.item.name}`}
                            onClick={() => {
                              removeOne(last.item.id);
                              toast.success(
                                n > 1 ? `${e.item.name}: ${n - 1} left` : `Removed ${e.item.name}`,
                              );
                            }}
                          >
                            {n > 1 ? <Minus aria-hidden /> : <Trash2 aria-hidden className="text-destructive" />}
                          </Button>
                          <span className="w-5 text-center tabular-nums" aria-live="polite">
                            {n}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-11"
                            aria-label={`One more ${e.item.name}`}
                            onClick={() => {
                              save([
                                ...trip.entries,
                                {
                                  ...last,
                                  packed: false,
                                  item: { ...last.item, id: `${last.item.id}-${crypto.randomUUID().slice(0, 6)}` },
                                },
                              ]);
                              toast.success(`${e.item.name}: ${n + 1}`);
                            }}
                          >
                            <Plus aria-hidden />
                          </Button>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 shrink-0"
                        aria-label={
                          e.bag === "worn"
                            ? `Pack ${e.item.name} in carry-on`
                            : n > 1
                              ? `Move one ${e.item.name} to other bag`
                              : `Move ${e.item.name} to other bag`
                        }
                        title="Move to other bag"
                        onClick={() => {
                          const bag = e.bag === "carryOn" ? "personal" : "carryOn";
                          patch(last.item.id, { bag });
                          toast.success(
                            `Moved ${n > 1 ? "one " : ""}${e.item.name} to ${bagLabel(bag).toLowerCase()}`,
                          );
                        }}
                      >
                        <ArrowLeftRight aria-hidden />
                      </Button>
                      {e.bag === "worn" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 shrink-0 text-destructive"
                          aria-label={`Remove ${e.item.name}`}
                          onClick={() => {
                            save(trip.entries.filter((x) => !ids.has(x.item.id)));
                            toast.success(`Removed ${e.item.name}`);
                          }}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      )}
                    </div>
                    {(expanded || fix) && (
                      <div className="pb-3 pl-[4.25rem] pr-3 text-muted-foreground">
                        <p>
                          {e.reason} · {e.bag === "worn" ? "Worn on the plane" : bagLabel(e.bag)}
                        </p>
                        {fixEntry && (
                          <p className="mt-1 text-warning">
                            {n > 1 ? "Pack one fewer" : "Remove"}: saves{" "}
                            {fmtWeight(fixEntry.item.weightG)} and {fmtVolume(fixEntry.item.volumeL)}{" "}
                            ·{" "}
                            {fixEntry.impact === 0
                              ? "added extra"
                              : fixEntry.impact === 1
                                ? "needed for only one activity or as a spare"
                                : "lower-impact spare compared with daily essentials"}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

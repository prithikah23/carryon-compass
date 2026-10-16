import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ACTIVITIES, CATEGORIES, type Activity, type Category, type Formality, type Item, type Warmth } from "@/lib/types";
import { uid } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Draft {
  name: string;
  category: Category;
  color: string;
  weightG: string;
  volumeL: string;
  warmth: Warmth;
  formality: Formality;
  suitable: Activity[];
  maxWears: string;
  liquid: boolean;
  containerMl: string;
}

const toDraft = (i?: Item): Draft => ({
  name: i?.name ?? "",
  category: i?.category ?? "top",
  color: i?.color ?? "#8a8f94",
  weightG: i ? String(i.weightG) : "",
  volumeL: i ? String(i.volumeL) : String(CATEGORIES[0].defaultL),
  warmth: i?.warmth ?? "light",
  formality: i?.formality ?? "casual",
  suitable: i?.suitable ?? ["city"],
  maxWears: i ? String(i.maxWears) : "3",
  liquid: i?.liquid ?? false,
  containerMl: i?.containerMl ? String(i.containerMl) : "",
});

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item?: Item;
  onSave: (item: Item) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{item ? "Edit item" : "Add an item"}</DialogTitle>
          <DialogDescription>Weights in grams, space in litres. Estimates are fine.</DialogDescription>
        </DialogHeader>
        {open && <ItemForm key={item?.id ?? "new"} item={item} onSave={onSave} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ItemForm({ item, onSave, onCancel }: { item?: Item; onSave: (i: Item) => void; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(() => toDraft(item));
  const [volTouched, setVolTouched] = useState(!!item);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const name = d.name.trim();
    if (!name) errs.name = "Give the item a name.";
    else if (name.length > 60) errs.name = "Keep the name under 60 characters.";
    const w = Number(d.weightG);
    if (!d.weightG || !Number.isFinite(w) || w <= 0 || w > 10000) errs.weightG = "Enter a weight between 1 and 10,000 g.";
    const v = Number(d.volumeL);
    if (!d.volumeL || !Number.isFinite(v) || v <= 0 || v > 40) errs.volumeL = "Enter a volume between 0.05 and 40 L.";
    const m = Number(d.maxWears);
    if (!Number.isInteger(m) || m < 1 || m > 99) errs.maxWears = "Enter a whole number from 1 to 99.";
    const ml = Number(d.containerMl);
    if (d.category === "toiletry" && d.liquid && (!d.containerMl || !Number.isFinite(ml) || ml <= 0 || ml > 2000))
      errs.containerMl = "Enter the container size in mL.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({
      id: item?.id ?? uid(),
      name,
      category: d.category,
      color: d.color,
      weightG: Math.round(w),
      volumeL: Math.round(v * 100) / 100,
      warmth: d.warmth,
      formality: d.formality,
      suitable: d.suitable,
      maxWears: m,
      ...(d.category === "toiletry" ? { liquid: d.liquid, containerMl: d.liquid ? Math.round(ml) : 0 } : {}),
      sample: item?.sample,
    });
  };

  const err = (k: string) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1 text-sm font-medium text-destructive">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-err` : undefined });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <Label htmlFor="f-name">Name</Label>
        <Input id="f-name" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Merino t-shirt" {...aria("name")} />
        {err("name")}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="f-cat">Category</Label>
          <Select
            value={d.category}
            onValueChange={(v) => {
              const c = v as Category;
              setD((p) => ({ ...p, category: c, volumeL: volTouched ? p.volumeL : String(CATEGORIES.find((x) => x.value === c)?.defaultL ?? 1) }));
            }}
          >
            <SelectTrigger id="f-cat" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="f-color">Color</Label>
          <div className="flex items-center gap-2">
            <input id="f-color" type="color" value={d.color} onChange={(e) => set("color", e.target.value)} className="h-11 w-full cursor-pointer rounded-lg border bg-card p-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="f-w">Weight (g)</Label>
          <Input id="f-w" inputMode="numeric" value={d.weightG} onChange={(e) => set("weightG", e.target.value)} {...aria("weightG")} />
          {err("weightG")}
        </div>
        <div>
          <Label htmlFor="f-v">Volume (L)</Label>
          <Input
            id="f-v"
            inputMode="decimal"
            value={d.volumeL}
            onChange={(e) => {
              setVolTouched(true);
              set("volumeL", e.target.value);
            }}
            {...aria("volumeL")}
          />
          {err("volumeL")}
        </div>
        <Choice label="Warmth" value={d.warmth} options={["light", "medium", "warm"]} onChange={(v) => set("warmth", v as Warmth)} />
        <Choice label="Formality" value={d.formality} options={["casual", "smart", "formal"]} onChange={(v) => set("formality", v as Formality)} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Suitable for</legend>
        <ActivityPicker value={d.suitable} onChange={(v) => set("suitable", v)} />
      </fieldset>
      <div>
        <Label htmlFor="f-m">Max wears before washing</Label>
        <Input id="f-m" inputMode="numeric" value={d.maxWears} onChange={(e) => set("maxWears", e.target.value)} {...aria("maxWears")} />
        {err("maxWears")}
      </div>
      {d.category === "toiletry" && (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3">
          <Choice label="Liquid?" value={d.liquid ? "yes" : "no"} options={["yes", "no"]} onChange={(v) => set("liquid", v === "yes")} />
          {d.liquid && (
            <div>
              <Label htmlFor="f-ml">Container size (mL)</Label>
              <Input id="f-ml" inputMode="numeric" value={d.containerMl} onChange={(e) => set("containerMl", e.target.value)} {...aria("containerMl")} />
              {err("containerMl")}
            </div>
          )}
        </div>
      )}
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{item ? "Save changes" : "Add item"}</Button>
      </DialogFooter>
    </form>
  );
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const id = `c-${label.replace(/\W/g, "")}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11 capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="capitalize">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ActivityPicker({ value, onChange }: { value: Activity[]; onChange: (v: Activity[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIVITIES.map((a) => {
        const on = value.includes(a);
        return (
          <button
            key={a}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== a) : [...value, a])}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-medium capitalize transition-colors",
              on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-secondary",
            )}
          >
            {a}
          </button>
        );
      })}
    </div>
  );
}

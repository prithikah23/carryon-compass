import { useId, useRef, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogGroup, CATALOG_GROUPS, catalogItem, searchCatalog, type CatalogEntry } from "@/lib/catalog";
import { actions, useAppState } from "@/lib/store";
import { uid } from "@/lib/format";
import type { Item, Category } from "@/lib/types";
import { CategoryIcon, ItemIcon } from "./ItemIcon";
import { ItemColors } from "./ItemColors";

const groupCategories: Record<CatalogGroup, Category> = { Tops: "top", Bottoms: "bottom", Layers: "outer", Shoes: "shoes", Accessories: "accessory", Toiletries: "toiletry", Tech: "tech" };
export function CatalogBrowser({ onEdit, onCustom }: { onEdit: (item: Item) => void; onCustom: (name: string) => void }) {
  const s = useAppState();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<CatalogGroup>("Tops");
  const [recent, setRecent] = useState<string | null>(null);
  const id = useId();
  const resultButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const tabButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const results = searchCatalog(query, group);
  const add = (entry: CatalogEntry) => {
    const previous = s.items.find((item) => item.catalogId === entry.catalogId);
    const item = { ...catalogItem(entry, uid()), color: previous?.color ?? entry.color };
    actions.saveItem(item);
    setRecent(entry.catalogId);
    toast.success(`Added ${entry.name}.`, { action: { label: "Edit details", onClick: () => onEdit(item) } });
  };
  return <section aria-label="Travel item catalog" className="mb-8">
    <label htmlFor={`${id}-search`} className="mb-2 block text-lg font-semibold">Find an item to add</label>
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden />
      <Input id={`${id}-search`} type="search" placeholder="Search travel essentials…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-14 border-primary/40 bg-card pl-12 text-base" aria-controls={`${id}-results`} onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); resultButtons.current[0]?.focus(); } }} />
    </div>
    {!query.trim() && <div role="tablist" aria-label="Catalog categories" className="mt-3 flex flex-wrap gap-1">
      {CATALOG_GROUPS.map((g, index) => <Button ref={(el) => { tabButtons.current[index] = el; }} key={g} type="button" variant={group === g ? "secondary" : "ghost"} role="tab" id={`${id}-tab-${g}`} aria-controls={`${id}-results`} aria-selected={group === g} tabIndex={group === g ? 0 : -1} className="px-3" onClick={() => setGroup(g)} onKeyDown={(e) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
        e.preventDefault();
        const next = e.key === "Home" ? 0 : e.key === "End" ? CATALOG_GROUPS.length - 1 : (index + (e.key === "ArrowRight" ? 1 : -1) + CATALOG_GROUPS.length) % CATALOG_GROUPS.length;
        const selected = CATALOG_GROUPS[next];
        if (selected) { setGroup(selected); tabButtons.current[next]?.focus(); }
      }}><CategoryIcon category={groupCategories[g]} label={g} />{g}</Button>)}
    </div>}
    <p aria-live="polite" className="my-3 text-sm text-muted-foreground">{query.trim() ? `${results.length} matching items` : `${group} · typical weights`}</p>
    <div id={`${id}-results`} role={query.trim() ? "region" : "tabpanel"} aria-label="Catalog results" aria-labelledby={query.trim() ? undefined : `${id}-tab-${group}`}>
      {!results.length ? <Button variant="outline" className="h-auto min-h-11 w-full whitespace-normal break-words" onClick={() => onCustom(query.trim())}>Add '{query.trim()}' as a custom item</Button> :
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((entry, index) => {
            const copies = s.items.filter((item) => item.catalogId === entry.catalogId);
            const latest = copies.at(-1);
            return <li key={entry.catalogId} className="min-w-0 rounded-lg border bg-card">
              <Button ref={(el) => { resultButtons.current[index] = el; }} type="button" variant="ghost" className="h-auto min-h-24 w-full justify-start whitespace-normal p-4 text-left [&_svg]:size-10" aria-label={`Add ${entry.name}, ${entry.weightG} g`} onClick={() => add(entry)} onKeyDown={(e) => {
                if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
                e.preventDefault();
                const next = e.key === "Home" ? 0 : e.key === "End" ? results.length - 1 : (index + (["ArrowUp", "ArrowLeft"].includes(e.key) ? -1 : 1) + results.length) % results.length;
                resultButtons.current[next]?.focus();
              }}>
                <ItemIcon item={latest ?? entry} className="size-10" />
                <span className="min-w-0 flex-1"><span className="block break-words">{entry.name}</span><span className="block font-normal text-muted-foreground">{entry.weightG} g</span></span><Plus className="!size-5 text-primary" aria-hidden />
              </Button>
              {latest && <div className="border-t px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  {entry.repeatable ? <div className="flex items-center gap-2" role="group" aria-label={`Quantity of ${entry.name}`}>
                    <Button variant="ghost" size="icon" aria-label={`Decrease ${entry.name} quantity`} onClick={() => actions.deleteItem(latest.id)}><Minus aria-hidden /></Button>
                    <span className="min-w-5 text-center font-semibold" aria-live="polite">{copies.length}</span>
                    <Button variant="ghost" size="icon" aria-label={`Increase ${entry.name} quantity`} onClick={() => add(entry)}><Plus aria-hidden /></Button>
                  </div> : <span className="text-sm text-success">{copies.length} added</span>}
                  <Button variant="link" className="px-1 text-sm" onClick={() => onEdit(latest)}>Edit details</Button>
                </div>
                {recent === entry.catalogId && <ItemColors name={entry.name} color={latest.color} onChange={(color) => copies.forEach((item) => actions.saveItem({ ...item, color }))} />}
              </div>}
            </li>;
          })}
        </ul>}
    </div>
    {results.length > 0 && <Button variant="link" className="mt-2 px-0 whitespace-normal text-left" onClick={() => onCustom(query.trim())}>{query.trim() ? `Add '${query.trim()}' as a custom item` : "Add a custom item"}</Button>}
  </section>;
}
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ItemIcon } from "@/components/ItemIcon";
import { searchTravelItems, createCustomItem, CUSTOM_CATEGORIES } from "@/lib/travel-items";
import type { Item } from "@/lib/types";

export function AddPackingItem({ open, onOpenChange, onAdd, saved }: { open: boolean; onOpenChange: (open: boolean) => void; onAdd: (item: Item) => void; saved: Item[] }) {
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState(false);
  const results = searchTravelItems(query, saved);
  const add = (item: Item) => { onAdd(item); setQuery(""); setCustom(false); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={(value) => { if (!value) { setQuery(""); setCustom(false); } onOpenChange(value); }}>
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>Add item</DialogTitle><DialogDescription className="text-base">Travel essentials and typical weights.</DialogDescription></DialogHeader>
      <Label htmlFor="add-search">Search items</Label>
      <div className="relative"><Search className="absolute left-3 top-3 size-5 text-muted-foreground" aria-hidden /><Input id="add-search" type="search" maxLength={80} value={query} onChange={(e) => { setQuery(e.target.value); setCustom(false); }} placeholder="Try hair dryer, camera or gifts" className="pl-10" /></div>
      {custom ? <div><p className="mb-3 break-words font-medium">{query.trim()}</p><div role="group" aria-label="Item category" className="flex flex-wrap gap-2">{CUSTOM_CATEGORIES.map((c) => <Button key={c.label} variant="outline" className="min-h-11" onClick={() => add(createCustomItem(query, c.label))}>{c.label}</Button>)}</div></div> : <>
        <ul className="divide-y">{results.slice(0, query.trim() ? 30 : 12).map((i) => <li key={i.name}><Button variant="ghost" className="h-auto min-h-16 w-full justify-start whitespace-normal text-left" aria-label={`Add ${i.name}, about ${i.weightG} g`} onClick={() => add(i)}><ItemIcon item={i} className="size-8 shrink-0" /><span className="min-w-0 flex-1 break-words">{i.name}<span className="block font-normal text-muted-foreground">about {i.weightG} g</span></span><Plus aria-hidden className="shrink-0" /></Button></li>)}</ul>
        {!results.length && query.trim() && <Button variant="outline" className="h-auto min-h-11 whitespace-normal break-words" onClick={() => setCustom(true)}>Add '{query.trim()}'</Button>}
      </>}
    </DialogContent>
  </Dialog>;
}
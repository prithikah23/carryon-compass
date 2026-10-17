import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Item } from "@/lib/types";

export function ItemMeasurements({ item, onSave, onClose }: { item: Item | null; onSave: (values: { weightG?: number; volumeL?: number }) => void; onClose: () => void }) {
  const [weight, setWeight] = useState(String(item?.weightG ?? ""));
  const [volume, setVolume] = useState(String(item?.volumeL ?? ""));
  const [error, setError] = useState("");
  return <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>{item?.name}</DialogTitle><DialogDescription className="text-base">Weight and volume per item.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(e) => {
    e.preventDefault();
    const w = Number(weight), v = Number(volume);
    if (!weight.trim() || !volume.trim() || !Number.isFinite(w) || w < 0 || !Number.isFinite(v) || v <= 0) { setError("Enter a weight of 0 g or more and a volume above 0 L."); return; }
    onSave({ ...(w !== item?.weightG ? { weightG: w } : {}), ...(v !== item?.volumeL ? { volumeL: v } : {}) });
    onClose();
  }}><div><Label htmlFor="item-weight">Weight (g)</Label><Input id="item-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></div><div><Label htmlFor="item-volume">Volume (L)</Label><Input id="item-volume" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} /></div>{error && <p role="alert" className="text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div></form></DialogContent></Dialog>;
}
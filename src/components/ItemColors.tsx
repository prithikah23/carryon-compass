import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ITEM_COLORS = [
  ["Charcoal", "#343a40"], ["Ivory", "#f2eee4"], ["Blue", "#356b9a"], ["Teal", "#476b75"],
  ["Green", "#5b7651"], ["Red", "#b44646"], ["Pink", "#d68d9c"], ["Ochre", "#b88b35"],
] as const;
export function ItemColors({ color, onChange, name }: { color: string; onChange: (color: string) => void; name: string }) {
  return <div className="flex flex-wrap gap-1" role="group" aria-label={`Color for ${name}`}>
    {ITEM_COLORS.map(([label, value]) => <Button key={value} type="button" variant="ghost" size="icon" className="size-11" aria-label={`${label} for ${name}`} aria-pressed={color === value} onClick={() => onChange(value)}>
      <span className="flex size-6 items-center justify-center rounded-full border border-foreground/30" style={{ backgroundColor: value }}>{color === value && <Check className="size-4" style={{ color: label === "Ivory" || label === "Pink" ? ITEM_COLORS[0][1] : ITEM_COLORS[1][1] }} aria-hidden />}</span>
    </Button>)}
  </div>;
}
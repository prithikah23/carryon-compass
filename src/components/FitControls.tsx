import { Button } from "./ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
export function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o}
            type="button"
            variant={o === value ? "secondary" : "outline"}
            aria-pressed={o === value}
            onClick={() => onChange(o)}
            className={cn("min-h-11 border-2 px-3 capitalize", o === value ? "border-primary" : "border-border")}
          >
            {o === value && <Check aria-hidden className="size-4 shrink-0" />}
            {typeof o === "string" ? o.charAt(0).toUpperCase() + o.slice(1) : o}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Carry-On Compass` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Carry-On Compass` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});

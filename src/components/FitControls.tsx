import { Button } from "./ui/button";
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
            className={cn("px-3", o === value && "border border-primary")}
          >
            {o}
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

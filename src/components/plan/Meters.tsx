import { type Meter, meterText } from "@/lib/engine";
import { fmtVolume, fmtWeight } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MeterBar({ m, returning }: { m: Meter; returning: boolean }) {
  const f = m.unit === "g" ? fmtWeight : fmtVolume;
  const scale = Math.max(m.limit ?? 0, m.used + m.reserve, 0.0001);
  const usedPct = Math.min(100, (m.used / scale) * 100);
  const resPct = Math.min(100 - usedPct, (m.reserve / scale) * 100);
  const tone =
    m.status === "over" ? "text-destructive" : m.status === "close" ? "text-warning" : m.status === "fits" ? "text-success" : "text-muted-foreground";
  const label = m.limit != null ? `${f(m.used)} of ${f(m.limit)}` : f(m.used);
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-medium">{m.label}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div
        role="meter"
        aria-label={m.label}
        aria-valuemin={0}
        aria-valuemax={m.limit ?? undefined}
        aria-valuenow={Math.round(m.used * 10) / 10}
        aria-valuetext={`${label}${m.reserve ? `, plus ${f(m.reserve)} for souvenirs` : ""}. ${meterText(m)}`}
        className="relative flex h-4 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("transition-all", m.status === "over" ? "bg-destructive" : "bg-primary")} style={{ width: `${usedPct}%` }} />
        {m.reserve > 0 && (
          <div
            className={cn("transition-all", returning ? "bg-souvenir" : "stripes")}
            style={{ width: `${resPct}%` }}
            title={returning ? "Souvenirs" : "Saved for souvenirs"}
          />
        )}
        {m.limit != null && m.used + m.reserve > m.limit && (
          <div className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${(m.limit / scale) * 100}%` }} aria-hidden />
        )}
      </div>
      <div className="mt-1 flex flex-wrap justify-between gap-x-3 text-sm">
        <span className={cn("font-semibold", tone)}>{meterText(m)}</span>
        {m.reserve > 0 && (
          <span className="text-muted-foreground">
            {returning ? "Includes" : "Saving"} {f(m.reserve)} {returning ? "of souvenirs" : "for souvenirs"}
          </span>
        )}
      </div>
    </div>
  );
}

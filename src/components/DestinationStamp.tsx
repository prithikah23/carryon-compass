import { Mountain, Sun, Waves, Building2, Plane } from "lucide-react";
import type { Stop } from "@/lib/packing";

export function DestinationStamp({ stop, index, code }: { stop: Stop; index: number; code?: string }) {
  const Icon = stop.activities.includes("hiking") ? Mountain : stop.activities.includes("beach") ? Waves : stop.climate === "Hot" || stop.climate === "Warm" ? Sun : Building2;
  return <div className="destination-stamp" data-ink={index % 3}>
    <div className="stamp-perforation">
      <span className="stamp-caption">STOP {String(index + 1).padStart(2, "0")}</span>
      <Icon className="stamp-landmark" strokeWidth={1.4} aria-hidden />
      {code && <span className="stamp-code">{code}</span>}
      <span className="stamp-destination">{stop.name}</span>
      <span className="stamp-duration"><Plane className="size-3" aria-hidden />{stop.days} {stop.days === 1 ? "DAY" : "DAYS"}</span>
    </div>
  </div>;
}
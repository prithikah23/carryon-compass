import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Plane, CheckCircle2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { freshSample, totals } from "@/lib/packing";
import { savePackingTrip } from "@/lib/packing-store";
import { fmtWeight, fmtVolume } from "@/lib/format";

export function BoardingPass() {
  const [returning, setReturning] = useState(false);
  const trip = freshSample();
  const t = totals(trip, returning);
  const days = trip.stops.reduce((sum, stop) => sum + stop.days, 0);
  const fits = !t.overG && !t.overCarryL && !t.overPersonalL;
  return (
    <div className="boarding-pass">
      <div className="pass-main">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed pb-4">
          <span className="ticket-label flex items-center gap-2"><Plane className="size-5" aria-hidden /> SAMPLE TRIP / MULTI-CLIMATE</span>
          <span className="ticket-label">{days} DAYS · 2 BAGS</span>
        </div>
        <div className="pass-route" aria-label="Buenos Aires to Atacama to Patagonia to Santiago">
          {trip.stops.map((stop, i) => {
            const code = ["BA", "ATC", "PAT", "SCL"][i] ?? stop.name.slice(0, 3).toUpperCase();
            const name = stop.name;
            return (
            <div key={code} className="relative min-w-0"><span className="block font-display text-3xl font-semibold sm:text-4xl">{code}</span><span className="mt-1 block text-sm text-muted-foreground">{name}</span>{i < 3 && <span className="route-dash" aria-hidden>→</span>}</div>
            );
          })}
        </div>
        <div className="grid gap-4 border-t border-dashed pt-4 sm:grid-cols-3">
          <div><p className="ticket-label text-muted-foreground">CARRY-ON</p><p className="mt-1 font-semibold">{fmtVolume(trip.carryOnL)}</p></div>
          <div><p className="ticket-label text-muted-foreground">PERSONAL ITEM</p><p className="mt-1 font-semibold">{fmtVolume(trip.personalL)}</p></div>
          <div><p className="ticket-label text-muted-foreground">SOUVENIR RESERVE</p><p className="mt-1 flex items-center gap-2 font-semibold"><Gift className="size-4 text-primary" aria-hidden />{fmtWeight(t.reserveG)}</p></div>
        </div>
      </div>
      <div className="pass-stub">
        <div role="group" aria-label="Sample trip direction" className="grid grid-cols-2 gap-1">
          {[false, true].map((v) => <Button key={String(v)} variant={returning === v ? "secondary" : "ghost"} className="px-2 text-sm" aria-pressed={returning === v} onClick={() => setReturning(v)}>{v ? "Return" : "Outbound"}</Button>)}
        </div>
        <p className="pass-stamp"><CheckCircle2 className="size-5" aria-hidden />{fits ? "BAGS FIT" : "OVER LIMIT"}</p>
        <div aria-live="polite"><p className="ticket-label text-muted-foreground">COMBINED WEIGHT</p><p className="mt-1 text-xl font-semibold tabular-nums">{fmtWeight(t.usedG)} <span className="text-sm font-normal text-muted-foreground">/ {trip.limitKg} kg</span></p></div>
        <Button asChild variant="link" className="justify-between px-0"><Link to="/trips/$tripId" params={{ tripId: "sample-trip" }} onClick={() => savePackingTrip(trip)}>Open packing plan <ArrowUpRight aria-hidden /></Link></Button>
      </div>
    </div>
  );
}
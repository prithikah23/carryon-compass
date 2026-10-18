import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronDown, Compass, Gift, Layers, Luggage, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { meta } from "@/components/FitControls";
import { BoardingPass } from "@/components/BoardingPass";
import { AIRLINES, freshSample } from "@/lib/packing";
import { savePackingTrip } from "@/lib/packing-store";
export const Route = createFileRoute("/")({
  head: () =>
    meta(
      "Will it all fit in your carry-on?",
      "Tell us where you’re going and what bags you have. Get a packing list that fits, with room to bring things home.",
    ),
  component: Home,
});
function Home() {
  const [openAirline, setOpenAirline] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="home-travel relative">
        <div className="relative z-10">
          <p className="ticket-label mb-5 flex items-center gap-2 text-primary">
            <Compass className="size-5" aria-hidden />
            TWO BAGS. EVERY CLIMATE.
          </p>
          <h1 className="home-heading font-semibold">
            Will it all fit in your <em>carry-on?</em>
          </h1>
          <p className="home-intro mt-5 text-lg leading-relaxed text-muted-foreground">
            Tell us where you're going and what bags you have. Get a packing list that fits, with
            room to bring things home.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link
                to="/trips/$tripId"
                params={{ tripId: "sample-trip" }}
                onClick={() => savePackingTrip(freshSample())}
              >
                See the sample trip
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/trips/new">Plan my trip</Link>
            </Button>
          </div>
          <p className="mt-7 max-w-lg text-muted-foreground">
            Born from a trip to Buenos Aires, the Atacama, and Patagonia with just a carry-on.
          </p>
        </div>
        <BoardingPass />
      </section>
      <section aria-labelledby="why" className="border-t py-12">
        <h2 id="why" className="mb-8 text-3xl font-semibold">
          Why it works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              Icon: Layers,
              title: "One capsule for every climate",
              text: "Pieces that layer from desert heat to glacier cold, so you skip outfits you'd wear once.",
            },
            {
              Icon: Plane,
              title: "Typical airline limits",
              text: "Tap an airline to see its typical bag sizes. Rules change, so check yours.",
            },
            {
              Icon: Gift,
              title: "Room saved for souvenirs",
              text: "Switch to the return trip and see if everything still fits with what you bring home.",
            },
          ].map(({ Icon, title, text }) => (
            <div key={title}>
              <Icon className="mb-3 size-7 text-accent" aria-hidden />
              <h3 className="mb-2 text-xl font-semibold">{title}</h3>
              <p className="text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="airlines" className="border-t py-12">
        <h2 id="airlines" className="text-3xl font-semibold">Pick your airline</h2>
        <p className="mt-2 text-muted-foreground">
          Tap an airline to see its typical bag sizes. Rules change, so check yours.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AIRLINES.map((a, index) => (
            <li key={a.name} className="airline-tag self-start overflow-hidden bg-card">
              <Button
                variant="ghost"
                aria-expanded={openAirline === a.name}
                aria-controls={`airline-details-${index}`}
                onClick={() => setOpenAirline((current) => current === a.name ? null : a.name)}
                className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal px-4 py-4 text-left font-normal"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <Plane className="size-4 shrink-0 text-accent" aria-hidden />
                  {a.name}
                </span>
                <ChevronDown className={`size-4 shrink-0 transition-transform motion-reduce:transition-none ${openAirline === a.name ? "rotate-180" : ""}`} aria-hidden />
              </Button>
              <div id={`airline-details-${index}`} hidden={openAirline !== a.name} className="border-t px-4 pb-4 pt-3">
                <dl className="space-y-3">
                  <div><dt className="font-medium">Carry-on{a.paidCabinBag ? " · paid cabin bag" : ""}</dt><dd className="text-muted-foreground">{a.carryOnSize} · {a.carryOnL} L</dd></div>
                  <div><dt className="font-medium">Personal item{a.paidCabinBag ? " · free under-seat bag" : ""}</dt><dd className="text-muted-foreground">{a.personalSize} · {a.personalL} L</dd></div>
                  <div><dt className="font-medium">Weight limit</dt><dd className="text-muted-foreground">{a.limitKg === null ? "No weight limit" : `${a.limitKg} kg${a.paidCabinBag ? " with paid cabin bag" : ""}`}</dd></div>
                </dl>
                <p className="mt-3 text-muted-foreground">Typical economy rules. Check your airline before you fly.</p>
                <Button asChild className="mt-4 h-auto min-h-11 w-full whitespace-normal">
                  <Link to="/trips/new" search={{ airline: a.name }}>Plan a trip with {a.name}<ArrowRight className="shrink-0" aria-hidden /></Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-wrap items-center justify-between gap-5 border-t py-8">
        <div className="flex items-center gap-3">
          <Luggage className="size-6 text-accent" aria-hidden />
          <span className="font-medium">A carry-on. A personal item. Room for the way home.</span>
        </div>
        <p className="text-muted-foreground">No accounts. Just your next trip.</p>
      </section>
    </div>
  );
}

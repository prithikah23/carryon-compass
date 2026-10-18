import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Gift, Layers, Luggage, Plane } from "lucide-react";
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
              text: "Pick an airline to fill in typical bag sizes and weight limits. Rules change, so check yours.",
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
          Bag sizes and weight limits fill in for you. Typical economy rules, check yours.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AIRLINES.map((a) => (
            <li key={a.name}>
              <Link
                to="/trips/new"
                search={{ airline: a.name }}
                className="airline-tag grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-card px-4 py-4 transition-all hover:border-primary focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <Plane className="size-4 shrink-0 text-accent" aria-hidden />
                  {a.name}
                </span>
                <span className="text-muted-foreground">{a.limitKg === null ? "No weight limit" : `${a.limitKg} kg`}</span>
              </Link>
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

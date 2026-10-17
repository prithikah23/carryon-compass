import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Gift, Layers, Luggage, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { meta } from "@/components/FitControls";
import { freshSample } from "@/lib/packing";
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
      <section className="home-travel relative flex min-h-[590px] flex-col justify-center overflow-hidden py-14">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-5 flex items-center gap-2 font-medium text-primary">
            <Compass className="size-5" aria-hidden />
            TWO BAGS. EVERY CLIMATE.
          </p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight sm:text-6xl">
            Will it all fit in your carry-on?
          </h1>
          <p className="mt-6 max-w-lg text-xl leading-relaxed text-muted-foreground">
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
            Built after packing for a desert, a glacier, and city dinners with no checked bag.
          </p>
        </div>
        <svg
          className="travel-bags pointer-events-none absolute bottom-5 right-4 h-72 w-60 text-primary/20"
          viewBox="0 0 240 280"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          aria-label="Carry-on suitcase and personal backpack"
          role="img"
        >
          <rect x="35" y="50" width="125" height="195" rx="10" />
          <path d="M65 50V22h65v28M65 80v125m30-125v125m30-125v125M53 245v15m90-15v15" />
          <rect x="130" y="138" width="95" height="110" rx="20" />
          <path d="M156 138v-12h42v12m-45 35h48v50h-48z" />
        </svg>
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
              title: "Your airline's real limits",
              text: "Pick Qatar, Delta, Air Canada and more. Sizes and weight fill in, so no surprise gate fees.",
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

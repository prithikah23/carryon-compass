import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Luggage, MapPinned, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_TRIP_ID } from "@/lib/sample";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carry-On Compass — Pack for every climate in a carry-on" },
      {
        name: "description",
        content: "Add your clothes and your trip. Get a packing list that fits both bags, an outfit for every day, and room to bring things home.",
      },
      { property: "og:title", content: "Carry-On Compass — Pack for every climate" },
      { property: "og:description", content: "A packing list that fits a carry-on and a personal item, with room saved for souvenirs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const STEPS = [
  { icon: Shirt, title: "Add your clothes", text: "Weight, size, warmth and what each piece is good for." },
  { icon: MapPinned, title: "Add your trip", text: "Your bags, each stop's weather and what you'll do there." },
  { icon: Luggage, title: "Get a list that fits your bags", text: "Outfits for every day, room for souvenirs, and why each item made the cut." },
];

function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid items-center gap-10 py-12 md:grid-cols-[1.2fr_1fr] md:py-20">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
            Carry-on + personal item. No checked bag.
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Pack for every climate in just a carry-on and a personal item.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Add your clothes and your trip. Get a packing list that fits both bags, an outfit for every day, and room to bring things home.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/trips/$tripId" params={{ tripId: SAMPLE_TRIP_ID }}>
                See the sample trip <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/trips/new">Plan my own trip</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm italic text-muted-foreground">
            Built after packing for a desert, a glacier, and city dinners with no checked bag.
          </p>
        </div>
        <HeroCard />
      </section>

      <section aria-labelledby="how" className="pb-16">
        <h2 id="how" className="mb-6 text-2xl font-semibold">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{i + 1}</span>
                <s.icon className="size-5 text-accent" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function HeroCard() {
  const rows = [
    { label: "Carry-on", w: 72, r: 10, text: "15 L of 40 L" },
    { label: "Personal item", w: 30, r: 0, text: "5 L of 18 L" },
    { label: "Combined weight", w: 78, r: 10, text: "7.8 kg of 10 kg" },
  ];
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm" aria-hidden>
      <p className="text-sm font-medium text-muted-foreground">Buenos Aires › Atacama › Patagonia › Santiago</p>
      <p className="mt-2 font-display text-2xl font-semibold text-success">Your bags fit, with 1.2 kg to spare</p>
      <div className="mt-6 space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">{r.label}</span>
              <span className="text-muted-foreground">{r.text}</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              <div className="bg-primary" style={{ width: `${r.w - r.r}%` }} />
              {r.r > 0 && <div className="stripes" style={{ width: `${r.r}%` }} />}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {["Desert", "Glacier", "City dinners"].map((t) => (
          <span key={t} className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{t}</span>
        ))}
        <span className="rounded-full bg-accent/15 px-3 py-1 font-medium text-foreground">1 kg saved for souvenirs</span>
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { Compass, Luggage } from "lucide-react";
import { usePackingState } from "@/lib/packing-store";
import { Button } from "./ui/button";
export function TopNav() {
  const s = usePackingState();
  return (
    <header className="craft-nav bg-card">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-3 px-5">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2 font-display text-lg font-semibold"
        >
          <Compass className="size-6 text-accent" aria-hidden />
          Carry-On Compass
        </Link>
        <Button asChild variant="ghost" className="px-2">
          {s.trip ? (
            <Link to="/trips/$tripId" params={{ tripId: s.trip.id }}>
              <Luggage aria-hidden />
              My trip
            </Link>
          ) : (
            <Link to="/trips/new">
              <Luggage aria-hidden />
              My trip
            </Link>
          )}
        </Button>
      </div>
    </header>
  );
}

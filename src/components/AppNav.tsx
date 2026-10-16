import { Link } from "@tanstack/react-router";
import { Compass, Luggage, Settings, Shirt } from "lucide-react";

const TABS = [
  { to: "/trips", label: "Trips", icon: Luggage },
  { to: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex min-h-11 items-center gap-2 rounded-lg font-display text-lg font-semibold text-foreground">
          <Compass className="size-6 text-accent" aria-hidden />
          Carry-On Compass
        </Link>
        <nav aria-label="Main" className="hidden gap-1 md:flex">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="flex min-h-11 items-center gap-2 rounded-lg px-4 font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              activeProps={{ className: "bg-secondary !text-secondary-foreground", "aria-current": "page" }}
            >
              <t.icon className="size-4" aria-hidden />
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function BottomTabs() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {TABS.map((t) => (
          <li key={t.to}>
            <Link
              to={t.to}
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-medium text-muted-foreground"
              activeProps={{ className: "!text-primary", "aria-current": "page" }}
            >
              <t.icon className="size-5" aria-hidden />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

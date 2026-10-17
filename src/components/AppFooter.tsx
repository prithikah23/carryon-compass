import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
export function AppFooter() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="mt-8 border-t px-5 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <span className="text-muted-foreground">
          A little less packing. A little more possibility.
        </span>
        <Button variant="link" onClick={() => setOpen(true)}>
          About & limitations
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About Carry-On Compass</DialogTitle>
            <DialogDescription className="text-base">
              Weights and sizes are estimates. Airline rules
              vary, so check yours.
            </DialogDescription>
          </DialogHeader>
          <p>To suggest a climate, place names and dates are sent to Open-Meteo, a free weather service. Nothing else leaves your browser. Climate is based on past years unless your trip is within two weeks.</p>
          <p>
            Souvenir volume is estimated at 4 L per kg. Bag weights are packing contents only; allow
            for the empty bags in your airline’s combined limit.
          </p>
        </DialogContent>
      </Dialog>
    </footer>
  );
}

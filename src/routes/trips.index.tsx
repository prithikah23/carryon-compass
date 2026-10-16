import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, PageHeader, PageLoading, SampleBadge } from "@/components/common";
import { actions, useAppState } from "@/lib/store";
import { computePlan, sortedLegs } from "@/lib/engine";
import { fmtShort } from "@/lib/format";
import type { Trip } from "@/lib/types";

export const Route = createFileRoute("/trips/")({
  head: () => ({
    meta: [
      { title: "Your trips — Carry-On Compass" },
      { name: "description", content: "All your planned trips and whether your carry-on and personal item fit." },
      { property: "og:title", content: "Your trips — Carry-On Compass" },
      { property: "og:description", content: "See at a glance which trips fit your bags." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trips,
});

function Trips() {
  const s = useAppState();
  const [deleting, setDeleting] = useState<Trip | null>(null);
  if (!s.loaded) return <PageLoading />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Trips"
        description="Each trip gets its own packing list, outfits and bag check."
        action={
          <Button asChild>
            <Link to="/trips/new">
              <Plus aria-hidden /> Plan a new trip
            </Link>
          </Button>
        }
      />
      {s.trips.length === 0 ? (
        <EmptyState
          title="No trips yet."
          actions={
            <Button asChild>
              <Link to="/trips/new">Plan my own trip</Link>
            </Button>
          }
        >
          Add your bags and where you're going, and you'll get a packing list that fits. You can bring the sample trip back from Settings.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {s.trips.map((t) => {
            const plan = computePlan(t, s.items);
            const legs = sortedLegs(t.legs);
            return (
              <li key={t.id} className="flex flex-col rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold">{t.name}</h2>
                      {t.sample && <SampleBadge />}
                    </div>
                    {legs.length > 0 && (
                      <p className="mt-1 text-muted-foreground">
                        {fmtShort(legs[0].start)} – {fmtShort(legs[legs.length - 1].end)} · {plan.days.length} days · {legs.length} leg{legs.length === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${t.name}`} onClick={() => setDeleting(t)}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
                <p className={`mt-4 flex items-center gap-2 font-medium ${plan.verdict.ok ? "text-success" : "text-warning"}`}>
                  {plan.verdict.ok ? <CheckCircle2 className="size-5" aria-hidden /> : <AlertTriangle className="size-5" aria-hidden />}
                  {plan.verdict.text}
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link to="/trips/$tripId" params={{ tripId: t.id }}>
                      Open plan
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>The trip and its checklist will be removed. Your wardrobe stays as it is.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleting) {
                  actions.deleteTrip(deleting.id);
                  toast.success("Trip deleted");
                }
                setDeleting(null);
              }}
            >
              Delete trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

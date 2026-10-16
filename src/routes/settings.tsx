import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlayCircle, RotateCcw, Trash2 } from "lucide-react";
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
import { PageHeader, PageLoading } from "@/components/common";
import { actions, useAppState } from "@/lib/store";
import { SAMPLE_TRIP_ID } from "@/lib/sample";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Carry-On Compass" },
      { name: "description", content: "Replay the tour, reset the sample trip, or start fresh. Your data stays in this browser." },
      { property: "og:title", content: "Settings — Carry-On Compass" },
      { property: "og:description", content: "Manage sample data and learn about Carry-On Compass's limits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const s = useAppState();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<"reset" | "fresh" | null>(null);
  if (!s.loaded) return <PageLoading />;
  const hasSample = s.trips.some((t) => t.id === SAMPLE_TRIP_ID);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Settings" description="Tour, sample data, and how this app works." />

      <div className="space-y-4">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-xl font-semibold">Guided tour</h2>
          <p className="mt-1 text-muted-foreground">
            {hasSample ? "Walk through the sample trip again in four quick steps." : "The tour runs on the sample trip. Reset sample data first to bring it back."}
          </p>
          <Button
            className="mt-4"
            disabled={!hasSample}
            onClick={() => {
              actions.setPrefs({ tourDone: false, bannerDismissed: false });
              navigate({ to: "/trips/$tripId", params: { tripId: SAMPLE_TRIP_ID } });
            }}
          >
            <PlayCircle aria-hidden /> Replay tour
          </Button>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-xl font-semibold">Data</h2>
          <p className="mt-1 text-muted-foreground">Reset brings back the sample trip and wardrobe and keeps your own items and trips. Start fresh removes everything.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setConfirm("reset")}>
              <RotateCcw aria-hidden /> Reset sample data
            </Button>
            <Button variant="outline" className="text-destructive" onClick={() => setConfirm("fresh")}>
              <Trash2 aria-hidden /> Start fresh (clear everything)
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5" aria-labelledby="about">
          <h2 id="about" className="text-xl font-semibold">About and limitations</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Your data stays in this browser only. Nothing is sent to a server and there's no account.</li>
            <li>Weather is entered by you. Check a forecast before you go.</li>
            <li>Airline size, weight, and liquid rules vary, so check yours.</li>
            <li>Weights and volumes are estimates. Weigh your packed bags at home if you're close to a limit.</li>
            <li>Recommendations follow fixed rules, so the same trip and wardrobe always give the same list.</li>
          </ul>
        </section>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "reset" ? "Reset sample data?" : "Clear everything?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "reset"
                ? "The sample trip and sample wardrobe go back to how they started. Your own items and trips are kept."
                : "All items, trips and checklists will be deleted from this browser. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirm === "fresh" ? "min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90" : "min-h-11"}
              onClick={() => {
                if (confirm === "reset") {
                  actions.resetSample();
                  toast.success("Sample data reset");
                } else {
                  actions.startFresh();
                  toast.success("Everything cleared. Start by adding your clothes.");
                }
                setConfirm(null);
              }}
            >
              {confirm === "reset" ? "Reset sample data" : "Clear everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

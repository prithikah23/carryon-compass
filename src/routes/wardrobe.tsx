import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ItemFormDialog } from "@/components/ItemForm";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { ItemIcon } from "@/components/ItemIcon";
import { actions, useAppState } from "@/lib/store";
import { CATEGORIES, categoryLabel, type Item } from "@/lib/types";
import { fmtVolume, fmtWeight } from "@/lib/format";

export const Route = createFileRoute("/wardrobe")({
  head: () => ({
    meta: [
      { title: "Wardrobe — Carry-On Compass" },
      { name: "description", content: "Your travel wardrobe with weight, volume, warmth and what each piece is good for." },
      { property: "og:title", content: "Wardrobe — Carry-On Compass" },
      { property: "og:description", content: "Add the clothes you might bring and let Carry-On Compass pick what fits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Wardrobe,
});

function Wardrobe() {
  const s = useAppState();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Item | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [initialName, setInitialName] = useState("");
  const [deleting, setDeleting] = useState<Item | null>(null);

  const list = useMemo(
    () => s.items.filter((i) => (cat === "all" || i.category === cat) && i.name.toLowerCase().includes(q.trim().toLowerCase())),
    [s.items, cat, q],
  );

  if (!s.loaded) return <PageLoading />;

  const openNew = () => {
    setEditing(undefined);
    setInitialName("");
    setFormOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Wardrobe"
        description="Everything you might bring. The planner picks the lightest mix that covers every day."
        action={
          <Button onClick={openNew}>
            <Plus aria-hidden /> Add item
          </Button>
        }
      />

      <CatalogBrowser onEdit={(item) => { setEditing(item); setInitialName(""); setFormOpen(true); }} onCustom={(name) => { setEditing(undefined); setInitialName(name || " "); setFormOpen(true); }} />
      <h2 className="mb-4 text-xl font-semibold">Your wardrobe</h2>
      {s.items.length === 0 ? (
        <EmptyState
          title="No items yet. Add your first item or load the sample wardrobe."
          actions={
            <>
              <Button onClick={openNew}>
                <Plus aria-hidden /> Add your first item
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  actions.loadSampleWardrobe();
                  toast.success("Sample wardrobe loaded");
                }}
              >
                Load the sample wardrobe
              </Button>
            </>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
            <div>
              <Label htmlFor="w-search" className="sr-only">
                Search by name
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input id="w-search" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <Label htmlFor="w-cat" className="sr-only">
                Filter by category
              </Label>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger id="w-cat" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.plural}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {list.length} of {s.items.length} items
          </p>
          {list.length === 0 ? (
            <EmptyState title="Nothing matches.">Try a different search or category.</EmptyState>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-2xl border bg-card p-4">
                  <ItemIcon item={i} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{i.name}</p>
                      {i.sample && <SampleBadge />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {categoryLabel(i.category)} · {fmtWeight(i.weightG)} · {fmtVolume(i.volumeL)}
                      {i.liquid ? ` · ${i.containerMl} mL liquid` : ""}
                    </p>
                    {i.suitable.length > 0 && <p className="mt-1 text-sm capitalize text-muted-foreground">{i.suitable.join(", ")}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${i.name}`}
                      onClick={() => {
                        setEditing(i);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${i.name}`} onClick={() => setDeleting(i)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editing}
        initialName={initialName}
        onSave={(item) => {
          actions.saveItem(item);
          setFormOpen(false);
          toast.success(editing ? `Saved ${item.name}` : `Added ${item.name}`);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>It will be removed from your wardrobe and from every trip's packing list.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleting) {
                  actions.deleteItem(deleting.id);
                  toast.success(`Deleted ${deleting.name}`);
                }
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { target: "verdict", text: "This tells you if your bags fit." },
  { target: "packing", text: "Every item says why it was picked and which bag it goes in." },
  { target: "plane", text: "Wear these on the plane to save weight." },
  { target: "return", text: "Switch to Return to see if your souvenirs fit." },
];

export function Tour({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = STEPS[i]!;

  useLayoutEffect(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const update = () => setRect(el.getBoundingClientRect());
    const t = window.setInterval(update, 150);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [step.target]);

  useEffect(() => {
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDone();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, onDone]);

  const pad = 8;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const below = rect ? rect.bottom + 16 + 180 < vh : true;
  const top = rect ? (below ? rect.bottom + pad + 8 : Math.max(12, rect.top - pad - 8 - 180)) : vh / 2 - 90;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tour-text">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-2xl ring-4 ring-accent"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px color-mix(in oklab, var(--foreground) 55%, transparent)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-foreground/55" />
      )}
      <div
        ref={cardRef}
        tabIndex={-1}
        className="absolute left-1/2 w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border bg-card p-5 shadow-xl outline-none"
        style={{ top }}
      >
        <p className="text-sm font-medium text-muted-foreground">
          Step {i + 1} of {STEPS.length}
        </p>
        <p id="tour-text" className="mt-1 font-display text-xl font-semibold">
          {step.text}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={onDone}>
            Skip tour
          </Button>
          <div className="flex gap-2">
            {i > 0 && (
              <Button variant="outline" onClick={() => setI(i - 1)}>
                Back
              </Button>
            )}
            <Button onClick={() => (i < STEPS.length - 1 ? setI(i + 1) : onDone())}>{i < STEPS.length - 1 ? "Next" : "Done"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

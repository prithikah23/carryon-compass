<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Active app data lives in browser localStorage via `src/lib/packing-store.ts` (try/catch, fallback to memory); a new versioned key isolates the fresh brief from prior app data.
- Store is read only after hydration (useSyncExternalStore with an "unloaded" server snapshot); pages render a skeleton until loaded. Why: avoids SSR hydration mismatches.
- Packing selection, bag assignment, totals and removal suggestions live in the pure `src/lib/packing.ts` module; UI does not duplicate rules.
- The active app has only home, one-page trip setup and individual packing plans; packed item edits are saved directly per trip so checklist and bag choices persist.
- The active travel catalog narrows shared catalog defaults to common essentials and supplements sleepwear, toiletry kit and documents; individual copies represent quantity.
- A shared ItemIcon renders category/name-specific line illustrations using each item's stored color so wardrobe and trip displays stay consistent.
- Generated trips carry a packing-rules version; obsolete saved samples regenerate on load while personal trips and current sample edits remain untouched, so revised defaults appear without discarding user work.
- Airline presets use a null weight allowance for size-only rules; trips persist an explicit weight-check flag so no artificial weight ceiling is enforced while older numeric plans retain their checks.

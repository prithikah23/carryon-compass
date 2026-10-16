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

- All app data lives in browser localStorage via `src/lib/store.ts` (try/catch, fallback to memory). Why: brief forbids backend/accounts.
- Store is read only after hydration (useSyncExternalStore with an "unloaded" server snapshot); pages render a skeleton until loaded. Why: avoids SSR hydration mismatches.
- Packing/outfit logic is a pure deterministic module `src/lib/engine.ts`; UI never duplicates its rules. Why: testable, consistent reasons everywhere.
- User edits to a recommendation are stored as `trip.overrides` on top of the computed plan, so "Restore recommendation" just clears them.

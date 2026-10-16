# Carry-On Compass — Competition Plan

## Strategy (driven by the SheBuilds rubric)

The rubric rewards a **focused, complete, polished** app over a large unfinished one, and gives no extra points for AI, extra features, or paid plans. So the plan is:

1. **One clear core loop, done end-to-end:** wardrobe → trip → recommended outfits + packing list → weight/space tracking. Every screen reachable, every button works, no dead ends or placeholder text.
2. **Eligibility-safe:** fresh build, no unresolved security errors, publishable and accessible to reviewers.
3. **Deliberate scope cuts:** no social features, no monetization, no AI gimmicks. Weather and airline data are handled with simple, reliable approaches instead of fragile integrations.

## Core features (the complete loop)

1. **Digital wardrobe**
   - Add/edit/delete items: name, category (top, bottom, outerwear, shoes, accessory, toiletry), color, weight (g), size/bulk (S/M/L), photo optional.
   - Wardrobe grid with filters by category/color.

2. **Trip planner**
   - Create a trip: destination, dates/length, activities (multi-select: business, hiking, beach, dining out, etc.), airline baggage limit (presets for major carry-on standards + custom), and a souvenir reserve (e.g. keep 2 kg / 15% space free).
   - Weather: destination + season-based climate summary (curated data), so no fragile live-API dependency at judging time.

3. **Outfit & packing recommendations**
   - Rule-based engine: combines trip length, activities, and climate to suggest versatile outfits (capsule-wardrobe logic — items that mix and match) and generates a packing list from the user's own wardrobe.
   - User can swap items in/out of the list.

4. **Weight & space tracker**
   - Live totals: packed weight vs. airline limit, space used vs. bag capacity, souvenir reserve shown as a protected buffer.
   - Clear visual gauge; warnings when over limit.

5. **Accounts & persistence (Lovable Cloud)**
   - Email sign-up/login so wardrobes and trips persist and each reviewer sees their own data.
   - A seeded demo account so judges can explore instantly without creating data.

## Pages

- `/` — landing page: what the app does, one screenshot-style visual, "Get started" / "Try the demo"
- `/wardrobe` — wardrobe grid + add-item form
- `/trips` — trip list + create-trip wizard
- `/trips/$tripId` — trip dashboard: outfits, packing checklist, weight/space gauges, souvenir reserve
- `/login` — auth

## Design

- Distinct travel-journal aesthetic: warm off-white background, deep teal + terracotta accents, serif display font for headings (Fraunces) + clean sans body (Work Sans). No generic purple-gradient look.
- Fully responsive; judges may open it on a phone.
- Empty states with helpful guidance on every screen.

## Technical notes

- TanStack Start + Tailwind v4 + shadcn, per project stack.
- Lovable Cloud for auth + database (wardrobe items, trips, packing-list entries) with row-level security so users only see their own data.
- Recommendation logic is a transparent, testable rules module (no external AI calls — keeps judging reliable).
- Each route gets proper head metadata (title, description, og tags).

## Build order

1. Lovable Cloud setup + schema + auth
2. Wardrobe CRUD
3. Trip creation + climate/activity model
4. Recommendation engine + packing list
5. Weight/space tracking + souvenir reserve
6. Landing page, polish, empty states, mobile pass
7. Final sweep: no placeholders, no console errors, publish-ready

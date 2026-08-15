# Food & Nutrition Analysis — Design Spec

**Date:** 2026-08-15
**Status:** Approved, pending implementation plan
**Owner:** Muhammad Taha (VisionWise FYP)

## Problem

VisionWise's Health lens currently gives every scanned object a generic
Good/Bad/Neutral verdict + score + a 3-5 item factor breakdown
(`{label, percent}`), regardless of what was scanned. That's too shallow for
food specifically — the FYP requirements call for real nutrition estimates,
packaged-food label reading, per-ingredient explanations, and honest
low/moderate/high impact framing instead of a flat healthy/unhealthy label.

## Goals

1. When a scanned object is a food **dish**, estimate per-serving nutrition
   (calories, protein, carbs, fat, fiber, sugar, sodium, other notable
   nutrients) from the image.
2. When a scanned object is **packaged food** with a visible label, read the
   ingredient list and nutrition facts directly from the label instead of
   estimating.
3. Explain notable ingredients (what it is, why it's used, effect on the
   body, concern level) as visual cards, not paragraphs.
4. Give each nutrient a Low/Moderate/High impact framing with a plain
   explanation — not a blanket healthy/unhealthy label.
5. Present all of the above as an at-a-glance visual summary (cards,
   progress indicators), not a wall of text.
6. Never invent data. Distinguish label-extracted values from AI-estimated
   values. Say so plainly when an image is too unclear to read reliably.

## Non-goals

- No new scan mode, toggle, or UI entry point. This upgrades the existing
  Health-lens scan flow (per user decision) — same camera, same "Scan now"
  button, same one Gemini call per scan.
- No OCR library or barcode scanner. Gemini's vision call already reads
  printed text in-frame; that's the only "label reading" mechanism.
- No dedicated "nutrition summary" screen distinct from the nutrient cards
  — one component serves both the detail view and the at-a-glance summary
  (goal 5 folded into goal 1's component; see Frontend section).
- No per-nutrient sourcing (label vs. estimated) — sourcing is one flag for
  the whole scan (`food.source`), not per nutrient. A packaged product's
  photo either shows a readable label or it doesn't.

## Data model

One new optional field on the existing scan response, `ScanLog` document,
and Gemini JSON contract: `food`. Absent/`isFood: false` for every
non-food object and for all non-Health lenses — zero behavior change there.

```ts
food?: {
  isFood: boolean
  dishType: "dish" | "packaged"        // which extraction path applied
  source: "label" | "estimated"        // read from packaging vs AI-estimated
  servingNote: string                  // e.g. "Estimated for 1 plate/serving"
  unclear: boolean                     // true => nutrients/ingredients stay empty
  nutrients: Array<{
    label: string                      // "Calories", "Protein", "Sodium", ...
    amount: number
    unit: string                       // "kcal", "g", "mg"
    percentDV: number                  // 0-100+, Gemini computes vs. standard daily values
    impact: "Low" | "Moderate" | "High"
    note: string                       // one-sentence plain-language explanation
  }>
  ingredients: Array<{
    name: string
    whatItIs: string
    whyUsed: string
    effect: string
    concern: "Low" | "Moderate" | "High" | null
  }>
}
```

`nutrients` always attempts the 7 named nutrients (calories, protein, carbs,
fat, fiber, sugar, sodium) plus any other nutrient Gemini judges notable for
that item, capped at 12 entries. `ingredients` covers only ingredients worth
explaining (additives, preservatives, notable allergens/actives) — a plain
home-cooked dish may return an empty or very short list, which is correct,
not a bug.

When `unclear: true`, `nutrients` and `ingredients` are empty arrays and the
UI shows an honest "couldn't reliably read this — try a clearer or closer
photo" state instead of a blank or fabricated panel.

## Backend changes

### `server/services/geminiService.js`

Extend the single existing prompt (no second Gemini call) with a
conditional food block appended after the current verdict/breakdown
instructions:

> If the scanned object is food (a dish or a packaged food/drink product),
> additionally analyze it and include a `"food"` object in your JSON
> response with this shape: `{isFood, dishType, source, servingNote,
> unclear, nutrients: [...], ingredients: [...]}`. Use `dishType:
> "packaged"` and `source: "label"` only if you can actually read printed
> nutrition/ingredient text in the image — otherwise use `dishType: "dish"`
> and `source: "estimated"`. Never invent numbers: if the object is food but
> the image is too unclear to read or reliably estimate, set
> `unclear: true` and leave `nutrients`/`ingredients` empty. If the object
> is not food, omit the `food` field entirely (or set `isFood: false`).
> Nutrient impact should be Low/Moderate/High based on the amount in this
> serving relative to typical daily intake — not a blanket healthy/bad
> label. Keep ingredient explanations to one short sentence each.

Sanitization (mirrors the existing `breakdown` sanitizer added last
session): after `JSON.parse`, if `parsed.food` is present, coerce/validate
types, clamp `percentDV` to `[0, 400]` (some nutrients like sodium can
legitimately exceed 100% DV), cap `nutrients` at 12 and `ingredients` at 8,
drop malformed entries, and default missing enums (`impact`/`concern`) to
`null` rather than guessing. If `parsed.food` is missing or malformed
entirely, default to `undefined` (same as today — no food panel renders).

The existing rate-limit fallback (`getFallbackVerdict`) is **not** changed:
it already returns no `breakdown`, and will continue to return no `food`
data. That's correct — no AI available means no invented nutrition, per
goal 6.

### `server/models/ScanLog.js`

Add one more optional subdocument field, same pattern as `breakdown`:

```js
food: {
  type: {
    isFood: Boolean,
    dishType: String,
    source: String,
    servingNote: String,
    unclear: Boolean,
    nutrients: [{ label: String, amount: Number, unit: String, percentDV: Number, impact: String, note: String, _id: false }],
    ingredients: [{ name: String, whatItIs: String, whyUsed: String, effect: String, concern: String, _id: false }]
  },
  default: undefined
}
```

### `server/controllers/scanController.js`

One line added to the existing `ScanLog.create` call: `food:
verdictData.food` (mirrors the `breakdown` line already there). No new
routes, no new validation middleware — `imageBase64`/`objectLabel`/`context`
inputs are unchanged.

## Frontend changes

Two new components in `client/src/components/InfographicChart/`, alongside
the existing `BreakdownChart.jsx`:

### `NutritionPanel.jsx`

Props: `{ nutrients, servingNote, unclear }`. Renders:
- `unclear` → a single muted state message, nothing else.
- Otherwise a responsive card grid, one card per nutrient: label, `amount
  unit`, a gradient progress bar filled to `percentDV` (clamped visually at
  100% even if the value exceeds it, with the raw % shown as text), and a
  small color-coded impact chip (Low/Moderate/High — reusing the existing
  `--good`/`--neutral`/`--bad` CSS tokens so it matches the app's established
  semantic colors, not a new palette).
- `servingNote` rendered once above the grid in small muted text.

This single component satisfies goals 1, 4, and 5 — the "at a glance
summary" is this same grid, not a separate view.

### `IngredientInfographic.jsx`

Props: `{ ingredients }`. Renders nothing if empty. Otherwise a card per
ingredient: name, one-line "what it is", one-line "why it's used", one-line
"effect", and a concern chip (Low/Moderate/High/omitted) using the same
color tokens as above.

### `VerdictCard.jsx`

When `result.food?.isFood` is true: render a small source badge ("Estimated
from photo" / "Read from package label"), then `NutritionPanel`, then
`IngredientInfographic`, **instead of** the current `BreakdownChart` (shown
only when `food` is absent — unchanged for every non-food scan and every
non-Health lens). A one-line disclaimer ("General educational information,
not medical advice — portion size and frequency matter.") renders once
under the ingredient cards, satisfying the last bullet of goal 6.

No changes to the score bar, reason text, tips list, share button, or
fallback notice — those stay exactly as they are today for every scan type.

## Error handling / accuracy

- Prompt-level: explicit "never invent numbers" instruction + the
  `unclear` escape hatch (see above).
- Sanitizer-level: malformed/missing fields default to empty/null rather
  than being guessed at in code.
- UI-level: `unclear: true` shows an honest message instead of an empty or
  fabricated-looking panel; a food scan with `unclear: false` but an empty
  `ingredients` array is a valid, common result (plain dish, nothing to
  flag) and renders no ingredient section, not an error state.
- Fallback path (Gemini rate-limited) is unchanged and already handles this
  correctly by omitting all detail data.

## Testing

- Manual smoke test (same pattern used earlier this session): `curl` the
  `/api/scan` endpoint with a real food photo and inspect the `food` object
  shape in the response — verifies prompt + sanitizer end-to-end without
  spending extra Gemini quota on repeated UI clicks.
- One rendering check per new component confirming the `unclear`/empty
  states don't crash (no nutrients, no ingredients, `food` entirely absent)
  — these are the states most likely to regress silently.
- No new backend route to unit-test; existing `/api/scan` validation
  middleware is untouched.

## Open risks

- Gemini's nutrition estimates for a *dish* (goal 1) are inherently rough —
  this is disclosed via `source: "estimated"` and the UI badge, not solved
  in code.
- `percentDV` accuracy depends entirely on the model's own knowledge of
  daily value references; not independently verified against an external
  nutrition database (would require a paid API, against the project's
  free-tech constraint).

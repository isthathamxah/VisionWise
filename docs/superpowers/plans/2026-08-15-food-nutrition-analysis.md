# Food & Nutrition Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Health-lens scan flow so that when a scanned object is food, the verdict response includes real per-serving nutrition (estimated for a dish, or read from a visible package label), Low/Moderate/High impact framing per nutrient, and explainer cards for notable ingredients — rendered as visual cards instead of the generic factor-breakdown donut.

**Architecture:** One existing Gemini call (no new API calls, no new endpoints) gets a conditional prompt extension that returns an optional `food` object. A pure `sanitizeFood()` function validates/clamps it before it's persisted on `ScanLog` and returned from `POST /api/scan`. Two new presentational React components render it inside the existing `VerdictCard`, replacing `BreakdownChart` only when `food.isFood` is true.

**Tech Stack:** Node.js (`node:test` + `node:assert/strict` for backend unit tests — zero new dependency, built into Node 18+), Express, Mongoose, `@google/generative-ai`, React, Tailwind (existing CSS variable tokens, no new palette).

**Spec:** `docs/superpowers/specs/2026-08-15-food-nutrition-analysis-design.md`

## Global Constraints

- No new npm dependencies (backend or frontend).
- No second Gemini call per scan — the food analysis rides on the same request that already produces `verdict`/`score`/`breakdown`.
- Never invent nutrition numbers. If `unclear: true`, `nutrients` and `ingredients` must be empty arrays — no fabricated data.
- `food` field absent (or `isFood: false`) must leave every non-food scan and every non-Health-lens scan byte-for-byte unchanged from current behavior.
- Impact/concern colors reuse the existing `--good`/`--neutral`/`--bad` CSS variable tokens already used by `VerdictCard` — no new color palette.
- `dishType: "packaged"` and `source: "label"` only travel together — a scan can never claim "read from label" without also being classified `packaged`.

---

### Task 1: Gemini prompt extension + `sanitizeFood`

**Files:**
- Modify: `server/services/geminiService.js`
- Create: `server/services/geminiService.test.js`
- Modify: `server/package.json` (add `test` script)

**Interfaces:**
- Consumes: nothing new — extends the existing exported `getVerdict(objectLabel, context, imageBase64)`.
- Produces: `export function sanitizeFood(food)` — takes the raw parsed `food` value from Gemini's JSON (or `undefined`/garbage) and returns either `undefined` or a fully-validated object of shape `{ isFood, dishType, source, servingNote, unclear, nutrients: [{label, amount, unit, percentDV, impact, note}], ingredients: [{name, whatItIs, whyUsed, effect, concern}] }`. Later tasks (`scanController.js`, `NutritionPanel.jsx`, `IngredientInfographic.jsx`) consume exactly this shape.

- [ ] **Step 1: Add the `test` script to `server/package.json`**

```json
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "node --test"
  },
```

- [ ] **Step 2: Write the failing tests**

Create `server/services/geminiService.test.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeFood } from './geminiService.js'

test('sanitizeFood returns undefined for non-food or missing input', () => {
  assert.equal(sanitizeFood(undefined), undefined)
  assert.equal(sanitizeFood(null), undefined)
  assert.equal(sanitizeFood({ isFood: false }), undefined)
  assert.equal(sanitizeFood('not an object'), undefined)
})

test('sanitizeFood keeps valid dish data and clamps percentDV to 400', () => {
  const result = sanitizeFood({
    isFood: true,
    dishType: 'dish',
    source: 'estimated',
    servingNote: 'Estimated for 1 plate',
    unclear: false,
    nutrients: [
      { label: 'Sodium', amount: 900, unit: 'mg', percentDV: 950, impact: 'High', note: 'Very high for one serving.' }
    ],
    ingredients: []
  })
  assert.equal(result.dishType, 'dish')
  assert.equal(result.source, 'estimated')
  assert.equal(result.nutrients[0].percentDV, 400)
  assert.equal(result.nutrients[0].impact, 'High')
})

test('sanitizeFood forces source to estimated unless dishType is packaged', () => {
  const result = sanitizeFood({ isFood: true, dishType: 'dish', source: 'label', unclear: false, nutrients: [], ingredients: [] })
  assert.equal(result.source, 'estimated')

  const packaged = sanitizeFood({ isFood: true, dishType: 'packaged', source: 'label', unclear: false, nutrients: [], ingredients: [] })
  assert.equal(packaged.source, 'label')
})

test('sanitizeFood drops malformed nutrient and ingredient entries', () => {
  const result = sanitizeFood({
    isFood: true,
    unclear: false,
    nutrients: [{ label: 'Calories' }, { label: 'Protein', amount: 12 }],
    ingredients: [{ whatItIs: 'no name field' }, { name: 'Sugar' }]
  })
  assert.equal(result.nutrients.length, 1)
  assert.equal(result.nutrients[0].label, 'Protein')
  assert.equal(result.ingredients.length, 1)
  assert.equal(result.ingredients[0].name, 'Sugar')
})

test('sanitizeFood returns empty nutrients/ingredients when unclear', () => {
  const result = sanitizeFood({
    isFood: true,
    unclear: true,
    nutrients: [{ label: 'Calories', amount: 100 }],
    ingredients: [{ name: 'Salt' }]
  })
  assert.equal(result.nutrients.length, 0)
  assert.equal(result.ingredients.length, 0)
})

test('sanitizeFood defaults an invalid impact/concern enum to null instead of guessing', () => {
  const result = sanitizeFood({
    isFood: true,
    unclear: false,
    nutrients: [{ label: 'Fiber', amount: 4, impact: 'Extreme' }],
    ingredients: [{ name: 'MSG', concern: 'Severe' }]
  })
  assert.equal(result.nutrients[0].impact, null)
  assert.equal(result.ingredients[0].concern, null)
})

test('sanitizeFood caps nutrients at 12 and ingredients at 8', () => {
  const manyNutrients = Array.from({ length: 20 }, (_, i) => ({ label: `N${i}`, amount: 1 }))
  const manyIngredients = Array.from({ length: 20 }, (_, i) => ({ name: `I${i}` }))
  const result = sanitizeFood({ isFood: true, unclear: false, nutrients: manyNutrients, ingredients: manyIngredients })
  assert.equal(result.nutrients.length, 12)
  assert.equal(result.ingredients.length, 8)
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd server && npm test`
Expected: FAIL — `sanitizeFood is not a function` (it doesn't exist in `geminiService.js` yet).

- [ ] **Step 4: Extend the prompt and implement `sanitizeFood`**

In `server/services/geminiService.js`, add the conditional food instructions to the existing prompt string (right after the `breakdown` sentence, before the "Respond with ONLY valid JSON" line):

```js
Also break the object down into 3-5 key components or factors that drove your verdict (e.g. for food: ingredients/nutrients; for a device: materials or usage factors) with a percent weight each, summing to 100.

If the scanned object is food (a dish or a packaged food/drink product), additionally analyze it and include a "food" object in your JSON response. Use dishType "packaged" and source "label" ONLY if you can actually read printed nutrition/ingredient text in the image — otherwise use dishType "dish" and source "estimated". Never invent numbers: if the object is food but the image is too unclear to read or reliably estimate, set unclear to true and leave nutrients and ingredients empty. If the object is not food, omit the "food" field entirely. Nutrient impact must be "Low", "Moderate", or "High" based on the amount in this serving relative to typical daily intake — not a blanket healthy/bad label. Keep each ingredient explanation to one short sentence.
```

Update the JSON contract block to add the `food` field:

```js
Respond with ONLY valid JSON (no markdown, no extra text):
{
  "verdict": "Good" or "Bad" or "Neutral",
  "score": <integer between 0 and 100>,
  "reason": "<one clear sentence explanation>",
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "breakdown": [{"label": "<component or factor>", "percent": <integer, sums to 100 across items>}],
  "food": {
    "isFood": <true or false>,
    "dishType": "dish" or "packaged",
    "source": "estimated" or "label",
    "servingNote": "<e.g. 'Estimated for 1 plate/serving'>",
    "unclear": <true or false>,
    "nutrients": [{"label": "Calories", "amount": <number>, "unit": "kcal", "percentDV": <integer>, "impact": "Low" or "Moderate" or "High", "note": "<one sentence>"}],
    "ingredients": [{"name": "<ingredient>", "whatItIs": "<one sentence>", "whyUsed": "<one sentence>", "effect": "<one sentence>", "concern": "Low" or "Moderate" or "High" or null}]
  }
}

Score guide: 0-33 = Bad, 34-66 = Neutral, 67-100 = Good`
```

Add `sanitizeFood` as an exported function, and add a `sanitizeBreakdown` extraction for symmetry is NOT needed — leave the existing inline `breakdown` sanitizer as-is. Place `sanitizeFood` above `getVerdict`:

```js
export function sanitizeFood(food) {
  if (!food || typeof food !== 'object' || food.isFood !== true) return undefined

  const dishType = food.dishType === 'packaged' ? 'packaged' : 'dish'
  const clean = {
    isFood: true,
    dishType,
    source: dishType === 'packaged' && food.source === 'label' ? 'label' : 'estimated',
    servingNote: typeof food.servingNote === 'string' ? food.servingNote.slice(0, 120) : '',
    unclear: food.unclear === true,
    nutrients: [],
    ingredients: []
  }

  if (clean.unclear) return clean

  clean.nutrients = Array.isArray(food.nutrients)
    ? food.nutrients
        .filter(n => n?.label && Number.isFinite(n.amount))
        .slice(0, 12)
        .map(n => ({
          label: String(n.label).slice(0, 40),
          amount: Math.max(0, n.amount),
          unit: typeof n.unit === 'string' ? n.unit.slice(0, 10) : '',
          percentDV: Number.isFinite(n.percentDV) ? Math.max(0, Math.min(400, Math.round(n.percentDV))) : 0,
          impact: ['Low', 'Moderate', 'High'].includes(n.impact) ? n.impact : null,
          note: typeof n.note === 'string' ? n.note.slice(0, 200) : ''
        }))
    : []

  clean.ingredients = Array.isArray(food.ingredients)
    ? food.ingredients
        .filter(i => i?.name)
        .slice(0, 8)
        .map(i => ({
          name: String(i.name).slice(0, 60),
          whatItIs: typeof i.whatItIs === 'string' ? i.whatItIs.slice(0, 200) : '',
          whyUsed: typeof i.whyUsed === 'string' ? i.whyUsed.slice(0, 200) : '',
          effect: typeof i.effect === 'string' ? i.effect.slice(0, 200) : '',
          concern: ['Low', 'Moderate', 'High'].includes(i.concern) ? i.concern : null
        }))
    : []

  return clean
}
```

Wire it into `getVerdict`, right after the existing `parsed.breakdown = ...` block:

```js
    parsed.food = sanitizeFood(parsed.food)
    return parsed
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd server && npm test`
Expected: PASS — 7 tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add server/services/geminiService.js server/services/geminiService.test.js server/package.json
git commit -m "feat(server): extend Gemini prompt with food nutrition analysis"
```

---

### Task 2: Persist `food` end-to-end (ScanLog + scanController)

**Files:**
- Modify: `server/models/ScanLog.js`
- Modify: `server/controllers/scanController.js`

**Interfaces:**
- Consumes: `sanitizeFood`'s output shape from Task 1 (via `verdictData.food` inside `getVerdict`'s return value — already wired, no import needed in `scanController.js` since it just reads the object `getVerdict` returns).
- Produces: `ScanLog` documents and `POST /api/scan` responses that include a `food` field with the Task 1 shape whenever the scan was food, exactly as `breakdown` already does.

- [ ] **Step 1: Add the `food` field to the ScanLog schema**

In `server/models/ScanLog.js`, add after the existing `breakdown` field:

```js
  breakdown: {
    type: [{ label: String, percent: Number, _id: false }],
    default: []
  },
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

- [ ] **Step 2: Persist it in the controller**

In `server/controllers/scanController.js`, add one line to the existing `ScanLog.create` call, after `breakdown`:

```js
      reason: verdictData.reason,
      tips: verdictData.tips,
      breakdown: verdictData.breakdown || [],
      food: verdictData.food
    })
```

(`res.json({ ...verdictData, scanLogId: scanLog._id })` already spreads `food` through to the API response — no change needed there.)

- [ ] **Step 3: Verify with a live smoke test**

Restart the backend so the schema/controller changes load:

```bash
netstat -ano | grep ':5000' | grep LISTENING   # find the PID
taskkill //F //PID <pid>
cd server && node index.js &
```

Wait for `MongoDB connected` / `Server running on port 5000` in the log, then log in as the existing smoke-test user and scan a real food photo (a photo of visible food, not a 1x1 placeholder — the point is to see Gemini actually classify it as food):

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"smoketest+vw@example.com","password":"Smoketest1"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")
curl -s -X POST http://localhost:5000/api/scan -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"objectLabel\":\"apple\",\"context\":\"health\",\"imageBase64\":\"<base64 of a real food photo>\"}"
```

Expected: the JSON response includes a `food` object with `isFood: true`, `dishType`, `source`, and a non-empty `nutrients` array whose entries match the Task 1 shape (`label`/`amount`/`unit`/`percentDV`/`impact`/`note`). Confirm the same scan retrieved via `GET /api/history` also carries the `food` field (proves it round-tripped through Mongo, not just the in-memory response).

- [ ] **Step 4: Commit**

```bash
git add server/models/ScanLog.js server/controllers/scanController.js
git commit -m "feat(server): persist food nutrition data on scan logs"
```

---

### Task 3: Nutrition panel, ingredient cards, and VerdictCard wiring

**Files:**
- Create: `client/src/components/InfographicChart/NutritionPanel.jsx`
- Create: `client/src/components/InfographicChart/IngredientInfographic.jsx`
- Modify: `client/src/components/VerdictCard/VerdictCard.jsx`

**Interfaces:**
- Consumes: `result.food` from the `POST /api/scan` response, in the exact shape `sanitizeFood` (Task 1) produces and `scanController.js` (Task 2) persists/returns.
- Produces: `NutritionPanel({ nutrients, servingNote, unclear })` and `IngredientInfographic({ ingredients })`, both default exports, both returning `null` when there's nothing to show (matching the existing `BreakdownChart` convention).

This project has no component-testing harness (no Jest/RTL, confirmed absent from both `package.json` files) and no isolated story/playground — `NutritionPanel` and `IngredientInfographic` are only ever meaningfully reviewed rendered together inside `VerdictCard`, so all three files are one task, verified with one live browser check at the end rather than three disconnected ones.

- [ ] **Step 1: Create `NutritionPanel.jsx`**

```jsx
const IMPACT_STYLES = {
  Low:      { text: 'text-good',    bar: 'rgb(var(--good))',    chip: 'bg-good/10 border-good/25' },
  Moderate: { text: 'text-neutral', bar: 'rgb(var(--neutral))', chip: 'bg-neutral/10 border-neutral/25' },
  High:     { text: 'text-bad',     bar: 'rgb(var(--bad))',     chip: 'bg-bad/10 border-bad/25' },
}

export default function NutritionPanel({ nutrients, servingNote, unclear }) {
  if (unclear) {
    return (
      <div className="rounded-xl2 p-4 mb-5 bg-surface2 border border-border">
        <p className="text-sm text-muted text-center py-2">
          Couldn't reliably read nutrition from this photo — try a clearer or closer shot.
        </p>
      </div>
    )
  }

  if (!nutrients?.length) return null

  return (
    <div className="rounded-xl2 p-4 mb-5 bg-surface2 border border-border">
      <p className="eyebrow mb-1">Nutrition</p>
      {servingNote && <p className="text-xs text-faint mb-4">{servingNote}</p>}
      <div className="grid grid-cols-2 gap-3">
        {nutrients.map((n, i) => {
          const style = IMPACT_STYLES[n.impact] || { text: 'text-muted', bar: 'rgb(var(--faint))', chip: 'bg-surface border-border' }
          const fillPct = Math.min(n.percentDV, 100)
          return (
            <div key={i} className="rounded-xl p-3 bg-surface border border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted truncate">{n.label}</span>
                {n.impact && (
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${style.chip} ${style.text}`}>
                    {n.impact}
                  </span>
                )}
              </div>
              <p className="font-display font-bold text-lg text-text mb-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {n.amount}<span className="text-xs font-normal text-faint ml-1">{n.unit}</span>
              </p>
              <div className="h-1.5 rounded-full overflow-hidden bg-surface2">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fillPct}%`, background: style.bar }} />
              </div>
              {n.note && <p className="text-xs text-muted mt-2 leading-relaxed">{n.note}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `IngredientInfographic.jsx`**

```jsx
const CONCERN_STYLES = {
  Low:      { text: 'text-good',    chip: 'bg-good/10 border-good/25' },
  Moderate: { text: 'text-neutral', chip: 'bg-neutral/10 border-neutral/25' },
  High:     { text: 'text-bad',     chip: 'bg-bad/10 border-bad/25' },
}

export default function IngredientInfographic({ ingredients }) {
  if (!ingredients?.length) return null

  return (
    <div className="rounded-xl2 p-4 mb-5 bg-surface2 border border-border">
      <p className="eyebrow mb-3">Ingredients to know</p>
      <div className="flex flex-col gap-3">
        {ingredients.map((ing, i) => {
          const style = CONCERN_STYLES[ing.concern]
          return (
            <div key={i} className="rounded-xl p-3 bg-surface border border-border">
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="font-display font-bold text-sm text-text">{ing.name}</span>
                {ing.concern && (
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${style.chip} ${style.text}`}>
                    {ing.concern} concern
                  </span>
                )}
              </div>
              {ing.whatItIs && <p className="text-xs text-muted leading-relaxed"><span className="text-faint">What: </span>{ing.whatItIs}</p>}
              {ing.whyUsed && <p className="text-xs text-muted leading-relaxed"><span className="text-faint">Why: </span>{ing.whyUsed}</p>}
              {ing.effect && <p className="text-xs text-muted leading-relaxed"><span className="text-faint">Effect: </span>{ing.effect}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire both into `VerdictCard.jsx`**

Add the imports, after the existing `BreakdownChart` import:

```jsx
import NutritionPanel from '../InfographicChart/NutritionPanel'
import IngredientInfographic from '../InfographicChart/IngredientInfographic'
```

Replace the existing:

```jsx
      <p className="text-text leading-relaxed mb-5">{result.reason}</p>

      <BreakdownChart breakdown={result.breakdown} />

      {result.tips?.length > 0 && (
```

with:

```jsx
      <p className="text-text leading-relaxed mb-5">{result.reason}</p>

      {result.food?.isFood ? (
        <>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4 bg-surface2 border border-border">
            <span className="font-mono text-[10px] text-faint uppercase">
              {result.food.source === 'label' ? 'Read from package label' : 'Estimated from photo'}
            </span>
          </div>
          <NutritionPanel nutrients={result.food.nutrients} servingNote={result.food.servingNote} unclear={result.food.unclear} />
          <IngredientInfographic ingredients={result.food.ingredients} />
          {!result.food.unclear && (
            <p className="text-[11px] text-faint leading-relaxed mb-5">
              General educational information, not medical advice — portion size and frequency matter.
            </p>
          )}
        </>
      ) : (
        <BreakdownChart breakdown={result.breakdown} />
      )}

      {result.tips?.length > 0 && (
```

- [ ] **Step 4: Verify live in the browser**

Restart the frontend dev server if it isn't already running (`cd client && npm run dev`), confirm the backend from Task 2 is up, then use the Playwright MCP tools:

1. `browser_navigate` to `http://localhost:5173/history` (or `/scanner`) while logged in as the smoke-test user.
2. `browser_console_messages` (level `warning`) — confirm no new errors beyond the pre-existing harmless favicon 404.
3. Re-run the Task 2 curl smoke test (or trigger a real scan through the camera if available) so a food scan exists, then reload `/scanner` and drive a scan if the camera is available; otherwise confirm via `GET /api/history` that the persisted `food` data matches what `NutritionPanel`/`IngredientInfographic` expect, and visually inspect the component code against the shape (`n.impact`, `n.percentDV`, `ing.concern` etc. — all present).
4. `browser_take_screenshot` of the verdict card and read the PNG with the `Read` tool — confirm: the "Estimated from photo" / "Read from package label" badge renders, nutrient cards show label/amount/unit/progress bar/impact chip, ingredient cards render when present, and `BreakdownChart` is correctly *not* shown for a food result (replaced by the panels) while still showing for a non-food Health scan.
5. Delete any screenshot files written to the repo root (`rm -f *.png`, matches the cleanup pattern used earlier this session) — they're verification artifacts, not project files.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/InfographicChart/NutritionPanel.jsx client/src/components/InfographicChart/IngredientInfographic.jsx client/src/components/VerdictCard/VerdictCard.jsx
git commit -m "feat(client): render food nutrition panel and ingredient cards on verdict"
```

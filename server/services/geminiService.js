import { GoogleGenerativeAI } from '@google/generative-ai'

// GEMINI_API_KEYS is an optional comma-separated list — a hedge against
// Gemini's daily free-tier quota (confirmed live: heavy testing exhausted it
// for the rest of the day). Each additional key comes from a separate Google
// account and gets its own independent free quota. GEMINI_API_KEY alone
// still works exactly as before if no extra keys are configured.
const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean)

const models = keys.map(key => new GoogleGenerativeAI(key).getGenerativeModel({ model: 'gemini-flash-latest' }))

// Rules used when Gemini is rate-limited
const fallbackRules = {
  good: ['apple', 'orange', 'banana', 'broccoli', 'carrot', 'sandwich', 'salad', 'water bottle', 'book'],
  bad: ['hot dog', 'pizza', 'donut', 'cake', 'wine glass', 'bottle', 'cup', 'cell phone'],
}

function getFallbackVerdict(objectLabel) {
  const label = objectLabel.toLowerCase()

  const isGood = fallbackRules.good.some(item => label.includes(item) || item.includes(label))
  const isBad = fallbackRules.bad.some(item => label.includes(item) || item.includes(label))

  const verdict = isGood ? 'Good' : isBad ? 'Bad' : 'Neutral'
  const score = isGood ? 75 : isBad ? 25 : 50

  const reasons = {
    Good: `A ${objectLabel} is generally considered positive for your health.`,
    Bad: `A ${objectLabel} may have a negative health impact.`,
    Neutral: `A ${objectLabel} has a neutral health impact.`
  }

  return {
    verdict,
    score,
    reason: reasons[verdict],
    tips: [
      `Consider portion size and frequency when evaluating a ${objectLabel}.`,
      `Usage habits matter more than the object itself.`,
      `For a detailed analysis, try again when the AI is available.`
    ],
    fallback: true
  }
}

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
        .map(n => (n && typeof n === 'object' ? { ...n, amount: Number(n.amount) } : n))
        .filter(n => n?.label && Number.isFinite(n.amount))
        .slice(0, 12)
        .map(n => ({
          label: String(n.label).slice(0, 40),
          amount: Math.round(Math.max(0, n.amount) * 10) / 10,
          unit: typeof n.unit === 'string' ? n.unit.slice(0, 10) : '',
          percentDV: Number.isFinite(n.percentDV) ? Math.max(0, Math.min(400, Math.round(n.percentDV))) : 0,
          impact: ['Low', 'Moderate', 'High'].includes(n.impact) ? n.impact : null,
          direction: ['limit', 'beneficial', 'neutral'].includes(n.direction) ? n.direction : 'neutral',
          note: typeof n.note === 'string' ? n.note.slice(0, 200) : ''
        }))
    : []

  clean.ingredients = Array.isArray(food.ingredients)
    ? food.ingredients
        .filter(i => i?.name)
        .slice(0, 25) // generous — a real packaged-food ingredient list rarely runs longer than this
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

export async function getVerdict(objectLabel, imageBase64) {
  const prompt = `You are a health and nutrition evaluator for the VisionWise app.
Look at the photo and identify what's actually there yourself — don't anchor on this hint, it comes from a generic 80-class on-device detector that's frequently wrong or vague, especially on anything besides a single easily-recognized object: "${objectLabel}".

STEP 1 — decide isFood first, before anything else. isFood is true ONLY if the object itself is something a person eats or drinks: a meal, snack, drink, fruit, or packaged food/drink product. Everything else — electronics, tools, furniture, stationery, vehicles, appliances, clothing, toys, books, containers/dishware with nothing in them, animals, people, plants that aren't produce — is NOT food, full stop, even if food happens to be visible nearby or in the background. When unsure, isFood is false.

STEP 2 — if isFood is false: set the top-level "food" key to null and instead break the object down into 3-5 key components or factors that drove your verdict, with a percent weight each summing to 100, in "breakdown".

STEP 3 — if isFood is true: set "breakdown" to an empty array (the nutrition data below covers that role instead) and fill in "food": dishType "packaged" and source "label" ONLY if you can actually read printed nutrition/ingredient text in the image — otherwise dishType "dish" and source "estimated". Never invent numbers: if the image is too unclear to read or reliably estimate, set unclear to true and leave nutrients and ingredients empty. Nutrient impact must be "Low", "Moderate", or "High" based on the amount in this serving relative to typical daily intake — not a blanket healthy/bad label. Set each nutrient's "direction" to "limit" (something people should generally moderate in large amounts, e.g. sugar, sodium, saturated fat), "beneficial" (generally good in reasonable amounts, e.g. fiber, protein, vitamins), or "neutral" (neither clearly applies) — this drives how it's color-coded, separately from how much of it is present. Keep each ingredient explanation to one short sentence.

The photo might show a single prepared dish, OR several separate raw ingredients/items grouped together (e.g. ingredients laid out for a recipe, a flat-lay of groceries) — these need different treatment. For "ingredients": if you can read a printed ingredient list (source "label"), transcribe and explain EVERY ingredient listed, in the order printed — do not summarize, group, or stop early just because the list is long; up to 25 is fine. If it's one prepared dish with no label, list its main identifiable components. If it's multiple separate items shown together, list EACH distinct item individually (e.g. eggs, flour, butter, milk — not just whichever container held the most obvious one) rather than collapsing them into a single generic entry or fixating on a bowl/plate/packaging over the actual food in it.

Respond with ONLY valid JSON (no markdown, no extra text), matching ONE of these two shapes exactly depending on your Step 1 decision:

Non-food shape ("food" is literally null):
{"verdict": "...", "score": <0-100>, "reason": "...", "tips": ["...", "...", "..."], "breakdown": [{"label": "...", "percent": <int, sums to 100>}], "food": null}

Food shape ("breakdown" is empty, "food" is fully filled in):
{"verdict": "...", "score": <0-100>, "reason": "...", "tips": ["...", "...", "..."], "breakdown": [], "food": {"isFood": true, "dishType": "dish" or "packaged", "source": "estimated" or "label", "servingNote": "<e.g. 'Estimated for 1 plate/serving'>", "unclear": <true or false>, "nutrients": [{"label": "Calories", "amount": <number>, "unit": "kcal", "percentDV": <integer>, "impact": "Low" or "Moderate" or "High", "direction": "limit" or "beneficial" or "neutral", "note": "<one sentence>"}], "ingredients": [{"name": "...", "whatItIs": "<one sentence>", "whyUsed": "<one sentence>", "effect": "<one sentence>", "concern": "Low" or "Moderate" or "High" or null}]}}

Score guide: 0-33 = Bad, 34-66 = Neutral, 67-100 = Good`

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const imagePart = { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }

  // gemini-flash-latest returns a 503 "currently experiencing high demand" from
  // Google's side occasionally — confirmed transient (a retry moments later
  // succeeds), so it's worth a couple of quick retries before giving up. The
  // SDK has no default timeout, so a bad attempt can hang indefinitely instead
  // of failing fast (confirmed live: one request hung 90+ seconds with zero
  // response) — an explicit per-attempt timeout, via the SDK's built-in
  // AbortController support, is what actually makes the retry loop useful.
  const isTransient = err =>
    err.status === 503 || err.name === 'AbortError' ||
    /503|high demand|Service Unavailable|abort|timeout/i.test(err.message || '')
  const isQuotaExhausted = err => err.message?.includes('429') || err.status === 429
  const attemptsPerKey = 3
  let lastErr

  for (let k = 0; k < models.length; k++) {
    for (let i = 0; i < attemptsPerKey; i++) {
      try {
        const result = await models[k].generateContent([prompt, imagePart], { timeout: 15000 })
        const text = result.response.text().trim()
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        // ScanLog's schema strictly requires verdict to be exactly "Good"/"Bad"/"Neutral"
        // — Gemini is only told the score-to-verdict mapping via the prompt's score
        // guide, and occasionally drifts off it (confirmed live: "Unrecognized / Blank
        // Image" on an edge-case photo), which threw a hard Mongoose ValidationError
        // and turned a working response into a 503. Deriving verdict from the
        // (clamped) score directly makes it impossible for this to happen again.
        parsed.score = Number.isFinite(Number(parsed.score)) ? Math.max(0, Math.min(100, Math.round(Number(parsed.score)))) : 50
        parsed.verdict = parsed.score >= 67 ? 'Good' : parsed.score >= 34 ? 'Neutral' : 'Bad'
        parsed.breakdown = Array.isArray(parsed.breakdown)
          ? parsed.breakdown
              .filter(b => b?.label && Number.isFinite(b.percent))
              .slice(0, 5)
              .map(b => ({ label: String(b.label).slice(0, 60), percent: Math.max(0, Math.min(100, Math.round(b.percent))) }))
          : []
        parsed.food = sanitizeFood(parsed.food)
        return parsed
      } catch (err) {
        lastErr = err
        // A quota hit means THIS key is spent for the day — retrying it is pointless,
        // move straight to the next key (if any) instead of burning retries on it.
        if (isQuotaExhausted(err)) {
          console.log(`[Gemini] Key ${k + 1}/${models.length} rate-limited — trying next key`)
          break
        }
        if (isTransient(err) && i < attemptsPerKey - 1) {
          console.log(`[Gemini] Transient error on key ${k + 1}/${models.length} (attempt ${i + 1}/${attemptsPerKey}), retrying:`, err.message)
          await new Promise(r => setTimeout(r, 1000 * (i + 1))) // 1s, then 2s
          continue
        }
        break // give up on this key, try the next one
      }
    }
  }
  // Every configured key failed. If it was for an expected reason (quota, transient
  // high-demand), a rule-based verdict beats a hard failure. Anything else (bad key,
  // malformed response, ...) gets rethrown so it's a visible 503 instead of silently
  // masquerading as normal fallback usage forever.
  if (isQuotaExhausted(lastErr) || isTransient(lastErr)) {
    console.log('[Gemini] All API keys unavailable — using fallback verdict')
    return { ...getFallbackVerdict(objectLabel), debugLastErr: lastErr?.message } // TODO: remove once diagnosed
  }
  throw lastErr
}

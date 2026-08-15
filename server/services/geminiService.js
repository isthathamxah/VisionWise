import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

const contextDescriptions = {
  health: 'judge the nutritional or health impact on a human body',
  eco: 'judge the environmental impact, recyclability, or sustainability',
  productivity: 'judge whether this object aids or distracts from work or study',
  finance: 'judge whether this object represents good or poor financial value'
}

// Fallback rules used when Gemini is rate-limited
const fallbackRules = {
  health: {
    good: ['apple', 'orange', 'banana', 'broccoli', 'carrot', 'sandwich', 'salad', 'water bottle', 'book'],
    bad: ['hot dog', 'pizza', 'donut', 'cake', 'wine glass', 'bottle', 'cup', 'cell phone'],
  },
  eco: {
    good: ['potted plant', 'book', 'bicycle', 'backpack', 'scissors', 'vase'],
    bad: ['bottle', 'cup', 'cell phone', 'laptop', 'tv', 'remote', 'car'],
  },
  productivity: {
    good: ['laptop', 'book', 'keyboard', 'mouse', 'scissors', 'clock', 'pen', 'notebook'],
    bad: ['cell phone', 'tv', 'remote', 'gaming controller', 'cup', 'couch'],
  },
  finance: {
    good: ['book', 'laptop', 'bicycle', 'backpack', 'keyboard'],
    bad: ['wine glass', 'tv', 'cell phone'],
  }
}

function getFallbackVerdict(objectLabel, context) {
  const label = objectLabel.toLowerCase()
  const rules = fallbackRules[context] || fallbackRules.health

  const isGood = rules.good?.some(item => label.includes(item) || item.includes(label))
  const isBad = rules.bad?.some(item => label.includes(item) || item.includes(label))

  const verdict = isGood ? 'Good' : isBad ? 'Bad' : 'Neutral'
  const score = isGood ? 75 : isBad ? 25 : 50

  const reasons = {
    Good: `A ${objectLabel} is generally considered positive in the ${context} context.`,
    Bad: `A ${objectLabel} may have a negative impact in the ${context} context.`,
    Neutral: `A ${objectLabel} has a neutral impact in the ${context} context.`
  }

  return {
    verdict,
    score,
    reason: reasons[verdict],
    tips: [
      `Consider the full context when evaluating a ${objectLabel}.`,
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

export async function getVerdict(objectLabel, context, imageBase64) {
  const isHealth = context === 'health'

  const breakdownInstruction = isHealth
    ? `Break the object down into 3-5 key components or factors that drove your verdict, with a percent weight each summing to 100 — UNLESS the object is food, in which case return an empty breakdown array (the nutrition data below covers that role instead).`
    : `Also break the object down into 3-5 key components or factors that drove your verdict (e.g. materials or usage factors) with a percent weight each, summing to 100.`

  // Food analysis only makes sense under the health context — asking for it under eco/focus/money
  // would just be wasted output the app throws away (sanitizeFood forces it to undefined there anyway).
  const foodInstruction = isHealth ? `

If the scanned object is food (a dish or a packaged food/drink product), additionally analyze it and include a "food" object in your JSON response. Use dishType "packaged" and source "label" ONLY if you can actually read printed nutrition/ingredient text in the image — otherwise use dishType "dish" and source "estimated". Never invent numbers: if the object is food but the image is too unclear to read or reliably estimate, set unclear to true and leave nutrients and ingredients empty. If the object is not food, omit the "food" field entirely. Nutrient impact must be "Low", "Moderate", or "High" based on the amount in this serving relative to typical daily intake — not a blanket healthy/bad label. Also set each nutrient's "direction" to "limit" (something people should generally moderate in large amounts, e.g. sugar, sodium, saturated fat), "beneficial" (generally good in reasonable amounts, e.g. fiber, protein, vitamins), or "neutral" (neither clearly applies) — this drives how it's color-coded, separately from how much of it is present. Keep each ingredient explanation to one short sentence.` : ''

  const foodJsonField = isHealth ? `,
  "food": {
    "isFood": <true or false>,
    "dishType": "dish" or "packaged",
    "source": "estimated" or "label",
    "servingNote": "<e.g. 'Estimated for 1 plate/serving'>",
    "unclear": <true or false>,
    "nutrients": [{"label": "Calories", "amount": <number>, "unit": "kcal", "percentDV": <integer>, "impact": "Low" or "Moderate" or "High", "direction": "limit" or "beneficial" or "neutral", "note": "<one sentence>"}],
    "ingredients": [{"name": "<ingredient>", "whatItIs": "<one sentence>", "whyUsed": "<one sentence>", "effect": "<one sentence>", "concern": "Low" or "Moderate" or "High" or null}]
  }` : ''

  const prompt = `You are a contextual object evaluator for the VisionWise app.
The user scanned a "${objectLabel}" and wants to evaluate it in the "${context}" context.
Your job: ${contextDescriptions[context]}.

${breakdownInstruction}${foodInstruction}

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "verdict": "Good" or "Bad" or "Neutral",
  "score": <integer between 0 and 100>,
  "reason": "<one clear sentence explanation>",
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "breakdown": [{"label": "<component or factor>", "percent": <integer, sums to 100 across items>}]${foodJsonField}
}

Score guide: 0-33 = Bad, 34-66 = Neutral, 67-100 = Good`

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const imagePart = { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }

  try {
    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text().trim()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    parsed.breakdown = Array.isArray(parsed.breakdown)
      ? parsed.breakdown
          .filter(b => b?.label && Number.isFinite(b.percent))
          .slice(0, 5)
          .map(b => ({ label: String(b.label).slice(0, 60), percent: Math.max(0, Math.min(100, Math.round(b.percent))) }))
      : []
    parsed.food = context === 'health' ? sanitizeFood(parsed.food) : undefined
    return parsed
  } catch (err) {
    // On rate limit, use fallback so the app keeps working
    if (err.message?.includes('429') || err.status === 429) {
      console.log('[Gemini] Rate limited — using fallback verdict')
      return getFallbackVerdict(objectLabel, context)
    }
    throw err
  }
}

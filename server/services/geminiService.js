import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

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

export async function getVerdict(objectLabel, context, imageBase64) {
  const prompt = `You are a contextual object evaluator for the VisionWise app.
The user scanned a "${objectLabel}" and wants to evaluate it in the "${context}" context.
Your job: ${contextDescriptions[context]}.

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "verdict": "Good" or "Bad" or "Neutral",
  "score": <integer between 0 and 100>,
  "reason": "<one clear sentence explanation>",
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"]
}

Score guide: 0-33 = Bad, 34-66 = Neutral, 67-100 = Good`

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const imagePart = { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }

  try {
    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text().trim()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (err) {
    // On rate limit, use fallback so the app keeps working
    if (err.message?.includes('429') || err.status === 429) {
      console.log('[Gemini] Rate limited — using fallback verdict')
      return getFallbackVerdict(objectLabel, context)
    }
    throw err
  }
}

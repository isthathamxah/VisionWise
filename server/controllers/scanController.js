import { validationResult } from 'express-validator'
import { getVerdict } from '../services/geminiService.js'
import ScanLog from '../models/ScanLog.js'

export const scan = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { imageBase64, objectLabel } = req.body
  try {
    const verdictData = await getVerdict(objectLabel, imageBase64)

    const scanLog = await ScanLog.create({
      userId: req.user._id,
      objectLabel,
      context: 'health',
      verdict: verdictData.verdict,
      score: verdictData.score,
      reason: verdictData.reason,
      tips: verdictData.tips,
      breakdown: verdictData.breakdown || [],
      food: verdictData.food
    })

    res.json({ ...verdictData, scanLogId: scanLog._id })
  } catch (err) {
    console.error('[scan] verdict failed:', err)
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: 'AI response parsing failed. Please try again.' })
    }
    res.status(503).json({ error: 'Verdict service temporarily unavailable.', debug: err.message }) // TODO: remove once diagnosed
  }
}

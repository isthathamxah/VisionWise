import ScanLog from '../models/ScanLog.js'

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getHistory = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(20, parseInt(req.query.limit) || 10)
  const skip = (page - 1) * limit

  const filter = { userId: req.user._id }
  if (req.query.q) filter.objectLabel = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i')
  if (['Good', 'Bad', 'Neutral'].includes(req.query.verdict)) filter.verdict = req.query.verdict

  try {
    const [scans, total] = await Promise.all([
      ScanLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ScanLog.countDocuments(filter)
    ])
    res.json({ scans, total, page, pages: Math.ceil(total / limit) })
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' })
  }
}

export const getScanById = async (req, res) => {
  try {
    const scan = await ScanLog.findOne({ _id: req.params.id, userId: req.user._id }).lean()
    if (!scan) return res.status(404).json({ error: 'Scan not found' })
    res.json(scan)
  } catch {
    res.status(404).json({ error: 'Scan not found' })
  }
}

export const getAnalytics = async (req, res) => {
  const days = Math.min(30, parseInt(req.query.days) || 7)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    const scans = await ScanLog.find({
      userId: req.user._id,
      createdAt: { $gte: since }
    }).lean()

    const weeklyScore = scans.length
      ? Math.round(scans.reduce((sum, s) => sum + s.score, 0) / scans.length)
      : 0

    // Group by date
    const byDate = {}
    scans.forEach(s => {
      const date = s.createdAt.toISOString().split('T')[0]
      byDate[date] = (byDate[date] || 0) + 1
    })
    const chartData = Object.entries(byDate).map(([date, count]) => ({ date, count }))

    res.json({ weeklyScore, chartData, totalScans: scans.length })
  } catch {
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}

export const deleteScan = async (req, res) => {
  try {
    const scan = await ScanLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!scan) return res.status(404).json({ error: 'Scan not found' })
    res.json({ message: 'Scan deleted' })
  } catch {
    res.status(500).json({ error: 'Failed to delete scan' })
  }
}

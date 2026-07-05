import { Router } from 'express'
import protect from '../middleware/authMiddleware.js'
import { getHistory, getAnalytics, deleteScan } from '../controllers/historyController.js'

const router = Router()

router.use(protect)

router.get('/', getHistory)
router.get('/analytics', getAnalytics)
router.delete('/:id', deleteScan)

export default router

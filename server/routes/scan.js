import { Router } from 'express'
import { body } from 'express-validator'
import protect from '../middleware/authMiddleware.js'
import { scanLimiter } from '../middleware/rateLimiter.js'
import { scan } from '../controllers/scanController.js'

const router = Router()

router.post('/', protect, scanLimiter, [
  body('objectLabel').trim().isLength({ min: 1, max: 100 }).escape(),
  body('context').isIn(['health', 'eco', 'productivity', 'finance']),
  body('imageBase64').isString().isLength({ max: 200000 })
], scan)

export default router

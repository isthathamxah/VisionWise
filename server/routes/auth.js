import { Router } from 'express'
import passport from 'passport'
import { body } from 'express-validator'
import { register, login, refresh, googleCallback, getMe, updateProfile, changePassword } from '../controllers/authController.js'
import protect from '../middleware/authMiddleware.js'
import '../config/passport.js'

const router = Router()

router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 64 })
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[0-9]/).withMessage('Must contain number')
], register)

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], login)

router.post('/refresh', refresh)
router.get('/me', protect, getMe)

router.patch('/profile', protect, [
  body('name').trim().isLength({ min: 2, max: 50 }).escape(),
], updateProfile)

router.patch('/password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8, max: 64 })
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[0-9]/).withMessage('Must contain number')
], changePassword)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
)

export default router

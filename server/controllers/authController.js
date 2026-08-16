import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator'
import User from '../models/User.js'

const signTokens = (userId, email) => ({
  accessToken: jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }),
  refreshToken: jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })
})

export const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { name, email, password } = req.body
  try {
    if (await User.findOne({ email })) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, password: hashed })
    const { accessToken, refreshToken } = signTokens(user._id, user.email)
    res.status(201).json({ accessToken, refreshToken, user: { _id: user._id, name: user.name, email: user.email, avatar: null, hasPassword: true } })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

export const login = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' })

    const { accessToken, refreshToken } = signTokens(user._id, user.email)
    res.json({ accessToken, refreshToken, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, hasPassword: !user.googleId } })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

export const refresh = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' })
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(401).json({ error: 'User not found' })
    const { accessToken } = signTokens(user._id, user.email)
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
}

export const googleCallback = (req, res) => {
  const { accessToken, refreshToken } = signTokens(req.user._id, req.user.email)
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`)
}

export const getMe = async (req, res) => {
  res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, avatar: req.user.avatar, hasPassword: !req.user.googleId })
}

export const updateProfile = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name: req.body.name }, { new: true })
    res.json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, hasPassword: !user.googleId })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

export const changePassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { currentPassword, newPassword } = req.body
  try {
    const user = await User.findById(req.user._id)
    if (!user.password) return res.status(400).json({ error: 'This account signs in with Google — there’s no password to change.' })

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect.' })

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()
    res.json({ message: 'Password updated' })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
}

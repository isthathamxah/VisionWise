import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import passport from 'passport'
import { globalLimiter } from './middleware/rateLimiter.js'
import authRoutes from './routes/auth.js'
import scanRoutes from './routes/scan.js'
import historyRoutes from './routes/history.js'

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())

const isDev = process.env.NODE_ENV !== 'production'
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin / tools with no Origin header (curl, health checks)
    if (!origin) return cb(null, true)
    // In dev, accept any localhost port (Vite may pick 5173, 5174, …)
    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true)
    // Otherwise only the configured client URL
    if (origin === process.env.CLIENT_URL) return cb(null, true)
    return cb(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
app.use(globalLimiter)
app.use(express.json({ limit: '5mb' }))
app.use(passport.initialize())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/scan', scanRoutes)
app.use('/api/history', historyRoutes)

// Health check (keeps Render free tier awake via uptime monitors)
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

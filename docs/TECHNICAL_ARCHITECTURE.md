# Technical Architecture Document
## VisionWise — AI-Powered Contextual Object Scanner & Recommender
**Version:** 1.0  
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)  
**Date:** June 2026

---

## 1. Architecture Overview

VisionWise uses a **3-tier MERN architecture** with an AI layer:

```
┌────────────────────────────────────────────────────────────────┐
│  TIER 1: Client (Browser)                                      │
│  React 18 + Vite + Tailwind CSS                               │
│  TF.js COCO-SSD (runs IN browser — no server call needed)     │
│  Deployed: Vercel (Free)                                       │
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTPS REST (JSON)
┌────────────────────────────▼───────────────────────────────────┐
│  TIER 2: Server (Node.js + Express)                            │
│  Auth, scan orchestration, Gemini proxy, rate limiting        │
│  Deployed: Render (Free)                                       │
└──────────────┬────────────────────────────┬───────────────────┘
               │                            │
┌──────────────▼──────────┐  ┌─────────────▼──────────────────┐
│  TIER 3A: Database      │  │  TIER 3B: AI Services          │
│  MongoDB Atlas M0 Free  │  │  Google Gemini 1.5 Flash (Free)│
│  (512MB, shared)        │  │  Google OAuth 2.0 (Free)       │
└─────────────────────────┘  └────────────────────────────────┘
```

---

## 2. Technology Stack Justification

| Layer | Technology | Version | Why | Cost |
|-------|-----------|---------|-----|------|
| Frontend framework | React | 18 | Industry standard, component model fits Camera/VerdictCard pattern | Free |
| Build tool | Vite | 5 | 10x faster than CRA, native ES modules | Free |
| Styling | Tailwind CSS | 3 | Utility-first, rapid prototyping, no CSS files needed | Free |
| Charts | Recharts | 2 | React-native chart library, easy bar/pie charts | Free |
| AI (detection) | TF.js + COCO-SSD | 4 / 2 | Runs in-browser, no API cost, real-time 30fps capable | Free |
| HTTP client | Axios | 1 | Interceptors for auth token injection, better than fetch | Free |
| Backend framework | Express | 4 | Minimal, fast, huge ecosystem | Free |
| Database ODM | Mongoose | 8 | Schema validation, typed models | Free |
| Database | MongoDB Atlas | M0 | Free 512MB cluster, no credit card, JSON-native | Free |
| Auth (local) | bcryptjs + JWT | — | Standard, secure password hashing + stateless tokens | Free |
| Auth (OAuth) | Passport.js | 0.7 | Battle-tested Google OAuth integration | Free |
| AI (verdict) | Gemini 1.5 Flash | — | Free 15 RPM, 1M tokens/day, vision-capable, JSON output | Free |
| Security | Helmet + cors + express-rate-limit | — | Defense-in-depth basics | Free |
| Frontend deploy | Vercel | — | Free tier, instant deploys from GitHub | Free |
| Backend deploy | Render | — | Free tier, auto-deploy from GitHub | Free |

---

## 3. Directory Structure

```
e:\Vision_Wise\
├── client/                          # React frontend (Vite)
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Camera/
│   │   │   │   ├── Camera.jsx       # <video> + <canvas> overlay
│   │   │   │   └── Camera.css
│   │   │   ├── ContextSelector/
│   │   │   │   └── ContextSelector.jsx
│   │   │   ├── VerdictCard/
│   │   │   │   └── VerdictCard.jsx
│   │   │   ├── InfographicChart/
│   │   │   │   └── InfographicChart.jsx
│   │   │   ├── Navbar/
│   │   │   │   └── Navbar.jsx
│   │   │   └── Dashboard/
│   │   │       └── Dashboard.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Scanner.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── hooks/
│   │   │   ├── useCamera.js
│   │   │   └── useDetection.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── canvasOverlay.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── scanController.js
│   │   └── historyController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── ScanLog.js
│   │   └── ContextRule.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── scan.js
│   │   └── history.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── rateLimiter.js
│   ├── services/
│   │   └── geminiService.js
│   ├── .env                         # NEVER commit this file
│   ├── .env.example                 # Committed — shows required keys
│   ├── package.json
│   └── index.js
│
├── docs/
│   ├── SRS.md
│   ├── SDS.md
│   ├── PRD.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── SECURITY_ACCESS.md
│   ├── FRONTEND_SPEC.md
│   └── FEATURE_TICKETS.md
│
├── PROGRESS.md
├── README.md
└── .gitignore
```

---

## 4. Environment Variables

### Server `.env` (never committed)
```
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/visionwise

# JWT
JWT_SECRET=<random 64-char string>
JWT_REFRESH_SECRET=<random 64-char string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Gemini
GEMINI_API_KEY=<from Google AI Studio — free>

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Server `.env.example` (committed to repo)
```
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
GEMINI_API_KEY=
PORT=5000
NODE_ENV=development
CLIENT_URL=
```

### Client `.env` (Vite — prefix with VITE_)
```
VITE_API_URL=http://localhost:5000/api
```
*No secret keys go in the client .env — Gemini key stays server-side only.*

---

## 5. AI Layer Design

### 5.1 TensorFlow.js COCO-SSD (Client-side)
```
Loading (once on Scanner page mount):
  import * as cocoSsd from '@tensorflow-models/coco-ssd'
  model = await cocoSsd.load()

Detection loop (requestAnimationFrame):
  const predictions = await model.detect(videoElement)
  // predictions = [{class: 'bottle', score: 0.94, bbox: [x,y,w,h]}, ...]
  // Filter: score > 0.5
  // Draw bbox on canvas
  // Set detectedObject = predictions[0].class
```

### 5.2 Gemini 1.5 Flash (Server-side)
```javascript
// geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

const prompt = `
You are a contextual object evaluator.
Object detected: "${objectLabel}"
User context: "${context}" (${contextDescriptions[context]})
Respond with ONLY valid JSON (no markdown):
{"verdict":"Good|Bad|Neutral","score":0-100,"reason":"<1 sentence>","tips":["<tip1>","<tip2>","<tip3>"]}
`

const imagePart = { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
const result = await model.generateContent([prompt, imagePart])
const json = JSON.parse(result.response.text())
```

### 5.3 Rate Limit Strategy (Gemini Free Tier)
- Gemini free tier: 15 requests/minute, 1M tokens/day
- Our rate limiter: 10 scan requests/minute per user (server-side)
- Token estimation: ~500 tokens per scan (prompt + image + response)
- Daily capacity: ~2,000 scans/day on free tier — sufficient for FYP

---

## 6. Deployment Architecture

```
GitHub Repository
       │
       ├── /client ──► Vercel (auto-deploy on push to main)
       │                URL: https://visionwise.vercel.app
       │
       └── /server ──► Render (auto-deploy on push to main)
                        URL: https://visionwise-api.onrender.com
                        MongoDB Atlas ◄─── connected via MONGODB_URI env var
```

### Deployment Steps
1. Push code to GitHub
2. Connect Vercel to `/client` folder → set `VITE_API_URL` env var
3. Connect Render to `/server` folder → set all server env vars
4. Create MongoDB Atlas M0 free cluster → whitelist Render IP (or 0.0.0.0/0 for dev)
5. Set `GOOGLE_CALLBACK_URL` to production Render URL in Google Cloud Console

---

## 7. Performance Considerations

| Concern | Mitigation |
|---------|-----------|
| TF.js model size (~8MB) | Load once, cache in memory; show loading spinner |
| Gemini API latency (~2–4s) | Show loading skeleton in VerdictCard while awaiting |
| Render free tier cold start (~30s) | Add `/health` ping endpoint; show user message "Waking server..." |
| MongoDB Atlas shared cluster | Index `userId` and `createdAt` on ScanLogs collection |
| Base64 image size | Resize canvas to 640×480 before encoding; ~50–100KB per scan |

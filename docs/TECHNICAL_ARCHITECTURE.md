# Technical Architecture Document
## VisionWise — AI-Powered Nutrition & Food Scanner
**Version:** 2.0 (updated for the food-only pivot and mobile-first rebuild — see PRD.md §0)
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)
**Date:** August 2026

---

## 1. Architecture Overview

VisionWise uses a **3-tier MERN architecture** with an AI layer:

```
┌────────────────────────────────────────────────────────────────┐
│  TIER 1: Client (Browser)                                      │
│  React 18 + Vite + Tailwind CSS, installable as a PWA          │
│  TF.js COCO-SSD (runs IN browser — no server call needed)      │
│  Deploy target: Vercel (Free) — not yet deployed                │
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTPS REST (JSON)
┌────────────────────────────▼───────────────────────────────────┐
│  TIER 2: Server (Node.js + Express)                            │
│  Auth, scan orchestration, Gemini proxy, rate limiting         │
│  Deploy target: Render (Free) — not yet deployed                │
└──────────────┬────────────────────────────┬───────────────────┘
               │                            │
┌──────────────▼──────────┐  ┌─────────────▼──────────────────────┐
│  TIER 3A: Database      │  │  TIER 3B: External Services         │
│  MongoDB Atlas M0 Free  │  │  Gemini API (gemini-flash-latest)   │
│  (512MB, shared)        │  │  Google OAuth 2.0 · Gmail SMTP      │
└─────────────────────────┘  └──────────────────────────────────────┘
```

---

## 2. Technology Stack Justification

| Layer | Technology | Version | Why | Cost |
|-------|-----------|---------|-----|------|
| Frontend framework | React | 18 | Industry standard, component model fits Camera/VerdictCard pattern | Free |
| Build tool | Vite | 5 | Fast dev server, native ES modules | Free |
| Styling | Tailwind CSS | 3 | Utility-first, CSS-variable theming for light/dark | Free |
| Charts | Recharts | 2 | React-native chart library, easy bar/pie charts | Free |
| AI (detection) | TF.js + COCO-SSD | 4 / 2 | Runs in-browser, no API cost, real-time capable | Free |
| HTTP client | Axios | 1 | Interceptors for auth token injection + auto-refresh | Free |
| Client testing | Vitest + Testing Library | latest | Vite-native, zero extra config | Free |
| Backend framework | Express | 4 | Minimal, fast, huge ecosystem | Free |
| Database ODM | Mongoose | 8 | Schema validation, typed models | Free |
| Database | MongoDB Atlas | M0 | Free 512MB cluster, no credit card, JSON-native | Free |
| Auth (local) | bcryptjs + JWT | — | Standard, secure password hashing + stateless tokens | Free |
| Auth (OAuth) | Passport.js | 0.7 | Battle-tested Google OAuth integration | Free |
| AI (verdict) | Gemini API (`gemini-flash-latest`) | — | Free tier, vision-capable, JSON output. Earlier model ids (`gemini-2.0-flash`, `gemini-1.5-flash`) were deprecated/quota-zero on the free tier during development; `gemini-flash-latest` is the confirmed-working alias | Free |
| Email delivery | Nodemailer + Gmail SMTP | — | Free, no new signup, used for password-reset emails | Free |
| Security | Helmet + cors + express-rate-limit | — | Defense-in-depth basics | Free |
| Frontend deploy | Vercel | — | Free tier, instant deploys from GitHub (not yet connected) | Free |
| Backend deploy | Render | — | Free tier, auto-deploy from GitHub (not yet connected) | Free |

---

## 3. Directory Structure

```
e:\Vision_Wise\
├── client/                            # React frontend (Vite)
│   ├── public/
│   │   ├── manifest.json              # PWA manifest
│   │   ├── service-worker.js          # App-shell + API caching
│   │   ├── favicon.png
│   │   └── icons/                     # 192/512 + apple-touch-icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Camera/Camera.jsx
│   │   │   ├── VerdictCard/VerdictCard.jsx (+ .test.jsx)
│   │   │   ├── InfographicChart/
│   │   │   │   ├── InfographicChart.jsx
│   │   │   │   ├── NutritionPanel.jsx (+ .test.js)
│   │   │   │   ├── IngredientInfographic.jsx
│   │   │   │   └── BreakdownChart.jsx
│   │   │   ├── Navbar/Navbar.jsx
│   │   │   ├── Footer/Footer.jsx
│   │   │   ├── BottomNav/BottomNav.jsx
│   │   │   ├── BottomSheet/BottomSheet.jsx
│   │   │   ├── StatCard/StatCard.jsx
│   │   │   ├── PhoneMockup/PhoneMockup.jsx
│   │   │   ├── Onboarding/Onboarding.jsx
│   │   │   └── Auth/ (AuthAside.jsx, GoogleButton.jsx)
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Scanner.jsx
│   │   │   ├── History.jsx
│   │   │   ├── ScanDetail.jsx
│   │   │   ├── Account.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── hooks/
│   │   │   ├── useCamera.js
│   │   │   ├── useDetection.js
│   │   │   └── useReveal.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── services/
│   │   │   └── api.js (+ api.test.js)
│   │   ├── utils/
│   │   │   └── canvasOverlay.js
│   │   ├── data/
│   │   │   └── steps.js               # shared onboarding/"how it works" content
│   │   ├── test/
│   │   │   └── setup.js               # Vitest + Testing Library cleanup
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js                 # includes `test` config
│   └── tailwind.config.js
│
├── server/
│   ├── controllers/
│   │   ├── authController.js          # register/login/refresh/me/profile/password/avatar/forgot-reset
│   │   ├── scanController.js
│   │   └── historyController.js       # list (search+filter)/by-id/analytics/delete
│   ├── models/
│   │   ├── User.js
│   │   └── ScanLog.js
│   │   # ContextRule.js — removed, was dead code from the original 4-context design
│   ├── routes/
│   │   ├── auth.js
│   │   ├── scan.js
│   │   └── history.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── rateLimiter.js
│   ├── services/
│   │   ├── geminiService.js (+ geminiService.test.js)
│   │   └── emailService.js            # Nodemailer/Gmail SMTP wrapper
│   ├── .env                           # NEVER commit this file
│   ├── .env.example                   # Committed — shows required keys
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

# Gmail SMTP (password-reset emails)
EMAIL_USER=<a Gmail address>
EMAIL_PASS=<a 16-char Google Account App Password, not the account password>

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
EMAIL_USER=
EMAIL_PASS=
PORT=5000
NODE_ENV=development
CLIENT_URL=
```

### Client `.env` (Vite — prefix with VITE_)
```
VITE_API_URL=http://localhost:5000/api
```
*No secret keys go in the client .env — the Gemini key and email
credentials stay server-side only.*

---

## 5. AI Layer Design

### 5.1 TensorFlow.js COCO-SSD (Client-side)
```
Loading (once on Scanner page mount):
  import * as cocoSsd from '@tensorflow-models/coco-ssd'
  model = await cocoSsd.load()

Detection loop (requestAnimationFrame, live camera):
  const predictions = await model.detect(videoElement)
  // predictions = [{class: 'banana', score: 0.94, bbox: [x,y,w,h]}, ...]
  // Filter: score > 0.5
  // Draw bbox on canvas, verdict-colored once a scan completes
  // Set detectedObject = predictions[0].class

One-shot detection (uploaded/captured photo):
  const predictions = await model.detect(imgElement) // same model, no loop
```

### 5.2 Gemini API (Server-side)
```javascript
// geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

// The prompt has no user-chosen "context" — it makes Gemini decide
// food/non-food itself, from the image, as an explicit first step:
const prompt = `
You are a health and nutrition evaluator for the VisionWise app.
The user scanned a "${objectLabel}" and wants to know whether it's good, neutral or bad for their health.

STEP 1 — decide isFood first, before anything else. isFood is true ONLY if
the object itself is something a person eats or drinks... [full prompt in
services/geminiService.js]

Respond with ONLY valid JSON, matching ONE of two shapes:
  non-food: {"...", "food": null}
  food:     {"...", "breakdown": [], "food": {...fully filled...}}
`

const imagePart = { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
const result = await model.generateContent([prompt, imagePart])
const json = JSON.parse(cleanedResponseText)
json.food = sanitizeFood(json.food) // clamps/validates every numeric field, drops malformed entries
```

`sanitizeFood()` is unit-tested (`geminiService.test.js`, 10 cases) —
it's the boundary between whatever Gemini returns and what the client
trusts to render, so it never passes through an unvalidated number,
enum value, or oversized array.

### 5.3 Rate Limit Strategy (Gemini Free Tier)
- Gemini free tier is rate-limited per minute; exact limits vary by model/account
- `express-rate-limit` caps overall API traffic at the app level (see `middleware/rateLimiter.js`)
- On a Gemini 429, `geminiService.js` falls back to a small rule-based
  verdict (keyword matching on the object label) so a scan never hard-fails
  during a rate-limit window — the response carries `fallback: true` so
  the client can show a "rule-based reading" notice

---

## 6. Deployment Architecture (planned — not yet executed)

```
GitHub Repository
       │
       ├── /client ──► Vercel (auto-deploy on push to main)
       │                URL: TBD
       │
       └── /server ──► Render (auto-deploy on push to main)
                        URL: TBD
                        MongoDB Atlas ◄─── connected via MONGODB_URI env var
```

### Deployment Steps
1. Push code to GitHub
2. Connect Vercel to `/client` folder → set `VITE_API_URL` env var
3. Connect Render to `/server` folder → set all server env vars (including `EMAIL_USER`/`EMAIL_PASS`)
4. Create MongoDB Atlas M0 free cluster → whitelist Render IP (or 0.0.0.0/0 for dev)
5. Set `GOOGLE_CALLBACK_URL` to the production Render URL in Google Cloud Console
6. Update the client's manifest/service-worker `start_url` if the deployed path differs from `/`

---

## 7. Performance Considerations

| Concern | Mitigation |
|---------|-----------|
| TF.js model size (~8MB) | Load once, cache in memory; show loading spinner |
| Gemini API latency (~2–4s) | Show loading skeleton in VerdictCard while awaiting |
| Render free tier cold start (~30s, once deployed) | Not yet mitigated — a `/health` ping or a client-side "waking up" message would help post-deploy |
| MongoDB Atlas shared cluster | Index `userId` and `createdAt` on ScanLogs collection |
| Base64 image size | Server caps `imageBase64` at ~200KB via express-validator; body parser limit is 5MB overall (also covers avatar uploads) |
| Avatar storage | Resized to 256×256 client-side (canvas) before upload, capped at ~300KB server-side — inline data URL, no object storage service |
| Offline usage | Service worker caches the app shell and last-seen API GETs; write operations (POST/PATCH/DELETE) are never cached and require network |

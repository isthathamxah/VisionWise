# VisionWise
**AI-Powered Contextual Object Scanner & Recommender**

Final Year Project | Muhammad Taha (4618-FOC/BSCS/F22) | IIUI | 2022–2026

---

## What is VisionWise?

VisionWise is a web application that lets you point your camera at any object and instantly receive a contextual **Good/Bad/Neutral verdict** with an AI-generated explanation.

Unlike Google Lens (which only identifies objects), VisionWise evaluates what the object **means for you** based on a context you choose:

| Context | Example |
|---------|---------|
| 🥗 Health | Scans an energy drink → "Bad — 35g sugar exceeds daily limit" |
| ♻️ Eco | Scans a plastic bottle → "Bad — #6 PS is not recyclable" |
| 💼 Productivity | Scans a gaming controller → "Bad — likely a distraction during study" |
| 💰 Finance | Scans luxury headphones → "Neutral — high price but strong resale value" |

---

## Tech Stack (100% Free)

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| AI (Detection) | TensorFlow.js + COCO-SSD (in-browser) |
| AI (Verdict) | Google Gemini 1.5 Flash API (free tier) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas M0 (free) |
| Auth | JWT + Google OAuth 2.0 (Passport.js) |
| Charts | Recharts |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
Vision_Wise/
├── client/          # React frontend
├── server/          # Node/Express backend
├── docs/            # All project documentation
└── PROGRESS.md      # Step-by-step progress tracker
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [SRS](docs/SRS.md) | Software Requirements Specification |
| [SDS](docs/SDS.md) | Software Design Specification |
| [PRD](docs/PRD.md) | Product Requirements Document |
| [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) | Stack, structure, AI design |
| [Security & Access](docs/SECURITY_ACCESS.md) | Auth, JWT, rate limiting |
| [Frontend Spec](docs/FRONTEND_SPEC.md) | Wireframes, components, design system |
| [Feature Tickets](docs/FEATURE_TICKETS.md) | 40 tickets across 5 epics |
| [Progress Tracker](PROGRESS.md) | Phase-by-phase completion status |

---

## Getting Started (Development)

### Prerequisites
- Node.js v20+
- MongoDB Atlas account (free)
- Google Gemini API key (free at aistudio.google.com)
- Google Cloud Console project (for OAuth)

### Setup

**1. Clone and install:**
```bash
# Server
cd server
npm install
cp .env.example .env   # Fill in your keys

# Client
cd ../client
npm install
cp .env.example .env   # Fill in VITE_API_URL
```

**2. Start development servers:**
```bash
# Terminal 1 — Backend
cd server
npm run dev    # runs on http://localhost:5000

# Terminal 2 — Frontend
cd client
npm run dev    # runs on http://localhost:5173
```

**3. Open browser:** http://localhost:5173

---

## Features

- Real-time camera object detection (TF.js COCO-SSD, runs in-browser)
- Context-aware AI verdict (Gemini 1.5 Flash)
- AR canvas overlay — green glow for Good, red for Bad
- Scan history with pagination
- Weekly analytics dashboard (Recharts bar chart)
- Google OAuth + Email/Password authentication
- Rate-limited, JWT-secured REST API

---

## Deployment

- **Frontend:** Vercel — connect `/client` folder, set `VITE_API_URL`
- **Backend:** Render — connect `/server` folder, set all env vars
- **Database:** MongoDB Atlas M0 cluster — whitelist Render IP

---

## Progress

See [PROGRESS.md](PROGRESS.md) for the current phase status.

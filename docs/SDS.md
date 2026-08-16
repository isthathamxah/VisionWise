# Software Design Specification (SDS)
## VisionWise — AI-Powered Nutrition & Food Scanner
**Version:** 2.0 (rewritten to match the shipped architecture — see PRD.md §0 for what changed and why)
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)
**Date:** August 2026

---

## Table of Contents
1. System Overview
2. Module Decomposition
3. Database Schema
4. API Contract
5. Sequence Diagrams
6. Data Flow Diagram
7. Component Design

---

## 1. System Overview

VisionWise follows a **MERN stack** architecture with a clear separation between:
- **Client** (React + Vite): camera/upload capture, UI, TF.js inference, PWA shell
- **Server** (Node + Express): auth, business logic, Gemini API calls
- **Database** (MongoDB Atlas): stores users and scan logs

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌───────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │  Camera   │  │  Upload / Take │  │     VerdictCard        │  │
│  │  (WebRTC) │  │  Picture       │  │  (score, nutrition,    │  │
│  │           │  │                │  │   ingredients)         │  │
│  └─────┬─────┘  └───────┬────────┘  └────────────┬───────────┘  │
│        │                 │                         │              │
│        ▼                 ▼                         │              │
│  ┌─────────────────────────────────────────────────┐             │
│  │              useDetection Hook                  │             │
│  │  TF.js COCO-SSD → object label                 │             │
│  │  Axios POST /api/scan → verdict response        │             │
│  └──────────────────────┬──────────────────────────┘             │
│                         │                                        │
│  BottomNav / BottomSheet / ToastContext / service worker (PWA)   │
└─────────────────────────│────────────────────────────────────────┘
                          │ HTTPS REST
┌─────────────────────────▼────────────────────────────────────────┐
│                     SERVER (Express)                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ authRoutes   │  │  scanRoutes     │  │   historyRoutes     │ │
│  │ /api/auth    │  │  /api/scan      │  │   /api/history      │ │
│  └──────┬───────┘  └────────┬────────┘  └──────────┬──────────┘ │
│         │                   │                        │            │
│         ▼                   ▼                        ▼            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Controllers + Services                      │    │
│  │  authController   scanController   historyController    │    │
│  │  geminiService (wraps @google/generative-ai SDK)         │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                     │
└─────────────────────────────│─────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                     ▼
  ┌─────────────┐    ┌───────────────┐    ┌─────────────────┐
  │ MongoDB     │    │  Gemini API   │    │  Google OAuth   │
  │ Atlas       │    │  (Google)     │    │  (Google)       │
  └─────────────┘    └───────────────┘    └─────────────────┘
```

---

## 2. Module Decomposition

### Module 1: Real-time Vision Module (Client-side)
**Responsibility:** Capture camera frames or a photo, run TF.js COCO-SSD, render the detection overlay

| Component | File | Responsibility |
|-----------|------|----------------|
| `useCamera` | `hooks/useCamera.js` | getUserMedia, stream management, front/rear toggle |
| `useDetection` | `hooks/useDetection.js` | Load COCO-SSD, run inference on video frames or a one-shot image, trigger scan |
| `canvasOverlay` | `utils/canvasOverlay.js` | Draw bounding box + label on canvas; capture a frame to base64 |
| `Camera` | `components/Camera/Camera.jsx` | `<video>` + `<canvas>` stacked UI |
| `Scanner` page | `pages/Scanner.jsx` | Orchestrates camera / upload / take-picture-with-retake, triggers a scan, renders `VerdictCard` |

### Module 2: AI Inference Engine (Server-side)
**Responsibility:** Accept scan requests, call Gemini, return a structured verdict

| Component | File | Responsibility |
|-----------|------|----------------|
| `geminiService` | `services/geminiService.js` | Build the Gemini prompt, call the API, parse and sanitize the JSON response (`sanitizeFood`), rule-based fallback on rate-limit |
| `scanController` | `controllers/scanController.js` | Validate request, call `geminiService`, save `ScanLog` |
| `scan routes` | `routes/scan.js` | `POST /api/scan` |

### Module 3: Nutrition Reasoning
**Responsibility:** Food/non-food decision and nutrition analysis via Gemini prompt engineering

There is no user-facing context/category selection. The prompt itself asks
Gemini to decide, from the image, whether the object is food — as an
explicit first step, before anything else — then branches:

```
STEP 1 — decide isFood first. isFood is true ONLY if the object itself is
something a person eats or drinks. Everything else (electronics, tools,
furniture, ...) is NOT food, even if food is visible nearby. When unsure,
isFood is false.

STEP 2 — if isFood is false: "food" is null, fill "breakdown" with 3-5
generic factors that drove the verdict.

STEP 3 — if isFood is true: "breakdown" is empty, fill "food" with
dishType/source, nutrients (amount, unit, %DV, impact, direction), and
ingredient explanations. Never invents numbers — sets "unclear" instead
of guessing when the image can't be read reliably.
```

The response must match one of two complete JSON shapes (non-food:
`"food": null`; food: `"breakdown": []` and a fully filled `"food"`
object) — this is deliberate: an earlier version showed one template with
`food` always present, which biased the model toward fabricating nutrition
data even for non-food objects (see `docs/superpowers/plans` git history
for the incident this fixed).

### Module 4: Analytics & User History
**Responsibility:** Store, retrieve, search, and visualize scan history

| Component | File | Responsibility |
|-----------|------|----------------|
| `historyController` | `controllers/historyController.js` | List (paginated, searchable, verdict-filterable), get-by-id, analytics, delete |
| `ScanLog` model | `models/ScanLog.js` | Mongoose schema |
| `InfographicChart` | `components/InfographicChart/` | Weekly bar chart, breakdown donut, nutrition panel, ingredient cards |
| `History` page | `pages/History.jsx` | Paginated/searchable scan list, swipe-to-delete, pull-to-refresh |
| `ScanDetail` page | `pages/ScanDetail.jsx` | Real, shareable per-scan page at `/history/:id` |

### Module 5: Account & Profile
**Responsibility:** Authentication, session, and profile management

| Component | File | Responsibility |
|-----------|------|----------------|
| `authController` | `controllers/authController.js` | Register, login, refresh, Google OAuth callback, get/update profile, change password, update avatar |
| `Account` page | `pages/Account.jsx` | Editable name, avatar upload, change password, theme, sign out |
| `AuthContext` | `context/AuthContext.jsx` | Global auth state; `updateUser()` merges a profile patch without touching tokens |

### Module 6: Mobile App Shell
**Responsibility:** PWA installability, navigation chrome, and native-feeling interaction

| Component | File | Responsibility |
|-----------|------|----------------|
| `service-worker.js` | `public/service-worker.js` | Caches the app shell and last-seen API GETs; navigations fall back to the cached shell offline |
| `BottomNav` | `components/BottomNav/BottomNav.jsx` | Primary mobile navigation (Dashboard / Scanner / Account) |
| `BottomSheet` | `components/BottomSheet/BottomSheet.jsx` | Reusable slide-up modal for detail/confirm views |
| `ToastContext` | `context/ToastContext.jsx` | App-wide toast notifications |

---

## 3. Database Schema

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "name": "string (required, 2-50 chars)",
  "email": "string (required, unique, lowercase)",
  "password": "string (nullable — null for Google-only accounts)",
  "googleId": "string (nullable — set for Google OAuth users)",
  "avatar": "string (nullable — a data:image/... URL, resized to 256px client-side, capped at ~300KB server-side)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Collection: `scanlogs`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "objectLabel": "string (e.g. 'banana', 'cell phone')",
  "context": "string (legacy field from the removed 4-context system, always 'health' now)",
  "verdict": "string (enum: Good | Bad | Neutral)",
  "score": "number (0-100)",
  "reason": "string",
  "tips": ["string"],
  "breakdown": [{ "label": "string", "percent": "number" }],
  "food": {
    "isFood": true,
    "dishType": "dish | packaged",
    "source": "estimated | label",
    "servingNote": "string",
    "unclear": "boolean",
    "nutrients": [{ "label": "string", "amount": "number", "unit": "string", "percentDV": "number", "impact": "Low | Moderate | High | null", "direction": "limit | beneficial | neutral", "note": "string" }],
    "ingredients": [{ "name": "string", "whatItIs": "string", "whyUsed": "string", "effect": "string", "concern": "Low | Moderate | High | null" }]
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
`food` is `undefined` on the document for non-food scans (`sanitizeFood`
returns `undefined` when Gemini's `food` was `null` or `isFood` was
false) — there is no separate `contextrules` collection; that was dead
code from the original design and was deleted.

---

## 4. API Contract

Base URL: `http://localhost:5000/api` (dev) — not yet deployed to a public URL.

### Auth Routes

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/auth/register` | None | `{name, email, password}` | `{accessToken, refreshToken, user}` |
| POST | `/auth/login` | None | `{email, password}` | `{accessToken, refreshToken, user}` |
| GET | `/auth/google` | None | — | Redirect to Google OAuth |
| GET | `/auth/google/callback` | None | — | Redirect to client with `?token=&refresh=` |
| POST | `/auth/refresh` | None | `{refreshToken}` | `{accessToken}` |
| GET | `/auth/me` | JWT | — | `user` (name, email, avatar, hasPassword) |
| PATCH | `/auth/profile` | JWT | `{name}` | `user` |
| PATCH | `/auth/password` | JWT | `{currentPassword, newPassword}` | `{message}` |
| PATCH | `/auth/avatar` | JWT | `{avatar: "data:image/...;base64,..."}` | `user` |
| POST | `/auth/forgot-password` | None | `{email}` | `{message}` (always generic, doesn't reveal whether the email exists) |
| POST | `/auth/reset-password` | None | `{token, password}` | `{message}` |

`user` shape: `{ _id, name, email, avatar, hasPassword }` — `hasPassword`
is derived server-side as `!googleId` (this app never links both auth
methods on one account), so the client can hide password-change UI for
Google-only accounts.

### Scan Routes

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/scan` | JWT | `{imageBase64, objectLabel}` | `{verdict, score, reason, tips, breakdown, food?, scanLogId}` |

**POST /scan — Request Body:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "objectLabel": "banana"
}
```

**POST /scan — Response (food):**
```json
{
  "verdict": "Good",
  "score": 82,
  "reason": "A whole banana is a good source of potassium and fiber with no added sugar.",
  "tips": ["Pair with protein to slow sugar absorption.", "Riper bananas are sweeter but higher glycemic."],
  "breakdown": [],
  "food": {
    "isFood": true,
    "dishType": "dish",
    "source": "estimated",
    "unclear": false,
    "nutrients": [{ "label": "Calories", "amount": 105, "unit": "kcal", "percentDV": 5, "impact": "Low", "direction": "neutral", "note": "..." }],
    "ingredients": []
  },
  "scanLogId": "ObjectId"
}
```

**POST /scan — Response (non-food, e.g. a phone):**
```json
{
  "verdict": "Neutral",
  "score": 50,
  "reason": "A personal electronic device — not a health-relevant scan.",
  "tips": ["..."],
  "breakdown": [{ "label": "Build quality", "percent": 60 }, { "label": "Usage context", "percent": 40 }],
  "scanLogId": "ObjectId"
}
```

### History Routes

| Method | Endpoint | Auth | Query | Response |
|--------|----------|------|-------|----------|
| GET | `/history` | JWT | `?page=1&limit=8&q=banana&verdict=Good` | `{scans[], total, page, pages}` |
| GET | `/history/:id` | JWT | — | `ScanLog` (404 if not found or not owned) |
| GET | `/history/analytics` | JWT | `?days=7` | `{weeklyScore, chartData[], totalScans}` |
| DELETE | `/history/:id` | JWT | — | `{message}` |

---

## 5. Sequence Diagrams

### 5.1 Registration Flow
```
User          Browser         Express        MongoDB
 │                │                │               │
 │──register──>   │                │               │
 │                │──POST /auth/register──>         │
 │                │                │──find email──>│
 │                │                │<──not found───│
 │                │                │──hash pw──────│
 │                │                │──create user─>│
 │                │                │<──user obj────│
 │                │                │──sign JWT─────│
 │                │<──{token,user}─│               │
 │<──store token──│                │               │
```

### 5.2 Scan Flow
```
User      Browser(TFjs)    Browser(Axios)    Express    Gemini     MongoDB
 │               │                │               │          │           │
 │──tap Scan────>│                │               │          │           │
 │               │──detect obj────│               │          │           │
 │               │  (COCO-SSD)    │               │          │           │
 │               │──capture frame─│               │          │           │
 │               │                │─POST /scan───>│          │           │
 │               │                │               │──prompt─>│           │
 │               │                │               │ (decides food first) │
 │               │                │               │<──JSON───│           │
 │               │                │               │──save────────────────>
 │               │                │               │<──scanLogId───────────
 │               │                │<──response────│          │           │
 │<──VerdictCard─│                │               │          │           │
```

### 5.3 Password Reset Flow
```
User          Browser         Express        MongoDB      Gmail SMTP
 │──forgot pw──>│                │               │              │
 │              │──POST /auth/forgot-password──>│              │
 │              │                │──find user───>│              │
 │              │                │──sign reset token (short-lived)
 │              │                │──send email────────────────>│
 │              │<──{message}────│               │              │
 │  (opens email, clicks link)   │               │              │
 │──new password>│               │               │              │
 │              │──POST /auth/reset-password {token, password}──>
 │              │                │──verify token──               │
 │              │                │──hash + save──>│              │
 │              │<──{message}────│               │              │
```

---

## 6. Data Flow Diagram

### Level 0 (Context Diagram)
```
[User] ──camera frame / photo──> [VisionWise System] ──verdict──> [User]
                                           │
                                    ──scan data──> [MongoDB Atlas]
                                           │
                                    ──image+prompt──> [Gemini API]
                                           │
                                    ──reset email──> [Gmail SMTP]
```

### Level 1
```
[Camera / Upload] → (1.0 Capture Frame) → frame
frame → (2.0 Detect Object) → {label, confidence}
{label, frame} → (3.0 Build Prompt) → structured_prompt (food/non-food decision first)
structured_prompt → (4.0 Call Gemini) → verdict_json
verdict_json → (4.1 Sanitize Food Payload) → clamped/validated nutrition data
verdict_json + userId → (5.0 Save ScanLog) → ScanLog[MongoDB]
verdict_json → (6.0 Render Verdict) → [User Interface]
ScanLog[] → (7.0 Aggregate Analytics) → [Dashboard]
```

---

## 7. Component Design

### Client State Management
```
App
├── AuthContext (global: user, token, login, logout, updateUser)
├── ThemeContext (global: theme, toggle)
├── ToastContext (global: showToast)
│
├── Scanner Page (local state)
│   ├── detectedObject: string
│   ├── uploadedSrc / capturedPreview: string | null
│   ├── scanResult: {verdict, score, reason, tips, breakdown, food?} | null
│   └── isScanning: boolean
│
├── History Page (local state)
│   ├── scans: ScanLog[]
│   ├── page, pages: number
│   ├── q, verdictFilter: string
│   └── analytics: object
│
├── Account Page (local state)
│   ├── stats: object
│   └── (name-edit / password-change / avatar-upload sub-state)
│
└── ScanDetail Page (local state)
    └── scan: ScanLog | null (fetched by id)
```

### Server Middleware Stack (per request)
```
Request
  → helmet()
  → cors()  (methods: GET, POST, PATCH, DELETE)
  → globalLimiter (rate limiting)
  → express.json({ limit: '5mb' })
  → passport.initialize()
  → [route handler]
    → authMiddleware (JWT verify — protected routes only)
      → express-validator (body validation — auth/scan routes)
        → controller
          → service / model
            → Response
```

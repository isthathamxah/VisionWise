# Software Design Specification (SDS)
## VisionWise — AI-Powered Contextual Object Scanner & Recommender
**Version:** 1.0  
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)  
**Date:** June 2026

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
- **Client** (React + Vite): handles camera, UI, TF.js inference
- **Server** (Node + Express): handles auth, business logic, Gemini API calls
- **Database** (MongoDB Atlas): stores users, scan logs, context rules

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌───────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │  Camera   │  │ ContextSelector│  │     VerdictCard        │  │
│  │  (WebRTC) │  │ (4 modes)      │  │  (Good/Bad + Chart)   │  │
│  └─────┬─────┘  └───────┬────────┘  └────────────┬───────────┘  │
│        │                 │                         │              │
│        ▼                 ▼                         │              │
│  ┌─────────────────────────────────────────────────┐             │
│  │              useDetection Hook                  │             │
│  │  TF.js COCO-SSD → object label                 │             │
│  │  Axios POST /api/scan → verdict response        │             │
│  └──────────────────────┬──────────────────────────┘             │
│                         │                                        │
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
│  │  geminiService (wraps Google AI SDK)                    │    │
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
**Responsibility:** Capture camera frames, run TF.js COCO-SSD, render AR overlay

| Component | File | Responsibility |
|-----------|------|----------------|
| `useCamera` | `hooks/useCamera.js` | getUserMedia, stream management, front/rear toggle |
| `useDetection` | `hooks/useDetection.js` | Load COCO-SSD, run inference on video frames, trigger scan |
| `canvasOverlay` | `utils/canvasOverlay.js` | Draw bounding box + glow (green/red) on canvas |
| `Camera` | `components/Camera/Camera.jsx` | `<video>` + `<canvas>` stacked UI |

### Module 2: AI Inference Engine (Server-side)
**Responsibility:** Accept scan requests, call Gemini, return structured verdict

| Component | File | Responsibility |
|-----------|------|----------------|
| `geminiService` | `services/geminiService.js` | Build Gemini prompt, call API, parse JSON response |
| `scanController` | `controllers/scanController.js` | Validate request, call geminiService, save ScanLog |
| `scan routes` | `routes/scan.js` | POST /api/scan |

### Module 3: Knowledge & Recommendation Engine
**Responsibility:** Context-aware verdict logic via Gemini prompt engineering

Gemini receives a structured prompt:
```
You are a contextual object evaluator. The user scanned a "{objectLabel}" in "{context}" mode.
Return ONLY valid JSON:
{
  "verdict": "Good" | "Bad" | "Neutral",
  "score": <integer 0-100>,
  "reason": "<one sentence explanation>",
  "tips": ["<tip1>", "<tip2>", "<tip3>"]
}
Context rules:
- Health: Judge nutritional/health impact
- Eco: Judge environmental/recyclability impact
- Productivity: Judge if object aids or distracts from work/study
- Finance: Judge if object represents good or poor financial value
```

### Module 4: Analytics & User History
**Responsibility:** Store, retrieve, and visualize scan history

| Component | File | Responsibility |
|-----------|------|----------------|
| `historyController` | `controllers/historyController.js` | CRUD for ScanLogs |
| `ScanLog model` | `models/ScanLog.js` | Mongoose schema |
| `Dashboard` | `components/Dashboard/Dashboard.jsx` | Charts + weekly score |
| `History page` | `pages/History.jsx` | Paginated scan list |

---

## 3. Database Schema

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "email": "string (required, unique)",
  "password": "string (nullable — null for OAuth users)",
  "googleId": "string (nullable — set for Google OAuth users)",
  "avatar": "string (URL, optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Collection: `scanlogs`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "objectLabel": "string (e.g. 'bottle')",
  "context": "string (enum: health | eco | productivity | finance)",
  "verdict": "string (enum: Good | Bad | Neutral)",
  "score": "number (0–100)",
  "reason": "string",
  "tips": ["string", "string", "string"],
  "imageSnapshot": "string (base64, optional — not stored by default)",
  "createdAt": "Date"
}
```

### Collection: `contextrules` (seed data, read-only at runtime)
```json
{
  "_id": "ObjectId",
  "context": "string",
  "objectLabel": "string",
  "defaultVerdict": "string",
  "notes": "string"
}
```
*This collection seeds fallback rules if Gemini is unavailable.*

---

## 4. API Contract

Base URL: `http://localhost:5000/api` (dev) | `https://visionwise-api.onrender.com/api` (prod)

### Auth Routes

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/auth/register` | None | `{name, email, password}` | `{token, user}` |
| POST | `/auth/login` | None | `{email, password}` | `{token, refreshToken, user}` |
| GET | `/auth/google` | None | — | Redirect to Google OAuth |
| GET | `/auth/google/callback` | None | — | `{token, user}` |
| POST | `/auth/refresh` | None | `{refreshToken}` | `{token}` |
| POST | `/auth/logout` | JWT | — | `{message}` |

### Scan Routes

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/scan` | JWT | `{imageBase64, objectLabel, context}` | `{verdict, score, reason, tips, scanLogId}` |

**POST /scan — Request Body:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "objectLabel": "bottle",
  "context": "eco"
}
```

**POST /scan — Response:**
```json
{
  "verdict": "Bad",
  "score": 28,
  "reason": "Single-use plastic bottles contribute significantly to landfill waste.",
  "tips": [
    "Switch to a reusable stainless steel bottle",
    "Check the recycling symbol — #1 PET is recyclable in most cities",
    "Avoid purchasing bottled water in bulk"
  ],
  "scanLogId": "ObjectId"
}
```

### History Routes

| Method | Endpoint | Auth | Query | Response |
|--------|----------|------|-------|----------|
| GET | `/history` | JWT | `?page=1&limit=10&context=eco` | `{scans[], total, page}` |
| GET | `/history/analytics` | JWT | `?days=7` | `{weeklyScore, chartData[], contextBreakdown}` |
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
 │──click Scan──>│                │               │          │           │
 │               │──detect obj────│               │          │           │
 │               │  (COCO-SSD)    │               │          │           │
 │               │──capture frame─│               │          │           │
 │               │                │─POST /scan───>│          │           │
 │               │                │               │──prompt─>│           │
 │               │                │               │<──JSON───│           │
 │               │                │               │──save────────────────>
 │               │                │               │<──scanLogId───────────
 │               │                │<──response────│          │           │
 │<──VerdictCard─│                │               │          │           │
 │  + AR glow    │                │               │          │           │
```

---

## 6. Data Flow Diagram

### Level 0 (Context Diagram)
```
[User] ──camera frame + context──> [VisionWise System] ──verdict──> [User]
                                           │
                                    ──scan data──> [MongoDB Atlas]
                                           │
                                    ──image+prompt──> [Gemini API]
```

### Level 1
```
[Camera] → (1.0 Capture Frame) → frame
frame → (2.0 Detect Object) → {label, confidence}
{label, context} → (3.0 Build Prompt) → structured_prompt
structured_prompt → (4.0 Call Gemini) → verdict_json
verdict_json + userId → (5.0 Save ScanLog) → ScanLog[MongoDB]
verdict_json → (6.0 Render Verdict) → [User Interface]
ScanLog[] → (7.0 Aggregate Analytics) → [Dashboard]
```

---

## 7. Component Design

### Client State Management
```
App
├── AuthContext (global: user, token, login, logout)
│
├── Scanner Page (local state)
│   ├── selectedContext: string
│   ├── detectedObject: string
│   ├── scanResult: {verdict, score, reason, tips} | null
│   ├── isScanning: boolean
│   └── cameraActive: boolean
│
└── History Page (local state)
    ├── scans: ScanLog[]
    ├── page: number
    └── analyticsData: object
```

### Server Middleware Stack (per request)
```
Request
  → cors()
  → helmet()
  → express.json()
  → rateLimiter (100/15min)
  → [route handler]
    → authMiddleware (JWT verify — protected routes only)
      → controller
        → service / model
          → Response
```

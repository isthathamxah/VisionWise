# VisionWise — Project Progress Tracker
**Student:** Muhammad Taha | **Reg:** 4618-FOC/BSCS/F22 | **IIUI**  
**Last Updated:** June 22, 2026

---

## Legend
- ✅ Done
- 🔵 In Progress
- ⬜ Pending

---

## Phase 1 — Documentation

| Task | Status | Notes |
|------|--------|-------|
| SRS.md | ✅ | Functional/Non-functional requirements, use cases |
| SDS.md | ✅ | Module design, DB schema, API contract, sequence diagrams |
| PRD.md | ✅ | Personas, MoSCoW prioritization, user stories |
| TECHNICAL_ARCHITECTURE.md | ✅ | Stack, directory structure, env vars, AI design |
| SECURITY_ACCESS.md | ✅ | Auth model, JWT, rate limiting, security checklist |
| FRONTEND_SPEC.md | ✅ | Wireframes, components, state, design system |
| FEATURE_TICKETS.md | ✅ | 40 tickets across 5 epics |
| README.md | ✅ | Project overview |
| PROGRESS.md | ✅ | This file |

---

## Phase 2 — Project Setup

| Task | Status | Notes |
|------|--------|-------|
| Initialize server (npm init) | ✅ | |
| Install server dependencies | ✅ | express, mongoose, jwt, bcryptjs, passport, gemini, etc. |
| Create Vite React client | ✅ | |
| Install client dependencies | ✅ | react-router, axios, tailwind, tfjs, recharts |
| Configure Tailwind CSS | ✅ | |
| Set up .env files | ✅ | server/.env + client/.env |
| Create .gitignore | ✅ | |
| Set up MongoDB Atlas cluster | ✅ | M0 free cluster, DB: visionwise |
| Get Gemini API key | ✅ | gemini-2.0-flash model |
| Set up Google OAuth credentials | ✅ | Dev credentials configured |

---

## Phase 3 — Auth Module

| Task | Status | Notes |
|------|--------|-------|
| User Mongoose model | ✅ | VW-001 |
| Register endpoint | ✅ | VW-001 — tested, returns JWT |
| Login endpoint | ✅ | VW-002 — tested |
| JWT middleware | ✅ | VW-004 — 401 on missing token |
| Token refresh endpoint | ✅ | VW-005 — tested |
| GET /me endpoint | ✅ | Added for OAuth callback user fetch |
| Passport Google OAuth strategy | ✅ | VW-003 — passport.initialize() added |
| Register page (React) | ✅ | VW-006 |
| Login page (React) | ✅ | VW-007 |
| AuthContext | ✅ | VW-008 |
| Protected route wrapper | ✅ | VW-008 |

---

## Phase 4 — Camera & Object Detection

| Task | Status | Notes |
|------|--------|-------|
| useCamera hook | ⬜ | VW-009 |
| Camera component (<video> + <canvas>) | ⬜ | VW-010 |
| TF.js COCO-SSD model loading | ⬜ | VW-011 |
| Real-time detection loop | ⬜ | VW-012 |
| Bounding box canvas overlay | ⬜ | VW-013 |
| Detection chip UI | ⬜ | VW-015 |
| Frame capture on scan click | ⬜ | VW-018 |
| Camera error handling | ⬜ | VW-017 |

---

## Phase 5 — Verdict Engine

| Task | Status | Notes |
|------|--------|-------|
| Context selector UI (pills) | ✅ | VW-019 |
| Gemini service (server) | ✅ | VW-020 — fallback rules added for rate limit |
| ScanLog Mongoose model | ✅ | VW-022 |
| POST /api/scan endpoint | ✅ | VW-021 — tested |
| VerdictCard component | ✅ | VW-023 — fallback indicator added |
| Loading/skeleton state | ✅ | VW-024 |
| Gemini error fallback | ✅ | VW-025 — rule-based fallback active |

---

## Phase 6 — History & Analytics

| Task | Status | Notes |
|------|--------|-------|
| GET /api/history endpoint | ✅ | VW-026 — pagination + filter tested |
| GET /api/history/analytics | ✅ | VW-027 — weekly score + context breakdown |
| DELETE /api/history/:id | ✅ | VW-028 — tested |
| History page (React) | ✅ | VW-029 |
| Pagination component | ✅ | VW-031 |
| Weekly score card | ✅ | VW-032 |
| Analytics bar chart (Recharts) | ✅ | VW-033 |

---

## Phase 7 — AR Overlay & UI Polish

| Task | Status | Notes |
|------|--------|-------|
| Canvas AR glow effect | ✅ | VW-034 — green/red/amber glow on verdict |
| Verdict color animation | ✅ | VW-035 |
| Home/landing page | ✅ | VW-036 |
| Navbar component | ✅ | VW-037 |
| Mobile responsiveness | ✅ | VW-038 — Tailwind responsive classes applied |
| 404 page | ✅ | VW-039 |

---

## Phase 8 — Deployment

| Task | Status | Notes |
|------|--------|-------|
| Push to GitHub | ⬜ | |
| Deploy client to Vercel | ⬜ | VW-040 |
| Deploy server to Render | ⬜ | VW-040 |
| Set production env vars | ⬜ | |
| Update Google OAuth callback URL | ⬜ | |
| End-to-end production test | ⬜ | |

---

## Completed Tickets
*(moved here as tickets are finished)*

---

## Issues / Blockers
*(log any blockers here)*

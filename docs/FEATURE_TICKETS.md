# Feature Ticket List
## VisionWise — AI-Powered Contextual Object Scanner & Recommender
**Version:** 1.0  
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)  
**Date:** June 2026

---

**Legend:**  
Priority: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low  
Status: ⬜ Pending | 🔵 In Progress | ✅ Done

---

## Epic 1: Authentication (VW-001 to VW-008)

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-001 | User Registration (Email/Password) | 🔴 | ⬜ | POST /api/auth/register — validate input, hash password, create User doc, return JWT |
| VW-002 | User Login (Email/Password) | 🔴 | ⬜ | POST /api/auth/login — compare hash, return access + refresh tokens |
| VW-003 | Google OAuth Login | 🟠 | ⬜ | Implement passport-google-oauth20 strategy, findOrCreate user in DB |
| VW-004 | JWT Middleware (protect routes) | 🔴 | ⬜ | Verify Bearer token on all protected endpoints |
| VW-005 | Token Refresh Endpoint | 🟠 | ⬜ | POST /api/auth/refresh — verify refresh token, issue new access token |
| VW-006 | Register Page (React) | 🔴 | ⬜ | Form: name, email, password — validation + error display |
| VW-007 | Login Page (React) | 🔴 | ⬜ | Form: email, password + "Continue with Google" button |
| VW-008 | AuthContext + Protected Routes | 🔴 | ⬜ | Global auth state; redirect to /login if not authenticated |

---

## Epic 2: Camera & Object Detection (VW-009 to VW-018)

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-009 | useCamera Hook | 🔴 | ⬜ | getUserMedia, attach stream to `<video>`, handle permission denied |
| VW-010 | Camera Component UI | 🔴 | ⬜ | Stacked `<video>` + `<canvas>` with correct sizing |
| VW-011 | TF.js COCO-SSD Model Loading | 🔴 | ⬜ | Load model on Scanner mount, show loading spinner |
| VW-012 | Real-time Object Detection Loop | 🔴 | ⬜ | requestAnimationFrame loop calling model.detect(video) |
| VW-013 | Bounding Box Canvas Overlay | 🟠 | ⬜ | Draw bbox + label text on canvas overlay per prediction |
| VW-014 | Detection Confidence Threshold | 🟠 | ⬜ | Filter predictions below 50% confidence |
| VW-015 | Detected Object Label Chip | 🟠 | ⬜ | Floating chip UI showing top detection (e.g., "bottle 94%") |
| VW-016 | Camera Front/Rear Toggle | 🟡 | ⬜ | Switch facingMode between 'user' and 'environment' |
| VW-017 | Camera Error Banner | 🟠 | ⬜ | Show instructions if camera permission denied |
| VW-018 | Frame Capture on Scan Click | 🔴 | ⬜ | Draw video frame to canvas, export as base64 JPEG |

---

## Epic 3: Verdict Engine (VW-019 to VW-025)

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-019 | Context Selector UI | 🔴 | ⬜ | 4-pill selector: Health / Eco / Productivity / Finance |
| VW-020 | Gemini Service (server) | 🔴 | ⬜ | geminiService.js — build prompt, call API, parse JSON response |
| VW-021 | POST /api/scan Endpoint | 🔴 | ⬜ | Receive {imageBase64, objectLabel, context} → call Gemini → save ScanLog → return verdict |
| VW-022 | ScanLog Mongoose Model | 🔴 | ⬜ | Schema: userId, objectLabel, context, verdict, score, reason, tips, createdAt |
| VW-023 | VerdictCard Component | 🔴 | ⬜ | Display verdict badge, score bar, reason, 3 tips |
| VW-024 | Scan Loading State | 🟠 | ⬜ | Show skeleton/spinner in VerdictCard area while awaiting |
| VW-025 | Gemini Fallback (error handling) | 🟠 | ⬜ | If Gemini fails/rate-limited, return 503 with user-friendly message |

---

## Epic 4: History & Analytics (VW-026 to VW-033)

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-026 | GET /api/history Endpoint | 🔴 | ⬜ | Return paginated ScanLogs for authenticated user |
| VW-027 | GET /api/history/analytics Endpoint | 🟠 | ⬜ | Return weeklyScore (avg), chartData (scans per day), contextBreakdown |
| VW-028 | DELETE /api/history/:id Endpoint | 🟠 | ⬜ | Delete scan by ID — verify ownership |
| VW-029 | History Page (React) | 🔴 | ⬜ | Paginated list: each row shows icon, label, context, verdict, score, date, delete btn |
| VW-030 | Context Filter on History | 🟡 | ⬜ | Dropdown to filter history by context |
| VW-031 | Pagination Component | 🟠 | ⬜ | Prev/Next buttons + page indicator |
| VW-032 | Weekly Score Card | 🟠 | ⬜ | Large score number + label "Your weekly score" |
| VW-033 | Analytics Bar Chart (Recharts) | 🟠 | ⬜ | Bar chart: scans per day for last 7 days, colored by verdict |

---

## Epic 5: UI Polish & AR Overlay (VW-034 to VW-040)

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-034 | Canvas AR Glow Effect | 🟠 | ⬜ | Apply green/red glow shadow to bounding box after verdict |
| VW-035 | Verdict Color Transition | 🟡 | ⬜ | Animate VerdictCard fade-in on result |
| VW-036 | Home / Landing Page | 🟠 | ⬜ | Hero section, feature cards, CTA button |
| VW-037 | Navbar Component | 🔴 | ⬜ | Logo, nav links (conditional auth), user avatar |
| VW-038 | Responsive Layout (Mobile) | 🟠 | ⬜ | Ensure scanner + history are usable on 375px mobile screens |
| VW-039 | 404 Not Found Page | 🟢 | ⬜ | Simple "Page not found" with link to home |
| VW-040 | Deployment (Vercel + Render) | 🔴 | ⬜ | Configure env vars, update OAuth callback URLs, test end-to-end in prod |

---

## Summary

| Epic | Tickets | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low |
|------|---------|------------|--------|----------|-------|
| Auth | VW-001–008 | 5 | 2 | 0 | 0 |
| Camera | VW-009–018 | 4 | 4 | 2 | 0 |
| Verdict | VW-019–025 | 4 | 2 | 0 | 0 |
| History | VW-026–033 | 2 | 4 | 2 | 0 |
| UI/Polish | VW-034–040 | 2 | 3 | 1 | 1 |
| **Total** | **40** | **17** | **15** | **5** | **1** |

**MVP (Critical only):** VW-001, 002, 004, 006, 007, 008, 009, 010, 011, 012, 018, 019, 020, 021, 022, 023, 026, 029, 037, 040 = **20 tickets**

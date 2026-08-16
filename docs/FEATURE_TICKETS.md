# Feature Ticket List
## VisionWise — AI-Powered Nutrition & Food Scanner
**Version:** 2.0 (updated to reflect actual shipped status and the food-only pivot — see PRD.md §0)
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)
**Date:** August 2026

---

**Legend:**
Priority: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
Status: ⬜ Pending | 🔵 In Progress | ✅ Done

---

## Epic 1: Authentication (VW-001 to VW-008)

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-001 | User Registration (Email/Password) | 🔴 | ✅ | POST /api/auth/register — validate input, hash password, create User doc, return JWT |
| VW-002 | User Login (Email/Password) | 🔴 | ✅ | POST /api/auth/login — compare hash, return access + refresh tokens |
| VW-003 | Google OAuth Login | 🟠 | ✅ | passport-google-oauth20 strategy, findOrCreate user in DB |
| VW-004 | JWT Middleware (protect routes) | 🔴 | ✅ | Verify Bearer token on all protected endpoints |
| VW-005 | Token Refresh Endpoint | 🟠 | ✅ | POST /api/auth/refresh — verify refresh token, issue new access token |
| VW-006 | Register Page (React) | 🔴 | ✅ | Form: name, email, password — validation + error display |
| VW-007 | Login Page (React) | 🔴 | ✅ | Form: email, password + "Continue with Google" button |
| VW-008 | AuthContext + Protected Routes | 🔴 | ✅ | Global auth state; redirect to /login if not authenticated |

---

## Epic 2: Camera & Object Detection (VW-009 to VW-018)

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-009 | useCamera Hook | 🔴 | ✅ | getUserMedia, attach stream to `<video>`, handle permission denied |
| VW-010 | Camera Component UI | 🔴 | ✅ | Stacked `<video>` + `<canvas>` with correct sizing |
| VW-011 | TF.js COCO-SSD Model Loading | 🔴 | ✅ | Load model on Scanner mount, show loading spinner |
| VW-012 | Real-time Object Detection Loop | 🔴 | ✅ | requestAnimationFrame loop calling model.detect(video) |
| VW-013 | Bounding Box Canvas Overlay | 🟠 | ✅ | Draw bbox + label text on canvas overlay per prediction |
| VW-014 | Detection Confidence Threshold | 🟠 | ✅ | Filter predictions below 50% confidence |
| VW-015 | Detected Object Label Chip | 🟠 | ✅ | Floating chip UI showing top detection (e.g., "bottle 94%") |
| VW-016 | Camera Front/Rear Toggle | 🟡 | ✅ | Switch facingMode between 'user' and 'environment' |
| VW-017 | Camera Error Banner | 🟠 | ✅ | Show instructions if camera permission denied |
| VW-018 | Frame Capture on Scan Click | 🔴 | ✅ | Draw video frame to canvas, export as base64 JPEG |
| VW-018b | Photo Upload + Take Picture (retake/confirm) | 🟠 | ✅ | Added beyond the original scope — scan from an uploaded photo or a captured-and-confirmed still, not just the live feed |

---

## Epic 3: Nutrition Verdict Engine (VW-019 to VW-025)

*Originally scoped as a 4-context (Health/Eco/Productivity/Finance) verdict
engine. Removed after shipping — a single generic prompt across four
unrelated domains never produced credible advice outside health/food, so
the product narrowed to food and nutrition only. See PRD.md §0.*

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-019 | ~~Context Selector UI~~ Food/Non-Food Decision in Prompt | 🔴 | ✅ | Superseded VW-019: no user-facing selector — Gemini decides isFood from the image itself, as an explicit first step in the prompt |
| VW-020 | Gemini Service (server) | 🔴 | ✅ | geminiService.js — build prompt, call API, parse JSON response, sanitizeFood() validates the nutrition payload |
| VW-021 | POST /api/scan Endpoint | 🔴 | ✅ | Receive {imageBase64, objectLabel} → call Gemini → save ScanLog → return verdict |
| VW-022 | ScanLog Mongoose Model | 🔴 | ✅ | Schema: userId, objectLabel, verdict, score, reason, tips, breakdown, food (nutrients/ingredients), createdAt |
| VW-023 | VerdictCard Component | 🔴 | ✅ | Verdict badge, score bar, reason, tips, nutrition panel + ingredient breakdown for food scans |
| VW-024 | Scan Loading State | 🟠 | ✅ | Spinner in VerdictCard area while awaiting the verdict |
| VW-025 | Gemini Fallback (error handling) | 🟠 | ✅ | If Gemini is rate-limited, a rule-based fallback verdict keeps the app usable |

---

## Epic 4: History & Analytics (VW-026 to VW-033)

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-026 | GET /api/history Endpoint | 🔴 | ✅ | Paginated ScanLogs for the authenticated user, with search (`q`) and verdict filter |
| VW-027 | GET /api/history/analytics Endpoint | 🟠 | ✅ | Returns weeklyScore (avg), chartData (scans per day), totalScans |
| VW-027b | GET /api/history/:id Endpoint | 🟠 | ✅ | Added beyond the original scope — a single scan by ID, scoped to its owner, backing a real shareable detail page |
| VW-028 | DELETE /api/history/:id Endpoint | 🟠 | ✅ | Delete scan by ID — verify ownership |
| VW-029 | History Page (React) | 🔴 | ✅ | Paginated, searchable list: verdict dot, label, score, date, swipe-to-delete |
| VW-030 | ~~Context Filter~~ Verdict Filter + Search on History | 🟡 | ✅ | Superseded VW-030: filter by Good/Neutral/Bad and free-text search by object label |
| VW-031 | Pagination Component | 🟠 | ✅ | Prev/Next buttons + page indicator |
| VW-032 | Weekly Score Card | 🟠 | ✅ | Large score number + label "Avg score" |
| VW-033 | Analytics Bar Chart (Recharts) | 🟠 | ✅ | Bar chart: scans per day for last 7 days |

---

## Epic 5: UI Polish (VW-034 to VW-040)

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-034 | ~~Canvas AR Glow Effect~~ | 🟡 | ⬜ | Descoped — not core to the food-nutrition use case |
| VW-035 | Verdict Reveal Animation | 🟡 | ✅ | VerdictCard fades/counts up on result |
| VW-036 | Home / Landing Page | 🟠 | ✅ | Rebuilt mobile-first: phone-mockup-first hero, swipe carousels instead of feature grids |
| VW-037 | Navbar Component | 🔴 | ✅ | Logo, nav links (conditional auth), user avatar — simplified on mobile since BottomNav owns that chrome when signed in |
| VW-038 | Responsive Layout (Mobile) | 🟠 | ✅ | Scanner + history usable down to 375px; entire UI treated as mobile-first, not shrunk-desktop |
| VW-039 | 404 Not Found Page | 🟢 | ✅ | "Page not found" with link to home |
| VW-040 | Deployment (Vercel + Render) | 🔴 | ⬜ | Not yet deployed — runs locally only as of this revision |

---

## Epic 6: Mobile App Pass (VW-041 to VW-053) — added post-MVP

| ID | Title | Priority | Status | Description |
|----|-------|----------|--------|-------------|
| VW-041 | Installable PWA | 🟠 | ✅ | manifest.json, service worker, home-screen icons |
| VW-042 | Offline Caching | 🟡 | ✅ | Service worker caches the app shell and last-seen API GETs; SPA routes fall back to the cached shell offline |
| VW-043 | Bottom Tab Navigation | 🔴 | ✅ | Dashboard / Scanner / Account tabs, replacing the old sheet-based account menu |
| VW-044 | Bottom Sheet Modals | 🟠 | ✅ | Reusable slide-up sheet for confirmations and detail views |
| VW-045 | Toast Notifications | 🟠 | ✅ | Replaced inline error banners app-wide |
| VW-046 | Swipe-to-Delete + Pull-to-Refresh (History) | 🟡 | ✅ | Native-feeling list gestures via Pointer/Touch Events, no library |
| VW-047 | Page Transitions | 🟡 | ✅ | Fade/slide on route change |
| VW-048 | Account Page (real page, not a sheet) | 🟠 | ✅ | Profile card, stats, theme toggle, sign out |
| VW-049 | Scan Detail Page (real page, not a modal) | 🟠 | ✅ | /history/:id — deep-linkable, shareable |
| VW-050 | Editable Profile (name, password, avatar) | 🟠 | ✅ | PATCH /auth/profile, /auth/password, /auth/avatar |
| VW-051 | Password Reset via Email | 🟡 | 🔵 | Forgot-password flow, email delivery via Gmail SMTP |
| VW-052 | Client-side Test Suite | 🟡 | ✅ | Vitest + Testing Library; covers pure logic (nutrientStyle, getApiError) and a VerdictCard render smoke test |
| VW-053 | CI Pipeline | 🟢 | ⬜ | Not started |

---

## Summary

| Epic | Tickets | Done | Pending/In progress |
|------|---------|------|----------------------|
| Auth | VW-001–008 | 8 | 0 |
| Camera | VW-009–018b | 11 | 0 |
| Verdict | VW-019–025 | 7 | 0 |
| History | VW-026–033 | 9 | 0 |
| UI/Polish | VW-034–040 | 6 | 2 (AR glow descoped, deployment pending) |
| Mobile App Pass | VW-041–053 | 11 | 2 (password reset in progress, CI pending) |
| **Total** | **53** | **51** | **2 pending, 1 in progress** |

Remaining before this can be called feature-complete for the FYP submission:
deployment (VW-040) and, optionally, a CI pipeline (VW-053).

# Software Requirements Specification (SRS)
## VisionWise — AI-Powered Nutrition & Food Scanner
**Version:** 2.0 (updated for the food-only pivot and mobile-first rebuild — see PRD.md §0)
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)
**Institution:** International Islamic University Islamabad
**Date:** August 2026

---

## Table of Contents
1. Introduction
2. Overall Description
3. Actors & Use Cases
4. Functional Requirements
5. Non-Functional Requirements
6. System Boundaries & Constraints
7. External Interface Requirements

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for VisionWise, a web-based, installable AI-powered food and nutrition scanner. It is intended for the development team, supervisor, and FYP evaluation committee.

### 1.2 Scope
VisionWise allows users to point their device camera at food or a packaged product (or upload/take a photo of one), and receive an instant AI-generated nutrition breakdown: a Good/Bad/Neutral verdict, a score, estimated or label-read nutrients, and an ingredient-by-ingredient explanation. Non-food objects get a generic factor breakdown instead of a fabricated verdict. The system stores scan history, generates visual analytics dashboards, and is installable to a device home screen as a Progressive Web App.

### 1.3 Definitions
| Term | Definition |
|------|-----------|
| Verdict | The AI output: Good, Bad, or Neutral |
| Scan | One complete cycle of object detection + verdict generation |
| ScanLog | A database record of a completed scan |
| COCO-SSD | A pre-trained TensorFlow.js model for object detection (client-side) |
| Gemini | Google's Gemini API (`gemini-flash-latest`), used for nutrition analysis |
| PWA | Progressive Web App — installable, with an offline-capable service worker |

---

## 2. Overall Description

### 2.1 Product Perspective
VisionWise is a standalone, mobile-first web application accessible via any modern browser, installable to a home screen like a native app. It combines client-side AI (TensorFlow.js) for real-time object detection and a server-side LLM API (Gemini) for nutrition reasoning.

### 2.2 Product Functions (Summary)
- Real-time camera-based object detection, plus photo upload and take-picture-with-retake
- Food/nutrition analysis: estimated nutrients from a dish photo, or nutrients read directly from a package label
- Ingredient-by-ingredient explanation for packaged food
- User authentication (Google OAuth + Email/Password), with an editable profile (name, photo, password)
- Scan history with search, verdict filtering, and a real per-scan detail page
- Weekly analytics dashboard
- Installable PWA with bottom-tab navigation, swipe/pull gestures, and offline viewing of the app shell and last-seen data

### 2.3 User Classes
| Class | Description |
|-------|-------------|
| Guest | Can view landing page; must register to scan |
| Registered User | Full access to scanner, history, dashboard, account |
| Admin (future) | Not implemented in this version |

### 2.4 Operating Environment
- Browser: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- Device: Any with a camera (desktop/laptop/tablet/phone) — camera is optional if using photo upload
- Network: Internet required for Gemini API calls and initial load; the PWA shell and last-viewed history remain viewable offline
- Platform: Windows, macOS, Linux, Android, iOS (browser-based, installable on Android/desktop; iOS supports "Add to Home Screen" with some PWA limitations)

---

## 3. Actors & Use Cases

### 3.1 Actors
- **Guest:** Unauthenticated visitor
- **Registered User:** Authenticated user with full access
- **Google OAuth Provider:** External auth service
- **Gemini API:** External AI inference service
- **MongoDB Atlas:** External database service

### 3.2 Use Case Diagram (ASCII)
```
                    +-----------------------------+
                    |          VisionWise          |
                    |                               |
  [Guest] -------> | UC-01 Register                |
                   | UC-02 Login                    |
                   +-----------------------------+
                           |
  [Reg User] -----------> | UC-03 Open Camera / Upload / Take Picture |
                          | UC-04 Detect Object       | <---> [TF.js COCO-SSD]
                          | UC-05 Trigger Scan        |
                          | UC-06 View Verdict        | <---> [Gemini API]
                          | UC-07 View History        |
                          | UC-08 View Dashboard      |
                          | UC-09 Edit Profile        |
                          | UC-10 Install as PWA      |
                          | UC-11 Logout              |
```

### 3.3 Use Case Descriptions

**UC-03 Open Camera / Upload / Take Picture**
- Actor: Registered User
- Precondition: Browser has camera permission, or the user has a photo to upload
- Main Flow: User navigates to Scanner page → browser requests camera → live feed renders in `<video>`; alternatively the user uploads a photo file, or takes a picture and confirms/retakes it before scanning
- Exception: Camera denied → show error banner with instructions; falls back to upload

**UC-04 Detect Object (Real-time)**
- Actor: Registered User + TF.js
- Precondition: Camera is active, or a photo is loaded
- Main Flow: TF.js COCO-SSD runs on each video frame (or once on an uploaded/captured image) → draws bounding box + label on canvas overlay → label displayed as floating chip

**UC-05 Trigger Scan**
- Actor: Registered User
- Precondition: Object detected
- Main Flow: User taps "Scan now" → frame captured → sent to backend → Gemini API called (decides food vs. non-food, then analyzes accordingly) → verdict returned → ScanLog saved

**UC-06 View Verdict**
- Actor: Registered User
- Main Flow: VerdictCard displays verdict (Good/Bad/Neutral), score (0–100), a plain-English reason, tips, and — for food — a nutrition panel and ingredient breakdown; for non-food, a generic factor breakdown instead

---

## 4. Functional Requirements

### Epic 1: Authentication & Profile
| ID | Requirement |
|----|-------------|
| FR-01 | The system shall allow users to register with email and password |
| FR-02 | The system shall allow users to log in with Google OAuth 2.0 |
| FR-03 | The system shall issue a JWT access token (15 min) and refresh token (7 days) on login |
| FR-04 | The system shall hash passwords using bcryptjs with 12 salt rounds |
| FR-05 | The system shall reject requests with invalid/expired JWT tokens |
| FR-05a | The system shall allow a registered user to edit their display name |
| FR-05b | The system shall allow a registered user with a password to change it, verifying the current password first |
| FR-05c | The system shall allow a registered user to upload a profile photo, resized client-side and stored inline |
| FR-05d | The system shall allow a registered user to request a password-reset email if they forget their password |

### Epic 2: Camera & Object Detection
| ID | Requirement |
|----|-------------|
| FR-06 | The system shall access the device camera via WebRTC getUserMedia API |
| FR-07 | The system shall run TF.js COCO-SSD model in-browser for real-time detection |
| FR-08 | The system shall draw bounding boxes and object labels on a canvas overlay |
| FR-09 | The system shall detect objects at ≥50% confidence threshold |
| FR-10 | The system shall allow users to switch between front and rear cameras |
| FR-10a | The system shall allow users to scan from an uploaded photo instead of the live camera |
| FR-10b | The system shall allow users to take a picture, then retake or confirm it before scanning |

### Epic 3: Nutrition Verdict Engine
| ID | Requirement |
|----|-------------|
| FR-11 | The system shall have Gemini determine, from the image itself, whether the scanned object is food — no user-facing category selection |
| FR-12 | The system shall send the captured image frame and detected label to the backend |
| FR-13 | The backend shall call the Gemini API with a structured prompt that decides food/non-food first, then branches accordingly |
| FR-14 | For food, Gemini shall return: verdict, score, reason, tips, and nutrition data (nutrients with amount/unit/%DV/impact/direction, plus ingredient explanations) — estimated from the dish, or read from a package label when legible |
| FR-14a | For non-food, Gemini shall return a generic 3–5 factor breakdown instead of nutrition data |
| FR-15 | The system shall display the verdict with color-coded UI (green/amber/red) |
| FR-16 | The system shall save each scan as a ScanLog in MongoDB |
| FR-16a | If Gemini is rate-limited, the system shall fall back to a rule-based verdict so the app remains usable |

### Epic 4: History & Analytics
| ID | Requirement |
|----|-------------|
| FR-17 | The system shall display a paginated list of the user's past scans |
| FR-17a | The system shall let users search history by object label and filter by verdict |
| FR-18 | The system shall display a bar chart of scans per day over the last 7 days |
| FR-19 | The system shall compute and display a "Weekly Score" (average of all scan scores) |
| FR-20 | The system shall allow users to delete individual scan entries |
| FR-20a | The system shall provide a real, shareable, per-scan detail page (not a modal), scoped to its owner |

### Epic 5: Mobile App Experience
| ID | Requirement |
|----|-------------|
| FR-21 | The system shall be installable as a Progressive Web App (manifest + service worker) |
| FR-22 | The service worker shall cache the app shell and last-seen API responses so the app remains viewable offline |
| FR-23 | Signed-in users shall navigate primarily via a bottom tab bar (Dashboard / Scanner / Account) |
| FR-24 | Confirmations and detail views shall use a bottom-sheet pattern on mobile |
| FR-25 | Route changes shall transition with a fade/slide rather than a hard cut |

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Object detection latency < 100ms per frame on a mid-range device |
| NFR-02 | Performance | Full scan response (camera → verdict displayed) < 5 seconds |
| NFR-03 | Usability | UI must be mobile-first and responsive across screen sizes 320px – 1920px |
| NFR-04 | Availability | 99% uptime target using free-tier Render + Vercel (once deployed) |
| NFR-05 | Security | Gemini API key and DB credentials must never be exposed to the client |
| NFR-06 | Security | All API endpoints must be rate-limited (100 req / 15 min per IP) |
| NFR-07 | Scalability | MongoDB Atlas M0 can support up to 500 concurrent users for this FYP scope |
| NFR-08 | Portability | Application must run in Chrome, Firefox, Edge, and Safari, and be installable on Android/desktop Chrome/Edge |
| NFR-09 | Maintainability | Code must follow modular MVC structure with clear separation of concerns |
| NFR-10 | Compliance | Camera access must follow browser permissions model; no raw frames stored permanently |
| NFR-11 | Reliability | Client-side logic with real branching (color-coding, cache strategy, error extraction) is covered by an automated test suite (Vitest) |

---

## 6. System Boundaries & Constraints

### In Scope
- Web application, mobile-first, installable as a PWA (no native App/Play Store build)
- Object detection using COCO-SSD (~80 object classes)
- Food-only nutrition verdicts — no category/lens selection
- User accounts with editable profiles and scan history
- Gemini (`gemini-flash-latest`) for nutrition reasoning

### Out of Scope
- Native mobile app (iOS/Android app store builds)
- Custom ML model training
- Admin panel (Phase 2 / future)
- Full offline scanning (Gemini requires internet; only viewing cached data works offline)
- Payment / premium features
- Multi-language support

### Constraints
- Gemini API free tier: rate-limited per minute; a rule-based fallback covers rate-limit windows
- MongoDB Atlas M0: 512MB storage, shared cluster
- Render free tier: server sleeps after 15 min inactivity (cold start ~30s), once deployed
- Avatars are stored inline as a data URL (no object storage service) — capped at ~300KB, resized to 256px client-side before upload

---

## 7. External Interface Requirements

### 7.1 User Interface
- Single-page application built with React 18 + Vite
- Styled with Tailwind CSS v3
- Mobile-first: bottom tab navigation, bottom sheets, swipe/pull gestures, installable PWA chrome

### 7.2 Hardware Interface
- Input: Device camera (WebRTC MediaDevices API), or a photo file
- Output: Browser display (canvas overlay for live detection)

### 7.3 Software Interfaces
| System | Interface | Purpose |
|--------|-----------|---------|
| Google Gemini | REST API (HTTPS) | Nutrition verdict generation |
| MongoDB Atlas | Mongoose ODM | Data persistence |
| Google OAuth | OAuth 2.0 / Passport.js | Social login |
| Gmail SMTP | Nodemailer | Password-reset email delivery |

### 7.4 Communication Interface
- Client ↔ Server: REST API over HTTPS (JSON)
- Server ↔ Gemini: HTTPS POST (Google AI SDK)
- Server ↔ MongoDB: MongoDB Wire Protocol (TLS)
- Client ↔ Service Worker: Fetch interception (same-origin, no network)

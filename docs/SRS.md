# Software Requirements Specification (SRS)
## VisionWise — AI-Powered Contextual Object Scanner & Recommender
**Version:** 1.0  
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)  
**Institution:** International Islamic University Islamabad  
**Date:** June 2026

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
This document specifies the software requirements for VisionWise, a web-based AI-powered contextual object scanner. It is intended for the development team, supervisor, and FYP evaluation committee.

### 1.2 Scope
VisionWise allows users to point their device camera at any object, select a context (Health, Eco, Productivity, Finance), and receive an instant AI-generated Good/Bad verdict with a one-sentence explanation and a score. The system stores scan history and generates visual analytics dashboards.

### 1.3 Definitions
| Term | Definition |
|------|-----------|
| Context | A user-chosen evaluation lens (e.g., Health, Eco) |
| Verdict | The AI output: Good, Bad, or Neutral |
| Scan | One complete cycle of object detection + verdict generation |
| ScanLog | A database record of a completed scan |
| COCO-SSD | A pre-trained TensorFlow.js model for object detection |
| Gemini | Google's Gemini 1.5 Flash LLM API used for contextual reasoning |

---

## 2. Overall Description

### 2.1 Product Perspective
VisionWise is a standalone web application accessible via any modern browser. It combines client-side AI (TensorFlow.js) for real-time object detection and a server-side LLM API (Gemini) for contextual verdict generation.

### 2.2 Product Functions (Summary)
- Real-time camera-based object detection
- Context-aware Good/Bad/Neutral verdict with explanation
- Visual AR overlay on camera feed (green/red glow)
- User authentication (Google OAuth + Email/Password)
- Scan history with infographic visualizations
- Weekly analytics dashboard

### 2.3 User Classes
| Class | Description |
|-------|-------------|
| Guest | Can view landing page; must register to scan |
| Registered User | Full access to scanner, history, dashboard |
| Admin (future) | Can manage context rules database |

### 2.4 Operating Environment
- Browser: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- Device: Any with a camera (desktop/laptop/tablet/phone)
- Network: Internet required for Gemini API calls
- Platform: Windows, macOS, Linux, Android, iOS (browser-based)

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
                    +------------------+
                    |   VisionWise     |
                    |                  |
  [Guest] -------> | UC-01 Register   |
                   | UC-02 Login      |
                   +------------------+
                           |
  [Reg User] -----------> | UC-03 Select Context     |
                          | UC-04 Open Camera        |
                          | UC-05 Detect Object      | <---> [TF.js COCO-SSD]
                          | UC-06 Trigger Scan       |
                          | UC-07 View Verdict       | <---> [Gemini API]
                          | UC-08 View History       |
                          | UC-09 View Dashboard     |
                          | UC-10 Logout             |
```

### 3.3 Use Case Descriptions

**UC-03 Select Context**
- Actor: Registered User
- Precondition: User is logged in
- Main Flow: User chooses one of Health/Eco/Productivity/Finance from dropdown
- Postcondition: Selected context is stored in session state

**UC-04 Open Camera**
- Actor: Registered User
- Precondition: Browser has camera permission
- Main Flow: User navigates to Scanner page → browser requests camera → live feed renders in `<video>` element
- Exception: Camera denied → show error banner with instructions

**UC-05 Detect Object (Real-time)**
- Actor: Registered User + TF.js
- Precondition: Camera is active
- Main Flow: TF.js COCO-SSD runs on each video frame → draws bounding box + label on canvas overlay → label displayed as floating chip

**UC-06 Trigger Scan**
- Actor: Registered User
- Precondition: Object detected, context selected
- Main Flow: User clicks "Scan" → frame captured → sent to backend → Gemini API called → verdict returned → ScanLog saved

**UC-07 View Verdict**
- Actor: Registered User
- Main Flow: VerdictCard displays verdict (Good/Bad/Neutral), score (0–100), 1-sentence reason, 3 tips → canvas overlay turns green/red

---

## 4. Functional Requirements

### Epic 1: Authentication
| ID | Requirement |
|----|-------------|
| FR-01 | The system shall allow users to register with email and password |
| FR-02 | The system shall allow users to log in with Google OAuth 2.0 |
| FR-03 | The system shall issue a JWT access token (15 min) and refresh token (7 days) on login |
| FR-04 | The system shall hash passwords using bcryptjs with 12 salt rounds |
| FR-05 | The system shall reject requests with invalid/expired JWT tokens |

### Epic 2: Camera & Object Detection
| ID | Requirement |
|----|-------------|
| FR-06 | The system shall access the device camera via WebRTC getUserMedia API |
| FR-07 | The system shall run TF.js COCO-SSD model in-browser for real-time detection |
| FR-08 | The system shall draw bounding boxes and object labels on a canvas overlay |
| FR-09 | The system shall detect objects at ≥85% confidence threshold |
| FR-10 | The system shall allow users to switch between front and rear cameras |

### Epic 3: Verdict Engine
| ID | Requirement |
|----|-------------|
| FR-11 | The system shall accept a context selection from: Health, Eco, Productivity, Finance |
| FR-12 | The system shall send the captured image frame and detected label to the backend |
| FR-13 | The backend shall call Gemini 1.5 Flash API with a structured prompt including context |
| FR-14 | Gemini shall return: verdict (Good/Bad/Neutral), score (0–100), reason (1 sentence), tips (array of 3) |
| FR-15 | The system shall display the verdict with color-coded UI (green/red/yellow) |
| FR-16 | The system shall save each scan as a ScanLog in MongoDB |

### Epic 4: History & Analytics
| ID | Requirement |
|----|-------------|
| FR-17 | The system shall display a paginated list of the user's past scans |
| FR-18 | The system shall display a bar chart of scans by context over the last 7 days |
| FR-19 | The system shall compute and display a "Weekly Score" (average of all scan scores) |
| FR-20 | The system shall allow users to delete individual scan entries |

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Object detection latency < 100ms per frame on a mid-range device |
| NFR-02 | Performance | Full scan response (camera → verdict displayed) < 5 seconds |
| NFR-03 | Usability | UI must be responsive across screen sizes 320px – 1920px |
| NFR-04 | Availability | 99% uptime target using free-tier Render + Vercel |
| NFR-05 | Security | Gemini API key and DB credentials must never be exposed to the client |
| NFR-06 | Security | All API endpoints must be rate-limited (100 req / 15 min per IP) |
| NFR-07 | Scalability | MongoDB Atlas M0 can support up to 500 concurrent users for this FYP scope |
| NFR-08 | Portability | Application must run in Chrome, Firefox, Edge, and Safari |
| NFR-09 | Maintainability | Code must follow modular MVC structure with clear separation of concerns |
| NFR-10 | Compliance | Camera access must follow browser permissions model; no raw frames stored permanently |

---

## 6. System Boundaries & Constraints

### In Scope
- Web application (browser-based, no mobile app)
- Object detection using COCO-SSD (~80 object classes)
- 4 contexts: Health, Eco, Productivity, Finance
- User accounts with scan history
- Gemini 1.5 Flash for verdict reasoning

### Out of Scope
- Native mobile app (iOS/Android)
- Custom ML model training
- Admin panel (Phase 2 / future)
- Offline mode (Gemini requires internet)
- Payment / premium features

### Constraints
- Gemini API free tier: 15 requests/minute, 1M tokens/day
- MongoDB Atlas M0: 512MB storage, shared cluster
- Render free tier: server sleeps after 15 min inactivity (cold start ~30s)

---

## 7. External Interface Requirements

### 7.1 User Interface
- Single-page application built with React 18 + Vite
- Styled with Tailwind CSS v3
- Responsive: mobile-first design

### 7.2 Hardware Interface
- Input: Device camera (WebRTC MediaDevices API)
- Output: Browser display (canvas overlay for AR)

### 7.3 Software Interfaces
| System | Interface | Purpose |
|--------|-----------|---------|
| Google Gemini | REST API (HTTPS) | Contextual verdict generation |
| MongoDB Atlas | Mongoose ODM | Data persistence |
| Google OAuth | OAuth 2.0 / Passport.js | Social login |

### 7.4 Communication Interface
- Client ↔ Server: REST API over HTTPS (JSON)
- Server ↔ Gemini: HTTPS POST (Google AI SDK)
- Server ↔ MongoDB: MongoDB Wire Protocol (TLS)

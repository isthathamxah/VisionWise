# Product Requirements Document (PRD)
## VisionWise — AI-Powered Contextual Object Scanner & Recommender
**Version:** 1.0  
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)  
**Date:** June 2026

---

## 1. Problem Statement

Existing image recognition tools (Google Lens, Amazon Rekognition) excel at identifying objects but provide no **actionable, personalized advice**. A student scanning an energy drink needs to know if it's bad for their health specifically — not just its Wikipedia page. A person sorting waste needs to know if a specific plastic is recyclable in their bin.

There is a gap between **what an object is** and **what it means for you** in a given context.

VisionWise fills this gap.

---

## 2. Target Users & Personas

### Persona 1: Aisha — Health-Conscious Student
- **Age:** 21 | CS student at IIUI
- **Goal:** Scan food/drinks to monitor sugar and calorie intake
- **Pain Point:** Google Lens tells her what a product is, but not if she should eat it
- **VisionWise value:** Scans a bag of chips → "Bad (Health) — 34g fat exceeds daily limit"

### Persona 2: Omar — Eco-Aware Professional
- **Age:** 28 | Environmental engineer
- **Goal:** Sort waste correctly and avoid buying unsustainable products
- **Pain Point:** Recycling symbols are confusing
- **VisionWise value:** Scans a plastic bottle → "Bad (Eco) — #6 PS is not recyclable. Choose #1 PET"

### Persona 3: Fatima — Focused Researcher
- **Age:** 24 | PhD student
- **Goal:** Maintain deep work sessions without distraction
- **Pain Point:** Has too many gadgets on her desk
- **VisionWise value:** Scans her gaming mouse → "Bad (Productivity) — Gaming peripherals are associated with distraction during study hours"

### Persona 4: Bilal — Budget-Conscious Shopper
- **Age:** 30 | Mid-level engineer
- **Goal:** Avoid impulse purchases and stay within budget
- **Pain Point:** Struggles to judge if something is worth buying
- **VisionWise value:** Scans luxury headphones → "Neutral (Finance) — Premium price but high resale value"

---

## 3. Feature Prioritization (MoSCoW)

### Must Have (MVP)
| Feature | Why |
|---------|-----|
| Camera access + live feed | Core product functionality |
| TF.js object detection (COCO-SSD) | Identifies what to evaluate |
| Context selector (4 modes) | Defines evaluation lens |
| Gemini verdict generation | Core AI value |
| VerdictCard display (Good/Bad/Neutral + score + reason) | Primary output |
| User registration + login (Email + Google OAuth) | Personalization prerequisite |
| Scan history storage | Enables analytics |
| Responsive UI | Accessible on all devices |

### Should Have
| Feature | Why |
|---------|-----|
| AR canvas overlay (green/red glow) | Immersive, differentiating UX |
| Analytics dashboard (bar chart + weekly score) | Shows product value over time |
| Paginated scan history | Usability for returning users |
| Delete scan entry | User data control |
| Camera front/rear toggle | Mobile usability |

### Could Have
| Feature | Why |
|---------|-----|
| Scan count badge per context | Gamification |
| Share verdict as image | Viral potential |
| Export history as PDF/CSV | Power users |
| Dark mode | UI preference |
| Crowdsourced correction ("AI was wrong") | Accuracy improvement loop |

### Won't Have (this version)
| Feature | Reason |
|---------|--------|
| Native mobile app | Out of FYP scope |
| Custom ML model training | Requires labeled dataset + GPU |
| Admin panel | Phase 2 |
| Offline mode | Gemini requires internet |
| Multi-language support | English-only for FYP |

---

## 4. Success Metrics

| Metric | Target |
|--------|--------|
| Object detection accuracy (COCO-SSD) | ≥ 85% on common everyday objects |
| Scan-to-verdict response time | < 5 seconds end-to-end |
| Gemini verdict quality (manual eval) | Contextually accurate in ≥ 90% of test cases |
| UI responsiveness | Works on screen widths 320px–1920px |
| Auth success rate | 100% on valid credentials |
| Scan history retrieval time | < 1 second for last 10 entries |
| Zero critical security vulnerabilities | No exposed API keys, no injection vectors |

---

## 5. User Stories

```
US-01: As a registered user, I want to open my camera so I can point it at an object.
US-02: As a registered user, I want to select a context (Health/Eco/Productivity/Finance) before scanning.
US-03: As a registered user, I want the app to automatically detect what object I'm looking at.
US-04: As a registered user, I want to tap "Scan" and receive a Good/Bad/Neutral verdict within 5 seconds.
US-05: As a registered user, I want to see a score (0–100) and a one-sentence reason for the verdict.
US-06: As a registered user, I want the camera overlay to glow green or red to visually indicate the verdict.
US-07: As a registered user, I want to view my scan history sorted by date.
US-08: As a registered user, I want to see a weekly analytics chart of my scans by context.
US-09: As a registered user, I want to delete a scan entry from my history.
US-10: As a guest, I want to register with my email and password.
US-11: As a guest, I want to log in using my Google account.
US-12: As a registered user, I want my session to persist so I don't have to log in every time.
```

---

## 6. Out-of-Scope Clarifications

- **No food database integration** (e.g., Open Food Facts API) in MVP — Gemini handles food reasoning via vision
- **No notifications/push alerts** in MVP
- **No social features** (following, sharing feeds) in MVP
- **No payment integration** — all infrastructure is free tier
- **No data sold or shared** — scan history is private to each user account

---

## 7. Release Plan

| Phase | Milestone | Timeline |
|-------|-----------|---------|
| Phase 1 | All documentation complete | Week 1 |
| Phase 2 | Project setup + Auth module | Week 2 |
| Phase 3 | Camera + TF.js detection working | Week 3 |
| Phase 4 | Gemini verdict engine integrated | Week 4 |
| Phase 5 | History + Dashboard | Week 5 |
| Phase 6 | AR overlay + UI polish | Week 6 |
| Phase 7 | Testing + bug fixes | Week 7 |
| Phase 8 | Deployment (Vercel + Render + Atlas) | Week 8 |
| Phase 9 | FYP presentation prep | Week 9 |

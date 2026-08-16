# Product Requirements Document (PRD)
## VisionWise — AI-Powered Nutrition & Food Scanner
**Version:** 2.0 (supersedes v1.0's 4-context design — see §0)
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)
**Date:** August 2026

---

## 0. Revision Note

The original design (v1.0) let a user pick one of four evaluation "lenses" —
Health, Eco, Productivity, Finance — and scan any object for a verdict
through that lens. That system shipped, then was deliberately removed:
letting a single generic prompt render a health verdict, an eco verdict,
and a finance verdict for the same object never produced credible advice
outside the health/food case, and it diluted the product's focus. VisionWise
is now a single-purpose **food and nutrition scanner** — point it at a
meal, a drink, or a packaged product and get a real nutrition breakdown,
not a shallow judgment stretched across four unrelated domains. This
version of the PRD reflects that scope, plus the mobile-first rebuild that
followed it (installable PWA, bottom-tab navigation, a real Account page).

---

## 1. Problem Statement

Existing image recognition tools (Google Lens, Amazon Rekognition) excel at
identifying objects but provide no **actionable, personalized advice**. A
student scanning an energy drink needs to know if it's bad for their
health specifically — the sugar content, the caffeine, whether it's worth
it — not just its Wikipedia page.

There is a gap between **what a food item is** and **what it means for
your health**. VisionWise fills that gap.

---

## 2. Target Users & Personas

### Persona 1: Aisha — Health-Conscious Student
- **Age:** 21 | CS student at IIUI
- **Goal:** Scan food/drinks to monitor sugar and calorie intake
- **Pain Point:** Google Lens tells her what a product is, but not if she should eat it, or what's actually in it
- **VisionWise value:** Scans a bag of chips → "Bad — 34g fat and 620mg sodium exceed a reasonable single-serving amount" plus a full ingredient breakdown

### Persona 2: Bilal — Label-Skeptical Shopper
- **Age:** 30 | Mid-level engineer
- **Goal:** Understand what's actually in packaged food before buying it
- **Pain Point:** Ingredient lists are long, jargon-heavy, and easy to skim past
- **VisionWise value:** Scans a snack bar's label → reads the printed nutrition facts directly, explains what each preservative/additive is and why it's there

---

## 3. Feature Prioritization (MoSCoW)

### Must Have (MVP)
| Feature | Why |
|---------|-----|
| Camera access + live feed, plus photo upload and take-picture | Core product functionality — works whether or not the object is in front of you right now |
| TF.js object detection (COCO-SSD) | Identifies what to evaluate, client-side |
| Gemini nutrition analysis (estimated from a dish, or read from a package label) | Core AI value |
| VerdictCard display (Good/Bad/Neutral + score + reason + nutrients + ingredients) | Primary output |
| User registration + login (Email + Google OAuth) | Personalization prerequisite |
| Scan history storage, with a real per-scan detail page | Enables analytics and revisiting past scans |
| Mobile-first responsive UI, installable as a PWA | Primary usage is on a phone |

### Should Have
| Feature | Why |
|---------|-----|
| Analytics dashboard (bar chart + weekly score + verdict split) | Shows product value over time |
| Paginated, searchable scan history | Usability for returning users |
| Delete scan entry | User data control |
| Camera front/rear toggle | Mobile usability |
| Editable profile (name, photo, password) | Basic account ownership |

### Could Have
| Feature | Why |
|---------|-----|
| Share verdict (with a real link to the scan) | Viral potential |
| Export history as PDF/CSV | Power users |
| Dark mode | UI preference (shipped) |
| Password reset via email | Account recovery |
| Crowdsourced correction ("AI was wrong") | Accuracy improvement loop |

### Won't Have (this version)
| Feature | Reason |
|---------|--------|
| Native mobile app (App Store / Play Store) | Out of FYP scope — a PWA covers the "feels like an app" requirement |
| Custom ML model training | Requires labeled dataset + GPU |
| Admin panel | Phase 2 |
| Full offline scanning | Gemini requires internet; the PWA does cache the app shell and last-viewed history for offline *viewing* |
| Multi-language support | English-only for FYP |

---

## 4. Success Metrics

| Metric | Target |
|--------|--------|
| Object detection accuracy (COCO-SSD) | ≥ 85% on common everyday objects |
| Scan-to-verdict response time | < 5 seconds end-to-end |
| Gemini verdict quality (manual eval) | Nutritionally plausible in ≥ 90% of test cases; correctly identifies non-food objects as non-food |
| UI responsiveness | Works on screen widths 320px–1920px, mobile-first |
| Auth success rate | 100% on valid credentials |
| Scan history retrieval time | < 1 second for last 10 entries |
| Zero critical security vulnerabilities | No exposed API keys, no injection vectors |

---

## 5. User Stories

```
US-01: As a registered user, I want to open my camera so I can point it at food.
US-02: As a registered user, I want to upload a photo or take a picture instead of using the live camera.
US-03: As a registered user, I want the app to automatically detect what object I'm looking at.
US-04: As a registered user, I want to tap "Scan" and receive a Good/Bad/Neutral verdict within 5 seconds.
US-05: As a registered user, I want a nutrition breakdown (calories, sugar, protein, etc.) when I scan food.
US-06: As a registered user, I want an ingredient-by-ingredient explanation for packaged food.
US-07: As a registered user, I want to view my scan history, searchable and filterable by verdict.
US-08: As a registered user, I want to see a weekly analytics chart of my scans.
US-09: As a registered user, I want to delete a scan entry from my history.
US-10: As a registered user, I want a real, shareable page for each past scan.
US-11: As a guest, I want to register with my email and password.
US-12: As a guest, I want to log in using my Google account.
US-13: As a registered user, I want my session to persist so I don't have to log in every time.
US-14: As a registered user, I want to edit my name, photo and password from an Account page.
US-15: As a registered user, I want to install VisionWise to my home screen like a native app.
```

---

## 6. Out-of-Scope Clarifications

- **No food database integration** (e.g., Open Food Facts API) — Gemini handles food reasoning via vision, not a lookup table
- **No notifications/push alerts**
- **No social features** (following, public sharing feeds, comments)
- **No payment integration** — all infrastructure is free tier
- **No data sold or shared** — scan history is private to each user account
- **No object categories beyond food** — a scanned non-food object gets a generic factor breakdown, not a fabricated health/eco/finance verdict

---

## 7. Release Plan

| Phase | Milestone |
|-------|-----------|
| Phase 1 | All documentation complete |
| Phase 2 | Project setup + Auth module |
| Phase 3 | Camera + TF.js detection working |
| Phase 4 | Gemini verdict engine integrated (originally 4-context, later narrowed to food/nutrition) |
| Phase 5 | History + Dashboard |
| Phase 6 | Food/nutrition analysis: ingredient breakdowns, label reading, direction-aware nutrient coloring |
| Phase 7 | Mobile-first rebuild: PWA, bottom nav, swipe/pull gestures, Account and scan-detail pages |
| Phase 8 | Testing + bug fixes |
| Phase 9 | Deployment (Vercel + Render + Atlas) |
| Phase 10 | FYP presentation prep |

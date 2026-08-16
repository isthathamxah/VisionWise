# Frontend Specification Document
## VisionWise — AI-Powered Nutrition & Food Scanner
**Version:** 2.0 (rewritten to match the shipped mobile-first UI — see PRD.md §0)
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)
**Date:** August 2026

---

## 1. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| React Router DOM | 6 | Client-side routing |
| Tailwind CSS | 3 | Styling, CSS-variable-based theming (light/dark) |
| Recharts | 2 | Analytics charts |
| Axios | 1 | HTTP client |
| TensorFlow.js | 4 | In-browser object detection |
| @tensorflow-models/coco-ssd | 2 | Pre-trained detection model |
| Vitest + Testing Library | latest | Client-side unit/component tests |
| lucide-react | — | Icon set |
| Fonts | — | Plus Jakarta Sans (display), Inter (body), IBM Plex Mono (mono/labels) — all Google Fonts, free |

No animation or carousel library — page transitions, swipe gestures, and
the landing page's swipe-carousels are hand-built on CSS transforms/
transitions and the Pointer/Touch Events APIs.

---

## 2. Page Structure & Routes

| Route | Page Component | Auth Required | Notes |
|-------|---------------|--------------|-------|
| `/` | `Home.jsx` | No | Landing page |
| `/login` | `Login.jsx` | No (redirects to /scanner if already logged in) | |
| `/register` | `Register.jsx` | No | |
| `/auth/callback` | `OAuthCallback` (inline in `App.jsx`) | No | Google OAuth redirect target |
| `/scanner` | `Scanner.jsx` | Yes | Shows a one-time onboarding sheet on first visit |
| `/history` | `History.jsx` | Yes | Searchable, verdict-filterable, paginated |
| `/history/:id` | `ScanDetail.jsx` | Yes | Real, shareable per-scan page (not a modal) |
| `/account` | `Account.jsx` | Yes | Profile, avatar, password, theme, sign out |
| `*` | 404 inline (in `App.jsx`) | No | |

Every route renders inside a shared `Shell` (in `App.jsx`): `Navbar` at
top, `Footer` on content pages, `BottomNav` at bottom for signed-in users
on mobile only. `Shell`'s `<main>` remounts on `key={pathname}` to replay
a fade/slide-in animation on every navigation.

---

## 3. Navigation Chrome

Two different navigation patterns depending on auth state and viewport:

- **Logged out, any width:** top `Navbar` with a hamburger menu on mobile.
- **Logged in, desktop (`md:` and up):** top `Navbar` shows Scanner /
  Dashboard / Account links plus a theme toggle, sign-out button, and an
  avatar (photo if set, initial otherwise) linking to `/account`.
- **Logged in, mobile:** top `Navbar` collapses to just the logo —
  `BottomNav` (Dashboard / Scanner / Account tabs, Scanner elevated in the
  center) is the sole navigation, so nothing is duplicated between the two.

---

## 4. Page Layout Notes

### 4.1 Home (`/`)
Phone-mockup-first hero (the mockup leads on mobile, sits beside the copy
on desktop) — visual first, minimal copy, one CTA. Below that: a
horizontally-scrolling "what you can scan" chip marquee, two swipe-
carousels ("How it works", "What you get" — scroll-snap on mobile, a
plain 3-column grid at `md:` and up), a single dashboard-preview card, a
plain CTA, and a one-line footer (logo + copyright — no link-column
sitemap).

### 4.2 Scanner (`/scanner`)
Camera feed (or an uploaded/captured photo) with a live detection
overlay, an upload/take-picture/flip-camera button cluster, a "Scan now"
button, and the `VerdictCard` beside it (below it on mobile). First visit
shows a one-time onboarding `BottomSheet` covering the three steps
(reads from `data/steps.js`, the same content Home's "How it works"
section uses); dismissing it sets a `localStorage` flag so it never
shows again.

### 4.3 History (`/history`)
Three stat cards (avg score, total scans, logged-on-this-page), a weekly
bar chart, a search input + Good/Neutral/Bad/All filter chips, then a
swipeable list — dragging a row left reveals a delete action; a small
always-visible delete icon does the same without a gesture. Tapping a row
navigates to `/history/:id`. Pull-to-refresh at the top of the page.
Delete requires confirming in a `BottomSheet`.

### 4.4 Account (`/account`)
Profile card (avatar with an upload button, inline-editable name, email),
two stat cards, a settings card (theme toggle, and — only for accounts
with a password — a collapsible change-password form), and a sign-out
button.

### 4.5 Login / Register
Centered form (email/password + "Continue with Google"), an illustrated
`AuthAside` panel beside it on desktop, hidden on mobile.

---

## 5. Component Hierarchy

```
App
├── ThemeProvider / AuthProvider / ToastProvider
├── Shell (per route)
│   ├── Navbar
│   │   └── ThemeToggle
│   ├── <main key={pathname}> — route content
│   ├── Footer (most routes; omitted on Scanner/Login/Register/Account/ScanDetail)
│   └── BottomNav (mobile, signed-in only)
│
├── Home
│   ├── PhoneMockup (animated sample-scan preview)
│   ├── Carousel (STEPS) / Carousel (CAPABILITIES)
│   └── Dashboard-preview card (Recharts BarChart + PieChart)
│
├── Login / Register
│   ├── GoogleButton
│   └── AuthAside
│
├── Scanner (Protected)
│   ├── Camera (<video> + <canvas> overlay)
│   ├── Onboarding (BottomSheet, first-visit only)
│   └── VerdictCard (conditional — after a scan)
│       ├── NutritionPanel (food scans)
│       ├── IngredientInfographic (food scans)
│       └── BreakdownChart (non-food scans)
│
├── History (Protected)
│   ├── StatCard × 3
│   ├── InfographicChart (weekly bar chart)
│   ├── search input + verdict filter chips
│   ├── SwipeableRow[] (Pointer Events drag-to-delete)
│   ├── Pagination
│   └── BottomSheet (delete confirmation)
│
├── ScanDetail (Protected)
│   └── VerdictCard (fetched by id)
│
└── Account (Protected)
    ├── AvatarUpload
    ├── EditableName
    ├── StatCard × 2
    └── ChangePassword (collapsible, conditional on hasPassword)
```

---

## 6. State Management

### Global State (AuthContext)
```javascript
const AuthContext = createContext(null)

// Value provided:
{
  user: { _id, name, email, avatar, hasPassword } | null,
  token: string | null,
  login: (accessToken, refreshToken, user) => void,   // persists to localStorage
  logout: () => void,                                  // clears localStorage
  updateUser: (patch) => void,                         // merges a profile patch, no token change
  isAuthenticated: boolean,
  loading: boolean
}
```

### Scanner Page Local State
```javascript
const [isScanning, setIsScanning] = useState(false)
const [scanResult, setScanResult] = useState(null)       // verdict response | null
const [uploadedSrc, setUploadedSrc] = useState(null)      // uploaded photo, if any
const [capturedPreview, setCapturedPreview] = useState(null) // just-taken photo awaiting retake/confirm
// detectedObject/confidence derive from whichever source (live camera vs.
// uploaded/captured image) is active — see useDetection below
```

### History Page Local State
```javascript
const [scans, setScans] = useState([])
const [page, setPage] = useState(1)
const [q, setQ] = useState('')              // debounced 300ms before hitting the API
const [verdictFilter, setVerdictFilter] = useState('')
const [confirmDelete, setConfirmDelete] = useState(null)
```

### useCamera Hook
```javascript
// Returns:
{ videoRef, isReady, error, startCamera, stopCamera, flipCamera }
```

### useDetection Hook
```javascript
// Returns:
{ predictions, isModelLoaded, detectedObject, confidence, detectImage }
// Internally: loads COCO-SSD once, runs detect() on an animation-frame loop
// for the live feed; detectImage() does a one-shot detection for an
// uploaded/captured static image.
```

---

## 7. Design System

### Color System
Colors are CSS custom properties (`--bg`, `--surface`, `--text`, `--brand`,
`--good`, `--bad`, `--neutral`, etc.), consumed in Tailwind as
`rgb(var(--x) / <alpha-value>)` so opacity modifiers work. Light and dark
values are both defined; `data-theme="dark"|"light"` on `<html>` (set
before first paint via an inline script to avoid a flash) picks which set
applies. Brand color is emerald green; verdict colors are green (Good),
red (Bad), amber (Neutral).

### Typography
- **Display/headings:** Plus Jakarta Sans, `font-display font-extrabold`
- **Body:** Inter
- **Mono (labels, stats, timestamps):** IBM Plex Mono

### Verdict Styling
| Verdict | Text/badge | Bounding-box glow | Score bar |
|---------|-----------|-------------------|-----------|
| Good | `text-good` | Green shadow | `rgb(var(--good))` |
| Bad | `text-bad` | Red shadow | `rgb(var(--bad))` |
| Neutral | `text-neutral` | Amber shadow | `rgb(var(--neutral))` |

### Responsive Approach
Mobile-first throughout (Tailwind's default `min-width` breakpoints): base
styles target a phone, `sm:`/`md:`/`lg:` add desktop treatment on top —
not the other way around. `md:` (768px) is where the bottom nav gives
way to the top Navbar's own links, and where the landing page's swipe-
carousels give way to a static grid.

---

## 8. Camera & Detection Overlay Behavior

### Camera Permission Flow
```
User lands on /scanner
  → useCamera hook calls navigator.mediaDevices.getUserMedia({video: true})
  → If granted: stream assigned to videoRef.current.srcObject
  → If denied: show an inline error panel with instructions, and the
    upload/take-picture path remains usable without camera access
```

### Canvas Detection Overlay
```javascript
// utils/canvasOverlay.js — drawOverlay(canvas, predictions, verdict)
// Draws a bounding box + label per prediction; once a verdict exists,
// the box glows in the verdict's color (green/red/amber) via a canvas
// shadow, not a separate "AR" layer.
```

### Frame Capture
```javascript
// utils/canvasOverlay.js — captureFrame(el)
// Accepts a <video> (live) or <img> (uploaded/captured) element, draws it
// to an offscreen canvas at its native size, returns a base64 JPEG.
```

---

## 9. Axios API Service

```javascript
// services/api.js
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

// Inject token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('vw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh once on a 401, then retry the original request
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('vw_refresh')
      if (!refresh) return Promise.reject(err)
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, { refreshToken: refresh })
        localStorage.setItem('vw_token', data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export function getApiError(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response) {
    const d = err.response.data || {}
    if (Array.isArray(d.errors) && d.errors.length) return d.errors[0].msg || fallback
    return d.error || d.message || fallback
  }
  if (err?.request) return 'Can\'t reach the server. Make sure the backend is running, then try again.'
  return fallback
}

export default api
```

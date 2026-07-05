# Frontend Specification Document
## VisionWise — AI-Powered Contextual Object Scanner & Recommender
**Version:** 1.0  
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)  
**Date:** June 2026

---

## 1. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| React Router DOM | 6 | Client-side routing |
| Tailwind CSS | 3 | Styling |
| Recharts | 2 | Analytics charts |
| Axios | 1 | HTTP client |
| TensorFlow.js | 4 | In-browser object detection |
| @tensorflow-models/coco-ssd | 2 | Pre-trained detection model |

---

## 2. Page Structure & Routes

| Route | Page Component | Auth Required |
|-------|---------------|--------------|
| `/` | `Home.jsx` | No |
| `/login` | `Login.jsx` | No (redirect to /scanner if already logged in) |
| `/register` | `Register.jsx` | No |
| `/scanner` | `Scanner.jsx` | Yes |
| `/history` | `History.jsx` | Yes |
| `*` | 404 inline | No |

---

## 3. Page Wireframes

### 3.1 Home Page (`/`)
```
┌────────────────────────────────────────────────────┐
│  NAVBAR: [VisionWise logo]            [Login] [Register] │
├────────────────────────────────────────────────────┤
│                                                    │
│         VisionWise                                 │
│   Scan. Understand. Act.                           │
│                                                    │
│   [  Start Scanning  ]   ← CTA button             │
│                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  🥗 Health  │  │  ♻️ Eco     │  │  💼 Work  │  │
│  │  Scan food  │  │  Go green   │  │  Stay focused│
│  └─────────────┘  └─────────────┘  └───────────┘  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │  How it works:                              │  │
│  │  1. Choose a context                        │  │
│  │  2. Point your camera                       │  │
│  │  3. Get your verdict                        │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### 3.2 Scanner Page (`/scanner`)
```
┌────────────────────────────────────────────────────┐
│  NAVBAR: [← Back] VisionWise          [Profile]   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Context: [Health ▼] [Eco] [Productivity] [Finance]│
│                         ← pill selector            │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  │         CAMERA FEED                         │  │
│  │      (live video + canvas overlay)          │  │
│  │                                              │  │
│  │   [  bottle  ]  ← floating detection chip   │  │
│  │                                              │  │
│  │  ┌────────────────────────────────────────┐ │  │
│  │  │   GREEN glow around bottle object      │ │  │
│  │  └────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│              [  🔍 Scan Now  ]                     │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  VerdictCard (appears after scan)            │  │
│  │                                              │  │
│  │  ✅ GOOD    Score: 82/100                   │  │
│  │  "Stainless steel water bottle reduces       │  │
│  │   single-use plastic waste significantly."  │  │
│  │                                              │  │
│  │  Tips:                                       │  │
│  │  • Clean weekly to prevent mold             │  │
│  │  • BPA-free materials are safer             │  │
│  │  • Choose 500ml for daily carry             │  │
│  │                                              │  │
│  │  [📊 View in Chart]  [🔄 Scan Again]        │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### 3.3 History Page (`/history`)
```
┌────────────────────────────────────────────────────┐
│  NAVBAR: [VisionWise]           [Scanner] [Profile]│
├────────────────────────────────────────────────────┤
│                                                    │
│  Scan History          Filter: [All ▼] [Context▼] │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ [♻️] bottle   Eco    ✅ Good  82   Jun 22   🗑│  │
│  ├──────────────────────────────────────────────┤  │
│  │ [🥗] chips    Health ❌ Bad   23   Jun 21   🗑│  │
│  ├──────────────────────────────────────────────┤  │
│  │ [💼] phone   Work   ❌ Bad   18   Jun 21   🗑│  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [← Prev]  Page 1 of 3  [Next →]                  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Weekly Score: 47/100                        │  │
│  │  [Bar chart: scans per day for last 7 days]  │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### 3.4 Login Page (`/login`)
```
┌────────────────────────────────────────────────────┐
│                  VisionWise                        │
│                                                    │
│           ┌──────────────────────────┐             │
│           │  Email                   │             │
│           │  Password                │             │
│           │  [     Login     ]       │             │
│           │                          │             │
│           │  ── or ──                │             │
│           │  [G Continue with Google]│             │
│           │                          │             │
│           │  Don't have an account?  │             │
│           │  [Register here]         │             │
│           └──────────────────────────┘             │
└────────────────────────────────────────────────────┘
```

---

## 4. Component Hierarchy

```
App
├── AuthContext.Provider
├── Navbar
│   ├── Logo
│   ├── NavLinks (conditional: guest vs logged-in)
│   └── UserAvatar (dropdown: Profile, Logout)
│
├── Routes
│   ├── Home
│   │   ├── HeroSection (tagline + CTA)
│   │   └── ContextFeatureCards (3 cards)
│   │
│   ├── Login
│   │   ├── LoginForm (email + password)
│   │   └── GoogleOAuthButton
│   │
│   ├── Register
│   │   └── RegisterForm (name + email + password)
│   │
│   ├── Scanner (Protected)
│   │   ├── ContextSelector (pill buttons: Health/Eco/Productivity/Finance)
│   │   ├── Camera
│   │   │   ├── <video> (WebRTC stream)
│   │   │   ├── <canvas> (AR overlay)
│   │   │   └── DetectionChip (floating label: "bottle 94%")
│   │   ├── ScanButton
│   │   └── VerdictCard (conditional — appears after scan)
│   │       ├── VerdictBadge (Good/Bad/Neutral)
│   │       ├── ScoreBar (0–100)
│   │       ├── ReasonText
│   │       └── TipsList (3 items)
│   │
│   └── History (Protected)
│       ├── FilterBar (context filter + date sort)
│       ├── ScanList
│       │   └── ScanItem[] (object, context, verdict, score, date, delete btn)
│       ├── Pagination
│       └── Dashboard
│           ├── WeeklyScoreCard
│           └── InfographicChart (Recharts BarChart)
```

---

## 5. State Management

### Global State (AuthContext)
```javascript
const AuthContext = createContext()

// Value provided:
{
  user: { _id, name, email, avatar } | null,
  token: string | null,
  login: (token, user) => void,  // saves to localStorage
  logout: () => void,             // clears localStorage
  isAuthenticated: boolean
}
```

### Scanner Page Local State
```javascript
const [context, setContext] = useState('health')
const [detectedObject, setDetectedObject] = useState(null)  // e.g. "bottle"
const [isScanning, setIsScanning] = useState(false)
const [scanResult, setScanResult] = useState(null)  // {verdict, score, reason, tips}
const [cameraError, setCameraError] = useState(null)
```

### useCamera Hook
```javascript
// Returns:
{ videoRef, isReady, error, flipCamera }
```

### useDetection Hook
```javascript
// Returns:
{ detectedObject, confidence, isModelLoaded }
// Internally: loads COCO-SSD once, runs detect() on animation frame
```

---

## 6. Design System

### Color Palette (Tailwind custom config)
```javascript
// tailwind.config.js
colors: {
  primary: '#6366F1',     // Indigo — brand color
  good: '#22C55E',        // Green — Good verdict
  bad: '#EF4444',         // Red — Bad verdict
  neutral: '#F59E0B',     // Amber — Neutral verdict
  surface: '#0F172A',     // Dark bg (dark mode default)
  card: '#1E293B',        // Card background
  text: '#F1F5F9',        // Primary text
  muted: '#94A3B8',       // Secondary text
}
```

### Typography
- **Font:** Inter (Google Fonts — free)
- **Headings:** `font-bold text-3xl` (h1), `text-xl` (h2)
- **Body:** `text-base text-text`
- **Muted:** `text-sm text-muted`

### Verdict Styling
| Verdict | Badge color | Canvas glow | Score bar color |
|---------|------------|-------------|----------------|
| Good | `bg-good text-white` | Green (#22C55E) rgba shadow | `bg-good` |
| Bad | `bg-bad text-white` | Red (#EF4444) rgba shadow | `bg-bad` |
| Neutral | `bg-neutral text-black` | Amber (#F59E0B) rgba shadow | `bg-neutral` |

### Responsive Breakpoints (Tailwind defaults)
| Breakpoint | Width | Layout change |
|-----------|-------|--------------|
| `sm` | 640px | Stack navigation items |
| `md` | 768px | Side-by-side camera + verdict |
| `lg` | 1024px | Full dashboard layout |

---

## 7. Camera & AR Overlay Behavior

### Camera Permission Flow
```
User lands on /scanner
  → useCamera hook calls navigator.mediaDevices.getUserMedia({video: true})
  → If granted: stream assigned to videoRef.current.srcObject
  → If denied: show banner "Camera access needed. Click here for instructions."
```

### Canvas AR Glow
```javascript
// utils/canvasOverlay.js
export function drawOverlay(ctx, predictions, verdict) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  predictions.forEach(pred => {
    const [x, y, w, h] = pred.bbox
    const color = verdict === 'Good' ? '#22C55E'
                : verdict === 'Bad'  ? '#EF4444'
                : '#F59E0B'

    // Glow effect using shadow
    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, w, h)
    ctx.shadowBlur = 0

    // Label chip
    ctx.fillStyle = color
    ctx.fillRect(x, y - 24, w, 24)
    ctx.fillStyle = '#fff'
    ctx.font = '14px Inter'
    ctx.fillText(`${pred.class} ${Math.round(pred.score * 100)}%`, x + 4, y - 6)
  })
}
```

---

## 8. Axios API Service

```javascript
// services/api.js
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Inject token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('vw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('vw_refresh')
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refreshToken: refresh })
      localStorage.setItem('vw_token', data.token)
      err.config.headers.Authorization = `Bearer ${data.token}`
      return axios(err.config)
    }
    return Promise.reject(err)
  }
)

export default api
```

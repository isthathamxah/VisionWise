# Security & Access Control Document
## VisionWise — AI-Powered Contextual Object Scanner & Recommender
**Version:** 1.0  
**Author:** Muhammad Taha (4618-FOC/BSCS/F22)  
**Date:** June 2026

---

## 1. Authentication Model

### 1.1 Dual Authentication Strategy

VisionWise supports two auth methods, both converging to the same JWT-based session:

```
Method A: Email/Password
  User → POST /api/auth/login {email, password}
  Server → bcrypt.compare(password, user.hashedPassword)
  Server → sign JWT → return {accessToken, refreshToken}

Method B: Google OAuth 2.0
  User → GET /api/auth/google
  Google → OAuth consent → callback to /api/auth/google/callback
  Passport.js → findOrCreate user in MongoDB
  Server → sign JWT → redirect to client with token in query param
```

### 1.2 JWT Token Design

| Token | Expiry | Storage | Purpose |
|-------|--------|---------|---------|
| Access Token | 15 minutes | `localStorage` (client) | API authentication |
| Refresh Token | 7 days | `localStorage` (client) | Obtain new access token |

**Access Token Payload:**
```json
{
  "userId": "ObjectId string",
  "email": "user@example.com",
  "iat": 1700000000,
  "exp": 1700000900
}
```

**Token Refresh Flow:**
```
Client detects 401 response
  → POST /api/auth/refresh {refreshToken}
  → Server verifies refresh token signature + expiry
  → Server issues new access token
  → Client retries original request
```
*Axios interceptor in `services/api.js` handles this automatically.*

---

## 2. Password Security

```javascript
// Registration — hash before saving
const saltRounds = 12
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)

// Login — compare
const isMatch = await bcrypt.compare(plainPassword, user.password)
```

**Password Rules (enforced via express-validator):**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Maximum 64 characters

**Google OAuth users:** `password` field is stored as `null` in MongoDB. They cannot use email/password login unless they set a password separately.

---

## 3. API Security

### 3.1 Authentication Middleware
```javascript
// middleware/authMiddleware.js
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] // Bearer <token>
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.userId).select('-password')
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

**Protected routes:** `/api/scan`, `/api/history/*`  
**Public routes:** `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, `/api/auth/google/callback`, `/api/auth/refresh`

### 3.2 Rate Limiting
```javascript
// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit'

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
})

export const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 scans per minute per IP
  message: { error: 'Scan rate limit exceeded.' }
})
```

### 3.3 HTTP Security Headers (Helmet)
```javascript
app.use(helmet()) // Sets: X-Content-Type-Options, X-Frame-Options,
                  // Content-Security-Policy, Strict-Transport-Security, etc.
```

### 3.4 CORS Configuration
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL, // e.g. https://visionwise.vercel.app
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
```

---

## 4. Input Validation & Sanitization

All incoming request bodies are validated with `express-validator`:

```javascript
// routes/auth.js — registration example
body('email').isEmail().normalizeEmail(),
body('password').isLength({ min: 8, max: 64 }).matches(/[A-Z]/).matches(/[0-9]/),
body('name').trim().isLength({ min: 2, max: 50 }).escape()

// routes/scan.js — no context param since the 4-context system was
// removed (see PRD.md §0); Gemini decides food/non-food from the image itself
body('objectLabel').trim().isLength({ max: 100 }).escape(),
body('imageBase64').isString().isLength({ max: 200000 }) // ~150KB max

// routes/auth.js — profile/password/avatar endpoints added post-MVP
body('name').trim().isLength({ min: 2, max: 50 }).escape()               // PATCH /auth/profile
body('newPassword').isLength({ min: 8, max: 64 }).matches(/[A-Z]/).matches(/[0-9]/) // PATCH /auth/password
// PATCH /auth/avatar validates a data:image/(png|jpeg|webp);base64, prefix
// and a 300KB length cap server-side, on top of a client-side resize to 256px
```

**MongoDB Injection Prevention:**
- Mongoose strict schemas reject unknown fields automatically
- All queries use parameterized Mongoose methods (`.findById()`, `.find()`) — no raw `$where` or string interpolation

---

## 5. API Key Protection

| Secret | Location | Access |
|--------|----------|--------|
| `GEMINI_API_KEY` | Server `.env` only | Never sent to client |
| `JWT_SECRET` | Server `.env` only | Never sent to client |
| `MONGODB_URI` | Server `.env` only | Never sent to client |
| `GOOGLE_CLIENT_SECRET` | Server `.env` only | Never sent to client |
| `VITE_API_URL` | Client `.env` (Vite) | Safe — only the API URL, no secrets |

`.gitignore` must include:
```
server/.env
client/.env
node_modules/
```

---

## 6. Data Privacy

- **Scan images:** By default, raw base64 images are NOT stored in MongoDB. Only the detected label, verdict, score, reason, and tips are stored.
- **User passwords:** Stored as bcrypt hashes only. Never logged or returned in API responses.
- **Scan history:** Visible only to the authenticated user who created it. All history routes filter by `userId` from the JWT.
- **Google profile data:** Only `googleId`, `name`, `email`, and `avatar` are stored from Google's OAuth response.

---

## 7. HTTPS Enforcement

- **Render:** Provides free TLS certificates automatically for all deployed services
- **Vercel:** Provides free TLS certificates automatically
- **Development:** HTTP is acceptable on localhost

---

## 8. Access Control Matrix

| Resource | Guest | Registered User |
|----------|-------|----------------|
| Landing page | Read | Read |
| Register/Login | Write | — |
| Scanner | — | Full access |
| Own scan history | — | Read/Delete |
| Other users' history | — | No access |
| Analytics dashboard | — | Own data only |
| Context rules (read) | — | Read |
| Any admin endpoint | — | No access |

---

## 9. Security Checklist (Pre-deployment)

- [ ] All `.env` files are in `.gitignore`
- [ ] No API keys hardcoded anywhere in source code
- [ ] Helmet middleware applied globally
- [ ] CORS restricted to production client URL
- [ ] Rate limiting on all routes
- [ ] Input validation on all POST bodies
- [ ] JWT verification on all protected routes
- [ ] MongoDB URI uses non-root database user with least privilege
- [ ] Google OAuth callback URL updated to production URL
- [ ] Render environment variables set (not `.env` file on server)
- [ ] Vercel environment variables set
- [ ] No `console.log` statements leaking sensitive data in production

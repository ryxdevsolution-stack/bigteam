# BigTreat — MLM Community Platform

> Previously known as **BigTeam**. A multi-level commission platform with content feed, advertisement system, admin-gated reactivation workflow, and full activation history.

A production-grade platform combining a TikTok/Instagram-style media feed with an MLM commission engine. Users activate via package purchase, earn commissions through their downline, deactivate at the 2/2 commission cap, and submit reactivation requests to an admin approval queue.

---

## Why This README Reads As Problems → Solutions

This codebase has been iterated on heavily. Rather than list features, this README documents the **problems each system actually solves** — so a new engineer can understand the *why*, not just the *what*. Each section follows:

> **Problem:** what was broken or risky
> **Solution:** what was built and why

---

## 🧩 Core Domain Problems Solved

### 1. Unsupervised Reactivation → Admin Approval Workflow

**Problem.** Users hitting the 2/2 commission cap could instantly reactivate by clicking a button. No admin oversight, no audit trail, no way to stop bad actors from cycling through positions to game the chain.

**Solution.** A dedicated `activation_requests` table + 7 endpoints under `/api/activation-requests/*`. Reactivation now goes through four states (`pending → approved | rejected | cancelled`) with:
- DB-level unique partial index — **one pending request per user**, enforced at the database layer
- Row-level locking at approval time to prevent double-credit race conditions
- Balance re-check at approval (not just at submission) — balance can change while pending
- Rejection requires a reason string returned to the user

Code: [`backend/routes/activation_requests.py`](backend/routes/activation_requests.py), [`backend/services/activation_request_service.py`](backend/services/activation_request_service.py), [`frontend/src/pages/admin/ActivationRequests.tsx`](frontend/src/pages/admin/ActivationRequests.tsx).

### 2. Lost Activation History → JSONB Timeline Per User

**Problem.** When a user deactivated and reactivated, their previous position, package, earnings, and dates were overwritten. No way to audit how many cycles a user had been through or how much they'd earned in lifetime.

**Solution.** Added `activation_history JSONB` column to `users` with three **GIN indexes** for fast querying. Each activation snapshots package, position, dates, commissions earned. UI surfaces this as a pulsing-dot timeline in [`ActivationHistoryTimeline.tsx`](frontend/src/components/user/ActivationHistoryTimeline.tsx) — current activation pulses green, history shows as gray.

### 3. Profile Page Hammering the API → Fixed `useEffect` Dependencies

**Problem.** The profile page was firing **hundreds of API calls per second**. Browser laggy, CPU spiking, backend DB queries flooding.

**Root cause.** `useEffect` dependency array included `fetchUserProfile` and `fetchDashboardStats` — both functions are recreated each render, so the effect re-ran every render forever.

**Solution.** Dependency array now contains only `[user.id]` — effect runs once per user-change, not once per render. Result: hundreds of calls/sec → exactly one on mount.

Fix: [`frontend/src/pages/user/Profile.tsx:82-88`](frontend/src/pages/user/Profile.tsx#L82-L88).

### 4. Broken Route Handler Signatures → `get_current_user_id()` Pattern

**Problem.** Every endpoint under `/api/activation-requests/*` was throwing `TypeError: missing 1 required positional argument: 'current_user_id'`. The `@token_required` decorator never passed `current_user_id` as a kwarg, but handlers expected it.

**Solution.** All seven handlers refactored to call `get_current_user_id()` inside the function body. Decorator now only validates the token; the handler reads the identity from request context. This pattern is now consistent across the codebase.

### 5. Multi-Worker Token Logout Doing Nothing → Redis Blacklist

**Problem.** Production runs **8 gunicorn workers × 8 threads = 64 concurrent request handlers**. An in-memory token blacklist (the Flask default) only blacklists in *one* worker — log out on worker 3, and worker 5 still accepts the token. Effectively no logout in production.

**Solution.** Redis-backed token blacklist shared across all workers (see [`render.yaml`](render.yaml) — `REDIS_URL` is required for multi-worker deployment). Logout is now consistent regardless of which worker handles the next request.

### 6. CORS Wildcard + Missing Security Headers → Hardened Defaults

**Problem.** Default Flask exposes the app to clickjacking, MIME sniffing, XSS, mixed-content, and uncontrolled origins.

**Solution.** [`backend/app.py:55-75`](backend/app.py#L55-L75) injects security headers on every response:
- `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (prod only)
- `Permissions-Policy` blocks camera, mic, geolocation, payment, USB, sensors

CORS is environment-aware: production uses a strict `FRONTEND_URL` allowlist (no wildcards), dev allows `localhost:3000/3001/5173`.

### 7. Unbounded JSON Body → 16KB Cap

**Problem.** A malicious client could POST a 100MB JSON body and exhaust memory.

**Solution.** `MAX_CONTENT_LENGTH = 16KB` for JSON. File uploads are routed through their own handlers with higher, validated limits.

### 8. Brute-Force on Auth → Flask-Limiter on Sensitive Routes

**Problem.** Login and other sensitive endpoints had no rate limiting — vulnerable to credential stuffing.

**Solution.** `init_limiter(app)` applies rate limits to auth and admin endpoints. See [`backend/utils/rate_limiter.py`](backend/utils/rate_limiter.py).

### 9. DB Pool Choking at Scale → Tuned for 1000+ Concurrent

**Problem.** Default SQLAlchemy pool (5 connections) collapses under real load. Symptom: connection-pool-exhausted errors during traffic spikes.

**Solution.** Production pool sized to `min=10, max=100`. Combined with `gunicorn --workers 8 --threads 8 --keep-alive 5 --max-requests 1000 --max-requests-jitter 50 --preload`, the deployment supports **~300–500 req/sec** sustained. `max-requests` recycles workers periodically to prevent memory leaks.

### 10. Jarring Dark/Light Toggle → AnimatedThemeToggler

**Problem.** Instant theme switch is visually harsh and looks unpolished.

**Solution.** Built `AnimatedThemeToggler` using the **View Transitions API** for a circular reveal animation that radiates from the toggle button. Graceful fallback for browsers without support.

---

## 🏗️ Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│      Frontend       │     │     Backend API     │     │      Database       │
│   React 18 + TS     │◄───►│       Flask         │◄───►│  Supabase Postgres  │
│   Redux Toolkit     │     │   Port 8000         │     │   (pooler :6543)    │
│   Tailwind + Framer │     │   8 workers × 8 thr │     │   JSONB + GIN idx   │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
           │                          │                          │
           │                ┌─────────────────────┐              │
           └───────────────►│   Redis (required)  │◄─────────────┘
                            │  Token blacklist    │
                            │  Rate limit store   │
                            └─────────────────────┘
```

**Why these choices:**
- **Flask, not FastAPI** — chosen for blueprint-based modularity; each domain (auth, team, packages, activation requests) is its own blueprint.
- **Supabase (Postgres) over self-hosted** — managed connection pooler, built-in storage for media, free SSL.
- **Redis is non-optional in production** — multi-worker deployments cannot share in-memory state.

---

## 🗂️ Project Structure

```
bigteam/
├── backend/                              # Flask backend (port 8000)
│   ├── app.py                            # Security headers, CORS, blueprints
│   ├── routes/
│   │   ├── auth.py                       # JWT login/logout/refresh
│   │   ├── user.py                       # Profile, dashboard stats
│   │   ├── team.py                       # MLM tree, downline, commissions
│   │   ├── package.py                    # Activation packages
│   │   ├── activation_history.py         # Lifetime activation timeline
│   │   ├── activation_requests.py        # Admin approval queue
│   │   ├── post.py, feed.py              # Media feed
│   │   ├── advertisement.py              # Ad scheduling
│   │   └── meetings.py                   # Meeting management
│   ├── services/                         # Business logic
│   ├── models/                           # SQLAlchemy models
│   ├── utils/rate_limiter.py             # Flask-Limiter setup
│   └── migrations/                       # *_migration.py scripts
├── frontend/                             # React + Vite (port 3000)
│   └── src/
│       ├── pages/
│       │   ├── admin/                    # 9 admin screens
│       │   │   └── ActivationRequests.tsx  # Approval queue UI
│       │   └── user/                     # 8 user screens
│       ├── components/{admin,user,shared,ui,dashboard,auth}
│       ├── services/                     # Typed API client per domain
│       ├── store/                        # Redux Toolkit + RTK Query
│       ├── contexts/                     # React contexts
│       └── hooks/                        # Custom hooks
├── infrastructure/
│   ├── nginx/                            # Reverse proxy config
│   └── systemd/                          # Service unit files
├── render.yaml                           # Render.com deployment
└── deploy.sh                             # Deployment helper
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+ (3.13.4 in production)
- Redis (local or remote)
- Supabase project

### One-Command Dev

```bash
npm run dev
```

Starts:
- Backend → http://localhost:8000
- Frontend → http://localhost:3000

### First-Time Setup

```bash
# 1. Install everything
npm run install:all

# 2. Backend .env
cat > backend/.env <<EOF
FLASK_ENV=development
DB_URL=postgresql://...:6543/postgres   # Supabase pooler port
DB_HOST=...
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.xxxxx
DB_PASS=...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJ...
JWT_SECRET_KEY=<generate-with-openssl-rand>
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
DB_POOL_MIN=2
DB_POOL_MAX=10
EOF

# 3. Frontend .env
cat > frontend/.env <<EOF
VITE_API_BASE_URL=http://localhost:8000
EOF

# 4. Local Redis (if not using cloud)
docker run -d -p 6379:6379 redis:alpine

# 5. Run migrations
cd backend && python run_migration.py
```

---

## 📡 API Surface

| Domain | Base path | Purpose |
|---|---|---|
| Auth | `/auth/*` | JWT login, logout, refresh |
| Users | `/api/user/*` | Profile, dashboard stats |
| Team | `/api/team/*` | MLM tree, purchase, downline |
| Packages | `/api/packages/*` | List + manage activation packages |
| Posts | `/api/posts/*` | Media feed, interactions |
| Ads | `/api/ads/*` | Advertisement scheduling |
| Activation History | `/api/activation-history/*` | Lifetime timeline + stats |
| **Activation Requests** | `/api/activation-requests/*` | **Admin-gated reactivation** |
| Meetings | `/api/meetings/*` | Meeting management |

### Activation Request Endpoints (the workflow gate)

```
POST  /api/activation-requests/submit               # User submits
GET   /api/activation-requests/my-request           # User checks pending
POST  /api/activation-requests/:id/cancel           # User cancels
GET   /api/activation-requests/pending              # Admin lists
GET   /api/activation-requests/pending-count        # Admin badge count
POST  /api/activation-requests/:id/approve          # Admin approves → activates
POST  /api/activation-requests/:id/reject           # Admin rejects with reason
```

---

## 🔐 Security Posture

| Concern | Mitigation | Where |
|---|---|---|
| Clickjacking | `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'` | [`backend/app.py`](backend/app.py) |
| MIME sniffing | `X-Content-Type-Options: nosniff` | [`backend/app.py`](backend/app.py) |
| XSS | CSP `default-src 'self'`, axios escaping, no raw HTML injection in components | global |
| Brute-force auth | Flask-Limiter rate limits | [`backend/utils/rate_limiter.py`](backend/utils/rate_limiter.py) |
| SQL injection | Parameterized queries / ORM only | services |
| Logout-bypass under multi-worker | Redis-backed JWT blacklist | [`render.yaml`](render.yaml) |
| Unbounded request body | `MAX_CONTENT_LENGTH = 16KB` for JSON | [`backend/app.py`](backend/app.py) |
| HTTPS downgrade | HSTS preload (`max-age=31536000`) in production | [`backend/app.py`](backend/app.py) |
| Feature abuse (camera/mic/geo) | `Permissions-Policy` blocks them all | [`backend/app.py`](backend/app.py) |
| Race conditions on approval | Row-level locking + balance re-check at approval time | activation_request_service |
| Wildcard CORS | Strict `FRONTEND_URL` allowlist in prod | [`backend/app.py`](backend/app.py) |

---

## 🎨 User States (Profile Status Card)

The Profile page shows one of four cards depending on user state. This was added so users always know *exactly* what to do next.

| State | Card | Button | Why |
|---|---|---|---|
| **Active** (0–1 commissions) | 🟢 Green — "Your Account is Active!" | None | Already earning |
| **Inactive** (first-time or <2 commissions) | 🟠 Orange — "Account Inactive" | "Activate Now" → instant | No prior cycle, no approval needed |
| **Needs Reactivation** (2/2, no pending request) | 🟣 Purple — "Ready to Reactivate!" | "Reactivate Now" → submits request | Hit cycle cap, must request |
| **Request Pending** (2/2, has pending request) | 🟡 Yellow — "Reactivation Request Pending" | None (pulsing clock icon) | Waiting on admin |

---

## 🐳 Deployment (Render.com)

Production config lives in [`render.yaml`](render.yaml). Key choices:

```yaml
startCommand: >
  gunicorn --bind 0.0.0.0:$PORT
    --workers 8 --threads 8                # 64 concurrent handlers
    --timeout 60 --keep-alive 5
    --max-requests 1000 --max-requests-jitter 50   # recycle to avoid leaks
    --preload                              # faster startup + shared memory
    app:app
```

- **8 workers × 8 threads** — fits Render's standard plan, ~300–500 req/sec sustained
- **`--max-requests 1000`** — every worker recycles after 1000 requests, jitter prevents thundering herd
- **`--preload`** — share read-only memory between workers, faster cold start
- **Redis is provisioned alongside** — `bigteam-redis` (starter plan, 25MB)

Health check: `GET /health` → `{"status": "healthy"}`

---

## 🧪 Testing & Quality Gates

```bash
# Type check (frontend)
npm run typecheck

# Lint (frontend)
npm run lint:frontend

# Backend smoke verification
cd backend && python verify_system.py
cd backend && python simple_verify.py
```

---

## 📈 What's Next

- [ ] Email notifications for approve/reject events
- [ ] User-visible rejection reason on profile
- [ ] Cancel-pending-request from UI (backend exists)
- [ ] Pending count badge in admin nav
- [ ] PDF export of activation history

---

## 📚 Related Docs

- [`ADMIN_APPROVAL_IMPLEMENTATION.md`](ADMIN_APPROVAL_IMPLEMENTATION.md) — full implementation report for the approval workflow
- [`BUGS_FIXED.md`](BUGS_FIXED.md) — Profile loop + route signature fixes
- [`DEEP_VERIFICATION_REPORT.md`](DEEP_VERIFICATION_REPORT.md) — component/integration audit
- [`backend/ACTIVATION_HISTORY_README.md`](backend/ACTIVATION_HISTORY_README.md) — JSONB history schema
- [`UI_LOCATION_GUIDE.md`](UI_LOCATION_GUIDE.md) — where features live in the UI

---

**BigTreat** — built around the principle that *every system in this repo exists because something specific broke or was at risk*. Read the section that matches your concern.

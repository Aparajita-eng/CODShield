# CODShield

> COD Trust Infrastructure for E-Commerce

CODShield is a full-stack platform that evaluates checkout intent before every cash-on-delivery shipment. It verifies buyer identities, scores regional postal risk zones, detects repeat-refusal fraud, and protects merchant dispatch margins through a programmatic API layer.

---

## Project Structure

```
CODShield/
├── backend/              # NestJS API server (port 5001)
│   ├── src/
│   │   ├── modules/     # Feature modules (auth, merchant, order, etc.)
│   │   ├── lib/         # Shared utilities (auth, db, mailer)
│   │   └── main.ts      # Application entry point
│   ├── prisma/          # Database schema and migrations
│   └── .env.example     # Environment variable template
├── frontend/             # Next.js web application (port 3000)
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # React components
│   │   └── lib/         # Shared utilities (auth, API client)
│   ├── design-system/   # Tailwind design system reference
│   └── .env.example     # Environment variable template
├── render.yaml          # Render deployment configuration
└── package.json         # Root package with workspace scripts
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted: Supabase, Neon, Railway)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Aparajita-eng/CODShield.git
cd CODShield
npm install          # Installs all dependencies for backend + frontend
```

### 2. Configure Environment Variables

```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL, DIRECT_URL, SMS keys, etc.

# Frontend environment
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with NEXT_PUBLIC_BACKEND_URL
```

**Required Backend Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection for Prisma
- `SESSION_SECRET` - Secret for session encryption
- `JWT_SECRET` - Secret for JWT signing
- `REFRESH_SECRET` - Secret for refresh tokens
- `FRONTEND_URL` - Frontend URL for CORS (e.g., http://localhost:3000)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- `TWOFACTOR_API_KEY` - 2Factor.in API key for OTP

**Required Frontend Environment Variables:**
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (e.g., http://localhost:5001)

### 3. Set Up Database

```bash
cd backend
npx prisma generate          # Generate Prisma client
npx prisma migrate dev        # Run database migrations
npm run prisma:seed           # Seed test data (optional)
cd ..
```

### 4. Run Development Servers

```bash
# Run both backend and frontend together
npm run dev

# Or run separately
npm run dev:backend    # Backend on http://localhost:5001
npm run dev:frontend   # Frontend on http://localhost:3000
```

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 5001 | NestJS REST API — auth, risk engine, dashboard, merchant API |
| Frontend | 3000 | Next.js app — landing page, dashboard, sandbox console |

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Email/password login, OTP-based login, session management with refresh tokens |
| **OTP Verification** | Confirms buyer intent at checkout via SMS (2Factor.in / Twilio) |
| **Trust Graph** | Cross-merchant identity matching and delivery cluster analysis |
| **Pincode Intelligence** | Regional RTO risk weighting for 6-digit Indian postal codes |
| **Fraud History** | Phone number blacklist across repeat-refusal incidents |
| **Dynamic Risk Engine** | Weighted scoring (0–100) combining pincode, order value, and phone history |
| **Merchant Scoring** | Compliance tier tracking based on claim ratios |
| **Claims & Payouts** | Automated 4-step insurance claim workflow for failed deliveries |
| **Health Monitoring** | Comprehensive health check with database connectivity status |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js · NestJS · TypeScript · Prisma ORM |
| Database | PostgreSQL |
| Frontend | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion 12 |
| SMS | 2Factor.in (primary) · Twilio (fallback) |
| Email | Nodemailer |
| Deployment | Render |

---

## Backend API Endpoints

### Authentication
```
POST /api/auth/login              # Email/password login
POST /api/auth/register           # User registration
POST /api/auth/logout             # Logout
POST /api/auth/refresh           # Refresh session token
POST /api/auth/forgot-password    # Request password reset
POST /api/auth/reset-password     # Reset password with token
```

### OTP
```
POST /api/otp/send                # Send OTP to phone number
POST /api/otp/verify              # Verify OTP code
POST /api/auth/otp-session        # Create session with verified OTP
```

### Dashboard
```
GET  /api/dashboard/data          # Fetch merchant metrics + orders
POST /api/dashboard/claim-submit  # Register a new protection claim
```

### Sandbox (no auth required)
```
POST /api/sandbox/trust-graph     # Evaluate buyer trust graph
POST /api/sandbox/risk-engine     # Run full risk assessment
POST /api/sandbox/pincode         # Check pincode risk zone
POST /api/sandbox/fraud-history   # Check phone blacklist history
POST /api/sandbox/merchant-ratio  # Evaluate merchant claim ratio
POST /api/sandbox/claim           # Simulate claim processing steps
```

### Public API (requires `x-api-key` header)
```
POST /api/v1/orders/risk-check    # Evaluate order risk + save log
```

### Health
```
GET  /health                       # Server health status with database connectivity
```

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/login` | Login page with password and OTP options |
| `/register` | User registration page |
| `/dashboard` | Merchant dashboard — metrics, order logs, claim management |
| `/sandbox` | Sandbox console — test all risk engine modules interactively |

---

## Scripts

### Root Scripts
```bash
npm run dev           # Start both backend and frontend
npm run dev:backend   # Start backend only
npm run dev:frontend  # Start frontend only
```

### Backend Scripts
```bash
npm run dev           # Start dev server with hot reload
npm run build         # Compile TypeScript to dist/
npm run start         # Run compiled production build
npm run prisma:generate  # Regenerate Prisma Client
npm run prisma:seed       # Seed database with test data
```

### Frontend Scripts
```bash
npm run dev           # Start Next.js dev server
npm run build         # Build optimized production bundle
npm run start         # Start production server
npm run lint          # Run ESLint
```

---

## Deployment

### Render Deployment

The project includes `render.yaml` for automated deployment to Render.

**Backend Service (codshield-backend):**
- Runtime: Node.js
- Build: `npm install --include=dev && npx prisma generate && npm run build`
- Start: `node dist/main.js`
- Port: 10000
- Health Check: `/health`

**Frontend Service (codshield-frontend):**
- Runtime: Node.js
- Build: `npm install --include=dev && npm run build`
- Start: `npm run start`
- Environment: `NEXT_PUBLIC_BACKEND_URL`, `BACKEND_URL`, `SESSION_SECRET`

**Required Environment Variables in Render Dashboard:**
- Backend: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `JWT_SECRET`, `REFRESH_SECRET`, SMTP credentials, SMS API keys
- Frontend: `SESSION_SECRET`

---

## Development Notes

### Backend Architecture
- NestJS modular architecture with feature-based organization
- Prisma ORM for database operations with PostgreSQL
- JWT-based authentication with refresh tokens
- Global guards for authentication, roles, and rate limiting
- Structured logging for production debugging
- Health check endpoint with database connectivity validation

### Frontend Architecture
- Next.js 16 App Router for server-side rendering
- Centralized API client with retry logic and error handling
- Cold start protection for backend health checks
- Middleware-based authentication with automatic token refresh
- Cookie-based session management with httpOnly and secure flags

### Authentication Flow
1. User submits login/registration credentials
2. Frontend API route proxies request to backend
3. Backend validates credentials and issues JWT tokens
4. Frontend sets httpOnly cookies for session and refresh tokens
5. Middleware validates session on protected routes
6. Automatic token refresh when session expires

---

## Troubleshooting

### Backend Issues
- **Database connection errors**: Verify `DATABASE_URL` and `DIRECT_URL` are correct
- **CORS errors**: Ensure `FRONTEND_URL` matches your frontend domain
- **OTP not sending**: Check `TWOFACTOR_API_KEY` and SMS provider credentials
- **Health check failing**: Check database connectivity and environment variables

### Frontend Issues
- **"Can't reach backend" error**: Check `NEXT_PUBLIC_BACKEND_URL` and backend health
- **Login not working**: Verify backend is running and CORS is configured
- **Session not persisting**: Check cookie settings and browser privacy settings
- **Middleware redirect loops**: Verify session token validation logic

---

## License

MIT © CODShield

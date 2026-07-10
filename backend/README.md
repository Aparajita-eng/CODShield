# CODShield Backend

> Express + TypeScript API server — the engine powering all CODShield risk evaluation, OTP verification, and merchant data.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Language | TypeScript 5 |
| Database | PostgreSQL (via Prisma ORM) |
| Dev server | ts-node-dev |
| SMS | 2Factor.in (primary) · Twilio (fallback) |

---

## Prerequisites

- Node.js 18+
- A PostgreSQL database (local or hosted, e.g. Supabase, Neon, Railway)

---

## Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, and SMS keys in .env

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed the database with test merchants and risk data
npm run prisma:seed

# 6. Start the development server
npm run dev
```

The API server starts on **http://localhost:5001**

---

## API Endpoints

### Health
```
GET  /health                          → Server status
```

### OTP
```
POST /api/otp/send                    → Send OTP to phone number
POST /api/otp/verify                  → Verify OTP code
```

### Sandbox (no auth required)
```
POST /api/sandbox/trust-graph         → Evaluate buyer trust graph
POST /api/sandbox/risk-engine         → Run full risk assessment
POST /api/sandbox/pincode             → Check pincode risk zone
POST /api/sandbox/fraud-history       → Check phone blacklist history
POST /api/sandbox/merchant-ratio      → Evaluate merchant claim ratio
POST /api/sandbox/claim               → Simulate claim processing steps
```

### Dashboard
```
GET  /api/dashboard/data              → Fetch merchant metrics + orders
POST /api/dashboard/claim-submit      → Register a new protection claim
```

### Public API (requires `x-api-key` header)
```
POST /api/v1/orders/risk-check        → Evaluate order risk + save log
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run prisma:generate` | Regenerate Prisma Client after schema changes |
| `npm run prisma:seed` | Seed database with test data |

---

## Project Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── dashboardController.ts   # Merchant data + claim submission
│   │   ├── otpController.ts         # OTP send/verify (2Factor + Twilio)
│   │   ├── sandboxController.ts     # Simulation endpoints (no auth)
│   │   └── v1Controller.ts          # Public API (merchant API key auth)
│   ├── lib/
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── otpStore.ts              # In-memory OTP store (Map)
│   │   └── risk.ts                  # Core risk scoring algorithm
│   ├── routes/
│   │   └── index.ts                 # Route definitions
│   └── server.ts                    # Express app entry point
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Test data seeder
├── .env.example                     # Environment variable template
├── package.json
└── tsconfig.json
```

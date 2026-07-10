# CODShield

> COD Trust Infrastructure for E-Commerce

CODShield is a full-stack platform that evaluates checkout intent before every cash-on-delivery shipment. It verifies buyer identities, scores regional postal risk zones, detects repeat-refusal fraud, and protects merchant dispatch margins through a programmatic API layer.

---

## Monorepo Structure

```
CODShield/
├── backend/          # Express + TypeScript API server (port 5001)
├── frontend/         # Next.js 16 web application (port 3000)
│   └── design-system/  # Tailwind design system tokens & reference
├── package.json      # Root — unified dev scripts via concurrently
└── README.md
```

---

## Quick Start

### 1. Clone & install all dependencies

```bash
git clone https://github.com/Aparajita-eng/CODShield.git
cd CODShield
npm install          # installs concurrently at root
npm run install:all  # installs deps in both backend/ and frontend/
```

### 2. Configure environment variables

```bash
# Backend — PostgreSQL + SMS gateway
cp backend/.env.example backend/.env

# Frontend — backend URL
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` with your database URL and SMS provider keys.

### 3. Set up the database

```bash
cd backend
npx prisma migrate dev --name init   # runs migrations
npm run prisma:seed                  # seeds test merchants + risk data
cd ..
```

### 4. Run both services

```bash
npm run dev          # starts backend (5001) + frontend (3000) together
```

Or run them separately:

```bash
npm run dev:backend   # Express API on http://localhost:5001
npm run dev:frontend  # Next.js app on http://localhost:3000
```

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 5001 | REST API — OTP, risk engine, dashboard, public merchant API |
| Frontend | 3000 | Next.js app — landing page, dashboard, sandbox console |

---

## Core Features

| Feature | Description |
|---------|-------------|
| **OTP Verification** | Confirms buyer intent at checkout via SMS (2Factor.in / Twilio) |
| **Trust Graph** | Cross-merchant identity matching and delivery cluster analysis |
| **Pincode Intelligence** | Regional RTO risk weighting for 6-digit Indian postal codes |
| **Fraud History** | Phone number blacklist across repeat-refusal incidents |
| **Dynamic Risk Engine** | Weighted scoring (0–100) combining pincode, order value, and phone history |
| **Merchant Scoring** | Compliance tier tracking based on claim ratios |
| **Claims & Payouts** | Automated 4-step insurance claim workflow for failed deliveries |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js · Express · TypeScript · Prisma ORM |
| Database | PostgreSQL |
| Frontend | Next.js 16 · React 19 · TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion 12 |
| SMS | 2Factor.in (primary) · Twilio (fallback) |

---

## Documentation

- [`backend/README.md`](./backend/README.md) — Backend setup, API reference, project structure
- [`frontend/README.md`](./frontend/README.md) — Frontend setup, page map, environment variables
- [`frontend/design-system/`](./frontend/design-system/) — Design system reference (open `design-system.html` in browser)

---

## License

MIT © CODShield

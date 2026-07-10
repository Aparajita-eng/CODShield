# CODShield Frontend

> Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Framer Motion

The merchant-facing web application for CODShield — includes the marketing landing page, merchant dashboard, and sandbox API console.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion 12 |
| Icons | Lucide React |
| HTTP | Native `fetch` (no client library) |

---

## Prerequisites

- Node.js 18+
- CODShield backend server running (see `../backend/README.md`)

---

## Setup

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_BACKEND_URL in .env.local

# 3. Start the development server
npm run dev
```

The app starts on **http://localhost:3000**

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page — hero, features, pricing, CTA |
| `/dashboard` | Merchant dashboard — metrics, order logs, claim management |
| `/sandbox` | Sandbox console — test all 6 risk engine modules interactively |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:5001` | Base URL for the backend API server |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Start production server (requires build) |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (fonts, grain overlay)
│   │   ├── globals.css              # Design tokens + Tailwind v4 theme
│   │   ├── page.tsx                 # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Merchant dashboard
│   │   └── sandbox/
│   │       └── page.tsx             # Sandbox API console
│   ├── components/
│   │   ├── Navigation.tsx           # Top navigation bar
│   │   └── Footer.tsx               # Site footer
│   └── lib/
│       └── motion.ts                # Shared Framer Motion variants
├── public/                          # Static assets
├── design-system/                   # CODShield design system reference
│   ├── tailwind.config.js           # Full Tailwind token config
│   ├── components.css               # @apply component classes
│   └── design-system.html           # Interactive component reference (open in browser)
├── .env.example                     # Environment variable template
├── next.config.ts
├── postcss.config.mjs
└── tsconfig.json
```

---

## Design System

The `design-system/` folder contains the full CODShield Tailwind design system:

- **`tailwind.config.js`** — all color, spacing, typography, shadow, and animation tokens
- **`components.css`** — reusable `@apply` component classes
- **`design-system.html`** — open directly in any browser to preview every component with no build step

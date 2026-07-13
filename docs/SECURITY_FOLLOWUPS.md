# Security follow-ups

## Fixed (session + merchant binding)

| Route | Auth | Merchant scope |
|-------|------|----------------|
| `GET /api/dashboard/data` | `requireSession` | `resolveActiveMerchantId` |
| `POST /api/dashboard/claim-submit` | `requireSession` | order `merchantId` check |
| `GET /api/orders` | `requireSession` | `?merchantId=` validated |
| `GET /api/orders/:orderId` | `requireSession` | order ownership |
| `PATCH /api/orders/bulk` | `requireSession` | all `orderIds` ownership |
| `GET /api/customers` | `requireSession` | orders scoped to merchant |
| `GET /api/customers/search` | `requireSession` | orders scoped to merchant |
| `GET /api/customers/profile` | `requireSession` | orders scoped to merchant |
| `GET /api/pincodes/intelligence` | `requireSession` | orders scoped to merchant |
| `GET /api/pincodes/:pincode/detail` | `requireSession` | orders scoped to merchant |
| `GET /api/fraud/events` | `requireSession` | orders scoped to merchant |
| `GET /api/fraud/trust-graph` | `requireSession` | (existing) |

Dashboard UI calls these via same-origin Next.js proxy routes under `frontend/src/app/api/`.

## Intentionally public (keep as-is or use dedicated auth)

| Route | Auth model |
|-------|------------|
| `POST /api/auth/*` | Public auth flows |
| `POST /api/otp/*` | Public OTP |
| `POST /api/v1/orders/risk-check` | Merchant `x-api-key` header |
| `POST /api/sandbox/*` | Dev/demo sandbox (consider gating in production) |

## Schema follow-up

~~Add explicit `User.merchantId` FK~~ — **done** (`20260713110000_init` + `20260713120000_add_user_merchant_id`). Demo user and new registrations use `User.merchantId`; demo-mode sessions still bind to `DEMO_MERCHANT_ACME_ID`.

## Dev CORS note

`FRONTEND_URL` is documented in `backend/.env.example` and copied into `backend/.env` during README setup (`cp backend/.env.example backend/.env`). If `backend/.env` is never created, CORS falls back to permissive `origin: true` in development only.

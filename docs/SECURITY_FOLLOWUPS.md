# Security follow-ups

Tracked items identified during dashboard auth hardening (not yet addressed).

## Unauthenticated API routes (require session or API-key auth)

These Express endpoints are currently **public** — any caller can hit them without a session:

| Route | Controller | Suggested fix |
|-------|------------|---------------|
| `GET /api/orders` | `ordersController.listOrders` | `requireSession` + merchant access check |
| `GET /api/orders/:orderId` | `ordersController.getOrderById` | `requireSession` + order ownership |
| `PATCH /api/orders/bulk` | `ordersController.bulkUpdateOrders` | `requireSession` + merchant access |
| `GET /api/customers` | `customersController.listCustomers` | `requireSession` |
| `GET /api/customers/search` | `customersController.searchCustomers` | `requireSession` |
| `GET /api/customers/profile` | `customersController.getCustomerProfile` | `requireSession` |
| `GET /api/pincodes/intelligence` | `pincodeController` | `requireSession` |
| `GET /api/pincodes/:pincode/detail` | `pincodeController` | `requireSession` |
| `GET /api/fraud/events` | `fraudEventsController` | `requireSession` |

## Intentionally public (keep as-is or use dedicated auth)

| Route | Auth model |
|-------|------------|
| `POST /api/auth/*` | Public auth flows |
| `POST /api/otp/*` | Public OTP |
| `POST /api/v1/orders/risk-check` | Merchant `x-api-key` header |
| `POST /api/sandbox/*` | Dev/demo sandbox (consider gating in production) |

## Authorization gaps (authenticated but not merchant-scoped)

| Area | Issue |
|------|--------|
| `GET /api/dashboard/data` | Session required; merchant list filtered to user's merchants (fixed). |
| `POST /api/dashboard/claim-submit` | Session required; order `merchantId` must match user's merchant (fixed). |

## Schema follow-up

Add explicit `User.merchantId` FK (or join table) instead of matching `companyName` → `Merchant.name`.

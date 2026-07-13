# Deploy CODShield to Render

This guide deploys the **backend API**, **Next.js frontend**, and **PostgreSQL** database to [Render](https://render.com).

## Architecture on Render

| Service        | Render name     | Root dir   | URL example                          |
|----------------|-----------------|------------|--------------------------------------|
| PostgreSQL     | `codshield-db`  | —          | Internal only                        |
| Backend API    | `codshield-api` | `backend/` | `https://codshield-api.onrender.com` |
| Frontend app   | `codshield-web` | `frontend/`| `https://codshield-web.onrender.com` |

The repo includes a [`render.yaml`](../render.yaml) blueprint so Render can provision all three resources from one click.

---

## Option A — Blueprint (recommended)

1. Push this repo to GitHub (if not already).
2. Sign in to [Render](https://dashboard.render.com).
3. Click **New → Blueprint**.
4. Connect the `CODShield` repository and confirm `render.yaml`.
5. Click **Apply** — Render creates the database, API, and web app.
6. Wait for both web services to finish building (first deploy can take ~5–10 minutes).
7. **Seed the database** (one time, optional but recommended):
   - Open the **codshield-api** service → **Shell**
   - Run: `npx prisma db seed`
8. Open the **codshield-web** URL and log in with:
   - Email: `demo@codshield.com`
   - Password: `Demo@1234`

> **Note:** Without seeding, the app still works using in-memory demo data when the database is empty or unavailable.

---

## Option B — Manual setup

### 1. PostgreSQL

1. **New → PostgreSQL** → name it `codshield-db`, plan **Free**.
2. Copy the **Internal Database URL** (and External URL for local tools).

### 2. Backend (`codshield-api`)

| Setting        | Value |
|----------------|-------|
| Type           | Web Service |
| Root Directory | `backend` |
| Build Command  | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
| Start Command  | `npm start` |
| Health Check   | `/health` |

**Environment variables:**

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Postgres connection string from step 1 |
| `DIRECT_URL` | Same as `DATABASE_URL` on Render free Postgres |
| `SESSION_SECRET` | Long random string (e.g. `openssl rand -hex 32`) |
| `FRONTEND_URL` | Your frontend URL, e.g. `https://codshield-web.onrender.com` |
| `NODE_ENV` | `production` |
| `DEMO_USER_EMAIL` | `demo@codshield.com` |
| `DEMO_USER_PASSWORD` | `Demo@1234` |

After deploy, run in **Shell**: `npx prisma db seed`

### 3. Frontend (`codshield-web`)

| Setting        | Value |
|----------------|-------|
| Type           | Web Service |
| Root Directory | `frontend` |
| Build Command  | `npm install && npm run build` |
| Start Command  | `npm start` |

**Environment variables:**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL, e.g. `https://codshield-api.onrender.com` |
| `SESSION_SECRET` | **Must match** backend `SESSION_SECRET` |
| `NODE_ENV` | `production` |

> `NEXT_PUBLIC_BACKEND_URL` is baked in at **build time**. If you change the backend URL, trigger a **manual redeploy** of the frontend.

---

## Free tier notes

- Services **spin down after ~15 minutes** of inactivity; the first request may take 30–60 seconds.
- Free Postgres expires after 90 days (export data before then if you need to keep it).
- Region in `render.yaml` is set to `singapore` — change it in the blueprint or dashboard if you prefer another region.

---

## Verify deployment

```bash
# Backend health
curl https://YOUR-API.onrender.com/health

# API data (should return JSON)
curl https://YOUR-API.onrender.com/api/orders
```

Then visit your frontend URL, sign in, and open `/dashboard`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Frontend shows empty data / network errors | Check `NEXT_PUBLIC_BACKEND_URL` matches the live API URL; redeploy frontend after fixing. |
| Login works but trust graph fails | Ensure `SESSION_SECRET` is identical on frontend and backend. |
| Prisma migrate fails on build | Confirm `DATABASE_URL` and `DIRECT_URL` are set on the API service. |
| Build fails on `prisma generate` | Root Directory must be `backend`, not repo root. |
| CORS errors | Set `FRONTEND_URL` on the backend to your exact frontend origin (no trailing slash). |

---

## Local development

Copy env templates and run from the repo root:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm install
npm run dev
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

dMoney — a QA/testing practice platform styled as a mobile financial service (MFS) app (à la bKash/Nagad). This repo (`dmoney-web-app-ui`) is the **frontend only**: Next.js 15 (App Router) + TypeScript + Material UI. It talks over REST to a separate backend repo, `dmoney-transaction-api` (Node.js/Express/Sequelize/MySQL), which is not in this repo.

`README.md` at the repo root is a full Business Requirements Document covering both frontend and backend (roles, transaction rules, fees, ledger structure, API reference, status codes). Read it before implementing any transaction, auth, or user-management feature — the business rules (fee formulas, limits, protected accounts, HTTP status conventions like `208` for soft failures) live there, not in code comments.

**`dmoney-reactjs/` is a legacy Create-React-App version of this same app, kept in the repo for reference only.** Active development happens in `src/` (the Next.js app) at the repo root. Do not edit `dmoney-reactjs/` unless explicitly asked to port something from it. `QUICK_START.md` is stale (describes an early, partial migration state) — trust `src/app/*` directory structure over that doc for what's actually implemented.

## Commands

Run from the repo root (`dmoney-web-app-ui/`), not `dmoney-reactjs/`.

```bash
npm run dev     # start dev server (Turbopack), reads .env.development, http://localhost:3000
npm run build   # production build (Turbopack)
npm run start   # start built app on PORT=3006 (cross-env)
npm run prod    # build + start, PORT=3006
```

There is no lint script, no test script, and no ESLint config in this project currently — don't assume `npm run lint` works.

Environment files: `.env` (base/example values, committed), `.env.development` / `.env.production` (gitignored, real keys) are auto-loaded by Next.js per `NODE_ENV`. Key vars: `NEXT_PUBLIC_API_URL` (backend base URL), `NEXT_PUBLIC_SECRET_KEY` (sent as `X-AUTH-SECRET-KEY` header, must match backend's `PARTNER_KEY`), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Architecture

### Auth flow and session state
- Login is a two-phase flow for non-Admin roles: `POST /user/login` → if `otpRequired: true`, the login page switches to an OTP input → `POST /user/verify-otp` → JWT returned. Admin/SYSTEM skip OTP and get a token immediately from `/user/login`.
- On successful login, session data is written to **both** `localStorage` (token, role, name, email, userId, phoneNumber, photo, balance — read by client components) **and** a `token` cookie (read by `src/middleware.ts` for route protection at the edge). Keep these in sync when touching auth code.
- `src/middleware.ts` gates all routes except `/login`, `/register`, `/`, `/forgot-password`, `/reset-password` — no cookie means redirect to `/login`; a cookie present on `/login` redirects to `/profile`.
- `src/lib/api.ts` exports a shared Axios instance (`API`) that all API calls should go through: it attaches `Authorization: Bearer <token>` and `X-AUTH-SECRET-KEY` on every request, proactively decodes the JWT to reject requests with an already-expired token, and on any `401` response clears localStorage + cookie and hard-redirects to `/login` via `clearSessionAndRedirect()`. `403` is intentionally left alone (shown as an in-page error, not treated as session expiry) — preserve that distinction in new code.
- `DashboardLayout.tsx` independently polls token expiry every 30s client-side (`forceLogout`) as a belt-and-suspenders check beyond the Axios interceptor.

### Role-based UI
- Four live roles — Admin, Agent, Customer, Merchant — plus the internal SYSTEM account. Role is stored in `localStorage.role` after login and drives sidebar contents.
- `src/components/LeftMenu.tsx` holds the `ROLE_MENUS` map (role → nav items → routes) and `ROLE_CONFIG` (role → accent color). `src/components/DashboardLayout.tsx` has its own duplicate `ROLE_CONFIG` for the top bar avatar/chip — when adding or recoloring a role, update both.
- Page routes under `src/app/` mirror the role structure: `admin/*`, `agent/*`, `customer/*`, `merchant/*`, plus shared pages (`profile`, `change-password`, `login`, `register`, `forgot-password`, `reset-password`) at the top level. A page's role restriction is enforced by which role's menu links to it plus backend authorization — the middleware only checks "is there a token," not role, so don't rely on `middleware.ts` for role-gating.

### Transactions and money semantics
- All financial identifiers are **phone numbers**, not user IDs. Balance is never stored client-side as a source of truth — it's fetched live from `GET /transaction/balance/:account` (see the balance toggle in `DashboardLayout.tsx`) or `GET /transaction/statement/:account`.
- Every transaction type (deposit, withdraw, send-money, payment, admin-deposit, Stripe cash-in) has specific fee math, min/max limits, and role preconditions documented in `README.md` §7–9 — check there before changing amounts, validation, or fee display logic rather than inferring rules from one screen.
- `SelfStatement.tsx` computes a running balance **client-side** from the full statement fetch (up to 10,000 records) filtered by date range — there is no server-side running-balance field.
- Bank cash-in uses Stripe.js (`@stripe/react-stripe-js`) in a 3-step wizard (`/customer/cash-in-bank`): create PaymentIntent → confirm card via Stripe.js → call backend `/transaction/stripe/confirm` to credit the wallet. The backend does idempotency/anti-spoofing checks server-side; don't try to replicate those client-side.

### Conventions worth matching
- All interactive pages/components are Client Components (`'use client'`) — MUI + hooks-heavy, no server components/server actions in use anywhere in `src/app`.
- Styling is inline MUI `sx` props with hard-coded hex colors (dark slate palette: `#1e293b`, `#111827`, accent `#6366f1`) — there's no theme provider or design-token file; match existing hex values rather than introducing new ones or a Tailwind-only approach (Tailwind is configured via `@tailwindcss/postcss` but MUI `sx` is the dominant pattern in practice).
- `Pagination.tsx` is a shared component reused across all list views (users, transactions, statements) — extend it rather than building page-specific pagination.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).

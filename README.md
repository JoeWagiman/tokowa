# Tokowa.app

Sell on WhatsApp without owning a WhatsApp Business API account.
Live demo: <https://tokowa.app>

## The problem

To sell through the WhatsApp Business API (WABA), a business must clear three
gates: a Meta-approved sender number, a legal business entity, and a credit
card for billing. In practice even that is not enough: Meta's onboarding is
tricky and effectively limited to certain people, even when going through a
tech provider.

We felt this first-hand. As the developers of [obrool.com](https://obrool.com),
a legally incorporated company and an approved Meta tech provider, we hit
this wall on day one while onboarding a high-volume prospect: no business
legality, no credit card, and no willingness to get one. The deal died on
paperwork, not on product.

That prospect is the rule, not the exception: warung owners, laundry shops,
car washes, housekeepers, and other micro-businesses sell every day on
WhatsApp, but almost none of them can (or want to) register for WABA.

## The solution

Tokowa.app is one shared storefront on top of **one platform WhatsApp number**.
Sellers ride on Tokowa's approved sender instead of registering their own:

- **No WABA registration:** no Meta application, no business legality
  documents, no credit card.
- **No app to install:** buyers order by chatting; sellers manage everything
  from the web dashboard.
- **Not only shops:** works for goods (warung, stalls) and services
  (laundry, car wash, housekeeping): anything with a price list and a
  fulfillment step.

This repo is the **storefront frontend** (Next.js App Router). The backend
(agents, WhatsApp Cloud API, payments, logistics) lives in a separate project,
**obrool**, which this app calls over HTTP.

## Features

- **Buyers:** catalog, product pages, guest checkout, cart, order tracking by
  order code + WhatsApp number, payment confirmation with receipt upload,
  returns, disputes, instant-courier quotes from buyer location.
- **Sellers:** dashboard with sales analytics, products, orders, returns,
  two-stage disputes, store settings (hours, QRIS, shipping tariffs).
- **Admins:** seller KYC queue, seller list with strikes/suspension, dispute
  decisions.
- Pre-launch **waitlist mode** gates seller signup behind an external form.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Plain CSS design tokens, no UI framework, no ESLint
- BFF API routes proxy authenticated calls to the obrool backend

## Getting started

Prerequisites: Node.js 20+ and a running obrool backend (see below).

```bash
git clone https://github.com/JoeWagiman/tokowa.git
cd tokowa
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. The dev servers used during development are
Tokowa on port 3000 and obrool on port 3002.

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build (set NODE_OPTIONS=--max-old-space-size=3072 on low-memory machines)
npm start           # run the production build
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OBROOL_API_BASE` | Yes | Base URL of the obrool backend, e.g. `http://localhost:3002` |
| `NEXT_PUBLIC_WA_NUMBER` | No | Platform WhatsApp number; chat buttons stay disabled until set |
| `NEXT_PUBLIC_WAITLIST_URL` | No | External waitlist form link shown on signup pages |
| `WAITLIST_FORWARD_URL` | No | Server-side endpoint receiving waitlist submissions as JSON; unset means signup is closed |
| `OBROOL_WEBHOOK_SECRET` | No | Shared HMAC secret verifying obrool → Tokowa webhooks |

See `.env.example` for the full list (names only, never secrets).

## Backend (obrool)

Tokowa is a frontend only: catalog, orders, auth, and files all come from the
obrool API. Point `OBROOL_API_BASE` at a running instance. The API contract
between the two projects is documented in `docs/rencana-kontrak-api.md`
(Indonesian).

## Project layout

- `src/app/`: routes `/` landing, `/katalog`, `/produk/[id]`, `/keranjang`,
  `/lacak`, `/pesanan-saya`, `/toko-saya/[agentId]/*` (seller), `/admin/*`,
  `/api/*` (BFF + webhooks)
- `src/components/`: shared UI (`site.tsx` header/footer, order/cart forms)
- `src/lib/`: API client, cart, order-history (localStorage), formatting
- `docs/rencana-kontrak-api.md`: API contract with obrool (Indonesian)
- `DESIGN.md`: brand direction (Indonesian)

## Notes for reviewers

- Code comments, commit messages, and `docs/` are written in Indonesian; this
  README is in English for international judges.
- Buyer checkout is guest-based (no account); seller/admin areas require login.
- Order tracking needs only an order code plus the last 4 digits of the buyer’s
  WhatsApp number.

## Build timeline (Meta hackathon starts Oct 26, 2026)

Built before the hackathon (Oct 17–18): catalog storefront, seller dashboard,
seller KYC + admin queue, order tracking, web ordering with shipping quotes,
buyer payment confirmation, multi-product cart, cancellation and returns.

Built during the hackathon (Oct 28–30): signed outbound webhooks, WhatsApp
webhook ownership docs, distance-based instant-courier tariffs, web receipt
upload (R2), normalized v1 seller API, seller home dashboard, buyer order
history, two-stage disputes with strikes and suspension, seller onboarding
(signup + create store), waitlist mode with interest field, landing redesign
with motion system, English README, and a full security audit with remediation.
The schedule above is verifiable per commit via `git log` (times in WIB).

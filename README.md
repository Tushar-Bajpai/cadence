# Cadence — Recurring Billing & Subscription Platform

Cadence is an automated subscription management and recurring billing platform engineered by **CodeLifters**.

It helps businesses manage subscription plans, generate recurring invoices automatically on schedule, prevent duplicate charges, record multi-method payments, and provide customers with an isolated self-service billing portal.

> **Built With:** Next.js 16 (App Router) • React 19 • TypeScript 5.7 • Tailwind CSS 4 • Prisma ORM 6.19 • PostgreSQL 16 • Razorpay

---

## What Does Cadence Do?

- **Bills on Time, Every Time**: Automatically identifies subscriptions due for billing and generates invoices for the period. If a cycle was missed, Cadence catches up sequentially so no revenue is lost.
- **Zero Duplicate Billing**: A database-level unique rule guarantees that running the billing engine multiple times will never create duplicate invoices for the same subscription period.
- **Finance Dashboard**: Gives leadership an immediate look at Monthly Recurring Revenue (MRR), active subscribers, revenue charts, and overdue invoices that need attention.
- **Customer Self-Service Portal**: Customers log into their own secure portal to view active plans, download printable invoice receipts, pay outstanding balances, and pause or resume services.
- **Catalog & Discount Rules**: Set up products with custom attribute pricing (such as plan tiers or add-ons), percentage or fixed taxes, and discount codes with expiration dates and usage limits.
- **Multi-Method Payments**: Record settlements via Card, UPI, Bank Transfer, Cash, Cheque, or online via Razorpay. Invoices automatically update to Paid once the balance reaches zero.

---

## How It Works in 3 Steps

1. **Set Up Products & Plans**: Define subscription plans with Daily, Weekly, Monthly, or Yearly billing intervals, plus any tax or discount rules.
2. **Create and Activate Subscriptions**: Subscriptions follow a clear path:
   `Draft` → `Quotation` → `Confirmed` → `Active` → `Closed`
   Admins can pause, resume, or renew subscriptions based on the plan rules.
3. **Run Automated Billing**: The billing engine runs (via button click or scheduled cron), generates invoices for all due subscriptions, snapshots tax rates, applies valid discounts, and tracks payments until settled.

---

## Quick Demo Credentials

To test the application immediately, open the login page at [`/auth`](http://localhost:3000/auth). You can click the one-click credential buttons or use these credentials:

| Role | Email | Password | What You Can See |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cadence.dev` | `Admin@1234` | Full access to dashboard, products, subscriptions, invoices, and payments (`/admin`) |
| **Staff** | `staff@cadence.dev` | `Admin@1234` | Daily operations, customer accounts, and catalog management (`/admin`) |
| **Customer** | `robert.fox@example.com` | `Admin@1234` | Customer self-service portal, invoices, and active subscriptions (`/portal`) |

*(Alternate seeded accounts: `admin@brightloop.dev` and `customer@brightloop.dev` with password `Password123!`)*

---

## Quickstart Guide

### 1. Prerequisites
- **Node.js**: v20 or higher
- **PostgreSQL**: Local database, Docker, or cloud PostgreSQL (Neon, Supabase)

### 2. Install Dependencies
```bash
git clone https://github.com/CodeLifters/cadence.git
cd cadence
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the project root:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/cadence?sslmode=disable"

# Secret key for signing login session tokens (at least 32 characters)
JWT_SECRET="cadence-super-secure-production-secret-key-32chars"

# App URL and port
APP_URL="http://localhost:3000"
PORT="3000"

# Optional: Google OAuth
GOOGLE_AUTH_CLIENT_ID="your-google-client-id"
GOOGLE_AUTH_CLIENT_SECRET="your-google-client-secret"

# Optional: Razorpay Payments
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_your_key_id"

# Optional: Email Notifications (uses Ethereal mock by default in dev)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="Cadence Billing <billing@cadence.dev>"
```

### 4. Initialize Database & Seed Demo Data
```bash
# Push database tables and generate Prisma client
npx prisma db push
npx prisma generate

# Seed sample products, plans, discounts, and demo accounts
npm run seed
npx tsx scripts/seed-demo-accounts.ts
```

### 5. Start the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> Note for macOS: Next.js launches with the `--webpack` flag via `scripts/next.mjs` for stable local execution.

---

## 5-Minute Walkthrough: How to Test Cadence

1. **Sign In as Admin**:
   - Go to `/auth` and click "Fill Admin Credentials" (`admin@cadence.dev`).
   - Click Sign In to enter the Operations Studio.

2. **Check the Product Catalog**:
   - Go to `/admin/products`.
   - View products and variants (such as extra pricing for brand add-ons).
   - Go to `/admin/discounts` to inspect active, expired, and exhausted discount codes.

3. **Advance a Subscription**:
   - Go to `/admin/subscriptions` and click on any record.
   - Use the visual lifecycle stepper to progress a contract from `Draft` to `Quotation`, `Confirmed`, and `Active`.

4. **Test Idempotent Invoicing**:
   - Click the "Run Billing Engine" button in the navigation bar.
   - The system generates invoices for all due active subscriptions.
   - Click "Run Billing Engine" a second time: observe that **0 new invoices** are created. Cadence guarantees that no subscription is billed twice for the same period.

5. **Record a Payment**:
   - Go to `/admin/invoices` and open an unpaid invoice.
   - Record a partial payment: notice the invoice stays `Confirmed` with a lower balance.
   - Record the remaining balance: the invoice automatically flips to `Paid`.

6. **Review the Finance Dashboard**:
   - Open `/admin/dashboard`.
   - Check the normalized Monthly Recurring Revenue (MRR), revenue charts, and overdue receivables.
   - Use the date range filters (`30D`, `90D`, `YTD`) to see sub-2-second query performance over thousands of records.

7. **Test Customer Isolation**:
   - Log out, then log in using "Fill Customer Credentials" (`robert.fox@example.com`).
   - Visit `/portal/subscriptions` and `/portal/invoices`.
   - The customer can only see their own records. Cross-account data access is blocked at the server level.

---

## Core System Modules

- **Invoicing Engine (`POST /api/billing/run`)**: Identifies active subscriptions past their next billing date, runs a catch-up loop for missed cycles, applies discounts, snapshots taxes, and enforces uniqueness on `[subscriptionId, periodStart]`.
- **Finance Analytics (`/admin/dashboard`)**: Aggregates MRR across daily, weekly, monthly, and yearly subscriptions, renders Recharts graphs, and lists overdue invoices with quick settlement.
- **Receivables Ledger (`/admin/payments`)**: Tracks settlements across Card, UPI, Bank Transfer, Cash, Cheque, and Razorpay. Prevents overpayments and enforces atomic accounting.
- **Customer Portal (`/portal`)**: Clean interface for customers to monitor active subscriptions, download printable PDF/thermal receipts, and manage account details.
- **Editorial Showcase (`/`)**: Interactive landing page with smooth horizontal spread transitions and the Jelly mascot guide.

---

## Tech Stack & Architecture

Cadence is built with a modern, end-to-end TypeScript architecture:

| Layer | Technology | Key Responsibility & Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.4.3** (App Router) | Server Components for instant data loading, Server Actions, and protected REST Route Handlers |
| **Language** | **TypeScript 5.7** | Strict end-to-end type safety across database models, API payloads, and UI components |
| **User Interface** | **React 19** & **Tailwind CSS 4** | Modern component architecture, zero-runtime styling, and responsive layout primitives |
| **Data Visualization** | **Recharts 3.10** | High-performance responsive charts for Monthly Recurring Revenue (MRR) and status breakdown |
| **Database** | **PostgreSQL 16** | Relational data integrity, ACID compliance, and indexed queries for sub-2s latency |
| **ORM & Migrations** | **Prisma ORM 6.19.3** | Type-safe queries, relations, and unique compound constraints (`@@unique([subscriptionId, periodStart])`) |
| **Auth & Security** | **jose** & **bcryptjs** | Stateless HMAC-SHA256 JWT cookies, role-based access control (Admin, Staff, Customer), and salted password hashing |
| **Validation** | **Zod 4.6** | Runtime schema validation for all incoming API requests and form submissions |
| **Payments** | **Razorpay SDK** | Integrated checkout order generation and HMAC signature verification |
| **Email Service** | **Nodemailer** | SMTP-backed transactional invoice receipts and 6-digit OTP password recovery emails |
| **Date Calculations** | **date-fns 4.4** | Exact recurring cycle interval math (daily, weekly, monthly, yearly) and timezone handling |

---

## Automated Test Scripts

Run these scripts from your terminal to verify system functionality:

```bash
# Verify Customer Portal isolation and self-service rules
npx tsx scripts/test-phase8.ts

# Verify Finance Dashboard query speed (<2s SLA) and MRR math
npx tsx scripts/test-phase9.ts

# Test Razorpay payment integration
npx tsx scripts/test-phase7-razorpay.ts

# Test discount rules (active, expired, usage limits)
npx tsx scripts/test-discounts.ts
```

---

## Directory Overview

```
cadence/
├── app/
│   ├── page.tsx               # Editorial landing showcase
│   ├── auth/page.tsx          # Login & registration with 1-click demo buttons
│   ├── admin/                 # Admin operations, catalog, and finance dashboard
│   ├── portal/                # Customer self-service portal
│   └── api/                   # REST API endpoints (billing, auth, subscriptions)
├── components/
│   ├── jelly-guide.tsx        # Jelly companion mascot
│   ├── magazine-header.tsx    # Navigation header
│   └── ui/                    # Reusable UI controls
├── lib/
│   ├── db.ts                  # Database client singleton
│   ├── auth.ts                # Session token management
│   ├── rbac.ts                # Role permissions guard
│   └── mailer.ts              # Email delivery helper
├── prisma/
│   ├── schema.prisma          # Database schema and idempotency rules
│   └── seed.ts                # Database seed script
└── scripts/
    ├── next.mjs               # Development and production server runner
    ├── seed-demo-accounts.ts  # Demo account credentials seed
    ├── test-phase8.ts         # Portal security test
    └── test-phase9.ts         # Performance SLA test
```

---

## Team & License

- **Engineered by**: **CodeLifters**
- **License**: MIT License

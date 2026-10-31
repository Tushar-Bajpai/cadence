# Cadence — Recurring Billing & Subscription Engine

> **Recurring billing. Zero missed cycles.**  
> Cadence is a high-performance, enterprise-grade subscription management and automated recurring billing system built with Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, and PostgreSQL.

---

## 🚀 Key Features

- **⚡ Idempotent Invoicing Engine (`POST /api/billing/run`)**:
  - Automatically identifies all due active subscriptions (`nextBillingDate <= now`).
  - Strict catch-up loop: bills every missed billing period without skipping cycles.
  - Guaranteed idempotency via compound database constraints (`@@unique([subscriptionId, periodStart])`). Running billing twice creates 0 duplicate invoices.
  - Auto-evaluates and applies active discounts, tracking usage limits and expiry dates.

- **📊 Executive Finance & Performance Dashboard (`/admin/dashboard`)**:
  - Sub-second analytical queries executed in parallel via `Promise.all`.
  - Normalized MRR calculation ($D \times 30$, $W \times 4.33$, $M \times 1$, $Y \div 12$).
  - Recharts monthly revenue bar chart and subscription lifecycle status donut chart.
  - Interactive overdue invoices ledger with instant one-click settlement modal shortcut.
  - Filter by date range presets (`30D`, `90D`, `YTD`, `ALL`), custom date ranges, customers, and subscription statuses.

- **💳 Payments & Receivable Ledger (`/admin/payments`)**:
  - Multi-method settlements (`CARD`, `BANK_TRANSFER`, `UPI`, `CASH`, `CHEQUE`).
  - Atomic transaction ledger computation (`aggregate._sum.amount`); automatically marks invoices `PAID` once fully settled.
  - Rejects overpayment and payments against draft or cancelled invoices.

- **🔄 Full Subscription Lifecycle (`/admin/subscriptions`)**:
  - Interactive visual stepper (`DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`).
  - Plan-governed rules: pause/resume (if `plan.pausable`), renew (if `plan.renewable`), early closure (if `plan.closable`), and auto-closure on expiry.
  - Instant subscription creation from reusable Quotation Templates.

- **📦 Dynamic Product & Plan Catalog (`/admin/products`)**:
  - Configurable products with multi-attribute variants (e.g. Brand: `Odoo (+560)`).
  - Multi-period plans (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`) with min-quantities and validity dates.
  - Tax configurations (Percentage/Fixed) with point-in-time rate snapshotting.

- **🛡️ Customer Self-Service Portal (`/portal`)**:
  - Strictly scoped server-side security (`where: { customerId }`) preventing cross-tenant leakage.
  - Subscriptions view with self-service pause/resume/close controls.
  - Invoices view with print view (`window.print()` optimized) and instant payment recording.
  - Profile management for company details, contacts, and billing address.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.4.3 (App Router, Server Actions, Route Handlers)
- **UI & Styling**: React 19, Tailwind CSS 4, Lucide Icons, Tabler Icons
- **Data Visualization**: Recharts (Responsive Bar Chart & Donut Chart)
- **Database**: PostgreSQL (Neon Serverless with PgBouncer connection pooling)
- **ORM**: Prisma ORM 6.19.3
- **Authentication**: Stateless HMAC-SHA256 JWT sessions via `jose` with RBAC (`ADMIN`, `STAFF`, `CUSTOMER`)
- **Date Handling**: `date-fns`

---

## ⚡ Quickstart & Setup

### 1. Prerequisites
- **Node.js**: v20+ or v24+
- **PostgreSQL**: Local PostgreSQL, Docker container, or cloud PostgreSQL (Neon / Supabase)

### 2. Clone and Install Dependencies
```bash
cd cadence
npm install
```

### 3. Environment Variables
Create a `.env` file in the `cadence` root directory:
```env
# Database connection string (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/cadence?sslmode=disable"

# Session JWT secret
JWT_SECRET="cadence-super-secure-production-secret-key-32chars"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup & Migrations
Push the Prisma schema and indexes to PostgreSQL:
```bash
npx prisma db push
```

### 5. Seed Demonstration Data
Run the Phase 10 bulk seed script (creates 5,000 subscriptions, 50 customers, 5 products, 4 plans, 2 taxes, 3 discounts, ~300 invoices, ~150 payments):
```bash
npm run seed
# or: npx tsx prisma/seed.ts
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Route |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.dev` | `Password123!` | `/admin` & `/admin/dashboard` |
| **Staff** | `staff1@brightloop.dev` | `Password123!` | `/admin` & `/admin/dashboard` |
| **Staff** | `staff2@brightloop.dev` | `Password123!` | `/admin` & `/admin/dashboard` |
| **Customer** | `customer@brightloop.dev` | `Password123!` | `/portal` |
| **Customer 2** | `customer2@brightloop.dev` | `Password123!` | `/portal` |

---

## 🎬 5-Minute Demo Walkthrough Script

1. **Sign Up & Auth**:
   - Navigate to `/login` or `/signup`.
   - Show password strength validation (>8 characters, uppercase, lowercase, special character).
   - Sign in as Admin (`admin@brightloop.dev`).

2. **Catalog & Variants**:
   - Visit `/admin/products`.
   - Inspect the `Cadence Cloud Infrastructure` product featuring the **Brand: Odoo (+560)** variant.
   - Review `/admin/discounts` showing the 3 discounts: Expired, Exhausted, and Valid.

3. **Subscription Lifecycle**:
   - Navigate to `/admin/subscriptions`.
   - Open a subscription and walk through the visual status stepper (`Draft` → `Quotation` → `Confirmed` → `Active`).

4. **Automated Billing Engine**:
   - Click the **"Run Billing Engine ⚡"** button in the header navbar or Operations Studio.
   - View generated invoices with auto-calculated taxes and auto-applied discounts.
   - Click **"Run Billing Engine ⚡"** a second time: observe that **0 new invoices** are generated (100% idempotent guarantee).

5. **Payments & Ledger**:
   - Visit `/admin/invoices` and open an unpaid confirmed invoice.
   - Record a partial payment: observe status remains `CONFIRMED` with updated `amountPaid` and outstanding balance.
   - Settle remaining balance: status automatically flips to `PAID`.

6. **Executive Finance Dashboard**:
   - Visit `/admin/dashboard`.
   - Review the normalized MRR, active subscription counters, monthly revenue Recharts bar chart, and status donut breakdown.
   - Scroll to the overdue table and click **"Record Payment"** to settle past-due accounts in real time.
   - Filter by date preset (`30D`, `90D`, `YTD`), customer, or status; observe sub-second updates.

7. **Customer Portal**:
   - Sign in as `customer@brightloop.dev`.
   - Visit `/portal/subscriptions` and `/portal/invoices`.
   - Confirm strict tenant isolation: Customer A cannot see Customer B's invoices or subscriptions (returns 404).

---

## 🧪 Automated Test Suites

Run individual end-to-end verification suites:
```bash
# Phase 8: Customer Portal isolation & self-service test
npx tsx scripts/test-phase8.ts

# Phase 9: Finance Dashboard SLA & reporting test
npx tsx scripts/test-phase9.ts
```

---

## 📄 License
MIT License. Developed for Cadence Billing Operations.


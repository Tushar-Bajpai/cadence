# Brightloop Subscription Management System: One-Day Build Plan

**Stack:** Next.js (App Router, TypeScript) + **PostgreSQL + Prisma ORM** + Tailwind + shadcn/ui
**Goal:** Working end-to-end demo in ~10 hours of build time. Depth beats breadth: a complete happy path beats half-built features.

> **Instructions for the agent developer:** Work phase by phase, in order. Do not start a phase until the previous phase's "Done when" checks pass. Commit after every phase. If a phase runs over its time box, cut items marked `[STRETCH]` and move on. Never skip the "Business Rules" sections; the judges will test those.

---

## 0. Ground Rules

- **One repo, one app.** API lives in `app/api/**/route.ts`. No separate backend.
- **Database:** PostgreSQL. Local via Docker (`docker run -p 5432:5432 -e POSTGRES_PASSWORD=pw postgres:16`) or a free hosted DB (Neon / Supabase). Schema is managed with `prisma db push` during the hackathon (skip migration files, they cost time).
- **Validate every input with `zod`** on the server. Return `{ error: string }` with proper status codes.
- **Money:** `Decimal(12,2)` columns (Prisma `Decimal`). Never use JS floats for totals: convert with `Prisma.Decimal` or compute in integer paise and convert at the edges. Pick one approach, stick to it.
- **Dates:** `DateTime` (UTC) in the DB. Format only in the UI.
- **Every list endpoint is paginated** (`?page=1&limit=20`, using `skip`/`take`), and every column used for filtering has an index. This is how we hit "<2 s with thousands of subscriptions".
- **Use transactions** (`prisma.$transaction`) for anything that touches more than one table (invoice creation, payments, state changes with side effects).
- **Auth:** JWT in an httpOnly cookie, verified in `middleware.ts` + again inside each route handler (defense in depth).
- **Env vars** (`.env`): `DATABASE_URL`, `JWT_SECRET`, `APP_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.

---

## 1. Time Plan (target)

| Block | Time | Phase |
|---|---|---|
| 1 | 0:00 – 0:45 | Phase 1: Setup, Prisma schema, DB |
| 2 | 0:45 – 2:00 | Phase 2: Auth, RBAC, password reset |
| 3 | 2:00 – 3:15 | Phase 3: Products, variants, plans |
| 4 | 3:15 – 4:15 | Phase 4: Taxes, discounts, quotation templates |
| 5 | 4:15 – 5:45 | Phase 5: Subscriptions + lifecycle |
| 6 | 5:45 – 7:15 | Phase 6: Invoicing engine (billing run) |
| 7 | 7:15 – 8:00 | Phase 7: Payments |
| 8 | 8:00 – 9:00 | Phase 8: Customer portal |
| 9 | 9:00 – 10:00 | Phase 9: Finance dashboard |
| 10 | 10:00 – end | Phase 10: Seed data, polish, perf check, demo script |

---

## Phase 1: Setup, Prisma Schema, DB (45 min)

### Steps
1. `npx create-next-app@latest brightloop --ts --tailwind --app --eslint`
2. Install: `prisma @prisma/client zod bcryptjs jose nodemailer date-fns recharts` and `@types/bcryptjs @types/nodemailer tsx`. Init shadcn/ui (`button input table dialog select badge card tabs form toast`).
3. `npx prisma init`, set `DATABASE_URL`, write `prisma/schema.prisma` (below), run `npx prisma db push`.
4. `lib/db.ts`: singleton `PrismaClient` (global cache so Next hot reload doesn't open new connections).
5. `lib/auth.ts` (sign/verify JWT with `jose`, `getSession()` reading the cookie) and `lib/rbac.ts` (`requireRole(session, ["ADMIN"])`).
6. `lib/api.ts`: tiny wrapper `handler(roles, fn)` that checks session and role, catches zod and Prisma errors (map `P2002` unique violation → 409), returns JSON. **Every route uses it.** This saves hours.

### Prisma schema (starting point, adjust field names as needed)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { ADMIN STAFF CUSTOMER }
enum BillingPeriod { DAILY WEEKLY MONTHLY YEARLY }
enum DiscountType { FIXED PERCENTAGE }
enum DiscountScope { PRODUCT SUBSCRIPTION }
enum TaxType { PERCENTAGE FIXED }
enum SubStatus { DRAFT QUOTATION CONFIRMED ACTIVE CLOSED }
enum InvoiceStatus { DRAFT CONFIRMED PAID CANCELLED }
enum PayMethod { CARD BANK_TRANSFER UPI CASH CHEQUE }

model User {
  id              String   @id @default(cuid())
  name            String
  email           String   @unique            // lowercase before saving
  passwordHash    String
  role            Role     @default(CUSTOMER)
  resetTokenHash  String?
  resetTokenExpiry DateTime?
  createdAt       DateTime @default(now())
  customer        Customer?
}

model Customer {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  companyName String?
  phone       String?
  address     String?
  subscriptions Subscription[]
  invoices      Invoice[]
  payments      Payment[]
}

model Tax {
  id       String  @id @default(cuid())
  name     String
  type     TaxType
  value    Decimal @db.Decimal(10,2)
  isActive Boolean @default(true)
  products ProductTax[]
}

model Product {
  id         String   @id @default(cuid())
  name       String
  type       String
  salesPrice Decimal  @db.Decimal(12,2)
  costPrice  Decimal  @db.Decimal(12,2)
  notes      String?
  isActive   Boolean  @default(true)
  variants   ProductVariant[]
  taxes      ProductTax[]
  discounts  DiscountProduct[]
}

model ProductVariant {          // e.g. attribute "Brand", value "Odoo", extraPrice 560
  id         String  @id @default(cuid())
  productId  String
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  attribute  String
  value      String
  extraPrice Decimal @db.Decimal(12,2) @default(0)
  @@index([productId])
}

model ProductTax {
  productId String
  taxId     String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  tax       Tax     @relation(fields: [taxId], references: [id])
  @@id([productId, taxId])
}

model Plan {
  id              String        @id @default(cuid())
  name            String
  price           Decimal       @db.Decimal(12,2)
  billingPeriod   BillingPeriod
  minQuantity     Int           @default(1)
  availableFrom   DateTime
  availableTo     DateTime?
  autoCloseOnEnd  Boolean       @default(false)
  closable        Boolean       @default(true)
  pausable        Boolean       @default(false)
  renewable       Boolean       @default(true)
  isActive        Boolean       @default(true)
  subscriptions   Subscription[]
  templates       QuotationTemplate[]
}

model QuotationTemplate {
  id           String @id @default(cuid())
  name         String
  planId       String
  plan         Plan   @relation(fields: [planId], references: [id])
  validityDays Int
  lines        QuotationTemplateLine[]
}

model QuotationTemplateLine {
  id          String  @id @default(cuid())
  templateId  String
  template    QuotationTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  productId   String
  variantId   String?
  quantity    Int
}

model Discount {
  id            String        @id @default(cuid())
  name          String
  type          DiscountType
  value         Decimal       @db.Decimal(12,2)
  scope         DiscountScope
  minPurchase   Decimal?      @db.Decimal(12,2)
  minQuantity   Int?
  startDate     DateTime
  endDate       DateTime
  usageLimit    Int
  usedCount     Int           @default(0)
  isActive      Boolean       @default(true)
  products      DiscountProduct[]
  subscriptions SubscriptionDiscount[]
}

model DiscountProduct {
  discountId String
  productId  String
  discount   Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)
  product    Product  @relation(fields: [productId], references: [id])
  @@id([discountId, productId])
}

model Subscription {
  id              String    @id @default(cuid())
  seq             Int       @unique @default(autoincrement())   // number = "SUB-" + seq padded to 6
  customerId      String
  customer        Customer  @relation(fields: [customerId], references: [id])
  planId          String
  plan            Plan      @relation(fields: [planId], references: [id])
  status          SubStatus @default(DRAFT)
  isPaused        Boolean   @default(false)
  startDate       DateTime
  expiryDate      DateTime
  paymentTermDays Int       @default(15)       // due date = issue date + this
  nextBillingDate DateTime?
  lastBilledThrough DateTime?
  createdById     String?
  createdAt       DateTime  @default(now())
  lines           SubscriptionLine[]
  discounts       SubscriptionDiscount[]
  invoices        Invoice[]
  @@index([status])
  @@index([customerId])
  @@index([status, isPaused, nextBillingDate])   // the billing-run query
}

model SubscriptionLine {
  id             String @id @default(cuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  productId      String
  variantId      String?
  description    String
  quantity       Int
  unitPrice      Decimal @db.Decimal(12,2)
  taxRate        Decimal @db.Decimal(10,2) @default(0)   // snapshot of tax at time of adding
  taxType        TaxType @default(PERCENTAGE)
  amount         Decimal @db.Decimal(12,2)
  @@index([subscriptionId])
}

model SubscriptionDiscount {
  subscriptionId String
  discountId     String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  discount       Discount     @relation(fields: [discountId], references: [id])
  @@id([subscriptionId, discountId])
}

model Invoice {
  id             String        @id @default(cuid())
  seq            Int           @unique @default(autoincrement())  // "INV-" + seq padded
  subscriptionId String
  subscription   Subscription  @relation(fields: [subscriptionId], references: [id])
  customerId     String
  customer       Customer      @relation(fields: [customerId], references: [id])
  status         InvoiceStatus @default(DRAFT)
  periodStart    DateTime
  periodEnd      DateTime
  issueDate      DateTime      @default(now())
  dueDate        DateTime
  subtotal       Decimal       @db.Decimal(12,2)
  taxTotal       Decimal       @db.Decimal(12,2)
  discountTotal  Decimal       @db.Decimal(12,2) @default(0)
  total          Decimal       @db.Decimal(12,2)
  amountPaid     Decimal       @db.Decimal(12,2) @default(0)
  sentAt         DateTime?
  lines          InvoiceLine[]
  discountLines  InvoiceDiscountLine[]
  payments       Payment[]

  @@unique([subscriptionId, periodStart])   // <- "never bill twice" guarantee
  @@index([status, dueDate])
  @@index([customerId])
}

model InvoiceLine {
  id          String  @id @default(cuid())
  invoiceId   String
  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  quantity    Int
  unitPrice   Decimal @db.Decimal(12,2)
  taxAmount   Decimal @db.Decimal(12,2)
  amount      Decimal @db.Decimal(12,2)
  @@index([invoiceId])
}

model InvoiceDiscountLine {
  id         String  @id @default(cuid())
  invoiceId  String
  invoice    Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  discountId String
  label      String
  amount     Decimal @db.Decimal(12,2)
  @@index([invoiceId])
}

model Payment {
  id         String    @id @default(cuid())
  invoiceId  String
  invoice    Invoice   @relation(fields: [invoiceId], references: [id])
  customerId String
  customer   Customer  @relation(fields: [customerId], references: [id])
  method     PayMethod
  amount     Decimal   @db.Decimal(12,2)
  date       DateTime
  note       String?
  recordedById String?
  @@index([invoiceId])
  @@index([date])
}
```

> **Numbering:** `seq` is an auto-increment column, so the display number is just `"SUB-" + String(seq).padStart(6,"0")`. No counter table needed. Put the formatter in `lib/format.ts`.

### Done when
- `prisma db push` succeeds, `npx prisma studio` shows all tables, `npm run dev` boots, and a quick script can insert a User.

---

## Phase 2: Auth, RBAC, Password Reset (75 min)

### Rules
- Email unique per account (catch Prisma `P2002` → 409). Lowercase and trim emails before saving.
- **Password: more than 8 characters (i.e. at least 9), at least 1 uppercase, 1 lowercase, 1 special character.** One shared zod schema in `lib/validators.ts` used by the signup form AND the API.
- Roles: `ADMIN` (everything), `STAFF` (limited: no user creation, no tax/discount/product/plan config), `CUSTOMER` (own data only).
- **Only admin can create staff.** Public signup always creates `role: CUSTOMER` + a `Customer` row (single nested `create`).

### Steps
1. `POST /api/auth/signup`: validate, hash with bcrypt (cost 10), create User+Customer, set cookie.
2. `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
3. `POST /api/auth/forgot-password`: always respond 200 (don't leak whether the email exists). Generate a random token, store its **SHA-256 hash** + 1h expiry, email a link `APP_URL/reset-password?token=...`.
   - `[FALLBACK]` If SMTP isn't ready, use Ethereal/Resend/Mailtrap and also `console.log` the link in dev so we're never blocked.
4. `POST /api/auth/reset-password`: validate token + new password rule, update hash, clear token.
5. `POST /api/admin/staff`: admin only, creates a `STAFF` user.
6. `middleware.ts`: redirect unauthenticated users to `/login`; `/admin/*` for admin+staff, `/portal/*` for customers. Enforce roles again in the API.
7. Pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`, role-aware layout with sidebar (admin/staff) and a simpler top nav (portal).

### Done when
- Weak passwords rejected with a clear message; duplicate email rejected.
- Reset link arrives (or prints), works once, expires.
- Customer hitting `/admin` is redirected; staff calling `POST /api/admin/staff` gets 403.

---

## Phase 3: Products, Variants, Plans (75 min)

### Steps
1. CRUD API + UI for **Products** (admin writes; staff read-only). Use nested writes (`variants: { create: [...] }`, `taxes: { create: [...] }`).
   - Form: name, type, sales price, cost price, notes, tax selection, **variants editor** (rows of attribute / value / extra price).
   - Effective price = `salesPrice + variant.extraPrice` (e.g. Odoo brand → +560). Put this in `lib/pricing.ts: getUnitPrice(product, variant?)`.
2. CRUD API + UI for **Plans** (admin writes).
   - Fields: name, price, billing period (daily/weekly/monthly/yearly), min quantity, available from/to, and four per-plan switches: **auto-close on end, closable early, pausable, renewable**.
3. `lib/billing-period.ts: addPeriod(date, period)` using date-fns (`addDays`, `addWeeks`, `addMonths`, `addYears`). Unit test it quickly.
4. List pages with search (`contains`, `mode: "insensitive"`) + pagination.

### Done when
- Admin can create a product with Brand variants and see the adjusted price.
- A weekly plan with min qty 5 saves; staff can view but not edit.

---

## Phase 4: Taxes, Discounts, Quotation Templates (60 min)

### Steps
1. **Taxes** (admin): CRUD, percentage or fixed. Linked to products via `ProductTax`. `lib/pricing.ts: calcLineTax(qty, unitPrice, taxes)`.
2. **Discounts** (**admin only**, enforce in API): CRUD with type (fixed/percentage), value, min purchase, min quantity, start/end dates, usage limit, scope (specific products or whole subscription).
3. `lib/discounts.ts: getApplicableDiscounts(subscription, now)`. A discount applies only if ALL are true:
   - `isActive` and `startDate <= now <= endDate`
   - `usedCount < usageLimit`
   - subtotal ≥ `minPurchase` and relevant quantity ≥ `minQuantity`
   - scope matches (product-scoped → only matching lines count; subscription-scoped → whole subtotal)
   - it is attached to the subscription (via `SubscriptionDiscount`) or targets its products
4. **Quotation templates** (admin + staff): name, plan, validity days, product lines.

### Done when
- Unit-test `getApplicableDiscounts` with: expired, exhausted, below minimum, wrong product, valid.
- A template saves with lines and validity days.

---

## Phase 5: Subscriptions and Lifecycle (90 min)

### Steps
1. `POST /api/subscriptions`: create from scratch OR `{ templateId }`.
   - From template: copy plan and lines, resolve prices and tax snapshots, and set the quote's validity as `today + validityDays`.
   - Fields: number (derived from `seq`), customer, plan, start date, expiry date, payment terms, lines (product, qty, unit price, taxes, amount).
   - Enforce `quantity >= plan.minQuantity`.
2. **State machine** in `lib/subscription-state.ts`. Allowed transitions only:
   ```
   DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED
   ```
   - `POST /api/subscriptions/:id/transition { to }`; reject illegal moves with 400.
   - On `→ ACTIVE`: set `nextBillingDate = startDate`.
   - Plan switches: **close early** only if `plan.closable`; **pause/resume** only if `plan.pausable`; **renew** only if `plan.renewable` (extend expiry by one plan term); plans with `autoCloseOnEnd` close themselves when `expiryDate` passes (handled in the billing run, Phase 6).
3. UI: subscription list (status badges + filters + search), detail page with line editor, a **status stepper** (Draft → Quotation → Confirmed → Active → Closed) and buttons for only the valid next steps. Anyone on the team can see status.
4. Detail page also lists its invoices and payments.

### Done when
- Can't jump Draft → Active. Can't pause a non-pausable plan.
- Template → quotation → confirmed → active works in the UI.

---

## Phase 6: Invoicing Engine (90 min), the heart of the project

### Billing run: `POST /api/billing/run` (admin/staff) + a "Run billing" button
**Algorithm:**
```
due = prisma.subscription.findMany({
        where: { status: "ACTIVE", isPaused: false, nextBillingDate: { lte: now } },
        include: { plan, lines, discounts }, take: BATCH })
for each sub (batches of ~50, Promise.allSettled per batch, one transaction per subscription):
   loop while sub.nextBillingDate <= now (catch-up for missed periods, safety cap ~24):
      periodStart = nextBillingDate
      periodEnd   = addPeriod(periodStart, plan.billingPeriod)
      compute lines, tax per line, discounts = getApplicableDiscounts(...), totals
      dueDate = issueDate + paymentTermDays
      prisma.$transaction:
         create Invoice (+ lines + discountLines), status DRAFT
            -> @@unique([subscriptionId, periodStart]) makes duplicates IMPOSSIBLE
            -> catch Prisma P2002: treat as "already billed", advance and continue
         update subscription: nextBillingDate = periodEnd, lastBilledThrough = periodEnd
         for each applied discount: update usedCount += 1 WHERE usedCount < usageLimit
            (if the update count is 0, roll back and re-evaluate without that discount)
      if plan.autoCloseOnEnd && periodEnd >= sub.expiryDate -> status CLOSED
return { created, skipped, failed, errors[] }
```
- For safety under concurrent clicks, `SELECT ... FOR UPDATE SKIP LOCKED` via `$queryRaw` on the due subscriptions is a nice `[STRETCH]`; the unique constraint is the hard guarantee.

### Business rules (must hold)
- **Nothing billed twice:** unique constraint + skip on P2002. Running billing twice in a row must create 0 new invoices the second time.
- **Nothing skipped:** the catch-up loop bills every missed period.
- **Discounts auto-apply** to the next invoice and **stop** when expired or `usedCount >= usageLimit`.
- **Invoice states:** `DRAFT → CONFIRMED → PAID` (+ `CANCELLED` from draft/confirmed). Transition endpoint with validation, same pattern as subscriptions.
- Actions: **confirm, cancel, send, print**.
  - Print = a clean `/admin/invoices/[id]/print` page styled for `window.print()`.
  - Send = Nodemailer email with invoice summary + portal link; set `sentAt`.

### UI
- Invoice list: filters by status, customer, date range, overdue-only; paginated (`skip/take`) with a `count` for the pager.
- Invoice detail: lines, taxes, discounts, totals, payments, action buttons.

### Done when
- Seeded 200 active, due subscriptions → one click creates ~200 invoices in a few seconds; a second click creates 0.
- A valid discount appears on the invoice and `usedCount` increments; an exhausted one doesn't appear.

---

## Phase 7: Payments (45 min)

### Steps
1. `POST /api/invoices/[id]/payments`: `{ method, amount, date, note }` against a **CONFIRMED** invoice (reject on draft/cancelled/paid; reject overpayment).
2. In one `$transaction`: create the payment, recompute `amountPaid` with `aggregate._sum`, and if `amountPaid >= total` set `status = PAID`. (Re-read the invoice inside the transaction to avoid double-pay races.)
3. `GET /api/payments` with filters (method, date range, customer) and pagination.
4. Derived field, never stored: **overdue** = `status === CONFIRMED && dueDate < now && amountPaid < total`. Show a red "Overdue" badge and an "Outstanding" column (`total − amountPaid`).
5. UI: "Record payment" dialog on invoice detail; Payments list page.

### Done when
- A partial payment keeps the invoice Confirmed with the correct outstanding; the full payment flips it to Paid.
- The overdue list shows only unpaid past-due invoices.

---

## Phase 8: Customer Portal (60 min)

Routes under `/portal`, customer role only. **Every query is scoped by the session's `customerId` on the server** (`where: { id, customerId }`), never trust an ID from the client.

- `/portal`: summary cards (active subs, outstanding amount, next invoice)
- `/portal/subscriptions` + detail (status, lines, next billing date). Self-service pause/resume/close only where the plan allows it.
- `/portal/invoices` + detail + print view; mock "Pay now" button that records a payment `[STRETCH]`
- `/portal/profile`: name, company, phone, address

### Done when
- Customer A cannot see Customer B's invoice even by guessing the URL (returns 404).

---

## Phase 9: Finance Dashboard (60 min)

`/admin/dashboard` (admin + staff). One API `GET /api/reports/summary?from=&to=&customerId=&status=`, with all queries run in parallel via `Promise.all`:

| Metric | How |
|---|---|
| Active subscriptions | `subscription.count({ where: { status: "ACTIVE" } })` |
| MRR (normalized) | `groupBy` plan billing period over active subs, then yearly/12, weekly×4.33, daily×30 (or one `$queryRaw` joining plan) |
| Revenue collected | `payment.aggregate({ _sum: { amount }, where: { date range } })` |
| Outstanding | `$queryRaw`: `SUM(total - "amountPaid")` where status = 'CONFIRMED' |
| Overdue invoices | `count` + sum, plus top 10 list (`dueDate < now`, status CONFIRMED, ordered by `dueDate`) |
| Revenue by month | `$queryRaw`: `date_trunc('month', date)`, `SUM(amount)`, `GROUP BY 1 ORDER BY 1` → bar chart |
| Subscriptions by status | `groupBy status` → donut/badges |

- Filters: date range, customer, status.
- Summary cards on top, Recharts bar chart, overdue table below with a "record payment" shortcut.
- **Performance:** rely on the indexes from the schema; `select` only the columns you need; no N+1 (use `include` / joins). Run `EXPLAIN ANALYZE` on any query that feels slow.

### Done when
- The dashboard loads in <2 s with the 5k-subscription seed (check the Network tab).

---

## Phase 10: Seed Data, Performance, Polish, Demo (about 60+ min)

1. **Seed script** `prisma/seed.ts` (`npx tsx prisma/seed.ts`, wired as `prisma.seed`). Use `createMany` for bulk inserts:
   - 1 admin (`admin@brightloop.dev`), 2 staff, 50 customers (+ users)
   - 5 products incl. one with Brand variants (Odoo +560), 4 plans (daily/weekly/monthly/yearly), 2 taxes, 3 discounts (one expired, one exhausted, one valid)
   - **5,000 subscriptions** in mixed statuses with `nextBillingDate` spread around today, plus ~300 invoices, ~150 payments
   - Print the demo credentials at the end.
2. **Perf check:** list pages and dashboard <2 s with seed data. Fix slow queries with `EXPLAIN ANALYZE` or by adding the missing `@@index`.
3. **Polish:** loading skeletons, toasts for success/error, empty states, status badge colors, mobile-friendly tables.
4. **README.md** with setup steps (`docker run` Postgres, `.env`, `prisma db push`, seed, `npm run dev`) and demo credentials.
5. **Deploy** `[STRETCH]`: Vercel + Neon/Supabase. Use the pooled connection string, add `prisma generate` to the build step, set env vars.

---

## Acceptance Checklist (map to the problem statement; tick every one before demo)

**Accounts & access**
- [ ] Email unique; password >8 chars with upper, lower, special
- [ ] Reset link emailed to the registered address
- [ ] Admin / staff / customer see different things; only admin creates staff

**Catalog**
- [ ] Product: name, type, sales price, cost price, notes, variants (Odoo +560)
- [ ] Plan: price, period (D/W/M/Y), min qty, available dates, per-plan close/pause/renew/auto-close

**Subscriptions**
- [ ] Quotation template → subscription with number, customer, plan, dates, payment terms, lines
- [ ] Draft → Quotation → Confirmed → Active → Closed, visible to the team

**Billing**
- [ ] Invoices generated from subscriptions automatically, no duplicates, none skipped
- [ ] Taxes auto-calculated; invoice Draft → Confirmed → Paid; confirm/cancel/send/print
- [ ] Discounts (admin only) auto-apply, then stop on expiry or usage limit

**Payments & reporting**
- [ ] Payment recorded with method, amount, date, note against an invoice
- [ ] Paid vs outstanding vs overdue visible at any time
- [ ] Dashboard: active subs, revenue, payments, overdue with filters; <2 s

---

## Priority Cut-Line (if time runs short)

**Never cut:** auth + roles, product/plan, subscription lifecycle, billing run with no-duplicates, payments, dashboard summary.
**Cut first:** email sending polish → PDF-style print → portal "Pay now" → charts (keep cards) → deployment.

## Demo Script (5 min)
1. Sign up as a customer, show weak-password rejection, trigger password reset.
2. Admin: create a product with an Odoo variant, create a plan, create a discount.
3. Staff: create a subscription from a template, walk Draft → Active.
4. Click **Run billing**: invoices appear with tax + discount. Click it again: 0 created.
5. Record a partial payment, then a full one. Show Paid vs Outstanding.
6. Dashboard: active subs, revenue, overdue list, filters, load time.
7. Log in as a customer: see only their own subscriptions and invoices.

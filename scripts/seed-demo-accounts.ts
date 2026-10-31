import { PrismaClient, SubStatus, InvoiceStatus, PayMethod, TaxType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const dbUrl = (process.env.DATABASE_URL || '').includes('connect_timeout')
  ? process.env.DATABASE_URL
  : `${process.env.DATABASE_URL}&connect_timeout=30`

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
})

async function connectWithRetry(retries = 5, delay = 2500) {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('⚡ Connected to Neon PostgreSQL database!')
      return
    } catch (err: any) {
      console.log(`⏳ Database warming up (attempt ${i}/${retries})...`)
      if (i === retries) throw err
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

async function main() {
  console.log('🚀 Starting demo account enrichment & data isolation...')
  await connectWithRetry()

  // 1. Ensure password hash for demo accounts
  const passwordHash = await bcrypt.hash('Admin@1234', 10)

  // 2. Setup/Enrich Admin Demo Account (admin@cadence.dev)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cadence.dev' },
    update: {
      name: 'Cadence Administrator',
      role: 'ADMIN',
      passwordHash,
    },
    create: {
      email: 'admin@cadence.dev',
      name: 'Cadence Administrator',
      role: 'ADMIN',
      passwordHash,
    },
  })
  console.log('✅ Admin demo user ready:', adminUser.email)

  // 3. Setup/Enrich Customer Demo Account (robert.fox@example.com)
  const customerUser = await prisma.user.upsert({
    where: { email: 'robert.fox@example.com' },
    update: {
      name: 'Robert Fox',
      role: 'CUSTOMER',
      passwordHash,
    },
    create: {
      email: 'robert.fox@example.com',
      name: 'Robert Fox',
      role: 'CUSTOMER',
      passwordHash,
    },
  })

  // Ensure Customer record for Robert Fox
  const robertCustomer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {
      companyName: 'Fox Global Studios',
      phone: '+91 98765 43210',
      address: '102 Cyber City, DLF Phase 2, Gurugram, Haryana 122002',
    },
    create: {
      userId: customerUser.id,
      companyName: 'Fox Global Studios',
      phone: '+91 98765 43210',
      address: '102 Cyber City, DLF Phase 2, Gurugram, Haryana 122002',
    },
  })
  console.log('✅ Robert Fox demo customer profile ready:', robertCustomer.id)

  // 4. Update / Standardize Plans to clean INR (₹)
  const starterPlan = await prisma.plan.upsert({
    where: { id: 'plan-starter-inr' },
    update: {
      name: 'Starter Plan',
      price: 499,
      billingPeriod: 'MONTHLY',
      availableFrom: new Date('2026-01-01'),
      minQuantity: 1,
      pausable: true,
      renewable: true,
    },
    create: {
      id: 'plan-starter-inr',
      name: 'Starter Plan',
      price: 499,
      billingPeriod: 'MONTHLY',
      availableFrom: new Date('2026-01-01'),
      minQuantity: 1,
      pausable: true,
      renewable: true,
    },
  })

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan-pro-inr' },
    update: {
      name: 'Pro Growth Plan',
      price: 1499,
      billingPeriod: 'MONTHLY',
      availableFrom: new Date('2026-01-01'),
      minQuantity: 1,
      pausable: true,
      renewable: true,
    },
    create: {
      id: 'plan-pro-inr',
      name: 'Pro Growth Plan',
      price: 1499,
      billingPeriod: 'MONTHLY',
      availableFrom: new Date('2026-01-01'),
      minQuantity: 1,
      pausable: true,
      renewable: true,
    },
  })

  const enterprisePlan = await prisma.plan.upsert({
    where: { id: 'plan-enterprise-inr' },
    update: {
      name: 'Enterprise Annual',
      price: 4999,
      billingPeriod: 'YEARLY',
      availableFrom: new Date('2026-01-01'),
      minQuantity: 1,
      pausable: true,
      renewable: true,
    },
    create: {
      id: 'plan-enterprise-inr',
      name: 'Enterprise Annual',
      price: 4999,
      billingPeriod: 'YEARLY',
      availableFrom: new Date('2026-01-01'),
      minQuantity: 1,
      pausable: true,
      renewable: true,
    },
  })
  console.log('✅ Standard INR plans configured: Starter (₹499), Pro (₹1,499), Enterprise (₹4,999)')

  // 5. Products & GST
  const gstTax = await prisma.tax.upsert({
    where: { id: 'tax-gst-18' },
    update: { name: 'GST (18%)', type: TaxType.PERCENTAGE, value: 18, isActive: true },
    create: { id: 'tax-gst-18', name: 'GST (18%)', type: TaxType.PERCENTAGE, value: 18, isActive: true },
  })

  const coreProduct = await prisma.product.upsert({
    where: { id: 'prod-core-engine' },
    update: {
      name: 'Recurring Billing Engine Core',
      type: 'SERVICE',
      salesPrice: 1499,
      costPrice: 500,
      isActive: true,
    },
    create: {
      id: 'prod-core-engine',
      name: 'Recurring Billing Engine Core',
      type: 'SERVICE',
      salesPrice: 1499,
      costPrice: 500,
      isActive: true,
    },
  })

  const addonProduct = await prisma.product.upsert({
    where: { id: 'prod-invoicing-addon' },
    update: {
      name: 'Automated Invoicing & E-Way Addon',
      type: 'SERVICE',
      salesPrice: 499,
      costPrice: 150,
      isActive: true,
    },
    create: {
      id: 'prod-invoicing-addon',
      name: 'Automated Invoicing & E-Way Addon',
      type: 'SERVICE',
      salesPrice: 499,
      costPrice: 150,
      isActive: true,
    },
  })

  // 6. ISOLATION: Clean up test subscriptions, invoices, and payments on NON-DEMO customer accounts!
  // Keep seed data ONLY on Robert Fox (robert.fox@example.com)!
  const nonDemoCustomers = await prisma.customer.findMany({
    where: {
      user: {
        email: { not: 'robert.fox@example.com' },
      },
    },
    select: { id: true, user: { select: { email: true } } },
  })

  console.log(`🧹 Cleaning test data from ${nonDemoCustomers.length} other profiles to guarantee isolation...`)
  for (const c of nonDemoCustomers) {
    // Delete payments
    await prisma.payment.deleteMany({ where: { customerId: c.id } })
    // Delete invoice lines and discount lines
    const invs = await prisma.invoice.findMany({ where: { customerId: c.id }, select: { id: true } })
    const invIds = invs.map((i) => i.id)
    if (invIds.length > 0) {
      await prisma.invoiceLine.deleteMany({ where: { invoiceId: { in: invIds } } })
      await prisma.invoiceDiscountLine.deleteMany({ where: { invoiceId: { in: invIds } } })
      await prisma.invoice.deleteMany({ where: { customerId: c.id } })
    }
    // Delete subscription lines and subscriptions
    const subs = await prisma.subscription.findMany({ where: { customerId: c.id }, select: { id: true } })
    const subIds = subs.map((s) => s.id)
    if (subIds.length > 0) {
      await prisma.subscriptionLine.deleteMany({ where: { subscriptionId: { in: subIds } } })
      await prisma.subscription.deleteMany({ where: { customerId: c.id } })
    }
    console.log(`   Cleared data for ${c.user?.email || c.id}`)
  }

  // 7. Clear old Robert Fox demo records and populate with rich, verified demo data
  await prisma.payment.deleteMany({ where: { customerId: robertCustomer.id } })
  const rInvs = await prisma.invoice.findMany({ where: { customerId: robertCustomer.id }, select: { id: true } })
  const rInvIds = rInvs.map((i) => i.id)
  if (rInvIds.length > 0) {
    await prisma.invoiceLine.deleteMany({ where: { invoiceId: { in: rInvIds } } })
    await prisma.invoiceDiscountLine.deleteMany({ where: { invoiceId: { in: rInvIds } } })
    await prisma.invoice.deleteMany({ where: { customerId: robertCustomer.id } })
  }
  const rSubs = await prisma.subscription.findMany({ where: { customerId: robertCustomer.id }, select: { id: true } })
  const rSubIds = rSubs.map((s) => s.id)
  if (rSubIds.length > 0) {
    await prisma.subscriptionLine.deleteMany({ where: { subscriptionId: { in: rSubIds } } })
    await prisma.subscription.deleteMany({ where: { customerId: robertCustomer.id } })
  }

  console.log('✨ Generating rich demo data for Robert Fox...')

  // 8. Create Subscriptions for Robert Fox:
  const now = new Date()

  // 8A. Primary ACTIVE Subscription
  const nextBilling = new Date(now)
  nextBilling.setDate(nextBilling.getDate() + 18) // in 18 days

  const expiryActive = new Date(now)
  expiryActive.setMonth(expiryActive.getMonth() + 12)

  const activeSub = await prisma.subscription.create({
    data: {
      customerId: robertCustomer.id,
      planId: proPlan.id,
      status: SubStatus.ACTIVE,
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      expiryDate: expiryActive,
      nextBillingDate: nextBilling,
      paymentTermDays: 15,
      lines: {
        create: [
          {
            productId: coreProduct.id,
            description: 'Recurring Billing Engine Core - Pro',
            quantity: 1,
            unitPrice: 1499,
            taxRate: 18,
            taxType: TaxType.PERCENTAGE,
            amount: 1499,
          },
          {
            productId: addonProduct.id,
            description: 'Automated Invoicing & E-Way Addon',
            quantity: 1,
            unitPrice: 499,
            taxRate: 18,
            taxType: TaxType.PERCENTAGE,
            amount: 499,
          },
        ],
      },
    },
  })
  console.log('   Created Active Subscription #', activeSub.seq)

  // 8B. A Quotation in Progress
  const quoteExpiry = new Date(now)
  quoteExpiry.setDate(quoteExpiry.getDate() + 14)

  const quoteSub = await prisma.subscription.create({
    data: {
      customerId: robertCustomer.id,
      planId: enterprisePlan.id,
      status: SubStatus.QUOTATION,
      startDate: now,
      expiryDate: quoteExpiry,
      nextBillingDate: null,
      paymentTermDays: 30,
      lines: {
        create: [
          {
            productId: coreProduct.id,
            description: 'Enterprise Dedicated Server Instance',
            quantity: 1,
            unitPrice: 4999,
            taxRate: 18,
            taxType: TaxType.PERCENTAGE,
            amount: 4999,
          },
        ],
      },
    },
  })
  console.log('   Created Quotation Subscription #', quoteSub.seq)

  // 9. Invoices for Robert Fox:
  // 9A. Invoice 1: PAID (2 months ago)
  const d1 = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const d1Due = new Date(now.getFullYear(), now.getMonth() - 2, 16)
  const inv1 = await prisma.invoice.create({
    data: {
      customerId: robertCustomer.id,
      subscriptionId: activeSub.id,
      status: InvoiceStatus.PAID,
      periodStart: d1,
      periodEnd: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      issueDate: d1,
      dueDate: d1Due,
      subtotal: 1998,
      taxTotal: 359.64,
      discountTotal: 0,
      total: 2357.64,
      amountPaid: 2357.64,
      lines: {
        create: [
          {
            description: 'Recurring Billing Engine Core - Pro',
            quantity: 1,
            unitPrice: 1499,
            taxAmount: 269.82,
            amount: 1499,
          },
          {
            description: 'Automated Invoicing & E-Way Addon',
            quantity: 1,
            unitPrice: 499,
            taxAmount: 89.82,
            amount: 499,
          },
        ],
      },
      payments: {
        create: {
          customerId: robertCustomer.id,
          amount: 2357.64,
          method: PayMethod.CARD,
          date: d1Due,
          note: 'Online Card Payment - Ref #CAD-88421',
        },
      },
    },
  })

  // 9B. Invoice 2: PAID (Last month)
  const d2 = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const d2Due = new Date(now.getFullYear(), now.getMonth() - 1, 16)
  const inv2 = await prisma.invoice.create({
    data: {
      customerId: robertCustomer.id,
      subscriptionId: activeSub.id,
      status: InvoiceStatus.PAID,
      periodStart: d2,
      periodEnd: new Date(now.getFullYear(), now.getMonth(), 1),
      issueDate: d2,
      dueDate: d2Due,
      subtotal: 1998,
      taxTotal: 359.64,
      discountTotal: 0,
      total: 2357.64,
      amountPaid: 2357.64,
      lines: {
        create: [
          {
            description: 'Recurring Billing Engine Core - Pro',
            quantity: 1,
            unitPrice: 1499,
            taxAmount: 269.82,
            amount: 1499,
          },
          {
            description: 'Automated Invoicing & E-Way Addon',
            quantity: 1,
            unitPrice: 499,
            taxAmount: 89.82,
            amount: 499,
          },
        ],
      },
      payments: {
        create: {
          customerId: robertCustomer.id,
          amount: 2357.64,
          method: PayMethod.UPI,
          date: d2Due,
          note: 'UPI Payment - Ref #UPI-CAD-99231',
        },
      },
    },
  })

  // 9C. Invoice 3: CONFIRMED (Current Period - Outstanding / Due Soon!)
  // Gives customer a real invoice to click "Pay Now"!
  const d3 = new Date(now.getFullYear(), now.getMonth(), 1)
  const d3Due = new Date(now)
  d3Due.setDate(d3Due.getDate() + 5)
  const inv3 = await prisma.invoice.create({
    data: {
      customerId: robertCustomer.id,
      subscriptionId: activeSub.id,
      status: InvoiceStatus.CONFIRMED,
      periodStart: d3,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      issueDate: d3,
      dueDate: d3Due,
      subtotal: 1998,
      taxTotal: 359.64,
      discountTotal: 0,
      total: 2357.64,
      amountPaid: 0,
      lines: {
        create: [
          {
            description: 'Recurring Billing Engine Core - Pro',
            quantity: 1,
            unitPrice: 1499,
            taxAmount: 269.82,
            amount: 1499,
          },
          {
            description: 'Automated Invoicing & E-Way Addon',
            quantity: 1,
            unitPrice: 499,
            taxAmount: 89.82,
            amount: 499,
          },
        ],
      },
    },
  })

  console.log('✅ Created 3 Invoices for Robert Fox:')
  console.log(`   - Inv #${inv1.seq}: PAID ₹2,357.64`)
  console.log(`   - Inv #${inv2.seq}: PAID ₹2,357.64`)
  console.log(`   - Inv #${inv3.seq}: CONFIRMED (Due) ₹2,357.64 with [Pay Now] ready`)

  console.log('\n🎉 Demo accounts successfully enriched & non-demo data strictly isolated!')
}

main()
  .catch((e) => {
    console.error('Error running demo seeding:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

import { db } from '../lib/db'
import bcrypt from 'bcryptjs'
import { Role, BillingPeriod, SubStatus, InvoiceStatus, PayMethod, TaxType, DiscountType, DiscountScope } from '@prisma/client'

async function main() {
  console.log('🌱 Starting Cadence database seed...')

  // 1. Password hash
  const defaultPasswordHash = await bcrypt.hash('Admin@1234', 10)

  // 2. Upsert Admin & Staff users
  const adminUser = await db.user.upsert({
    where: { email: 'admin@cadence.dev' },
    update: { role: Role.ADMIN, name: 'Admin User' },
    create: {
      email: 'admin@cadence.dev',
      name: 'Admin User',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
    },
  })

  // Also make sure admin@brightloop.dev has ADMIN role if present
  try {
    await db.user.update({
      where: { email: 'admin@brightloop.dev' },
      data: { role: Role.ADMIN },
    })
  } catch {}

  const staffUser = await db.user.upsert({
    where: { email: 'staff@cadence.dev' },
    update: { role: Role.STAFF, name: 'Billing Specialist' },
    create: {
      email: 'staff@cadence.dev',
      name: 'Billing Specialist',
      passwordHash: defaultPasswordHash,
      role: Role.STAFF,
    },
  })

  // 3. Customers from Reference Screenshots
  // Robert Fox (Admin / Customer from screenshot 2)
  const robertUser = await db.user.upsert({
    where: { email: 'robert.fox@example.com' },
    update: { name: 'Robert Fox' },
    create: {
      email: 'robert.fox@example.com',
      name: 'Robert Fox',
      passwordHash: defaultPasswordHash,
      role: Role.CUSTOMER,
    },
  })

  const robertCustomer = await db.customer.upsert({
    where: { userId: robertUser.id },
    update: {
      companyName: 'SaaS Patterns',
      phone: '(704) 555-0127',
      address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    },
    create: {
      userId: robertUser.id,
      companyName: 'SaaS Patterns',
      phone: '(704) 555-0127',
      address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
    },
  })

  // Darrell Steward (From screenshot 2: Invoice #1019)
  const darrellUser = await db.user.upsert({
    where: { email: 'darrell.steward@example.com' },
    update: { name: 'Darrell Steward' },
    create: {
      email: 'darrell.steward@example.com',
      name: 'Darrell Steward',
      passwordHash: defaultPasswordHash,
      role: Role.CUSTOMER,
    },
  })

  const darrellCustomer = await db.customer.upsert({
    where: { userId: darrellUser.id },
    update: {
      companyName: 'Steward Cloud Systems',
      phone: '(315) 555-0143',
      address: '2118 Thornridge Cir. Syracuse, Connecticut 35624',
    },
    create: {
      userId: darrellUser.id,
      companyName: 'Steward Cloud Systems',
      phone: '(315) 555-0143',
      address: '2118 Thornridge Cir. Syracuse, Connecticut 35624',
    },
  })

  // Jackson Graham
  const jacksonUser = await db.user.upsert({
    where: { email: 'jackson.graham@example.com' },
    update: { name: 'Jackson Graham' },
    create: {
      email: 'jackson.graham@example.com',
      name: 'Jackson Graham',
      passwordHash: defaultPasswordHash,
      role: Role.CUSTOMER,
    },
  })

  const jacksonCustomer = await db.customer.upsert({
    where: { userId: jacksonUser.id },
    update: {
      companyName: 'Graham Technologies',
      phone: '(206) 555-0199',
      address: '4517 Washington Ave. Manchester, Kentucky 39495',
    },
    create: {
      userId: jacksonUser.id,
      companyName: 'Graham Technologies',
      phone: '(206) 555-0199',
      address: '4517 Washington Ave. Manchester, Kentucky 39495',
    },
  })

  // Wade Warren
  const wadeUser = await db.user.upsert({
    where: { email: 'wade.warren@example.com' },
    update: { name: 'Wade Warren' },
    create: {
      email: 'wade.warren@example.com',
      name: 'Wade Warren',
      passwordHash: defaultPasswordHash,
      role: Role.CUSTOMER,
    },
  })

  const wadeCustomer = await db.customer.upsert({
    where: { userId: wadeUser.id },
    update: {
      companyName: 'Warren Digital Studios',
      phone: '(602) 555-0182',
      address: '1901 Thornridge Cir. Shiloh, Hawaii 81063',
    },
    create: {
      userId: wadeUser.id,
      companyName: 'Warren Digital Studios',
      phone: '(602) 555-0182',
      address: '1901 Thornridge Cir. Shiloh, Hawaii 81063',
    },
  })

  // 4. Taxes
  let vatTax = await db.tax.findFirst({ where: { name: 'VAT (10%)' } })
  if (!vatTax) {
    vatTax = await db.tax.create({
      data: {
        name: 'VAT (10%)',
        type: TaxType.PERCENTAGE,
        value: 10.0,
        isActive: true,
      },
    })
  }

  let gstTax = await db.tax.findFirst({ where: { name: 'GST (18%)' } })
  if (!gstTax) {
    gstTax = await db.tax.create({
      data: {
        name: 'GST (18%)',
        type: TaxType.PERCENTAGE,
        value: 18.0,
        isActive: true,
      },
    })
  }

  // 5. Products & Variants
  let basicProduct = await db.product.findFirst({ where: { name: 'Basic Plan' } })
  if (!basicProduct) {
    basicProduct = await db.product.create({
      data: {
        name: 'Basic Plan',
        type: 'service',
        salesPrice: 9.99,
        costPrice: 2.0,
        notes: 'Starter tier recurring plan',
        isActive: true,
      },
    })
  }

  let proProduct = await db.product.findFirst({ where: { name: 'Pro Plan' } })
  if (!proProduct) {
    proProduct = await db.product.create({
      data: {
        name: 'Pro Plan',
        type: 'service',
        salesPrice: 29.0,
        costPrice: 5.0,
        notes: 'Professional tier with full automation and real-time syncing',
        isActive: true,
        variants: {
          create: [
            { attribute: 'Integration', value: 'Odoo Connector', extraPrice: 560.0 },
            { attribute: 'Cluster', value: 'Dedicated Cloud', extraPrice: 1200.0 },
          ],
        },
      },
    })
  }

  let enterpriseProduct = await db.product.findFirst({ where: { name: 'Enterprise Billing Core' } })
  if (!enterpriseProduct) {
    enterpriseProduct = await db.product.create({
      data: {
        name: 'Enterprise Billing Core',
        type: 'service',
        salesPrice: 499.0,
        costPrice: 80.0,
        notes: 'Full-featured enterprise idempotency & multi-tenant invoicing',
        isActive: true,
      },
    })
  }

  // 6. Plans
  let basicPlan = await db.plan.findFirst({ where: { name: 'Basic Plan - $9.99' } })
  if (!basicPlan) {
    basicPlan = await db.plan.create({
      data: {
        name: 'Basic Plan - $9.99',
        price: 9.99,
        billingPeriod: BillingPeriod.MONTHLY,
        minQuantity: 1,
        availableFrom: new Date('2023-01-01'),
        autoCloseOnEnd: false,
        closable: true,
        pausable: true,
        renewable: true,
        isActive: true,
      },
    })
  }

  let proPlan = await db.plan.findFirst({ where: { name: 'Pro Plan' } })
  if (!proPlan) {
    proPlan = await db.plan.create({
      data: {
        name: 'Pro Plan',
        price: 29.0,
        billingPeriod: BillingPeriod.MONTHLY,
        minQuantity: 1,
        availableFrom: new Date('2023-01-01'),
        autoCloseOnEnd: false,
        closable: true,
        pausable: true,
        renewable: true,
        isActive: true,
      },
    })
  }

  let enterprisePlan = await db.plan.findFirst({ where: { name: 'Enterprise Annual' } })
  if (!enterprisePlan) {
    enterprisePlan = await db.plan.create({
      data: {
        name: 'Enterprise Annual',
        price: 499.0,
        billingPeriod: BillingPeriod.MONTHLY,
        minQuantity: 1,
        availableFrom: new Date('2023-01-01'),
        autoCloseOnEnd: false,
        closable: true,
        pausable: true,
        renewable: true,
        isActive: true,
      },
    })
  }

  // 7. Discounts
  let promoDiscount = await db.discount.findFirst({ where: { name: 'HACKATHON2026' } })
  if (!promoDiscount) {
    promoDiscount = await db.discount.create({
      data: {
        name: 'HACKATHON2026',
        type: DiscountType.PERCENTAGE,
        value: 15.0,
        scope: DiscountScope.SUBSCRIPTION,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        usageLimit: 100,
        usedCount: 12,
        isActive: true,
      },
    })
  }

  // 8. Subscriptions
  // Darrell's subscription for Basic Plan (linked to Invoice #1019)
  let darrellSub = await db.subscription.findFirst({
    where: { customerId: darrellCustomer.id, planId: basicPlan.id },
  })
  if (!darrellSub) {
    darrellSub = await db.subscription.create({
      data: {
        customerId: darrellCustomer.id,
        planId: basicPlan.id,
        status: SubStatus.ACTIVE,
        isPaused: false,
        startDate: new Date('2023-07-01'),
        expiryDate: new Date('2027-07-01'),
        paymentTermDays: 20,
        nextBillingDate: new Date(),
        lines: {
          create: [
            {
              productId: basicProduct.id,
              description: 'Basic Plan',
              quantity: 1,
              unitPrice: 9.99,
              taxRate: 0,
              taxType: TaxType.PERCENTAGE,
              amount: 9.99,
            },
          ],
        },
      },
    })
  }

  // Robert's subscription for Pro Plan
  let robertSub = await db.subscription.findFirst({
    where: { customerId: robertCustomer.id, planId: proPlan.id },
  })
  if (!robertSub) {
    robertSub = await db.subscription.create({
      data: {
        customerId: robertCustomer.id,
        planId: proPlan.id,
        status: SubStatus.ACTIVE,
        isPaused: false,
        startDate: new Date('2025-06-01'),
        expiryDate: new Date('2027-06-01'),
        paymentTermDays: 15,
        nextBillingDate: new Date(), // due today! Can test Run Billing!
        lines: {
          create: [
            {
              productId: proProduct.id,
              description: 'Pro Plan – Monthly',
              quantity: 1,
              unitPrice: 29.0,
              taxRate: 0,
              taxType: TaxType.PERCENTAGE,
              amount: 29.0,
            },
          ],
        },
      },
    })
  }

  // Jackson's subscription (Confirmed)
  let jacksonSub = await db.subscription.findFirst({
    where: { customerId: jacksonCustomer.id },
  })
  if (!jacksonSub) {
    jacksonSub = await db.subscription.create({
      data: {
        customerId: jacksonCustomer.id,
        planId: enterprisePlan.id,
        status: SubStatus.CONFIRMED,
        isPaused: false,
        startDate: new Date('2026-02-01'),
        expiryDate: new Date('2027-02-01'),
        paymentTermDays: 30,
        nextBillingDate: new Date('2026-03-01'),
        lines: {
          create: [
            {
              productId: enterpriseProduct.id,
              description: 'Enterprise Billing Core',
              quantity: 1,
              unitPrice: 499.0,
              taxRate: 18,
              taxType: TaxType.PERCENTAGE,
              amount: 499.0,
            },
          ],
        },
      },
    })
  }

  // Wade's subscription (Quotation)
  let wadeSub = await db.subscription.findFirst({
    where: { customerId: wadeCustomer.id },
  })
  if (!wadeSub) {
    wadeSub = await db.subscription.create({
      data: {
        customerId: wadeCustomer.id,
        planId: proPlan.id,
        status: SubStatus.QUOTATION,
        isPaused: false,
        startDate: new Date('2026-04-01'),
        expiryDate: new Date('2027-04-01'),
        paymentTermDays: 15,
        lines: {
          create: [
            {
              productId: proProduct.id,
              description: 'Pro Plan – Monthly (Quotation)',
              quantity: 1,
              unitPrice: 29.0,
              taxRate: 0,
              taxType: TaxType.PERCENTAGE,
              amount: 29.0,
            },
          ],
        },
      },
    })
  }

  // 9. Invoices matching reference Image 1 & Image 2
  // Invoice #1019 (Exact match from screenshot 2)
  const existingInv1019 = await db.invoice.findFirst({
    where: { customerId: darrellCustomer.id, total: 9.99 },
  })
  if (!existingInv1019) {
    const inv1019 = await db.invoice.create({
      data: {
        subscriptionId: darrellSub.id,
        customerId: darrellCustomer.id,
        status: InvoiceStatus.PAID,
        periodStart: new Date('2023-07-01'),
        periodEnd: new Date('2023-07-31'),
        issueDate: new Date('2023-07-31'),
        dueDate: new Date('2023-08-20'),
        subtotal: 9.99,
        taxTotal: 0,
        discountTotal: 0,
        total: 9.99,
        amountPaid: 9.99,
        lines: {
          create: [
            {
              description: 'Basic Plan',
              quantity: 1,
              unitPrice: 9.99,
              taxAmount: 0,
              amount: 9.99,
            },
          ],
        },
        payments: {
          create: [
            {
              customerId: darrellCustomer.id,
              method: PayMethod.CARD,
              amount: 9.99,
              date: new Date('2023-08-15'),
              note: 'Paid with Visa ending in 6888',
            },
          ],
        },
      },
    })
    console.log('Created Invoice #1019 matching screenshot 2:', inv1019.id)
  }

  // Invoices matching Screenshot 1 table:
  // Aug 03, 2025 | Pro Plan - Monthly | $29.00 | Paid
  const existingInvAug03 = await db.invoice.findFirst({
    where: { customerId: robertCustomer.id, periodStart: new Date('2025-08-01') },
  })
  if (!existingInvAug03) {
    await db.invoice.create({
      data: {
        subscriptionId: robertSub.id,
        customerId: robertCustomer.id,
        status: InvoiceStatus.PAID,
        periodStart: new Date('2025-08-01'),
        periodEnd: new Date('2025-08-31'),
        issueDate: new Date('2025-08-03'),
        dueDate: new Date('2025-08-18'),
        subtotal: 29.0,
        taxTotal: 0,
        discountTotal: 0,
        total: 29.0,
        amountPaid: 29.0,
        lines: {
          create: [
            {
              description: 'Pro Plan – Monthly',
              quantity: 1,
              unitPrice: 29.0,
              taxAmount: 0,
              amount: 29.0,
            },
          ],
        },
        payments: {
          create: [
            {
              customerId: robertCustomer.id,
              method: PayMethod.CARD,
              amount: 29.0,
              date: new Date('2025-08-03'),
              note: 'Stripe autopay transaction',
            },
          ],
        },
      },
    })
  }

  // Aug 01, 2025 | Pro Plan - Monthly | $29.00 | Failed
  const existingInvAug01 = await db.invoice.findFirst({
    where: { customerId: robertCustomer.id, periodStart: new Date('2025-07-15') },
  })
  if (!existingInvAug01) {
    await db.invoice.create({
      data: {
        subscriptionId: robertSub.id,
        customerId: robertCustomer.id,
        status: InvoiceStatus.CONFIRMED, // Unpaid / Failed attempt
        periodStart: new Date('2025-07-15'),
        periodEnd: new Date('2025-07-31'),
        issueDate: new Date('2025-08-01'),
        dueDate: new Date('2025-08-16'),
        subtotal: 29.0,
        taxTotal: 0,
        discountTotal: 0,
        total: 29.0,
        amountPaid: 0,
        lines: {
          create: [
            {
              description: 'Pro Plan – Monthly (Retry Failed)',
              quantity: 1,
              unitPrice: 29.0,
              taxAmount: 0,
              amount: 29.0,
            },
          ],
        },
      },
    })
  }

  // Jul 01, 2025 | Pro Plan - Monthly | $29.00 | Paid
  const existingInvJul01 = await db.invoice.findFirst({
    where: { customerId: robertCustomer.id, periodStart: new Date('2025-06-01') },
  })
  if (!existingInvJul01) {
    await db.invoice.create({
      data: {
        subscriptionId: robertSub.id,
        customerId: robertCustomer.id,
        status: InvoiceStatus.PAID,
        periodStart: new Date('2025-06-01'),
        periodEnd: new Date('2025-06-30'),
        issueDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-16'),
        subtotal: 29.0,
        taxTotal: 0,
        discountTotal: 0,
        total: 29.0,
        amountPaid: 29.0,
        lines: {
          create: [
            {
              description: 'Pro Plan – Monthly',
              quantity: 1,
              unitPrice: 29.0,
              taxAmount: 0,
              amount: 29.0,
            },
          ],
        },
        payments: {
          create: [
            {
              customerId: robertCustomer.id,
              method: PayMethod.CARD,
              amount: 29.0,
              date: new Date('2025-07-01'),
              note: 'Card autopay',
            },
          ],
        },
      },
    })
  }

  console.log('✅ Cadence database successfully seeded!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })


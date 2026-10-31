import { config } from 'dotenv'
config()

import { PrismaClient, Role, BillingPeriod, TaxType, DiscountType, DiscountScope, SubStatus, InvoiceStatus, PayMethod } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const db = new PrismaClient()

// Helper to format currency in output
const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

async function main() {
  console.log('====================================================================')
  console.log('            CADENCE BILLING ENGINE: PHASE 10 SEED')
  console.log('====================================================================\n')

  // 1. Neon Database Connection Warm-up
  console.log('1. Connecting to Neon PostgreSQL...')
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await db.$queryRaw`SELECT 1`
      console.log('   ✓ Connected to database.')
      break
    } catch (e: any) {
      if (attempt === 5) throw e
      console.log(`   Waiting for Neon serverless pooler (attempt ${attempt}/5)...`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  const passwordHash = await bcrypt.hash('Password123!', 10)

  // 2. Seed Admin & Staff Users
  console.log('\n2. Seeding Admin & Staff Accounts...')
  const admin = await db.user.upsert({
    where: { email: 'admin@brightloop.dev' },
    update: { role: Role.ADMIN, passwordHash },
    create: {
      name: 'Admin Brightloop',
      email: 'admin@brightloop.dev',
      passwordHash,
      role: Role.ADMIN,
    },
  })
  console.log(`   ✓ Admin user ready: ${admin.email}`)

  const staff1 = await db.user.upsert({
    where: { email: 'staff1@brightloop.dev' },
    update: { role: Role.STAFF, passwordHash },
    create: {
      name: 'Sarah Mitchell',
      email: 'staff1@brightloop.dev',
      passwordHash,
      role: Role.STAFF,
    },
  })

  const staff2 = await db.user.upsert({
    where: { email: 'staff2@brightloop.dev' },
    update: { role: Role.STAFF, passwordHash },
    create: {
      name: 'Marcus Chen',
      email: 'staff2@brightloop.dev',
      passwordHash,
      role: Role.STAFF,
    },
  })
  console.log(`   ✓ Staff users ready: ${staff1.email}, ${staff2.email}`)

  // 3. Seed 50 Customers + Users
  console.log('\n3. Seeding 50 Customers + Associated Users...')
  const customerCompanyNames = [
    'Acme Global Corp', 'Apex Cloud Solutions', 'Nexus AI Robotics', 'Zenith Retail Group',
    'Hyperion Energy Systems', 'Vanguard Cyber Defense', 'Quantum Horizon Labs', 'BluePeak Logistics',
    'Starlight Telematics', 'Crestview Analytics', 'Ironclad Storage Systems', 'Aura Health Technologies',
    'Solstice Microgrid', 'Velociraptor Freight', 'Beacon Financial Media', 'OmniScale Dynamics',
    'Titan Heavy Compute', 'Elysium Space Optics', 'Krypton Semiconductor', 'Frontier AgriTech',
    'Atlas Infrastructure Ltd', 'Pinnacle ERP Solutions', 'Catalyst Media Network', 'PrimeWave Telecom',
    'Sierra Water & Power', 'Echo Stream Studios', 'Vortex Machine Vision', 'Silverline Biotech',
    'Horizon Urban Mobility', 'Nova Genomics Labs', 'Spectra Sensor Networks', 'Terraform Data Systems',
    'Orbit Satellite Tech', 'Falcon High Frequency', 'Sapphire Cloud Native', 'Redwood Industrial Robotics',
    'Pacific Marine Logistics', 'Aegis Compliance Engine', 'Keystone Cement & Building', 'Borealis Clean Energy',
    'Monolith Enterprise AI', 'Cerebral Quantum Logic', 'Prism Interactive AR', 'Strata Geotechnical Labs',
    'Helios Solar Array', 'Equinox Supply Networks', 'Trident Secure Systems', 'Onyx Capital Partners',
    'Polaris Navigation Inc', 'Zenith Aviation Services'
  ]

  const targetCustomerData = []
  for (let i = 1; i <= 50; i++) {
    const email = i === 1 ? 'customer@brightloop.dev' : `customer${i}@brightloop.dev`
    const name = i === 1 ? 'Demo Customer' : `Executive Customer ${i}`
    const company = customerCompanyNames[i - 1] || `Enterprise Customer ${i}`
    const phone = `+91 98${String(i).padStart(3, '0')} ${String(1000 + i)}`
    const address = `${100 + i} Innovation Boulevard, Suite ${i}, Cyber City`
    targetCustomerData.push({ email, name, company, phone, address })
  }

  const existingUsers = await db.user.findMany({
    where: { email: { in: targetCustomerData.map((c) => c.email) } },
    include: { customer: true },
  })
  const existingMap = new Map(existingUsers.map((u) => [u.email, u]))

  const customerEntities: { id: string; userId: string; companyName: string }[] = []

  // Create missing customers in small parallel chunks
  const toCreate = targetCustomerData.filter((c) => !existingMap.has(c.email))
  console.log(`   Found ${existingUsers.length} existing customers, creating ${toCreate.length} new customers...`)

  for (const existing of existingUsers) {
    if (existing.customer) {
      customerEntities.push({
        id: existing.customer.id,
        userId: existing.id,
        companyName: existing.customer.companyName || 'Enterprise Customer',
      })
    }
  }

  // Create in parallel batches of 10
  for (let i = 0; i < toCreate.length; i += 10) {
    const chunk = toCreate.slice(i, i + 10)
    const createdChunk = await Promise.all(
      chunk.map(async (c) => {
        const u = await db.user.create({
          data: {
            name: c.name,
            email: c.email,
            passwordHash,
            role: Role.CUSTOMER,
            customer: {
              create: {
                companyName: c.company,
                phone: c.phone,
                address: c.address,
              },
            },
          },
          include: { customer: true },
        })
        return {
          id: u.customer!.id,
          userId: u.id,
          companyName: c.company,
        }
      })
    )
    customerEntities.push(...createdChunk)
  }
  console.log(`   ✓ 50 Customers ready (Primary Demo: customer@brightloop.dev)`)

  // 4. Seed 2 Taxes
  console.log('\n4. Seeding Taxes (GST 18% & VAT 5%)...')
  let gstTax = await db.tax.findFirst({ where: { name: 'GST 18%' } })
  if (!gstTax) {
    gstTax = await db.tax.create({
      data: {
        name: 'GST 18%',
        type: TaxType.PERCENTAGE,
        value: 18.00,
        isActive: true,
      },
    })
  }

  let vatTax = await db.tax.findFirst({ where: { name: 'VAT 5%' } })
  if (!vatTax) {
    vatTax = await db.tax.create({
      data: {
        name: 'VAT 5%',
        type: TaxType.PERCENTAGE,
        value: 5.00,
        isActive: true,
      },
    })
  }
  console.log(`   ✓ Taxes configured: ${gstTax.name} (${gstTax.value}%), ${vatTax.name} (${vatTax.value}%)`)

  // 5. Seed 5 Products with Variants (incl. Odoo +560)
  console.log('\n5. Seeding 5 Products & Variants...')
  let prod1 = await db.product.findFirst({
    where: { name: 'Cadence Cloud Infrastructure' },
    include: { variants: true },
  })
  if (!prod1) {
    prod1 = await db.product.create({
      data: {
        name: 'Cadence Cloud Infrastructure',
        type: 'SERVICE',
        salesPrice: 4999.00,
        costPrice: 2100.00,
        notes: 'Dedicated enterprise multi-tenant cloud hosting cluster',
        isActive: true,
        variants: {
          create: [
            { attribute: 'Brand', value: 'Odoo (+560)', extraPrice: 560.00 }, // Required Odoo +560
            { attribute: 'Brand', value: 'SAP (+1200)', extraPrice: 1200.00 },
            { attribute: 'Region', value: 'AWS US-East', extraPrice: 0.00 },
            { attribute: 'Region', value: 'GCP Europe-West', extraPrice: 350.00 },
          ],
        },
        taxes: {
          create: { taxId: gstTax.id },
        },
      },
      include: { variants: true },
    })
  }

  let prod2 = await db.product.findFirst({ where: { name: 'Dedicated API Gateway' } })
  if (!prod2) {
    prod2 = await db.product.create({
      data: {
        name: 'Dedicated API Gateway',
        type: 'SERVICE',
        salesPrice: 1499.00,
        costPrice: 600.00,
        notes: 'Low-latency reverse proxy and rate limiting gateway',
        taxes: { create: { taxId: gstTax.id } },
      },
    })
  }

  let prod3 = await db.product.findFirst({ where: { name: 'High-Availability Redis Cache' } })
  if (!prod3) {
    prod3 = await db.product.create({
      data: {
        name: 'High-Availability Redis Cache',
        type: 'SERVICE',
        salesPrice: 899.00,
        costPrice: 350.00,
        notes: 'In-memory multi-node clustered session & cache store',
        taxes: { create: { taxId: gstTax.id } },
      },
    })
  }

  let prod4 = await db.product.findFirst({ where: { name: 'Automated Disaster Recovery Backup' } })
  if (!prod4) {
    prod4 = await db.product.create({
      data: {
        name: 'Automated Disaster Recovery Backup',
        type: 'SERVICE',
        salesPrice: 499.00,
        costPrice: 150.00,
        notes: 'Hourly write-ahead WAL replication and daily cold snaps',
        taxes: { create: { taxId: vatTax.id } },
      },
    })
  }

  let prod5 = await db.product.findFirst({ where: { name: 'Priority Enterprise 24/7 SLA' } })
  if (!prod5) {
    prod5 = await db.product.create({
      data: {
        name: 'Priority Enterprise 24/7 SLA',
        type: 'SERVICE',
        salesPrice: 2999.00,
        costPrice: 1000.00,
        notes: '15-minute response SLA with dedicated site reliability engineer',
        taxes: { create: { taxId: gstTax.id } },
      },
    })
  }
  console.log(`   ✓ 5 Products seeded with Odoo +560 brand variant.`)

  // 6. Seed 4 Plans (Daily, Weekly, Monthly, Yearly)
  console.log('\n6. Seeding 4 Billing Plans (Daily, Weekly, Monthly, Yearly)...')
  const plans = await Promise.all([
    db.plan.upsert({
      where: { id: 'seed-plan-daily' },
      update: {},
      create: {
        id: 'seed-plan-daily',
        name: 'Daily Micro Instances',
        billingPeriod: BillingPeriod.DAILY,
        price: 99.00,
        minQuantity: 1,
        availableFrom: new Date('2024-01-01'),
        closable: true,
        pausable: true,
        renewable: true,
        autoCloseOnEnd: false,
      },
    }),
    db.plan.upsert({
      where: { id: 'seed-plan-weekly' },
      update: {},
      create: {
        id: 'seed-plan-weekly',
        name: 'Weekly Sprint Tier',
        billingPeriod: BillingPeriod.WEEKLY,
        price: 499.00,
        minQuantity: 1,
        availableFrom: new Date('2024-01-01'),
        closable: true,
        pausable: true,
        renewable: true,
        autoCloseOnEnd: false,
      },
    }),
    db.plan.upsert({
      where: { id: 'seed-plan-monthly' },
      update: {},
      create: {
        id: 'seed-plan-monthly',
        name: 'Monthly Pro Tier',
        billingPeriod: BillingPeriod.MONTHLY,
        price: 1999.00,
        minQuantity: 1,
        availableFrom: new Date('2024-01-01'),
        closable: true,
        pausable: true,
        renewable: true,
        autoCloseOnEnd: false,
      },
    }),
    db.plan.upsert({
      where: { id: 'seed-plan-yearly' },
      update: {},
      create: {
        id: 'seed-plan-yearly',
        name: 'Annual Enterprise Tier',
        billingPeriod: BillingPeriod.YEARLY,
        price: 19999.00,
        minQuantity: 1,
        availableFrom: new Date('2024-01-01'),
        closable: true,
        pausable: false,
        renewable: true,
        autoCloseOnEnd: true,
      },
    }),
  ])
  console.log(`   ✓ 4 Plans ready: ${plans.map((p) => `${p.name} (${p.billingPeriod})`).join(', ')}`)

  // 7. Seed 3 Discounts (One Expired, One Exhausted, One Valid)
  console.log('\n7. Seeding Discounts (Expired, Exhausted, Valid)...')
  const expiredDiscount = await db.discount.upsert({
    where: { id: 'seed-discount-expired' },
    update: {},
    create: {
      id: 'seed-discount-expired',
      name: 'Black Friday 2024 Special',
      type: DiscountType.PERCENTAGE,
      value: 20.00,
      scope: DiscountScope.SUBSCRIPTION,
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-30'), // Expired
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    },
  })

  const exhaustedDiscount = await db.discount.upsert({
    where: { id: 'seed-discount-exhausted' },
    update: {},
    create: {
      id: 'seed-discount-exhausted',
      name: 'Early Bird Launch 50%',
      type: DiscountType.PERCENTAGE,
      value: 50.00,
      scope: DiscountScope.SUBSCRIPTION,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2028-12-31'),
      usageLimit: 50,
      usedCount: 50, // Exhausted
      isActive: true,
    },
  })

  const validDiscount = await db.discount.upsert({
    where: { id: 'seed-discount-valid' },
    update: {},
    create: {
      id: 'seed-discount-valid',
      name: 'Growth Partner Special 15%',
      type: DiscountType.PERCENTAGE,
      value: 15.00,
      scope: DiscountScope.SUBSCRIPTION,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 1000,
      usedCount: 14, // Valid and ready to apply
      isActive: true,
    },
  })
  console.log(`   ✓ 3 Discounts ready:`)
  console.log(`     - Expired:   ${expiredDiscount.name} (ended ${expiredDiscount.endDate.toISOString().split('T')[0]})`)
  console.log(`     - Exhausted: ${exhaustedDiscount.name} (${exhaustedDiscount.usedCount}/${exhaustedDiscount.usageLimit} used)`)
  console.log(`     - Valid:     ${validDiscount.name} (${validDiscount.usedCount}/${validDiscount.usageLimit} used)`)

  // 8. Seed Quotation Templates
  console.log('\n8. Seeding Quotation Templates...')
  let tmpl1 = await db.quotationTemplate.findFirst({ where: { name: 'Enterprise Cloud Bundle' } })
  if (!tmpl1) {
    tmpl1 = await db.quotationTemplate.create({
      data: {
        name: 'Enterprise Cloud Bundle',
        planId: plans[2].id, // Monthly
        validityDays: 30,
        lines: {
          create: [
            { productId: prod1.id, quantity: 1 },
            { productId: prod2.id, quantity: 1 },
          ],
        },
      },
    })
  }

  let tmpl2 = await db.quotationTemplate.findFirst({ where: { name: 'High-Availability Cluster' } })
  if (!tmpl2) {
    tmpl2 = await db.quotationTemplate.create({
      data: {
        name: 'High-Availability Cluster',
        planId: plans[3].id, // Yearly
        validityDays: 60,
        lines: {
          create: [
            { productId: prod1.id, quantity: 2 },
            { productId: prod3.id, quantity: 2 },
            { productId: prod4.id, quantity: 1 },
          ],
        },
      },
    })
  }
  console.log(`   ✓ Quotation Templates ready.`)

  // 9. Bulk Seed 5,000 Subscriptions & Lines
  console.log('\n9. Bulk Seeding 5,000 Subscriptions with Mixed Statuses...')
  const currentSubCount = await db.subscription.count()
  const TARGET_SUBS = 5000
  const neededSubs = Math.max(0, TARGET_SUBS - currentSubCount)

  if (neededSubs > 0) {
    console.log(`   Generating ${neededSubs} subscriptions in bulk (using createMany batches)...`)

    const statuses: SubStatus[] = [
      ...Array(60).fill(SubStatus.ACTIVE),     // 60% Active
      ...Array(15).fill(SubStatus.CONFIRMED),  // 15% Confirmed
      ...Array(10).fill(SubStatus.QUOTATION),  // 10% Quotation
      ...Array(10).fill(SubStatus.DRAFT),      // 10% Draft
      ...Array(5).fill(SubStatus.CLOSED),      // 5% Closed
    ]

    const allProducts = [prod1, prod2, prod3, prod4, prod5]
    const now = new Date()

    const subBatchSize = 1000
    let subsCreated = 0

    while (subsCreated < neededSubs) {
      const thisBatchSize = Math.min(subBatchSize, neededSubs - subsCreated)
      const subRecords: any[] = []
      const lineRecords: any[] = []

      for (let j = 0; j < thisBatchSize; j++) {
        const globalIdx = subsCreated + j
        const subId = crypto.randomUUID()
        const customer = customerEntities[globalIdx % customerEntities.length]
        const plan = plans[globalIdx % plans.length]
        const status = statuses[globalIdx % statuses.length]

        // Start date: 1 to 180 days ago
        const startDaysAgo = 10 + (globalIdx % 170)
        const startDate = new Date(now.getTime() - startDaysAgo * 86400000)
        const expiryDate = new Date(startDate.getTime() + 365 * 86400000)

        // Billing date spread:
        // For ~250 active subscriptions: nextBillingDate <= now (due for billing run!)
        let nextBillingDate: Date | null = null
        if (status === SubStatus.ACTIVE) {
          if (globalIdx < 250) {
            // Due now or in the past (e.g. 0 to 5 days ago)
            nextBillingDate = new Date(now.getTime() - (globalIdx % 6) * 86400000)
          } else {
            // Spread across the next 1-30 days
            nextBillingDate = new Date(now.getTime() + ((globalIdx % 30) + 1) * 86400000)
          }
        }

        subRecords.push({
          id: subId,
          customerId: customer.id,
          planId: plan.id,
          status,
          isPaused: status === SubStatus.ACTIVE && globalIdx % 20 === 0, // 5% paused
          startDate,
          expiryDate,
          paymentTermDays: 15,
          nextBillingDate,
          lastBilledThrough: nextBillingDate ? new Date(nextBillingDate.getTime() - 30 * 86400000) : null,
          createdAt: startDate,
        })

        // 1 to 2 lines per subscription
        const numLines = (globalIdx % 2) + 1
        for (let l = 0; l < numLines; l++) {
          const product = allProducts[(globalIdx + l) % allProducts.length]
          const qty = (globalIdx % 3) + 1
          const unitPrice = Number(product.salesPrice)
          const amount = unitPrice * qty

          lineRecords.push({
            id: crypto.randomUUID(),
            subscriptionId: subId,
            productId: product.id,
            variantId: product.id === prod1.id ? prod1.variants[0]?.id : null,
            description: `${product.name} (Allocation #${globalIdx + 1})`,
            quantity: qty,
            unitPrice,
            taxRate: 18.00,
            taxType: TaxType.PERCENTAGE,
            amount,
          })
        }
      }

      // Bulk insert subscriptions
      await db.subscription.createMany({
        data: subRecords,
        skipDuplicates: true,
      })

      // Bulk insert lines
      await db.subscriptionLine.createMany({
        data: lineRecords,
        skipDuplicates: true,
      })

      subsCreated += thisBatchSize
      console.log(`     -> Inserted batch: ${subsCreated} / ${neededSubs} subscriptions`)
    }
  } else {
    console.log(`   ✓ Already have ${currentSubCount} subscriptions (>= 5,000 threshold).`)
  }

  const finalSubCount = await db.subscription.count()
  console.log(`   ✓ Total subscriptions in database: ${finalSubCount}`)

  // 10. Seed ~300 Invoices & ~150 Payments
  console.log('\n10. Seeding ~300 Invoices & ~150 Payments...')
  const currentInvoiceCount = await db.invoice.count()
  const TARGET_INVOICES = 300
  const neededInvoices = Math.max(0, TARGET_INVOICES - currentInvoiceCount)

  if (neededInvoices > 0) {
    console.log(`   Generating ${neededInvoices} invoices in bulk...`)

    // Fetch active and confirmed subscriptions to anchor realistic invoices
    const sampleSubs = await db.subscription.findMany({
      where: { status: { in: [SubStatus.ACTIVE, SubStatus.CONFIRMED] } },
      take: neededInvoices + 50,
      include: { lines: true, customer: true },
    })

    const now = new Date()
    const invoiceRecords: any[] = []
    const invLineRecords: any[] = []
    const paymentRecords: any[] = []

    for (let k = 0; k < neededInvoices && k < sampleSubs.length; k++) {
      const sub = sampleSubs[k]
      const invId = crypto.randomUUID()

      // Calculate invoice totals from sub lines
      let subtotal = 0
      for (const line of sub.lines) {
        subtotal += Number(line.amount)
      }
      if (subtotal === 0) subtotal = 1999.00
      const taxTotal = Math.round(subtotal * 0.18 * 100) / 100
      const total = subtotal + taxTotal

      // Status distribution: ~150 PAID, ~100 CONFIRMED (with ~30 overdue), ~35 DRAFT, ~15 CANCELLED
      let status: InvoiceStatus = InvoiceStatus.PAID
      let amountPaid = total
      let dueDate: Date

      if (k < 150) {
        // Fully PAID
        status = InvoiceStatus.PAID
        amountPaid = total
        dueDate = new Date(now.getTime() - (20 + (k % 40)) * 86400000)
      } else if (k < 250) {
        // CONFIRMED
        status = InvoiceStatus.CONFIRMED
        if (k < 180) {
          // ~30 OVERDUE invoices: dueDate in the past, partial or 0 payment
          dueDate = new Date(now.getTime() - (3 + (k % 25)) * 86400000)
          amountPaid = k % 2 === 0 ? Math.round((total * 0.4) * 100) / 100 : 0
        } else {
          // Future due date
          dueDate = new Date(now.getTime() + (5 + (k % 20)) * 86400000)
          amountPaid = 0
        }
      } else if (k < 285) {
        // DRAFT
        status = InvoiceStatus.DRAFT
        amountPaid = 0
        dueDate = new Date(now.getTime() + 15 * 86400000)
      } else {
        // CANCELLED
        status = InvoiceStatus.CANCELLED
        amountPaid = 0
        dueDate = new Date(now.getTime() - 10 * 86400000)
      }

      const issueDate = new Date(dueDate.getTime() - 15 * 86400000)
      const periodStart = issueDate
      const periodEnd = new Date(issueDate.getTime() + 30 * 86400000)

      invoiceRecords.push({
        id: invId,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        status,
        periodStart,
        periodEnd,
        issueDate,
        dueDate,
        subtotal,
        taxTotal,
        discountTotal: 0,
        total,
        amountPaid,
      })

      // Invoice line
      invLineRecords.push({
        id: crypto.randomUUID(),
        invoiceId: invId,
        description: `Subscription Period: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
        quantity: 1,
        unitPrice: subtotal,
        taxAmount: taxTotal,
        amount: subtotal,
      })

      // If amountPaid > 0, generate payment ledger record
      if (amountPaid > 0) {
        const methods: PayMethod[] = [
          PayMethod.CARD,
          PayMethod.BANK_TRANSFER,
          PayMethod.UPI,
          PayMethod.CASH,
          PayMethod.CHEQUE,
        ]
        const method = methods[k % methods.length]
        const paymentDate = new Date(issueDate.getTime() + (2 + (k % 5)) * 86400000)

        paymentRecords.push({
          id: crypto.randomUUID(),
          invoiceId: invId,
          customerId: sub.customerId,
          method,
          amount: amountPaid,
          date: paymentDate,
          note: `Settlement via ${method} for invoice`,
          recordedById: admin.id,
        })
      }
    }

    // Insert invoices
    await db.invoice.createMany({
      data: invoiceRecords,
      skipDuplicates: true,
    })

    // Insert invoice lines
    await db.invoiceLine.createMany({
      data: invLineRecords,
      skipDuplicates: true,
    })

    // Insert payments
    if (paymentRecords.length > 0) {
      await db.payment.createMany({
        data: paymentRecords,
        skipDuplicates: true,
      })
    }

    console.log(`   ✓ Created ${invoiceRecords.length} invoices and ${paymentRecords.length} payment records.`)
  } else {
    console.log(`   ✓ Already have ${currentInvoiceCount} invoices (>= 300 threshold).`)
  }

  const finalInvoiceCount = await db.invoice.count()
  const finalPaymentCount = await db.payment.count()
  console.log(`   ✓ Total invoices in database: ${finalInvoiceCount}`)
  console.log(`   ✓ Total payments in database: ${finalPaymentCount}`)

  // 11. Performance Check: Test analytical query speed on 5k subscriptions
  console.log('\n11. Running Performance SLA Check (< 2s)...')
  const t0 = performance.now()
  const [activeCount, mrrSum, overdueCount] = await Promise.all([
    db.subscription.count({ where: { status: SubStatus.ACTIVE } }),
    db.$queryRaw<{ total: any }[]>`
      SELECT COALESCE(SUM(COALESCE(l."amount", p."price")), 0) as total
      FROM "Subscription" s
      JOIN "Plan" p ON s."planId" = p."id"
      LEFT JOIN "SubscriptionLine" l ON l."subscriptionId" = s."id"
      WHERE s."status" = 'ACTIVE'
    `,
    db.invoice.count({
      where: {
        status: InvoiceStatus.CONFIRMED,
        dueDate: { lt: new Date() },
      },
    }),
  ])
  const t1 = performance.now()
  const benchmarkMs = Math.round(t1 - t0)
  console.log(`   ✓ Analytical queries on ${finalSubCount} subscriptions completed in: ${benchmarkMs} ms`)
  if (benchmarkMs < 2000) {
    console.log(`   ✓ [PASS] Performance SLA verified under 2,000 ms SLA (${benchmarkMs} ms).`)
  } else {
    console.log(`   ⚠ [WARN] Query took ${benchmarkMs} ms.`)
  }

  // 12. Print Demo Credentials
  console.log('\n====================================================================')
  console.log('                     DEMO CREDENTIALS READY')
  console.log('====================================================================')
  console.log('  Role       | Email                      | Password')
  console.log('  -----------+----------------------------+-------------------------')
  console.log('  Admin      | admin@brightloop.dev       | Password123!')
  console.log('  Staff      | staff1@brightloop.dev      | Password123!')
  console.log('  Staff      | staff2@brightloop.dev      | Password123!')
  console.log('  Customer   | customer@brightloop.dev    | Password123!')
  console.log('  Customer   | customer2@brightloop.dev   | Password123!')
  console.log('====================================================================')
  console.log('  Seeded Summary:')
  console.log(`  - Subscriptions: ${finalSubCount} (target: 5,000)`)
  console.log(`  - Invoices:      ${finalInvoiceCount} (target: ~300)`)
  console.log(`  - Payments:      ${finalPaymentCount} (target: ~150)`)
  console.log(`  - Products:      5 (incl. Brand: Odoo +560)`)
  console.log(`  - Plans:         4 (Daily, Weekly, Monthly, Yearly)`)
  console.log(`  - Discounts:     3 (Expired, Exhausted, Valid)`)
  console.log('====================================================================\n')
}

main()
  .then(async () => {
    await db.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('\n❌ SEED SCRIPT FAILED:', e)
    await db.$disconnect()
    process.exit(1)
  })

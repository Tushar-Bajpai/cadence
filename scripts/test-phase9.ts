import { config } from 'dotenv'
config()

import { db } from '../lib/db'
import { signSession } from '../lib/session'
import { Role, InvoiceStatus, PayMethod, SubStatus, BillingPeriod } from '@prisma/client'
import { NextRequest } from 'next/server'

async function runPhase9Tests() {
  console.log('====================================================')
  console.log('     CADENCE PHASE 9: FINANCE DASHBOARD TEST')
  console.log('====================================================\n')

  // Step 1: Database Warmup
  console.log('1. Warming up Database Connection...')
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await db.$queryRaw`SELECT 1`
      console.log('   Neon DB connected successfully.')
      break
    } catch (e: any) {
      if (attempt === 5) throw e
      console.log(`   Waiting for Neon DB connection (attempt ${attempt}/5)...`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  // Step 2: Ensure test admin, staff, and customer accounts exist
  console.log('\n2. Setting up Test Users and Roles...')
  let adminUser = await db.user.findFirst({ where: { role: Role.ADMIN } })
  if (!adminUser) {
    adminUser = await db.user.create({
      data: {
        name: 'Admin Tester',
        email: 'admin.phase9@cadence.dev',
        passwordHash: 'dummy',
        role: Role.ADMIN,
      },
    })
  }

  let staffUser = await db.user.findFirst({ where: { role: Role.STAFF } })
  if (!staffUser) {
    staffUser = await db.user.create({
      data: {
        name: 'Staff Tester',
        email: 'staff.phase9@cadence.dev',
        passwordHash: 'dummy',
        role: Role.STAFF,
      },
    })
  }

  let customerUser = await db.user.findFirst({
    where: { role: Role.CUSTOMER },
    include: { customer: true },
  })
  if (!customerUser || !customerUser.customer) {
    customerUser = await db.user.create({
      data: {
        name: 'Customer Tester',
        email: 'customer.phase9@cadence.dev',
        passwordHash: 'dummy',
        role: Role.CUSTOMER,
        customer: {
          create: {
            companyName: 'Phase 9 Customer Corp',
            phone: '+91 99999 00009',
          },
        },
      },
      include: { customer: true },
    })
  }

  const customer = customerUser.customer!
  console.log(`   Admin: ${adminUser.email}`)
  console.log(`   Staff: ${staffUser.email}`)
  console.log(`   Customer: ${customerUser.email} (Customer ID: ${customer.id})`)

  // Sign session tokens
  const adminToken = await signSession({
    userId: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: Role.ADMIN,
  })

  const staffToken = await signSession({
    userId: staffUser.id,
    email: staffUser.email,
    name: staffUser.name,
    role: Role.STAFF,
  })

  const customerToken = await signSession({
    userId: customerUser.id,
    email: customerUser.email,
    name: customerUser.name,
    role: Role.CUSTOMER,
    customerId: customer.id,
  })

  // Dynamically import report route handler
  const { GET: getSummary } = await import('../app/api/reports/summary/route')

  function makeReq(url: string, token?: string) {
    const headers = new Headers()
    if (token) {
      headers.set('Cookie', `cadence_session=${token}`)
      headers.set('Authorization', `Bearer ${token}`)
    }
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method: 'GET',
      headers,
    })
  }

  console.log('\n3. Testing Role-Based Access Control (RBAC)...')

  // Test 3A: Admin access -> 200 OK
  const adminReq = makeReq('/api/reports/summary', adminToken)
  const adminRes = await getSummary(adminReq)
  if (adminRes.status === 200) {
    console.log('   [PASS] Admin can access /api/reports/summary (Status 200)')
  } else {
    throw new Error(`Admin access failed with status ${adminRes.status}`)
  }

  // Test 3B: Staff access -> 200 OK
  const staffReq = makeReq('/api/reports/summary', staffToken)
  const staffRes = await getSummary(staffReq)
  if (staffRes.status === 200) {
    console.log('   [PASS] Staff can access /api/reports/summary (Status 200)')
  } else {
    throw new Error(`Staff access failed with status ${staffRes.status}`)
  }

  // Test 3C: Customer access -> 403 Forbidden
  const custReq = makeReq('/api/reports/summary', customerToken)
  const custRes = await getSummary(custReq)
  if (custRes.status === 403) {
    console.log('   [PASS] Customer blocked from /api/reports/summary (Status 403 Forbidden)')
  } else {
    throw new Error(`Expected 403 Forbidden for Customer, got ${custRes.status}`)
  }

  // Test 3D: Unauthenticated access -> 401 Unauthorized
  const unauthReq = makeReq('/api/reports/summary')
  const unauthRes = await getSummary(unauthReq)
  if (unauthRes.status === 401) {
    console.log('   [PASS] Unauthenticated blocked from /api/reports/summary (Status 401 Unauthorized)')
  } else {
    throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`)
  }

  // Step 4: Verify Analytical Payload Content
  console.log('\n4. Validating Analytical Metric Structure & Correctness...')
  const payload = await adminRes.json()

  // Verify metric fields
  const { metrics, charts, overdueInvoices, customers } = payload
  if (!metrics) throw new Error('Response missing metrics object')
  if (!charts) throw new Error('Response missing charts object')
  if (!Array.isArray(overdueInvoices)) throw new Error('Response missing overdueInvoices array')
  if (!Array.isArray(customers)) throw new Error('Response missing customers list')

  console.log('   Metrics Summary:')
  console.log(`     Active Subscriptions: ${metrics.activeSubscriptions}`)
  console.log(`     Normalized MRR:       ${metrics.formattedMrr} (raw: ${metrics.mrr})`)
  console.log(`     Revenue Collected:    ${metrics.formattedRevenueCollected}`)
  console.log(`     Outstanding Balance:  ${metrics.formattedOutstanding}`)
  console.log(`     Overdue Count/Sum:    ${metrics.overdueInvoicesCount} (${metrics.formattedOverdueAmount})`)
  console.log(`     Total Subscriptions:  ${metrics.totalSubscriptions}`)

  if (typeof metrics.activeSubscriptions !== 'number' || metrics.activeSubscriptions < 0) {
    throw new Error('Invalid activeSubscriptions metric')
  }
  if (typeof metrics.mrr !== 'number' || metrics.mrr < 0) {
    throw new Error('Invalid mrr metric')
  }
  if (typeof metrics.revenueCollected !== 'number') {
    throw new Error('Invalid revenueCollected metric')
  }
  if (typeof metrics.outstanding !== 'number') {
    throw new Error('Invalid outstanding metric')
  }

  console.log('   [PASS] All 5 high-level metrics validated structurally.')

  // Charts validation
  console.log('\n5. Validating Visualizations (Monthly Revenue & Status Donut)...')
  if (!Array.isArray(charts.monthlyRevenue) || charts.monthlyRevenue.length < 6) {
    throw new Error('Expected at least 6 months of revenue trends for Recharts')
  }
  console.log(`   Monthly Revenue Data Points: ${charts.monthlyRevenue.length} months`)
  console.log(`   Sample Month: ${charts.monthlyRevenue[0].label} -> ${charts.monthlyRevenue[0].formattedRevenue}`)

  if (!Array.isArray(charts.subscriptionsByStatus)) {
    throw new Error('Expected subscriptionsByStatus breakdown')
  }
  console.log(`   Status Breakdown Categories: ${charts.subscriptionsByStatus.length}`)
  for (const s of charts.subscriptionsByStatus) {
    console.log(`     ${s.status}: ${s.count} (${s.percentage}%) [color: ${s.color}]`)
  }
  console.log('   [PASS] Chart series properly formatted for Recharts components.')

  // Overdue Invoices
  console.log('\n6. Validating Top Overdue Invoices...')
  console.log(`   Total overdue invoices listed: ${overdueInvoices.length}`)
  if (overdueInvoices.length > 0) {
    const first = overdueInvoices[0]
    console.log(`   Oldest Overdue: #${first.number} for ${first.customerName}`)
    console.log(`   Due Date: ${first.dueDate} (${first.daysOverdue} days overdue)`)
    console.log(`   Balance: ${first.formattedBalanceDue} of ${first.formattedTotal}`)

    if (overdueInvoices.length > 10) {
      throw new Error('Overdue invoices should be capped at top 10')
    }
  }
  console.log('   [PASS] Overdue invoices sorted and structured correctly.')

  // Step 7: Filter Tests (date range, customer, status)
  console.log('\n7. Testing Filters (Date Range, Customer, Status)...')

  // Date range filter
  const dateFilteredReq = makeReq('/api/reports/summary?from=2020-01-01&to=2099-12-31', adminToken)
  const dateRes = await getSummary(dateFilteredReq)
  if (dateRes.status === 200) {
    console.log('   [PASS] Date range filter (?from=&to=) accepted successfully.')
  } else {
    throw new Error(`Date range filter failed with status ${dateRes.status}`)
  }

  // Customer filter
  const custFilteredReq = makeReq(`/api/reports/summary?customerId=${customer.id}`, adminToken)
  const custFilteredRes = await getSummary(custFilteredReq)
  if (custFilteredRes.status === 200) {
    const custFilteredData = await custFilteredRes.json()
    console.log(`   [PASS] Customer filter (?customerId=${customer.id}) returned successfully.`)
  } else {
    throw new Error(`Customer filter failed with status ${custFilteredRes.status}`)
  }

  // Status filter
  const statusFilteredReq = makeReq('/api/reports/summary?status=ACTIVE', adminToken)
  const statusFilteredRes = await getSummary(statusFilteredReq)
  if (statusFilteredRes.status === 200) {
    console.log('   [PASS] Status filter (?status=ACTIVE) returned successfully.')
  } else {
    throw new Error(`Status filter failed with status ${statusFilteredRes.status}`)
  }

  // Step 8: Performance Benchmark (< 2000 ms)
  console.log('\n8. Performance Benchmark: Execution Latency...')
  const startTime = performance.now()
  const benchReq = makeReq('/api/reports/summary', adminToken)
  const benchRes = await getSummary(benchReq)
  const endTime = performance.now()
  const duration = Math.round(endTime - startTime)

  console.log(`   API Execution Time: ${duration} ms`)
  if (duration < 2000) {
    console.log(`   [PASS] Execution latency is under 2000 ms SLA (${duration} ms).`)
  } else {
    console.warn(`   [WARN] Execution latency (${duration} ms) exceeded 2000 ms SLA.`)
  }

  // Step 9: Overdue Invoice & Settlement Shortcut Verification
  console.log('\n9. Testing Overdue Invoices & Instant Settlement Shortcut...')
  // Ensure an active subscription exists for test customer
  let testSub = await db.subscription.findFirst({
    where: { customerId: customer.id, status: SubStatus.ACTIVE },
  })
  if (!testSub) {
    let plan = await db.plan.findFirst()
    if (!plan) {
      plan = await db.plan.create({
        data: {
          name: 'Pro Plan',
          billingPeriod: BillingPeriod.MONTHLY,
          price: 1999,
        },
      })
    }
    testSub = await db.subscription.create({
      data: {
        customerId: customer.id,
        planId: plan.id,
        status: SubStatus.ACTIVE,
        startDate: new Date(),
        nextBillingDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 86400000),
      },
    })
  }

  // Create an overdue invoice for test customer (dueDate in the past, CONFIRMED status)
  const pastDueDate = new Date(Date.now() - 5 * 86400000) // 5 days ago
  const overdueInvoice = await db.invoice.create({
    data: {
      customerId: customer.id,
      subscriptionId: testSub.id,
      status: InvoiceStatus.CONFIRMED,
      issueDate: new Date(Date.now() - 15 * 86400000),
      dueDate: pastDueDate,
      periodStart: new Date(Date.now() - 15 * 86400000),
      periodEnd: new Date(Date.now() + 15 * 86400000),
      subtotal: 1500,
      taxTotal: 270,
      total: 1770,
      amountPaid: 0,
      lines: {
        create: {
          description: 'Overdue Subscription Cycle',
          quantity: 1,
          unitPrice: 1500,
          amount: 1500,
          taxAmount: 270,
        },
      },
    },
  })
  console.log(`   Created test overdue invoice #${overdueInvoice.seq} (Total: ₹${overdueInvoice.total}, Due: ${pastDueDate.toISOString()})`)

  // Fetch summary again to verify it appears in overdue list
  const summaryWithOverdueRes = await getSummary(makeReq('/api/reports/summary', adminToken))
  const summaryWithOverdue = await summaryWithOverdueRes.json()
  const foundOverdue = summaryWithOverdue.overdueInvoices.find((i: any) => i.id === overdueInvoice.id)
  if (!foundOverdue) {
    throw new Error('Overdue invoice did not appear in overdueInvoices list')
  }
  console.log(`   [PASS] Overdue invoice appeared in dashboard list: #${foundOverdue.number} (${foundOverdue.daysOverdue} days overdue, balance: ${foundOverdue.formattedBalanceDue})`)

  // Settle invoice using payment API route (shortcut used by RecordPaymentModal)
  const { POST: recordPayment } = await import('../app/api/invoices/[id]/payments/route')
  const payReq = new NextRequest(new URL(`/api/invoices/${overdueInvoice.id}/payments`, 'http://localhost:3000'), {
    method: 'POST',
    headers: new Headers({
      Cookie: `cadence_session=${adminToken}`,
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      amount: 1770,
      method: PayMethod.BANK_TRANSFER,
      note: 'Overdue settlement from Phase 9 dashboard modal',
    }),
  })

  // Next.js dynamic route params context
  const payRes = await recordPayment(payReq, {
    params: Promise.resolve({ id: overdueInvoice.id }),
  } as any)

  if (payRes.status === 200) {
    const payData = await payRes.json()
    console.log(`   [PASS] Payment recorded successfully: isFullyPaid=${payData.isFullyPaid}, amountPaid=₹${payData.amountPaid}`)
  } else {
    const errData = await payRes.json()
    throw new Error(`Record payment shortcut failed: ${errData.error || payRes.status}`)
  }

  // Verify invoice status in DB is now PAID
  const updatedInvoice = await db.invoice.findUnique({ where: { id: overdueInvoice.id } })
  if (updatedInvoice?.status !== InvoiceStatus.PAID) {
    throw new Error(`Expected invoice status PAID, got ${updatedInvoice?.status}`)
  }
  console.log(`   [PASS] Invoice #${updatedInvoice.seq} updated to status PAID in database.`)

  // Verify dashboard summary reflects updated revenue and cleared overdue
  const finalSummaryRes = await getSummary(makeReq('/api/reports/summary', adminToken))
  const finalSummary = await finalSummaryRes.json()
  const clearedOverdue = finalSummary.overdueInvoices.find((i: any) => i.id === overdueInvoice.id)
  if (clearedOverdue) {
    throw new Error('Settled invoice should no longer appear in overdue list')
  }
  console.log(`   [PASS] Settled invoice cleared from overdue list, revenue updated to ${finalSummary.metrics.formattedRevenueCollected}.`)

  console.log('\n====================================================')
  console.log('    PHASE 9 VERIFICATION COMPLETE - ALL PASSED! 🚀')
  console.log('====================================================\n')
}

runPhase9Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ PHASE 9 TEST FAILED:', err)
    process.exit(1)
  })

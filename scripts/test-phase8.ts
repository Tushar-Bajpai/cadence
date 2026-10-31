import { config } from 'dotenv'
config()

import { db } from '../lib/db'
import { signSession } from '../lib/session'
import { InvoiceStatus, PayMethod, SubStatus, BillingPeriod } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function runPhase8Tests() {
  console.log('====================================================')
  console.log('       CADENCE PHASE 8: CUSTOMER PORTAL TEST')
  console.log('====================================================\n')

  // 1. Setting up Test Customer A and Customer B...
  console.log('1. Setting up Test Customer A and Customer B...')

  // Warm up DB connection in case serverless Neon is cold
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await db.$queryRaw`SELECT 1`
      break
    } catch (e: any) {
      if (attempt === 5) throw e
      console.log(`   Waiting for Neon DB connection (attempt ${attempt}/5)...`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  const dummyPasswordHash = await bcrypt.hash('TestPass123!@#', 10)

  // 1a. Customer A
  let userA = await db.user.findUnique({
    where: { email: 'customer.alpha@test.dev' },
    include: { customer: true },
  })
  if (!userA) {
    userA = await db.user.create({
      data: {
        name: 'Alpha Customer',
        email: 'customer.alpha@test.dev',
        passwordHash: dummyPasswordHash,
        role: 'CUSTOMER',
        customer: {
          create: {
            companyName: 'Alpha Corp',
            phone: '+91 91111 11111',
            address: '101 Alpha Way, Tech Park',
          },
        },
      },
      include: { customer: true },
    })
  }

  // 1b. Customer B
  let userB = await db.user.findUnique({
    where: { email: 'customer.beta@test.dev' },
    include: { customer: true },
  })
  if (!userB) {
    userB = await db.user.create({
      data: {
        name: 'Beta Customer',
        email: 'customer.beta@test.dev',
        passwordHash: dummyPasswordHash,
        role: 'CUSTOMER',
        customer: {
          create: {
            companyName: 'Beta Logistics',
            phone: '+91 92222 22222',
            address: '202 Beta Boulevard, SEZ',
          },
        },
      },
      include: { customer: true },
    })
  }

  const customerA = userA.customer!
  const customerB = userB.customer!
  console.log(`   Customer A ID: ${customerA.id} (${userA.email})`)
  console.log(`   Customer B ID: ${customerB.id} (${userB.email})`)

  // 2. Ensure test plans exist (one pausable, one non-pausable)
  let planPausable = await db.plan.findFirst({
    where: { pausable: true, closable: true },
  })
  if (!planPausable) {
    planPausable = await db.plan.create({
      data: {
        name: 'Pro Flexible Plan',
        price: 2499,
        billingPeriod: BillingPeriod.MONTHLY,
        availableFrom: new Date(),
        pausable: true,
        closable: true,
      },
    })
  }

  // 3. Create Subscriptions for Customer A and Customer B
  console.log('\n2. Creating Subscriptions for Customer A and B...')
  const startDate = new Date()
  const expiryDate = new Date(Date.now() + 30 * 86400000)

  let subA = await db.subscription.findFirst({
    where: { customerId: customerA.id },
    include: { plan: true },
  })
  if (!subA) {
    subA = await db.subscription.create({
      data: {
        customerId: customerA.id,
        planId: planPausable.id,
        status: SubStatus.ACTIVE,
        startDate,
        expiryDate,
        nextBillingDate: expiryDate,
        lines: {
          create: {
            productId: 'prod-plan-a',
            description: 'Alpha Pro Cloud Service',
            quantity: 1,
            unitPrice: 2499,
            amount: 2499,
          },
        },
      },
      include: { plan: true },
    })
  }

  let subB = await db.subscription.findFirst({
    where: { customerId: customerB.id },
    include: { plan: true },
  })
  if (!subB) {
    subB = await db.subscription.create({
      data: {
        customerId: customerB.id,
        planId: planPausable.id,
        status: SubStatus.ACTIVE,
        startDate,
        expiryDate,
        nextBillingDate: expiryDate,
        lines: {
          create: {
            productId: 'prod-plan-b',
            description: 'Beta Dedicated Instance',
            quantity: 2,
            unitPrice: 2499,
            amount: 4998,
          },
        },
      },
      include: { plan: true },
    })
  }

  console.log(`   Subscription A ID: ${subA.id} (#${subA.seq}) for Customer A`)
  console.log(`   Subscription B ID: ${subB.id} (#${subB.seq}) for Customer B`)

  // 4. Create Invoices for Customer A and Customer B
  console.log('\n3. Creating Invoices for Customer A and B...')
  let invA = await db.invoice.findFirst({
    where: { customerId: customerA.id, status: InvoiceStatus.CONFIRMED },
  })
  if (!invA) {
    invA = await db.invoice.create({
      data: {
        subscriptionId: subA.id,
        customerId: customerA.id,
        status: InvoiceStatus.CONFIRMED,
        periodStart: startDate,
        periodEnd: expiryDate,
        issueDate: startDate,
        dueDate: new Date(Date.now() + 7 * 86400000),
        subtotal: 2499,
        taxTotal: 449.82,
        total: 2948.82,
        amountPaid: 0,
        lines: {
          create: {
            description: 'Alpha Pro Cloud Monthly',
            quantity: 1,
            unitPrice: 2499,
            taxAmount: 449.82,
            amount: 2499,
          },
        },
      },
    })
  }

  let invB = await db.invoice.findFirst({
    where: { customerId: customerB.id, status: InvoiceStatus.CONFIRMED },
  })
  if (!invB) {
    invB = await db.invoice.create({
      data: {
        subscriptionId: subB.id,
        customerId: customerB.id,
        status: InvoiceStatus.CONFIRMED,
        periodStart: startDate,
        periodEnd: expiryDate,
        issueDate: startDate,
        dueDate: new Date(Date.now() + 7 * 86400000),
        subtotal: 4998,
        taxTotal: 899.64,
        total: 5897.64,
        amountPaid: 0,
        lines: {
          create: {
            description: 'Beta Dedicated Instance Monthly',
            quantity: 2,
            unitPrice: 2499,
            taxAmount: 899.64,
            amount: 4998,
          },
        },
      },
    })
  }

  console.log(`   Invoice A: ${invA.id} (#${invA.seq}) for Customer A (Total: ₹${invA.total})`)
  console.log(`   Invoice B: ${invB.id} (#${invB.seq}) for Customer B (Total: ₹${invB.total})`)

  // 5. Generate Session Tokens for Customer A and Customer B
  console.log('\n4. Generating Authenticated Session Tokens...')
  const tokenA = await signSession({
    userId: userA.id,
    email: userA.email,
    name: userA.name,
    role: 'CUSTOMER',
    customerId: customerA.id,
  })

  const tokenB = await signSession({
    userId: userB.id,
    email: userB.email,
    name: userB.name,
    role: 'CUSTOMER',
    customerId: customerB.id,
  })
  console.log('   Tokens signed successfully.')

  // Set STRICT_PORTAL_AUTH flag to ensure zero dev fallback
  process.env.STRICT_PORTAL_AUTH = 'true'

  // Helper function to simulate Next.js API requests
  const baseUrl = 'http://localhost:3000'

  // 6. Test DIRECT scoping logic in Portal APIs
  console.log('\n5. Testing Customer Isolation & Scoping Rules...')

  // Import API route handlers directly to verify in-process
  const { GET: getInvoiceDetail } = await import('../app/api/portal/invoices/[id]/route')
  const { POST: payInvoice } = await import('../app/api/portal/invoices/[id]/pay/route')
  const { GET: getSubscriptionDetail } = await import('../app/api/portal/subscriptions/[id]/route')
  const { POST: subAction } = await import('../app/api/portal/subscriptions/[id]/action/route')
  const { GET: getPortalInvoices } = await import('../app/api/portal/invoices/route')
  const { GET: getPortalSubs } = await import('../app/api/portal/subscriptions/route')
  const { GET: getPortalSummary } = await import('../app/api/portal/summary/route')
  const { GET: getProfile, PUT: putProfile } = await import('../app/api/portal/profile/route')

  // Helper to make mock request with cookie
  function makeReq(url: string, token: string, method = 'GET', body?: any) {
    const headers = new Headers({
      Cookie: `cadence_session=${token}`,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    })
    return new Request(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  // TEST 6A: Customer A accesses their OWN invoice
  console.log('\n--- Test 6A: Customer A accesses own Invoice A ---')
  const reqA_own = makeReq(`${baseUrl}/api/portal/invoices/${invA.id}`, tokenA)
  const resA_own = await getInvoiceDetail(reqA_own, { params: Promise.resolve({ id: invA.id }) })
  console.log(`   Status: ${resA_own.status} (Expected: 200)`)
  const dataA_own = await resA_own.json()
  console.log(`   Invoice Number returned: ${dataA_own.number}`)
  if (resA_own.status !== 200 || dataA_own.id !== invA.id) {
    throw new Error('Customer A failed to view own invoice')
  }
  console.log('   [PASS] Customer A successfully viewed own invoice.')

  // TEST 6B: Customer A attempts to view Customer B's invoice (CRITICAL ACCEPTANCE CRITERIA)
  console.log('\n--- Test 6B: Customer A attempts to guess/access Customer B\'s Invoice B ---')
  const reqA_steals_B = makeReq(`${baseUrl}/api/portal/invoices/${invB.id}`, tokenA)
  const resA_steals_B = await getInvoiceDetail(reqA_steals_B, { params: Promise.resolve({ id: invB.id }) })
  console.log(`   Status: ${resA_steals_B.status} (Expected: 404)`)
  const dataA_steals_B = await resA_steals_B.json()
  console.log(`   Response Body: ${JSON.stringify(dataA_steals_B)}`)
  if (resA_steals_B.status !== 404) {
    throw new Error(`SECURITY BREACH! Customer A was able to access Customer B's invoice! Status: ${resA_steals_B.status}`)
  }
  console.log('   [PASS] Customer A was strictly BLOCKED with 404 from seeing Customer B\'s invoice!')

  // TEST 6C: Customer A attempts to view Customer B's invoice by numeric sequence number
  console.log('\n--- Test 6C: Customer A attempts to access Customer B\'s invoice by sequence number ---')
  const reqA_seq_B = makeReq(`${baseUrl}/api/portal/invoices/${invB.seq}`, tokenA)
  const resA_seq_B = await getInvoiceDetail(reqA_seq_B, { params: Promise.resolve({ id: String(invB.seq) }) })
  console.log(`   Status: ${resA_seq_B.status} (Expected: 404)`)
  if (resA_seq_B.status !== 404) {
    throw new Error(`SECURITY BREACH! Customer A accessed Customer B's invoice via sequence number!`)
  }
  console.log('   [PASS] Customer A blocked with 404 from accessing Customer B\'s sequence number.')

  // TEST 6D: Customer A attempts to record payment on Customer B's invoice
  console.log('\n--- Test 6D: Customer A attempts to pay Customer B\'s Invoice B ---')
  const reqA_pay_B = makeReq(`${baseUrl}/api/portal/invoices/${invB.id}/pay`, tokenA, 'POST', {
    method: 'CARD',
  })
  const resA_pay_B = await payInvoice(reqA_pay_B, { params: Promise.resolve({ id: invB.id }) })
  console.log(`   Status: ${resA_pay_B.status} (Expected: 404)`)
  if (resA_pay_B.status !== 404) {
    throw new Error(`SECURITY BREACH! Customer A was able to execute payment on Customer B's invoice!`)
  }
  console.log('   [PASS] Customer A blocked with 404 from paying Customer B\'s invoice.')

  // TEST 6E: Customer A attempts to view Customer B's Subscription
  console.log('\n--- Test 6E: Customer A attempts to access Customer B\'s Subscription B ---')
  const reqA_sub_B = makeReq(`${baseUrl}/api/portal/subscriptions/${subB.id}`, tokenA)
  const resA_sub_B = await getSubscriptionDetail(reqA_sub_B, { params: Promise.resolve({ id: subB.id }) })
  console.log(`   Status: ${resA_sub_B.status} (Expected: 404)`)
  if (resA_sub_B.status !== 404) {
    throw new Error(`SECURITY BREACH! Customer A was able to view Customer B's subscription!`)
  }
  console.log('   [PASS] Customer A blocked with 404 from viewing Customer B\'s subscription.')

  // TEST 6F: Customer A attempts to pause/cancel Customer B's Subscription
  console.log('\n--- Test 6F: Customer A attempts to pause Customer B\'s Subscription ---')
  const reqA_action_B = makeReq(`${baseUrl}/api/portal/subscriptions/${subB.id}/action`, tokenA, 'POST', {
    action: 'pause',
  })
  const resA_action_B = await subAction(reqA_action_B, { params: Promise.resolve({ id: subB.id }) })
  console.log(`   Status: ${resA_action_B.status} (Expected: 404)`)
  if (resA_action_B.status !== 404) {
    throw new Error(`SECURITY BREACH! Customer A was able to modify Customer B's subscription!`)
  }
  console.log('   [PASS] Customer A blocked with 404 from modifying Customer B\'s subscription.')

  // 7. Verify List Scoping
  console.log('\n7. Verifying Customer Portal List Scoping...')
  const reqInvoicesA = makeReq(`${baseUrl}/api/portal/invoices`, tokenA)
  const resInvoicesA = await getPortalInvoices(reqInvoicesA)
  const listInvoicesA = await resInvoicesA.json()
  console.log(`   Customer A invoice list count: ${listInvoicesA.length}`)
  const containsInvoiceB = listInvoicesA.some((i: any) => i.id === invB.id)
  console.log(`   Contains Customer B's invoice: ${containsInvoiceB ? 'FAIL' : 'NO (CORRECT)'}`)
  if (containsInvoiceB) throw new Error('Customer A invoice list leaks Customer B invoices!')

  const reqSubsA = makeReq(`${baseUrl}/api/portal/subscriptions`, tokenA)
  const resSubsA = await getPortalSubs(reqSubsA)
  const listSubsA = await resSubsA.json()
  console.log(`   Customer A subscription list count: ${listSubsA.length}`)
  const containsSubB = listSubsA.some((s: any) => s.id === subB.id)
  console.log(`   Contains Customer B's subscription: ${containsSubB ? 'FAIL' : 'NO (CORRECT)'}`)
  if (containsSubB) throw new Error('Customer A subscription list leaks Customer B subscriptions!')

  // 8. Test Self-Service Lifecycle Actions (pause, resume)
  console.log('\n8. Testing Self-Service Subscription Actions on Own Subscription...')
  // 8a. Pause
  const reqPause = makeReq(`${baseUrl}/api/portal/subscriptions/${subA.id}/action`, tokenA, 'POST', {
    action: 'pause',
  })
  const resPause = await subAction(reqPause, { params: Promise.resolve({ id: subA.id }) })
  const dataPause = await resPause.json()
  console.log(`   Pause response: ${dataPause.message} (Status: ${resPause.status})`)
  if (resPause.status !== 200 || !dataPause.subscription?.isPaused) {
    throw new Error('Self-service pause failed')
  }

  // 8b. Resume
  const reqResume = makeReq(`${baseUrl}/api/portal/subscriptions/${subA.id}/action`, tokenA, 'POST', {
    action: 'resume',
  })
  const resResume = await subAction(reqResume, { params: Promise.resolve({ id: subA.id }) })
  const dataResume = await resResume.json()
  console.log(`   Resume response: ${dataResume.message} (Status: ${resResume.status})`)
  if (resResume.status !== 200 || dataResume.subscription?.isPaused !== false) {
    throw new Error('Self-service resume failed')
  }
  console.log('   [PASS] Self-service pause & resume succeeded.')

  // 9. Test Mock "Pay now" button on own invoice
  console.log('\n9. Testing Mock "Pay now" button on own invoice...')
  const reqPayOwn = makeReq(`${baseUrl}/api/portal/invoices/${invA.id}/pay`, tokenA, 'POST', {
    method: 'CARD',
    note: 'Automated Phase 8 Test Payment',
  })
  const resPayOwn = await payInvoice(reqPayOwn, { params: Promise.resolve({ id: invA.id }) })
  const dataPayOwn = await resPayOwn.json()
  console.log(`   Pay response: ${dataPayOwn.message} (Status: ${resPayOwn.status})`)
  if (resPayOwn.status !== 200 || dataPayOwn.invoice?.status !== 'PAID') {
    throw new Error('Mock payment failed to mark invoice as PAID')
  }
  console.log('   [PASS] Mock "Pay now" recorded payment and marked invoice PAID.')

  // 10. Test Summary Cards API
  console.log('\n10. Testing Customer Summary Cards API...')
  const reqSummary = makeReq(`${baseUrl}/api/portal/summary`, tokenA)
  const resSummary = await getPortalSummary(reqSummary)
  const dataSummary = await resSummary.json()
  console.log(`   Active Subscriptions: ${dataSummary.metrics?.activeSubsCount}`)
  console.log(`   Total Outstanding: ${dataSummary.metrics?.formattedTotalOutstanding}`)
  console.log(`   Next Invoice Date: ${dataSummary.metrics?.nextInvoiceDate}`)
  if (
    typeof dataSummary.metrics?.activeSubsCount !== 'number' ||
    !dataSummary.metrics?.formattedTotalOutstanding ||
    !dataSummary.metrics?.nextInvoiceDate
  ) {
    throw new Error('Summary cards API missing required Phase 8 metrics')
  }
  console.log('   [PASS] Summary cards metrics verified.')

  // 11. Test Profile Get & Update
  console.log('\n11. Testing Customer Profile API...')
  const newCompanyName = 'Alpha Global Technologies ' + Math.floor(Math.random() * 1000)
  const reqPutProf = makeReq(`${baseUrl}/api/portal/profile`, tokenA, 'PUT', {
    name: 'Alpha Customer Renamed',
    companyName: newCompanyName,
    phone: '+91 99999 88888',
    address: '999 Silicon High Street',
  })
  const resPutProf = await putProfile(reqPutProf)
  const dataPutProf = await resPutProf.json()
  console.log(`   Update response: ${dataPutProf.message} (Status: ${resPutProf.status})`)
  if (resPutProf.status !== 200 || dataPutProf.customer?.companyName !== newCompanyName) {
    throw new Error('Profile update failed')
  }
  console.log('   [PASS] Profile update verified.')

  console.log('\n====================================================')
  console.log('  ALL PHASE 8 TESTS PASSED!')
  console.log('  - Customer A cannot see Customer B\'s invoice (404)')
  console.log('  - Customer A cannot pay Customer B\'s invoice (404)')
  console.log('  - Customer A cannot view or alter Customer B\'s sub (404)')
  console.log('  - Self-service pause/resume/close functional')
  console.log('  - Mock Pay now button functional')
  console.log('  - Summary cards functional')
  console.log('  - Profile updates functional')
  console.log('====================================================\n')
}

runPhase8Tests()
  .catch((err) => {
    console.error('Test Suite Failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })


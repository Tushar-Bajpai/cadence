// Unit tests for the discount rule engine (BUILD_PLAN Phase 4 "Done when"):
// expired, exhausted, below minimum purchase, below minimum quantity,
// wrong product scope, valid percentage and valid fixed (capped).
import { evaluateDiscount } from '../lib/discounts'
import { Discount, DiscountScope, DiscountType, Prisma } from '@prisma/client'

const D = (n: number) => new Prisma.Decimal(n)

function makeDiscount(
  overrides: Partial<Discount> & { products?: { productId: string }[] }
): Discount {
  const now = new Date()
  return {
    id: 'd1',
    name: 'TEST',
    type: DiscountType.PERCENTAGE,
    value: D(10),
    scope: DiscountScope.SUBSCRIPTION,
    minPurchase: null,
    minQuantity: null,
    startDate: new Date(now.getTime() - 86_400_000), // yesterday
    endDate: new Date(now.getTime() + 86_400_000), // tomorrow
    usageLimit: 5,
    usedCount: 0,
    isActive: true,
    products: [],
    subscriptions: [],
    ...overrides,
  } as unknown as Discount
}

const lines = [
  { productId: 'pA', quantity: 2, amount: D(200) },
  { productId: 'pB', quantity: 10, amount: D(1000) },
]

let failed = 0
function expect(label: string, condition: boolean) {
  console.log(`${condition ? 'PASS' : 'FAIL'} | ${label}`)
  if (!condition) failed++
}

// valid: percentage over whole subscription
let r = evaluateDiscount(makeDiscount({}), lines)
expect(
  'valid percentage discount applies (10% of 1200 = 120)',
  r !== null && Number(r.amount) === 120
)

// expired: endDate in the past
r = evaluateDiscount(makeDiscount({ endDate: new Date(Date.now() - 86_400_000) }), lines)
expect('expired discount is rejected', r === null)

// starts in the future
r = evaluateDiscount(makeDiscount({ startDate: new Date(Date.now() + 86_400_000) }), lines)
expect('future discount is rejected', r === null)

// exhausted: usage limit reached
r = evaluateDiscount(makeDiscount({ usedCount: 5 }), lines)
expect('exhausted discount is rejected', r === null)

// inactive
r = evaluateDiscount(makeDiscount({ isActive: false }), lines)
expect('inactive discount is rejected', r === null)

// below minimum purchase
r = evaluateDiscount(makeDiscount({ minPurchase: D(5000) }), lines)
expect('below min purchase is rejected', r === null)

// min purchase met
r = evaluateDiscount(makeDiscount({ minPurchase: D(1200) }), lines)
expect('min purchase met applies', r !== null)

// below minimum quantity
r = evaluateDiscount(makeDiscount({ minQuantity: 20 }), lines)
expect('below min quantity is rejected', r === null)

// min quantity met (sums matching quantities)
r = evaluateDiscount(makeDiscount({ minQuantity: 12 }), lines)
expect('min quantity met applies', r !== null)

// wrong product: product scope that matches nothing
r = evaluateDiscount(
  makeDiscount({ scope: DiscountScope.PRODUCT, products: [{ productId: 'pX' }] }),
  lines
)
expect('scope with wrong product is rejected', r === null)

// product scope matches only that product (10% of 200 = 20)
r = evaluateDiscount(
  makeDiscount({ scope: DiscountScope.PRODUCT, products: [{ productId: 'pA' }] }),
  lines
)
expect(
  'product-scoped discount applies only to matching lines',
  r !== null && Number(r.amount) === 20
)

// fixed discount capped at matching subtotal
r = evaluateDiscount(makeDiscount({ type: DiscountType.FIXED, value: D(5000) }), lines)
expect(
  'fixed discount is capped at subtotal',
  r !== null && Number(r.amount) === 1200
)

// valid fixed normal value
r = evaluateDiscount(makeDiscount({ type: DiscountType.FIXED, value: D(50) }), lines)
expect(
  'fixed discount applies',
  r !== null && Number(r.amount) === 50
)

if (failed > 0) {
  console.log(`${failed} test(s) failed`)
  process.exit(1)
}
console.log('All discount-engine tests passed.')

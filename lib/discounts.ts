import { Prisma, Discount, DiscountType, DiscountScope } from '@prisma/client'

export interface ApplicableDiscountResult {
  discountId: string
  label: string
  amount: Prisma.Decimal
}

export interface LineForDiscount {
  productId: string
  quantity: number
  amount: Prisma.Decimal
}

export function evaluateDiscount(
  discount: Discount & { products?: { productId: string }[] },
  lines: LineForDiscount[],
  now = new Date()
): ApplicableDiscountResult | null {
  // 1. Check active and validity dates
  if (!discount.isActive) return null
  if (discount.startDate > now || discount.endDate < now) return null

  // 2. Check usage limit
  if (discount.usedCount >= discount.usageLimit) return null

  // 3. Compute matching base
  let matchingSubtotal = new Prisma.Decimal(0)
  let matchingQty = 0

  if (discount.scope === DiscountScope.PRODUCT) {
    const targetProductIds = new Set(discount.products?.map((p) => p.productId) || [])
    for (const line of lines) {
      if (targetProductIds.has(line.productId)) {
        matchingSubtotal = matchingSubtotal.plus(line.amount)
        matchingQty += line.quantity
      }
    }
    if (matchingQty === 0) return null
  } else {
    // Subscription scope (all lines)
    for (const line of lines) {
      matchingSubtotal = matchingSubtotal.plus(line.amount)
      matchingQty += line.quantity
    }
  }

  // 4. Check min purchase & min quantity
  if (discount.minPurchase && matchingSubtotal.lessThan(discount.minPurchase)) {
    return null
  }
  if (discount.minQuantity && matchingQty < discount.minQuantity) {
    return null
  }

  // 5. Compute discount amount
  let discountAmount = new Prisma.Decimal(0)
  if (discount.type === DiscountType.PERCENTAGE) {
    discountAmount = matchingSubtotal.times(discount.value).dividedBy(100)
  } else {
    // Fixed discount, capped at matching subtotal
    discountAmount = Prisma.Decimal.min(discount.value, matchingSubtotal)
  }

  if (discountAmount.lessThanOrEqualTo(0)) return null

  return {
    discountId: discount.id,
    label: `${discount.name} (${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `₹${discount.value}`})`,
    amount: discountAmount.toDecimalPlaces(2),
  }
}


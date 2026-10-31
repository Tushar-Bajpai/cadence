import { Prisma, TaxType } from '@prisma/client'

export interface TaxInfo {
  id: string
  name: string
  type: TaxType
  value: Prisma.Decimal | number
}

export function getUnitPrice(
  basePrice: Prisma.Decimal | number,
  variantExtra?: Prisma.Decimal | number | null
): Prisma.Decimal {
  const base = new Prisma.Decimal(basePrice)
  const extra = variantExtra ? new Prisma.Decimal(variantExtra) : new Prisma.Decimal(0)
  return base.plus(extra)
}

export function calcLineTax(
  qty: number,
  unitPrice: Prisma.Decimal | number,
  taxes: TaxInfo[] = []
): { taxTotal: Prisma.Decimal; taxRate: Prisma.Decimal } {
  let taxSum = new Prisma.Decimal(0)
  let percentageSum = new Prisma.Decimal(0)
  const subtotal = new Prisma.Decimal(unitPrice).times(qty)

  for (const t of taxes) {
    const val = new Prisma.Decimal(t.value)
    if (t.type === 'PERCENTAGE') {
      const lineTax = subtotal.times(val).dividedBy(100)
      taxSum = taxSum.plus(lineTax)
      percentageSum = percentageSum.plus(val)
    } else {
      // Fixed tax per unit
      const lineTax = val.times(qty)
      taxSum = taxSum.plus(lineTax)
    }
  }

  return {
    taxTotal: taxSum.toDecimalPlaces(2),
    taxRate: percentageSum.toDecimalPlaces(2),
  }
}


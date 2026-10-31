import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'
import { TaxType } from '@prisma/client'
import { updateTaxSchema } from '@/lib/validators'

export const dynamic = 'force-dynamic'

// Admin only: edit a tax (name / type / value / active)
export const PATCH = apiHandler(['ADMIN'], async (req: NextRequest, _session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Tax ID is required')

  const parsed = updateTaxSchema.parse(await req.json())
  const data: { name?: string; type?: TaxType; value?: number; isActive?: boolean } = {}

  if (parsed.name !== undefined) data.name = parsed.name
  if (parsed.type !== undefined) data.type = parsed.type as TaxType
  if (parsed.value !== undefined) {
    if (parsed.value > 100) {
      const current = data.type
        ? data.type
        : (await db.tax.findUnique({ where: { id }, select: { type: true } }))?.type
      if (current === TaxType.PERCENTAGE) {
        throw new Error('A percentage tax cannot exceed 100%')
      }
    }
    data.value = parsed.value
  }
  if (parsed.isActive !== undefined) data.isActive = parsed.isActive

  const tax = await db.tax.update({ where: { id }, data })

  return {
    success: true,
    tax: {
      id: tax.id,
      name: tax.name,
      type: tax.type,
      value: Number(tax.value),
      isActive: tax.isActive,
    },
  }
})

// Admin only: delete a tax. If it is linked to products, deactivate it instead
// so historical line snapshots keep their meaning.
export const DELETE = apiHandler(['ADMIN'], async (_req: NextRequest, _session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Tax ID is required')

  try {
    await db.tax.delete({ where: { id } })
    return { success: true, deleted: true }
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === 'P2003') {
      // Foreign key violation on ProductTax
      const tax = await db.tax.update({ where: { id }, data: { isActive: false } })
      return {
        success: true,
        deleted: false,
        message: `Tax "${tax.name}" is linked to products, so it was deactivated instead of deleted.`,
      }
    }
    throw err
  }
})

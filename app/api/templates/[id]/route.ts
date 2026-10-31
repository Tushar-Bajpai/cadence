import { NextRequest } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Delete template lines then the template itself (lines cascade in schema,
// but keep it explicit so templateIDs with SQL-set FKs behave predictably)
export const DELETE = apiHandler(['ADMIN'], async (_req: NextRequest, _session, context?: ApiContext) => {
  const params = await context?.params
  const id = params?.id as string
  if (!id) throw new Error('Template ID is required')

  const template = await db.quotationTemplate.findUnique({ where: { id } })
  if (!template) throw new Error('Template not found')

  await db.quotationTemplateLine.deleteMany({ where: { templateId: id } })
  await db.quotationTemplate.delete({ where: { id } })

  return { success: true, deleted: true }
})

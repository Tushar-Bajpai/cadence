import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { Role } from '@prisma/client'
import { getSession, SessionPayload } from './auth'
import { requireRole, UnauthorizedError, ForbiddenError, NotFoundError } from './rbac'

export { NotFoundError, UnauthorizedError, ForbiddenError }

export type ApiContext = {
  params?: Promise<Record<string, string | string[]>>
}

export type ApiHandlerFn<T = unknown> = (
  req: NextRequest | Request | any,
  session: SessionPayload | null,
  context?: ApiContext
) => Promise<T>

export function apiHandler<T>(
  allowedRoles: Role[] | null,
  fn: ApiHandlerFn<T>
) {
  return async (req: NextRequest | Request | any, context: any = {}): Promise<NextResponse> => {
    try {
      let session: SessionPayload | null = null

      if (allowedRoles && allowedRoles.length > 0) {
        session = await getSession(req)
        requireRole(session, allowedRoles)
      } else {
        session = await getSession(req)
      }

      const data = await fn(req, session, context)
      if (data instanceof NextResponse) {
        return data
      }
      return NextResponse.json(data)
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error instanceof ForbiddenError) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error instanceof ZodError) {
        const message = error.issues.map((e) => e.message).join(', ')
        return NextResponse.json({ error: message, details: error.flatten() }, { status: 400 })
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = Array.isArray(error.meta?.target)
            ? error.meta?.target.join(', ')
            : 'field'
          return NextResponse.json(
            { error: `Unique constraint violation on ${target}. This record already exists.` },
            { status: 409 }
          )
        }
        if (error.code === 'P2025') {
          return NextResponse.json({ error: 'Record not found' }, { status: 404 })
        }
      }

      const err = error as Error
      console.error('[API Error]:', err)
      return NextResponse.json(
        { error: err?.message || 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

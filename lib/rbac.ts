import { Role } from '@prisma/client'
import { SessionPayload } from './auth'

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access denied: insufficient permissions') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export function hasRole(session: SessionPayload | null, allowedRoles: Role[]): boolean {
  if (!session) return false
  return allowedRoles.includes(session.role)
}

export function requireRole(session: SessionPayload | null, allowedRoles: Role[]): SessionPayload {
  if (!session) {
    throw new UnauthorizedError()
  }
  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError()
  }
  return session
}

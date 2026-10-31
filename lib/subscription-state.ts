import { SubStatus } from '@prisma/client'

export const ALLOWED_TRANSITIONS: Record<SubStatus, SubStatus[]> = {
  DRAFT: ['QUOTATION'],
  QUOTATION: ['CONFIRMED', 'CLOSED'],
  CONFIRMED: ['ACTIVE', 'CLOSED'],
  ACTIVE: ['CLOSED'],
  CLOSED: [],
}

export function isValidTransition(from: SubStatus, to: SubStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export interface PlanPolicyCheck {
  pausable: boolean
  closable: boolean
  renewable: boolean
  autoCloseOnEnd: boolean
}

export function canCloseEarly(policy: PlanPolicyCheck): boolean {
  return policy.closable
}

export function canPauseOrResume(policy: PlanPolicyCheck): boolean {
  return policy.pausable
}

export function canRenew(policy: PlanPolicyCheck): boolean {
  return policy.renewable
}


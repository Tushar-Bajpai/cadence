const FALLBACK_ERROR = 'Something went wrong. Please try again.'

const EXACT_MATCH_ERRORS: Record<string, string> = {
  'Invalid credentials': 'The email or password is incorrect.',
  'Invalid email or password': 'The email or password is incorrect.',
  'User already exists': 'An account with this email already exists.',
  'Email already registered': 'An account with this email already exists.',
}

export function toUserFriendlyError(value: unknown): string {
  const raw =
    typeof value === 'string'
      ? value.trim()
      : value instanceof Error
        ? value.message.trim()
        : ''

  if (!raw) return FALLBACK_ERROR

  // Check exact lookup dictionary
  if (EXACT_MATCH_ERRORS[raw]) {
    return EXACT_MATCH_ERRORS[raw]
  }

  const lower = raw.toLowerCase()

  // Catch database connectivity / serverless sleep issues
  if (
    lower.includes("can't reach database") ||
    lower.includes('prisma') ||
    lower.includes('neon.tech') ||
    lower.includes(':5432') ||
    lower.includes('p1001') ||
    lower.includes('p1002') ||
    lower.includes('p2024') ||
    lower.includes('timed out') ||
    lower.includes('connection refused')
  ) {
    return 'Database is currently warming up or reconnecting. Please wait a few seconds and try again.'
  }

  // Catch browser network errors
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    return 'Network connection issue. Please check your internet and try again.'
  }

  return raw
}

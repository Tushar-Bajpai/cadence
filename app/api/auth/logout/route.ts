import { clearSessionCookie } from '@/lib/auth'
import { apiHandler } from '@/lib/api'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  return apiHandler(null, async () => {
    await clearSessionCookie()
    return { ok: true }
  })(req)
}

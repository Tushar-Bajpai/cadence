import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { staffCreateSchema } from '@/lib/validators'
import { apiHandler } from '@/lib/api'

export const runtime = 'nodejs'

// ADMIN only: onboard a STAFF user (no Customer row, no session is opened).
export async function POST(req: Request) {
  return apiHandler(['ADMIN'], async (req) => {
    const data = staffCreateSchema.parse(await req.json())

    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'STAFF',
      },
    })

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  })(req)
}

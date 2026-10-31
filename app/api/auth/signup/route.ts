import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSessionCookie, signSession } from '@/lib/auth'
import { signupSchema } from '@/lib/validators'
import { apiHandler } from '@/lib/api'

export const runtime = 'nodejs'

// Public signup always creates a CUSTOMER user + customer row.
// Only ADMIN can create STAFF users (POST /api/admin/staff).
export async function POST(req: Request) {
  return apiHandler(null, async (req) => {
    const data = signupSchema.parse(await req.json())

    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email, // normalized (trimmed + lowercase) by the schema
        passwordHash,
        role: 'CUSTOMER',
        customer: {
          create: {
            companyName: data.companyName,
            phone: data.phone,
            address: data.address,
          },
        },
      },
      include: { customer: true },
    })

    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customer?.id,
    })
    await setSessionCookie(token)

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customer?.id ?? null,
      },
    }
  })(req)
}

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  keepAliveStarted: boolean | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Background database keep-alive for Neon Serverless PostgreSQL:
// Pings SELECT 1 every 3.5 minutes (210,000 ms) while the server process runs,
// preventing the Neon compute instance from entering cold sleep (5m inactivity threshold).
if (
  typeof window === 'undefined' &&
  !globalForPrisma.keepAliveStarted &&
  process.env.NODE_ENV !== 'test' &&
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  globalForPrisma.keepAliveStarted = true
  const KEEP_ALIVE_INTERVAL = 3.5 * 60 * 1000 // 210 seconds
  const serverPing = async () => {
    try {
      await db.$queryRaw`SELECT 1 as keepalive`
    } catch {
      // Non-fatal, server will attempt again next cycle
    }
  }

  const timer = setInterval(serverPing, KEEP_ALIVE_INTERVAL)
  if (typeof timer.unref === 'function') {
    timer.unref()
  }
}

export default db

// Launches the Next.js CLI on the port from the PORT env var (falls back to 3000).
// Used so a single source of truth (.env) defines the port across dev and prod,
// since `next dev`/`next start` only read PORT from the shell environment, not .env.
//
// Usage:   node scripts/next.mjs <dev|start>
// Called:  node --env-file-if-exists=.env scripts/next.mjs dev
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const subcommand = process.argv[2]
if (subcommand !== 'dev' && subcommand !== 'start') {
  console.error('Usage: node scripts/next.mjs <dev|start>')
  process.exit(1)
}

const port = process.env.PORT || '3000'
const require_ = createRequire(import.meta.url)
const nextBin = require_.resolve('next/dist/bin/next')

// --webpack is a dev/build flag, not a start flag
const flags = subcommand === 'dev' ? ['--webpack', '-p', port] : ['-p', port]

const result = spawnSync(process.execPath, [nextBin, subcommand, ...flags], {
  stdio: 'inherit',
  env: process.env,
})

if (result.status !== 0) process.exitCode = result.status ?? 1

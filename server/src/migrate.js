import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Applied automatically on every boot (npm "prestart"). The schema is
// idempotent (CREATE ... IF NOT EXISTS), so re-running is a no-op. We retry a
// few times because a freshly-provisioned DB can be briefly unreachable.
async function main() {
  const sql = readFileSync(join(__dirname, '..', 'schema.sql'), 'utf8')
  let lastErr
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await pool.query(sql)
      console.log('✓ Schema applied.')
      await pool.end()
      return
    } catch (err) {
      lastErr = err
      console.warn(`Migration attempt ${attempt} failed: ${err.message}`)
      if (attempt < 5) await sleep(attempt * 2000)
    }
  }
  console.error('Migration failed after retries:', lastErr)
  process.exit(1)
}

main()

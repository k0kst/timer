import pg from 'pg'

const { Pool } = pg

// A single shared pool. DATABASE_URL works for local Postgres, Supabase, Railway,
// and Render alike. SSL is enabled automatically for non-localhost connections.
const connectionString = process.env.DATABASE_URL

const isLocal =
  !connectionString ||
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1')

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

export const query = (text, params) => pool.query(text, params)

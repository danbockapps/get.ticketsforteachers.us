import Database from 'better-sqlite3'
import {BetterSQLite3Database, drizzle} from 'drizzle-orm/better-sqlite3'
import {mkdirSync} from 'fs'
import {dirname} from 'path'
import * as schema from './schema'

let _db: BetterSQLite3Database<typeof schema> | null = null
let _sqlite: Database.Database | null = null

function initDb() {
  if (_db && _sqlite) return {db: _db, sqlite: _sqlite}

  const dbPath = process.env.DATABASE_PATH || './data/database.db'

  const dir = dirname(dbPath)
  try {
    mkdirSync(dir, {recursive: true})
  } catch {
    // Directory already exists
  }

  _sqlite = new Database(dbPath)
  _sqlite.pragma('journal_mode = WAL')
  _sqlite.pragma('foreign_keys = ON')

  _db = drizzle(_sqlite, {schema})
  return {db: _db, sqlite: _sqlite}
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    const {db: instance} = initDb()
    return (instance as any)[prop]
  },
})

export const sqlite = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const {sqlite: instance} = initDb()
    return (instance as any)[prop]
  },
})

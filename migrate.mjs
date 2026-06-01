import Database from 'better-sqlite3'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {migrate} from 'drizzle-orm/better-sqlite3/migrator'
import {mkdirSync} from 'fs'
import {dirname} from 'path'

const dbPath = process.env.DATABASE_PATH || './data/database.db'
mkdirSync(dirname(dbPath), {recursive: true})

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
// Keep foreign keys OFF during migration. Drizzle's better-sqlite3 migrator
// runs every migration inside a single BEGIN...COMMIT, and SQLite ignores
// `PRAGMA foreign_keys` changes inside a transaction — so the OFF/ON pragmas
// the generated migrations emit are no-ops. With enforcement left ON, the
// table-recreation pattern (CREATE __new / copy / DROP old / RENAME) would
// cascade-delete child rows when the old parent table is dropped. The app's
// own connection (lib/db.ts) enables foreign keys for runtime enforcement.
sqlite.pragma('foreign_keys = OFF')

const db = drizzle(sqlite)
migrate(db, {migrationsFolder: './drizzle'})
sqlite.close()

console.log('Migrations applied successfully')

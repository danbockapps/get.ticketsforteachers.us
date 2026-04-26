import {sqliteTable, text, integer, index} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_sessions_user_id').on(table.userId),
  }),
)

export const magicLinkTokens = sqliteTable(
  'magic_link_tokens',
  {
    id: text('id').primaryKey(), // the token itself
    userId: text('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    expiresAt: integer('expires_at').notNull(), // unix timestamp (seconds)
  },
  (table) => ({
    userIdIdx: index('idx_magic_link_tokens_user_id').on(table.userId),
  }),
)

export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect

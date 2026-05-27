import {sqliteTable, text, integer, index} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(), // personal email, used for login
  emailVerified: integer('email_verified', {mode: 'boolean'}).notNull().default(false),
  workEmail: text('work_email').notNull().unique(),
  workEmailVerified: integer('work_email_verified', {mode: 'boolean'}).notNull().default(false),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  eventPreferences: text('event_preferences'), // JSON array of strings
  adaAccessible: integer('ada_accessible', {mode: 'boolean'}).notNull().default(false),
  primaryWorksite: text('primary_worksite'),
  phone: text('phone').unique(),
  phoneVerified: integer('phone_verified', {mode: 'boolean'}).notNull().default(false),
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
    emailType: text('email_type').notNull().default('personal'), // 'personal' | 'work'
  },
  (table) => ({
    userIdIdx: index('idx_magic_link_tokens_user_id').on(table.userId),
  }),
)

export const admins = sqliteTable('admins', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, {onDelete: 'cascade'}),
  domains: text('domains').notNull(), // JSON array of domain strings
})

export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type Admin = typeof admins.$inferSelect

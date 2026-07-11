import {sql} from 'drizzle-orm'
import {index, integer, primaryKey, real, sqliteTable, text} from 'drizzle-orm/sqlite-core'

export type TicketStatus = 'unclaimed' | 'claimed' | 'sent'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(), // personal email, used for login
  emailVerified: integer('email_verified', {mode: 'boolean'}).notNull().default(false),
  workEmail: text('work_email').notNull().unique(),
  workEmailVerified: integer('work_email_verified', {mode: 'boolean'}).notNull().default(false),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  eventPreferences: text('event_preferences'), // JSON array of strings
  contactMethod: text('contact_method').notNull().default('email'), // 'email' | 'sms' | 'sms_same_day'
  adaAccessible: integer('ada_accessible', {mode: 'boolean'}).notNull().default(false),
  primaryWorksite: text('primary_worksite'),
  phone: text('phone').unique(),
  phoneVerified: integer('phone_verified', {mode: 'boolean'}).notNull().default(false),
  smsConsentAt: text('sms_consent_at'), // ISO timestamp the user agreed to receive SMS/RCS; null = no consent
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

export const domains = sqliteTable('domains', {
  domain: text('domain').primaryKey(),
  // IANA time zone for the district (e.g. 'America/New_York'). Used to enforce TCPA
  // quiet hours (8am–9pm local) on outbound SMS. null = unknown; sends are blocked.
  timeZone: text('time_zone'),
  // DB-level default so raw SQL inserts (e.g. the distributor-granting flow) get a
  // timestamp without specifying one. Format matches `new Date().toISOString()`.
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
})

// Bridge table: one row = "this user is a distributor for this domain".
// A user can distribute for many domains; a domain can have many distributors.
export const domainDistributors = sqliteTable(
  'domain_distributors',
  {
    domain: text('domain')
      .notNull()
      .references(() => domains.domain, {onDelete: 'cascade'}),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
  },
  (table) => ({
    pk: primaryKey({columns: [table.domain, table.userId]}),
    userIdIdx: index('idx_domain_distributors_user_id').on(table.userId),
  }),
)

export const tickets = sqliteTable(
  'tickets',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    description: text('description').notNull(),
    quantity: integer('quantity').notNull(),
    eventAt: text('event_at').notNull(), // ISO timestamp
    location: text('location').notNull(),
    adaAccessible: integer('ada_accessible', {mode: 'boolean'}).notNull().default(false),
    parkingIncluded: integer('parking_included', {mode: 'boolean'}).notNull().default(false),
    highValue: integer('high_value', {mode: 'boolean'}).notNull().default(false),
    marketValue: real('market_value').notNull(), // dollars
    section: text('section'),
    row: text('row'),
    seats: text('seats'),
    notes: text('notes'),
    status: text('status').$type<TicketStatus>().notNull().default('unclaimed'),
    claimedByUserId: text('claimed_by_user_id').references(() => users.id, {onDelete: 'set null'}),
    claimedAt: text('claimed_at'),
    createdByDistributorId: text('created_by_distributor_id')
      .notNull()
      .references(() => users.id, {onDelete: 'restrict'}),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    deletedAt: text('deleted_at'), // ISO timestamp; null = not deleted (soft-delete)
    domain: text('domain')
      .notNull()
      .references(() => domains.domain, {onDelete: 'restrict'}),
  },
  (table) => ({
    statusIdx: index('idx_tickets_status').on(table.status),
    domainIdx: index('idx_tickets_domain').on(table.domain),
  }),
)

export const ticketOffers = sqliteTable(
  'ticket_offers',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id, {onDelete: 'cascade'}),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    token: text('token').notNull().unique(),
    method: text('method').notNull(), // 'email' | 'sms'
    sentAt: text('sent_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    openedAt: text('opened_at'),
    declinedAt: text('declined_at'),
  },
  (table) => ({
    ticketIdIdx: index('idx_ticket_offers_ticket_id').on(table.ticketId),
    userIdIdx: index('idx_ticket_offers_user_id').on(table.userId),
  }),
)

export const ticketEvents = sqliteTable(
  'ticket_events',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id, {onDelete: 'cascade'}),
    actorUserId: text('actor_user_id').references(() => users.id, {onDelete: 'set null'}),
    actorDistributorId: text('actor_distributor_id').references(() => users.id, {onDelete: 'set null'}),
    eventType: text('event_type').notNull(), // 'created' | 'offered' | 'accepted' | 'declined' | 'marked_sent' | 'status_changed' | 'edited' | 'deleted' | 'restored'
    targetUserId: text('target_user_id').references(() => users.id, {onDelete: 'set null'}),
    details: text('details'), // JSON
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    ticketIdIdx: index('idx_ticket_events_ticket_id').on(table.ticketId),
  }),
)

export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type Domain = typeof domains.$inferSelect
export type DomainDistributor = typeof domainDistributors.$inferSelect
export type Ticket = typeof tickets.$inferSelect
export type InsertTicket = typeof tickets.$inferInsert
export type TicketOffer = typeof ticketOffers.$inferSelect
export type InsertTicketOffer = typeof ticketOffers.$inferInsert
export type TicketEvent = typeof ticketEvents.$inferSelect
export type InsertTicketEvent = typeof ticketEvents.$inferInsert

CREATE TABLE `domains` (
	`domain` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `domains` ("domain", "created_at") SELECT DISTINCT "domain", strftime('%Y-%m-%dT%H:%M:%fZ', 'now') FROM `tickets`;--> statement-breakpoint
CREATE TABLE `domain_admins` (
	`domain` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`domain`, `user_id`),
	FOREIGN KEY (`domain`) REFERENCES `domains`(`domain`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_domain_admins_user_id` ON `domain_admins` (`user_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ticket_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_id` integer NOT NULL,
	`actor_user_id` text,
	`actor_admin_id` text,
	`event_type` text NOT NULL,
	`target_user_id` text,
	`details` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_ticket_events`("id", "ticket_id", "actor_user_id", "actor_admin_id", "event_type", "target_user_id", "details", "created_at") SELECT "id", "ticket_id", "actor_user_id", "actor_admin_id", "event_type", "target_user_id", "details", "created_at" FROM `ticket_events`;--> statement-breakpoint
DROP TABLE `ticket_events`;--> statement-breakpoint
ALTER TABLE `__new_ticket_events` RENAME TO `ticket_events`;--> statement-breakpoint
CREATE INDEX `idx_ticket_events_ticket_id` ON `ticket_events` (`ticket_id`);--> statement-breakpoint
CREATE TABLE `__new_tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`quantity` integer NOT NULL,
	`event_at` text NOT NULL,
	`location` text NOT NULL,
	`ada_accessible` integer DEFAULT false NOT NULL,
	`parking_included` integer DEFAULT false NOT NULL,
	`market_value` real NOT NULL,
	`section` text,
	`row` text,
	`seats` text,
	`notes` text,
	`status` text DEFAULT 'unclaimed' NOT NULL,
	`claimed_by_user_id` text,
	`claimed_at` text,
	`created_by_admin_id` text NOT NULL,
	`created_at` text NOT NULL,
	`domain` text NOT NULL,
	FOREIGN KEY (`claimed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`domain`) REFERENCES `domains`(`domain`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_tickets`("id", "description", "quantity", "event_at", "location", "ada_accessible", "parking_included", "market_value", "section", "row", "seats", "notes", "status", "claimed_by_user_id", "claimed_at", "created_by_admin_id", "created_at", "domain") SELECT "id", "description", "quantity", "event_at", "location", "ada_accessible", "parking_included", "market_value", "section", "row", "seats", "notes", "status", "claimed_by_user_id", "claimed_at", "created_by_admin_id", "created_at", "domain" FROM `tickets`;--> statement-breakpoint
DROP TABLE `tickets`;--> statement-breakpoint
ALTER TABLE `__new_tickets` RENAME TO `tickets`;--> statement-breakpoint
CREATE INDEX `idx_tickets_status` ON `tickets` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tickets_domain` ON `tickets` (`domain`);--> statement-breakpoint
DROP TABLE `admins`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
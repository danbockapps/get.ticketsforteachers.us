CREATE TABLE `ticket_events` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`actor_user_id` text,
	`actor_admin_id` text,
	`event_type` text NOT NULL,
	`target_user_id` text,
	`details` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_admin_id`) REFERENCES `admins`(`user_id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_ticket_events_ticket_id` ON `ticket_events` (`ticket_id`);--> statement-breakpoint
CREATE TABLE `ticket_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`method` text NOT NULL,
	`sent_at` text NOT NULL,
	`opened_at` text,
	`declined_at` text,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ticket_offers_token_unique` ON `ticket_offers` (`token`);--> statement-breakpoint
CREATE INDEX `idx_ticket_offers_ticket_id` ON `ticket_offers` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_ticket_offers_user_id` ON `ticket_offers` (`user_id`);--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
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
	FOREIGN KEY (`created_by_admin_id`) REFERENCES `admins`(`user_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_tickets_status` ON `tickets` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tickets_domain` ON `tickets` (`domain`);
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ticket_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
INSERT INTO `__new_ticket_events`("ticket_id", "actor_user_id", "actor_admin_id", "event_type", "target_user_id", "details", "created_at") SELECT "ticket_id", "actor_user_id", "actor_admin_id", "event_type", "target_user_id", "details", "created_at" FROM `ticket_events` ORDER BY "created_at";--> statement-breakpoint
DROP TABLE `ticket_events`;--> statement-breakpoint
ALTER TABLE `__new_ticket_events` RENAME TO `ticket_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_ticket_events_ticket_id` ON `ticket_events` (`ticket_id`);
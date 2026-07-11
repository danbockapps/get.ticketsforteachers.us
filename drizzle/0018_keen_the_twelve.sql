CREATE TABLE `consent_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`event` text NOT NULL,
	`channel` text DEFAULT 'sms' NOT NULL,
	`source` text NOT NULL,
	`method` text NOT NULL,
	`ip_address` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_consent_events_user_id` ON `consent_events` (`user_id`);--> statement-breakpoint
--> Backfill: seed a 'grant' event for every currently-consenting user, preserving
--> their original consent timestamp, before the source column is dropped.
INSERT INTO `consent_events` (`user_id`, `event`, `channel`, `source`, `method`, `ip_address`, `created_at`)
SELECT `id`, 'grant', 'sms', 'backfill', 'web_form', NULL, `sms_consent_at`
FROM `users` WHERE `sms_consent_at` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `sms_consent_at`;
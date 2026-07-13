ALTER TABLE `users` ADD `domain` text DEFAULT '' NOT NULL;--> statement-breakpoint
--> Backfill: derive each user's domain from the host portion of their work_email
--> (everything after the last '@'), matching lib/contact.ts emailHost().
UPDATE `users` SET `domain` = substr(`work_email`, instr(`work_email`, '@') + 1)
WHERE instr(`work_email`, '@') > 0;--> statement-breakpoint
CREATE INDEX `idx_users_domain` ON `users` (`domain`);
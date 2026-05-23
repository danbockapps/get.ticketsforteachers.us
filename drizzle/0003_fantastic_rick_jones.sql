ALTER TABLE `magic_link_tokens` ADD `email_type` text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `work_email` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `work_email_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_work_email_unique` ON `users` (`work_email`);
ALTER TABLE `domain_admins` RENAME TO `domain_distributors`;
--> statement-breakpoint
DROP INDEX `idx_domain_admins_user_id`;
--> statement-breakpoint
CREATE INDEX `idx_domain_distributors_user_id` ON `domain_distributors` (`user_id`);
--> statement-breakpoint
ALTER TABLE `tickets` RENAME COLUMN `created_by_admin_id` TO `created_by_distributor_id`;
--> statement-breakpoint
ALTER TABLE `ticket_events` RENAME COLUMN `actor_admin_id` TO `actor_distributor_id`;

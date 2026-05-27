CREATE TABLE `admins` (
	`user_id` text PRIMARY KEY NOT NULL,
	`domains` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

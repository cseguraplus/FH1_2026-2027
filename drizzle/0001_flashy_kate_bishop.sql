CREATE TABLE `request_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`resets_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `request_limits_expiry_idx` ON `request_limits` (`resets_at`);--> statement-breakpoint
CREATE TABLE `site_admin` (
	`role` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bound_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;

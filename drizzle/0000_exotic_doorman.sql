CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`name` text NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`referral_code` text NOT NULL,
	`sponsor_id` text,
	`wants_founder` integer DEFAULT 0 NOT NULL,
	`founder` integer DEFAULT 0 NOT NULL,
	`consent_version` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sponsor_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_public_id_unique` ON `profiles` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_referral_code_unique` ON `profiles` (`referral_code`);--> statement-breakpoint
CREATE INDEX `profiles_sponsor_idx` ON `profiles` (`sponsor_id`);--> statement-breakpoint
CREATE TABLE `progress` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`completed_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE no action
);

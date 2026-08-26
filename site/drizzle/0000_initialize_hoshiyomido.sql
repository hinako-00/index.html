CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text,
  `display_name` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `profiles` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `name` text,
  `birth_date` text,
  `birth_time` text,
  `birth_place` text,
  `consented_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_user_id` ON `profiles` (`user_id`);
--> statement-breakpoint
CREATE TABLE `reading_history` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `reading_id` text NOT NULL,
  `concern` text,
  `result_json` text NOT NULL,
  `unlocked` integer DEFAULT false NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reading_history_user_created` ON `reading_history` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `conversations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `role` text NOT NULL,
  `content` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_conversations_user_created` ON `conversations` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `provider_customer_id` text,
  `provider_subscription_id` text,
  `plan` text DEFAULT 'free' NOT NULL,
  `status` text DEFAULT 'inactive' NOT NULL,
  `current_period_end` integer,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_subscriptions_user_id` ON `subscriptions` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_subscriptions_provider_id` ON `subscriptions` (`provider_subscription_id`);
--> statement-breakpoint
PRAGMA optimize;

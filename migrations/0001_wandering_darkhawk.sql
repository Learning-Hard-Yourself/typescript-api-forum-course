CREATE TABLE `post_edits` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`editor_id` text NOT NULL,
	`previous_content` text NOT NULL,
	`new_content` text NOT NULL,
	`edit_reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`editor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`post_id` text NOT NULL,
	`vote_type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_user_id_post_id_unique` ON `votes` (`user_id`,`post_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`parent_post_id` text,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`vote_score` integer DEFAULT 0 NOT NULL,
	`is_edited` integer DEFAULT false NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`deleted_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "thread_id", "parent_post_id", "author_id", "content", "vote_score", "is_edited", "is_deleted", "deleted_at", "deleted_by", "created_at", "updated_at") SELECT "id", "thread_id", "parent_post_id", "author_id", "content", "vote_score", "is_edited", "is_deleted", NULL, NULL, "created_at", "updated_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`author_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text,
	`is_pinned` integer DEFAULT false NOT NULL,
	`is_locked` integer DEFAULT false NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`reply_count` integer DEFAULT 0 NOT NULL,
	`last_post_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_threads`("id", "category_id", "author_id", "title", "slug", "is_pinned", "is_locked", "view_count", "reply_count", "last_post_id", "created_at", "updated_at") SELECT "id", "category_id", "author_id", "title", "slug", "is_pinned", "is_locked", "view_count", "reply_count", "last_post_id", "created_at", "updated_at" FROM `threads`;--> statement-breakpoint
DROP TABLE `threads`;--> statement-breakpoint
ALTER TABLE `__new_threads` RENAME TO `threads`;--> statement-breakpoint
CREATE UNIQUE INDEX `threads_slug_unique` ON `threads` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`display_name` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`password_hash` text,
	`image` text,
	`avatar_url` text,
	`role` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_active_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "email", "name", "display_name", "email_verified", "password_hash", "image", "avatar_url", "role", "created_at", "updated_at", "last_active_at") SELECT "id", "username", "email", "name", "display_name", "email_verified", "password_hash", "image", "avatar_url", "role", "created_at", "updated_at", "last_active_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
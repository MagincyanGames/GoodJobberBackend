ALTER TABLE `good_jobs` ADD `current_owner_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `good_jobs` ADD `last_transfer_date` integer;
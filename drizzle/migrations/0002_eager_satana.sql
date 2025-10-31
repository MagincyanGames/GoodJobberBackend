-- Agregar campos con valor por defecto temporal
ALTER TABLE `transfers` ADD `balance_after_from` integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `transfers` ADD `balance_after_to` integer NOT NULL DEFAULT 0;
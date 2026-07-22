CREATE TABLE `incident_events` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "incident_events_type_check" CHECK("incident_events"."type" in ('created', 'status_changed', 'owner_changed', 'note_added', 'metric_alert'))
);
--> statement-breakpoint
CREATE INDEX `incident_events_incident_created_idx` ON `incident_events` (`incident_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `incident_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `incident_notes_incident_created_idx` ON `incident_notes` (`incident_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`severity` text NOT NULL,
	`status` text NOT NULL,
	`owner` text,
	`started_at` text NOT NULL,
	`resolved_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "incidents_severity_check" CHECK("incidents"."severity" in ('sev1', 'sev2', 'sev3')),
	CONSTRAINT "incidents_status_check" CHECK("incidents"."status" in ('investigating', 'identified', 'monitoring', 'resolved'))
);
--> statement-breakpoint
CREATE INDEX `incidents_service_idx` ON `incidents` (`service_id`);--> statement-breakpoint
CREATE INDEX `incidents_status_idx` ON `incidents` (`status`);--> statement-breakpoint
CREATE INDEX `incidents_severity_idx` ON `incidents` (`severity`);--> statement-breakpoint
CREATE INDEX `incidents_started_idx` ON `incidents` (`started_at`);--> statement-breakpoint
CREATE TABLE `metric_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`timestamp` text NOT NULL,
	`latency_ms` real NOT NULL,
	`error_rate` real NOT NULL,
	`throughput` real NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `metric_snapshots_service_timestamp_idx` ON `metric_snapshots` (`service_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `service_dependencies` (
	`service_id` text NOT NULL,
	`dependency_service_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	PRIMARY KEY(`service_id`, `dependency_service_id`),
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dependency_service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "service_dependencies_no_self_check" CHECK("service_dependencies"."service_id" <> "service_dependencies"."dependency_service_id")
);
--> statement-breakpoint
CREATE INDEX `service_dependencies_service_idx` ON `service_dependencies` (`service_id`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`slo_target` real NOT NULL,
	`uptime_30d` real NOT NULL,
	`last_deploy_at` text NOT NULL,
	CONSTRAINT "services_status_check" CHECK("services"."status" in ('operational', 'degraded', 'outage'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);
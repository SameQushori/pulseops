import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const services = sqliteTable(
  'services',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    slug: text().notNull(),
    description: text().notNull(),
    status: text().notNull(),
    sloTarget: real('slo_target').notNull(),
    uptime30d: real('uptime_30d').notNull(),
    lastDeployAt: text('last_deploy_at').notNull(),
  },
  (table) => [
    uniqueIndex('services_slug_unique').on(table.slug),
    check(
      'services_status_check',
      sql`${table.status} in ('operational', 'degraded', 'outage')`,
    ),
  ],
);

export const incidents = sqliteTable(
  'incidents',
  {
    id: text().primaryKey(),
    serviceId: text('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    title: text().notNull(),
    summary: text().notNull(),
    severity: text().notNull(),
    status: text().notNull(),
    owner: text(),
    startedAt: text('started_at').notNull(),
    resolvedAt: text('resolved_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('incidents_service_idx').on(table.serviceId),
    index('incidents_status_idx').on(table.status),
    index('incidents_severity_idx').on(table.severity),
    index('incidents_started_idx').on(table.startedAt),
    check(
      'incidents_severity_check',
      sql`${table.severity} in ('sev1', 'sev2', 'sev3')`,
    ),
    check(
      'incidents_status_check',
      sql`${table.status} in ('investigating', 'identified', 'monitoring', 'resolved')`,
    ),
  ],
);

export const incidentEvents = sqliteTable(
  'incident_events',
  {
    id: text().primaryKey(),
    incidentId: text('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    type: text().notNull(),
    message: text().notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('incident_events_incident_created_idx').on(
      table.incidentId,
      table.createdAt,
    ),
    check(
      'incident_events_type_check',
      sql`${table.type} in ('created', 'status_changed', 'owner_changed', 'note_added', 'metric_alert')`,
    ),
  ],
);

export const incidentNotes = sqliteTable(
  'incident_notes',
  {
    id: text().primaryKey(),
    incidentId: text('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    author: text().notNull(),
    body: text().notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('incident_notes_incident_created_idx').on(
      table.incidentId,
      table.createdAt,
    ),
  ],
);

export const metricSnapshots = sqliteTable(
  'metric_snapshots',
  {
    id: text().primaryKey(),
    serviceId: text('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    timestamp: text().notNull(),
    latencyMs: real('latency_ms').notNull(),
    errorRate: real('error_rate').notNull(),
    throughput: real().notNull(),
  },
  (table) => [
    index('metric_snapshots_service_timestamp_idx').on(
      table.serviceId,
      table.timestamp,
    ),
  ],
);

export const serviceDependencies = sqliteTable(
  'service_dependencies',
  {
    serviceId: text('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    dependencyServiceId: text('dependency_service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.serviceId, table.dependencyServiceId] }),
    index('service_dependencies_service_idx').on(table.serviceId),
    check(
      'service_dependencies_no_self_check',
      sql`${table.serviceId} <> ${table.dependencyServiceId}`,
    ),
  ],
);

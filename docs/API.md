# PulseOps API contract

All routes are same-origin under `/api`. Successful payloads are validated by
the same Zod schemas used at the RTK Query boundary. Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "fieldErrors": {
      "status": "Invalid option"
    }
  }
}
```

Malformed JSON returns `400`, unknown entities/routes return `404`, schema
validation returns `422`, and unexpected internals return a safe `500` without
D1, Drizzle, Zod or stack details.

## Transport parity

| Method | Path                       | Input                                              | Success schema                 | Sorting/filtering and side effects                                                                                         |
| ------ | -------------------------- | -------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/health`              | —                                                  | `{ status: "ok" }`             | Executes a safe D1 query                                                                                                   |
| GET    | `/api/overview`            | —                                                  | `OverviewResponse`             | Latest KPI, 3 unresolved incidents, newest 4 events; no simulation                                                         |
| GET    | `/api/incidents`           | `query`, `status`, `severity`, `serviceId`, `sort` | `{ items: Incident[], total }` | Trimmed case-insensitive title/summary search; newest default; oldest/severity modes; stable ID ties; invalid values `422` |
| GET    | `/api/incidents/:id`       | non-empty ID                                       | `IncidentDetailsResponse`      | Timeline and notes chronological; unknown `404`                                                                            |
| PATCH  | `/api/incidents/:id`       | `UpdateIncidentRequest`                            | `Incident`                     | Persists status/owner and `updatedAt`; resolved sets `resolvedAt`; changed fields append ordered timeline events           |
| POST   | `/api/incidents/:id/notes` | `AddIncidentNoteRequest`                           | `IncidentNote` (`201`)         | Persists the note and a `note_added` timeline event atomically                                                             |
| GET    | `/api/services`            | —                                                  | `{ items: Service[], total }`  | Stable name/ID order; four services                                                                                        |
| GET    | `/api/services/:id`        | service ID or slug                                 | `ServiceDetailsResponse`       | Direct dependencies in declared order, incidents newest-first, metrics chronological                                       |

The browser MSW handlers and real Hono routes share these inputs, schemas,
statuses, filters, sorting rules, errors and mutation side effects. Runtime
UUIDs and mutation timestamps intentionally differ: MSW uses deterministic
session identities, while D1 uses `crypto.randomUUID()` and current UTC.

## Database

Drizzle owns the schema and generated migration for:

- `services`;
- `incidents`;
- `incident_events`;
- `incident_notes`;
- `metric_snapshots`;
- `service_dependencies`.

Foreign keys and enum-like checks are enabled in SQLite, while shared Zod
schemas remain the transport/application authority. Mutations use D1 batches so
the entity write and its timeline side effects form one logical operation.

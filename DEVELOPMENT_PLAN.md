# PulseOps — detailed development plan

This is the authoritative execution plan for the project. `PRODUCT.md` defines the product; this file defines implementation order, boundaries and verification.

## 1. Project objective

Build a polished portfolio application that demonstrates:

- production-style React and TypeScript architecture;
- meaningful Redux Toolkit and RTK Query usage;
- data visualization and non-trivial UI states;
- a complete incident-management workflow;
- a small real backend without paid infrastructure;
- accessibility, responsiveness and automated testing.

The finished demo must tell one clear story:

> A healthy system begins to degrade, PulseOps creates an incident, the user investigates it, adds context, changes its status, and sees the system recover.

## 2. Scope boundary

### Portfolio release includes

- public presentation page with a clear demo entry point;
- Overview page;
- Incidents list;
- Incident details and timeline;
- Services list;
- deterministic incident simulation;
- real read/write API for core entities;
- responsive desktop/mobile UI;
- automated tests for the main workflow;
- deployable Cloudflare configuration;
- portfolio-quality README and screenshots.

### Explicitly excluded

- registration, login and permissions;
- organizations or multi-tenancy;
- billing and subscriptions;
- email, Slack or webhook integrations;
- real infrastructure monitoring;
- background jobs;
- WebSocket or SSE server;
- AI-generated incident summaries;
- drag-and-drop dashboards;
- light theme;
- localization;
- native mobile application;
- full admin CRUD.

Excluded work can only enter the plan after explicit user approval.

## 3. Locked stack

### Client

- React 19;
- TypeScript with `strict: true`;
- Vite;
- React Router;
- Redux Toolkit;
- RTK Query;
- CSS Modules and global CSS custom properties;
- React Bits source components, used selectively;
- Recharts;
- Lucide React;
- Zod;
- date-fns.

### Mocking and tests

- MSW;
- Vitest;
- React Testing Library;
- Playwright;
- axe accessibility checks where practical.

### Backend and deployment

- Cloudflare Pages Functions;
- Hono;
- Cloudflare D1;
- Drizzle ORM;
- Wrangler;
- one Cloudflare project for the built client and API.

Do not add Storybook until the portfolio release is complete. It is optional polish, not an MVP dependency.

## 4. Architecture

Target client structure:

```text
src/
  app/
    providers/
    router/
    store/
    styles/
  pages/
    landing/
    overview/
    incidents/
    incident-details/
    services/
    not-found/
  features/
    incident-filters/
    incident-simulation/
    incident-status/
    add-incident-note/
    time-range/
  entities/
    incident/
    service/
    metric/
    event/
  shared/
    api/
    config/
    lib/
    ui/
      react-bits/
```

Target backend structure:

```text
functions/
  api/
    [[route]].ts
server/
  app.ts
  db/
    schema.ts
    seed.ts
  routes/
    health.ts
    overview.ts
    incidents.ts
    services.ts
  validation/
drizzle/
```

Dependency direction:

```text
app/pages → features → entities → shared
```

Lower layers must not import from higher layers. Pages compose features and entities but contain little business logic.

## 5. State ownership

Use this table before adding state:

| State                                       | Owner                       |
| ------------------------------------------- | --------------------------- |
| Services, incidents, notes, initial metrics | RTK Query cache             |
| Current simulation phase                    | Redux `simulationSlice`     |
| Generated live metric points                | Redux `simulationSlice`     |
| Global time range                           | Redux `preferencesSlice`    |
| Incidents filters encoded in URL            | React Router search params  |
| Open dialog, hover, input draft             | Local React state           |
| Add-note form validation                    | Local form state            |
| Theme                                       | Not configurable; one theme |

Rules:

- Never duplicate the same server entity in a slice and RTK Query.
- Use memoized selectors for derived simulation values.
- URL search parameters are the source of truth for shareable filters.
- Simulation timers are coordinated through listener middleware and cleaned up on stop/unmount.

## 6. Domain model

Use string IDs and ISO 8601 UTC timestamps.

```ts
type ServiceStatus = 'operational' | 'degraded' | 'outage';
type IncidentSeverity = 'sev1' | 'sev2' | 'sev3';
type IncidentStatus =
  'investigating' | 'identified' | 'monitoring' | 'resolved';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ServiceStatus;
  sloTarget: number;
  uptime30d: number;
  lastDeployAt: string;
}

interface Incident {
  id: string;
  title: string;
  summary: string;
  serviceId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  owner: string | null;
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IncidentEvent {
  id: string;
  incidentId: string;
  type:
    | 'created'
    | 'status_changed'
    | 'owner_changed'
    | 'note_added'
    | 'metric_alert';
  message: string;
  createdAt: string;
}

interface IncidentNote {
  id: string;
  incidentId: string;
  author: string;
  body: string;
  createdAt: string;
}

interface MetricPoint {
  timestamp: string;
  latencyMs: number;
  errorRate: number;
  throughput: number;
}
```

## 7. API contract

All successful responses return JSON. Errors use:

```ts
interface ApiError {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}
```

Required endpoints:

| Method | Path                       | Purpose                                                   |
| ------ | -------------------------- | --------------------------------------------------------- |
| GET    | `/api/health`              | Deployment health check                                   |
| GET    | `/api/overview`            | KPI snapshot, services, initial metrics and recent events |
| GET    | `/api/incidents`           | Filtered incidents list                                   |
| GET    | `/api/incidents/:id`       | Incident, service, timeline and notes                     |
| PATCH  | `/api/incidents/:id`       | Change status or owner                                    |
| POST   | `/api/incidents/:id/notes` | Add a note                                                |
| GET    | `/api/services`            | Services list                                             |
| GET    | `/api/services/:id`        | Service details and incident history                      |

Supported incidents query parameters:

- `status`;
- `severity`;
- `serviceId`;
- `query`;
- `sort` with `newest`, `oldest`, `severity`.

The API does not generate live metric points. The overview response contains the initial stable series; the client simulation appends deterministic points.

## 8. Database scope

Tables:

- `services`;
- `incidents`;
- `incident_events`;
- `incident_notes`;
- `metric_snapshots`.

Relations:

- one service has many incidents;
- one incident has many events;
- one incident has many notes.

Seed data:

- 4 services;
- 5–7 historical incidents with different statuses and severities;
- one resolved Payments API incident;
- initial stable metric snapshots;
- realistic events and notes.

Seed data must be deterministic. Names, timestamps and values must not change randomly between test runs.

## 9. Visual system

### Tokens

Create CSS variables for:

- canvas, raised surface and hover surface;
- primary and muted text;
- neutral border;
- lime accent;
- severity warning and critical colors;
- focus ring;
- spacing scale;
- radii;
- shadows;
- typography.

### Component rules

- `BorderGlowCard` is the primary React Bits adaptation.
- Glow is subtle in stable state and stronger for active warnings.
- Severity is always communicated by text/icon as well as color.
- Sidebar navigation is desktop-only; compact bottom navigation is mobile-only.
- Charts use no more than three visible series.
- Tables turn into readable stacked rows on narrow screens.
- Decorative background effects are limited to empty states or the top portion of Overview.

### Required reusable UI

- `AppShell`;
- `PageHeader`;
- `Button`;
- `IconButton`;
- `StatusBadge`;
- `SeverityBadge`;
- `BorderGlowCard`;
- `MetricCard`;
- `EmptyState`;
- `ErrorState`;
- `Skeleton`;
- `Dialog`;
- `Select`;
- `TextField`;
- `Textarea`;
- `Toast`;
- `VisuallyHidden`.

Do not build a large general-purpose design system. Add a shared component only after it is used by at least two screens or is required for accessibility consistency.

## 10. Simulation state machine

The simulation must be deterministic and restartable.

```text
idle
  → degrading
  → incident-created
  → investigating
  → recovering
  → resolved
  → idle
```

Required behavior:

1. `Start simulation` resets the demo to the stable seed.
2. Latency and error rate rise over a short predefined sequence.
3. Payments API changes to `degraded`.
4. A SEV-2 incident appears and an event is added.
5. The user can open the incident and change its workflow status.
6. Recovery appends declining metric values.
7. Payments API returns to `operational`.
8. The incident can be resolved.
9. `Reset demo` returns all simulation-only client state to the initial snapshot.

Simulation values must come from fixed arrays or a seeded function, never `Math.random()`. This keeps tests and screenshots stable.

## 11. Route map

| Route                        | Page                        |
| ---------------------------- | --------------------------- |
| `/`                          | Public project presentation |
| `/app`                       | Redirect to `/app/overview` |
| `/app/overview`              | System overview             |
| `/app/incidents`             | Incidents list              |
| `/app/incidents/:incidentId` | Incident details            |
| `/app/services`              | Services list               |
| `/app/services/:serviceId`   | Service details             |
| `*`                          | Not found                   |

All pages must support direct navigation and browser back/forward behavior.

## 12. Implementation stages

Only one stage may be active at a time.

Each stage is executed in a separate chat. A stage chat must finish by updating
`PROJECT_STATUS.md` and must not start work from the next stage. The prompt for a
later stage is written only after the previous stage is complete, so it can include
the actual handoff state rather than assumptions.

### Stage 0 — Repository foundation

Tasks:

- initialize Vite React TypeScript project in the repository root without deleting planning files;
- add required runtime and development dependencies;
- enable strict TypeScript options;
- configure ESLint and Prettier;
- add test setup;
- add scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`;
- create the target folders;
- add a minimal README with local commands;
- ensure planning documents remain tracked.

Exit criteria:

- application renders;
- `typecheck`, `lint`, `test` and `build` pass;
- no generated starter content remains;
- repository structure matches the plan.

### Stage 1 — Design tokens and application shell

Tasks:

- implement global reset and tokens;
- establish typography and responsive breakpoints;
- build `AppShell` with sidebar and mobile navigation;
- configure all routes with placeholder pages;
- implement visible focus styles;
- add reduced-motion handling;
- add Lucide icons with accessible labels;
- create base button, badge, loading and error primitives.

Exit criteria:

- every route is reachable;
- navigation shows active state;
- layout works at 360 px, 768 px and 1440 px;
- keyboard navigation is usable;
- no page has horizontal overflow.

### Stage 2 — Domain, store and mock API

Tasks:

- add domain types and Zod schemas;
- configure Redux store and typed hooks;
- create RTK Query API slice;
- create deterministic fixtures;
- configure MSW browser and test handlers;
- implement mock versions of all required endpoints;
- add API error normalization;
- add loading, empty and error examples.

Exit criteria:

- Overview, Incidents and Services placeholders receive typed data through RTK Query;
- invalid mock payloads fail Zod validation;
- MSW contract tests cover success and error responses;
- server state is not duplicated in Redux slices.

### Stage 3 — Public presentation page

Tasks:

- implement a concise public landing page at `/`;
- explain that PulseOps is an interactive incident-response simulator;
- add `Start simulation` and `View source` actions;
- explain the Detect → Investigate → Resolve scenario;
- state clearly that telemetry is deterministic and simulated;
- include a restrained preview of the operations UI;
- add a short engineering highlights section;
- keep the page responsive and consistent with the application visual system.

Exit criteria:

- a first-time visitor understands the project in under 30 seconds;
- the primary action enters `/app/overview`;
- the page does not pretend to be a production monitoring service;
- the page works at 360 px, 768 px and desktop;
- copy contains no fake customers, testimonials or unsupported claims.

### Stage 4 — Overview screen

Tasks:

- implement header and overall status;
- add 3–4 KPI cards;
- adapt React Bits `Border Glow`;
- add performance chart;
- add service-health list;
- add activity feed;
- add time-range control;
- cover loading, empty and error states;
- make the screen responsive.

Exit criteria:

- screen matches the approved visual direction;
- chart has accessible name and readable labels;
- glow does not harm contrast or reduced-motion mode;
- data comes only through RTK Query/selectors;
- component tests cover major states.

### Stage 5 — Incident simulation

Tasks:

- create `simulationSlice`;
- implement state-machine actions and selectors;
- implement listener middleware timers with cleanup;
- append deterministic metric points;
- overlay simulated service and incident state on API data;
- add start, recovery and reset controls;
- add relevant activity events and toast feedback.

Exit criteria:

- simulation completes without page reload;
- repeated start/reset produces identical results;
- no duplicate timers remain after reset or navigation;
- fake timers test every state transition;
- reduced-motion mode avoids decorative transitions but preserves state changes.

### Stage 6 — Incidents list

Tasks:

- implement incidents query;
- add URL-backed search and filters;
- add severity/status/service filters;
- add sorting;
- implement result count;
- implement desktop table and mobile rows;
- link each incident to its details page;
- add loading, empty, no-results and error states.

Exit criteria:

- filters survive refresh and can be shared by URL;
- browser back/forward restores filters;
- filter controls are keyboard accessible;
- filtering and sorting have tests;
- no saved views feature is added in MVP.

### Stage 7 — Incident details workflow

Tasks:

- show incident header, service, severity, owner and timestamps;
- add related metrics chart;
- render chronological timeline;
- implement status change;
- implement owner change using a small predefined owner list;
- implement add-note dialog/form;
- use optimistic update with rollback;
- calculate and display MTTA/MTTR when data permits;
- handle unknown incident IDs.

Exit criteria:

- the user can investigate, update and resolve an incident;
- optimistic failure rolls back and displays an error;
- note validation prevents blank or oversized text;
- timeline order is deterministic;
- E2E test covers the complete incident workflow.

### Stage 8 — Services

Tasks:

- implement services list with health, SLO and last deploy;
- implement service details page;
- show a simple dependency list, not an interactive graph;
- show recent incidents for the service;
- link between services and incidents;
- add responsive and error states.

Exit criteria:

- all seeded services are discoverable;
- status and SLO values are understandable without relying on color;
- cross-navigation works;
- no complex topology editor or canvas is introduced.

### Stage 9 — Real backend

Tasks:

- configure Wrangler and local D1;
- add Drizzle schema and migrations;
- implement deterministic seed script;
- implement Hono routes;
- validate path, query and body inputs;
- return the documented error shape;
- connect RTK Query to `/api`;
- keep MSW for tests and isolated development;
- add API integration tests;
- add `/api/health`.

Exit criteria:

- local application works against D1;
- all required endpoints match the MSW contract;
- status/owner changes and notes persist;
- invalid input returns appropriate 4xx responses;
- deployment configuration contains no secrets;
- frontend can switch between mock and real API without component changes.

### Stage 10 — Quality and polish

Tasks:

- audit semantic headings and landmarks;
- audit focus order and keyboard interaction;
- run automated accessibility checks;
- verify reduced motion;
- remove unnecessary rerenders found through inspection;
- lazy-load route-level pages if useful;
- add final empty/error/skeleton polish;
- verify copy consistency;
- test at required breakpoints;
- remove unused code and dependencies.

Exit criteria:

- typecheck, lint, unit, component, E2E and build checks pass;
- main flows work at 360 px and desktop;
- no serious accessibility violations remain;
- no console errors or warnings remain;
- initial load is reasonable for a portfolio demo.

### Stage 11 — Deployment and portfolio handoff

Tasks:

- create production D1 database;
- apply migrations and seed;
- deploy the Cloudflare project;
- verify production health and main workflow;
- write final README;
- document architecture and tradeoffs;
- add screenshots or a short GIF;
- include live demo and repository links when available;
- document local development and test commands.

Exit criteria:

- production URL is reachable;
- API health check passes;
- complete demo scenario works in production;
- README explains why Redux, RTK Query, MSW and D1 were chosen;
- a reviewer can run the project from a clean clone.

## 13. Required test matrix

### Unit

- domain formatters;
- status/severity mappings;
- simulation selectors;
- simulation state transitions;
- MTTA/MTTR calculations;
- API error normalization.

### Component

- MetricCard stable/degraded states;
- Overview loading/success/error;
- incident filters and URL synchronization;
- incidents empty/no-results states;
- note form validation;
- optimistic update rollback;
- reduced-motion behavior where observable.

### E2E

1. Open Overview.
2. Start incident simulation.
3. Observe Payments API degradation.
4. Open the generated incident.
5. Change its status.
6. Add a note.
7. Move to monitoring/resolved.
8. Confirm Overview recovery.

Second smoke path:

1. Open Incidents directly.
2. Filter by severity and status.
3. Refresh.
4. Confirm filters remain in the URL and results remain correct.

## 14. Performance and accessibility budgets

Targets, not reasons to hide functionality:

- no horizontal scrolling at 360 px;
- all primary actions usable without a mouse;
- no information communicated by color alone;
- visible focus indicator on every interactive element;
- charts have accessible descriptions;
- animation disabled or simplified under `prefers-reduced-motion`;
- avoid shipping large 3D/WebGL dependencies;
- route-level code splitting if the initial bundle becomes unnecessarily large;
- no interval or listener leaks after route changes.

## 15. Definition of done

A task is done only when:

- requested behavior is implemented;
- TypeScript and lint pass for the changed scope;
- relevant tests exist and pass;
- responsive behavior was checked when UI changed;
- accessibility states were considered;
- no unrelated refactor was included;
- plan progress and decisions were updated.

A stage is done only when every exit criterion is verified and `PROJECT_STATUS.md`
contains its verification evidence.

The portfolio release is done only when:

- all stages 0–11 are complete;
- the production demo works;
- the core E2E scenario passes;
- the repository documentation is ready for an external reviewer.

## 16. Project status

`PROJECT_STATUS.md` is the only source of truth for stage statuses, verification
evidence, blockers and handoff notes. Do not recreate a second progress table here.

## 17. Decision log

Agents append decisions here only when they affect later work.

| Date       | Decision                                              | Reason                                                                                                                                                                                                                                |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-19 | PulseOps incident console selected                    | Demonstrates frontend architecture and product thinking better than a generic CRUD app                                                                                                                                                |
| 2026-07-19 | Border Glow replaces Spotlight Card                   | Better visual connection to health signals and severity states                                                                                                                                                                        |
| 2026-07-19 | Backend reduced to Pages Functions + Hono + D1        | Real persistence with minimal infrastructure and portfolio cost                                                                                                                                                                       |
| 2026-07-19 | Live metrics remain client-simulated                  | Avoids WebSocket/SSE complexity while preserving the main demo                                                                                                                                                                        |
| 2026-07-19 | Authentication excluded                               | Adds cost and scope without strengthening the primary frontend story                                                                                                                                                                  |
| 2026-07-19 | Public presentation page added as Stage 3             | A first-time visitor needs context and a clear entry into the interactive demo                                                                                                                                                        |
| 2026-07-20 | Simulated incident remains a client-only entity       | Stage 6 will merge selector output for `incident-simulated-payments-degradation`; Stage 7 will add its details workflow without mutating RTK Query or MSW fixtures                                                                    |
| 2026-07-20 | Incident writes use optimistic details-cache patches  | Stage 7 patches only the known `getIncident(id)` cache with `onQueryStarted`, undoes failures, and reconciles successful writes through the unchanged REST contract so Stage 9 can replace MSW without page changes                   |
| 2026-07-20 | Service details include direct dependencies           | `GET /api/services/:id` returns `{ service, dependencies, incidents, metrics }`; the deterministic `Depends on` list rejects self/duplicate IDs, and Stage 9 must reproduce this contract without a separate graph endpoint           |
| 2026-07-20 | Wrangler config uses a local-only D1 placeholder      | `wrangler.jsonc` is the Pages/D1 source of truth for local work; the all-zero `database_id` must be replaced with the real production D1 ID only in Stage 11, without changing the `DB` binding or local commands                     |
| 2026-07-20 | E2E uses deterministic MSW with route lazy boundaries | The required Chromium suite owns a programmatic Vite server for reliable cross-platform cleanup; Landing and each application page load through route-level dynamic imports, keeping Recharts out of the public initial request graph |

## 18. Change-control procedure

When a new idea appears:

1. Check whether it is required for the main demo scenario.
2. Check whether it is already in the portfolio release scope.
3. Estimate which current stage it changes.
4. If it changes scope, stack, cost or architecture, ask the user.
5. Record an approved change in the decision log.
6. Update affected stage tasks and exit criteria before writing code.

Do not silently reinterpret the plan.

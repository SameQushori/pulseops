# PulseOps

PulseOps is a portfolio incident-intelligence console with a public presentation
page and an interactive demo entry point. Its strictly typed data layer uses
Redux Toolkit with RTK Query, Zod response validation, deterministic fixtures,
an MSW API for isolated frontend work, and a local Cloudflare Pages
Functions/Hono/Drizzle/D1 backend with persistent incident mutations.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Local development

```bash
npm install
npm run dev
```

`npm run dev` is the fast Vite + MSW path. MSW starts before the first React
render and is enabled by default in Vite development. Tests continue to use the
Node MSW server.

The real full-stack local path is:

```bash
npm run db:reset:local
npm run build
npm run dev:pages
```

Open the Pages URL printed by Wrangler. A production build never registers MSW,
so RTK Query uses the same-origin `/api` Pages Function. If switching a browser
tab from `VITE_ENABLE_MSW=true` to `VITE_ENABLE_MSW=false` in Vite development,
reload once; PulseOps unregisters its stale `mockServiceWorker.js` and reloads
the controlled page before rendering real-mode data.

The two explicit development modes are:

```text
VITE_ENABLE_MSW=true   → Vite + browser MSW
VITE_ENABLE_MSW=false  → a Vite client pointed at a separately served /api
```

Pages local development uses the built client as shown above, where MSW is off
by production default.

Set `VITE_REPOSITORY_URL` to a real `http` or `https` repository URL to show the
optional source links on the public page. Leave it empty to omit those links;
PulseOps never renders a placeholder repository destination.

Components always use the same `/api` contract through RTK Query. No page or
component changes are needed when switching transports.

## Local backend

```text
browser → RTK Query → /api → Hono → Drizzle ORM → local D1
```

Wrangler 4 reads `wrangler.jsonc`, serves `dist`, compiles
`functions/api/[[route]].ts`, and binds local database `pulseops-local` as
`env.DB`. The checked-in all-zero D1 ID is an explicitly local placeholder; it
must be replaced only when production deployment work creates the real database.
No account ID, credentials, remote D1 resource or deployment is part of the
local setup.

Database commands are local-only:

```bash
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
npm run db:reset:local
npm run types:cloudflare
```

`db:reset:local` applies outstanding migrations and runs the deterministic seed,
which clears only the PulseOps tables before restoring 4 services, 4 direct
dependencies, 6 incidents, 6 events, 2 notes and 13 metric snapshots. Local D1
state lives under ignored `.wrangler/`.

Run the real boundary integration suite with:

```bash
npm run test:api
```

It builds the client, resets local D1, chooses a free port, starts
`wrangler pages dev`, runs the API contract/persistence suite, verifies a second
seed reset, and stops the full process tree even on failure. For a running Pages
server, `npm run verify:api` performs a compact status/owner/note persistence
flow (set `API_BASE_URL` if the server is not on
`http://127.0.0.1:8788`).

The persistence boundary is intentionally narrow: incident status, owner,
notes, and their timeline events are stored. Client simulation data remains
deterministic and non-persistent. There is no authentication; production D1
creation and deployment remain separate deployment work. The full route and
parity contract is documented in [`docs/API.md`](docs/API.md).

## Available routes

- `/` — public project presentation and demo entry point
- `/app` — redirects to Overview
- `/app/overview` — complete system Overview
- `/app/incidents` — complete searchable and filterable Incidents list
- `/app/incidents/:incidentId` — complete incident response workflow
- `/app/services` — complete Services catalog
- `/app/services/:serviceId` — complete service details
- any unknown URL — accessible not-found page

Overview now includes overall status, four KPI cards, a Redux-owned time range,
an accessible latency/error-rate chart, service health, recent activity and
separate loading, partial-empty, full-empty and retryable error states.

The Overview also implements a deterministic client-side incident simulation:

```text
idle → degrading → incident-created → investigating → recovering → resolved
```

Start the scenario, wait for the Payments API SEV-2 incident, choose **Begin
recovery**, then reset and replay the same metric points, IDs and timestamps.
Telemetry is overlaid on the validated RTK Query snapshot and is not written to
the API cache, MSW fixtures or persistent storage.

The Incidents list supports shareable URL-backed parameters:

- `query` for submitted title/summary search;
- `status`, `severity` and `serviceId` filters;
- `sort` with `newest`, `oldest` and `severity`.

Empty, invalid and default values are removed into a canonical URL, so refresh,
sharing and browser back/forward restore the applied controls and RTK Query
cache key. The client-only simulated incident is merged through a pure selector
boundary and is never copied into MSW, Redux server state or the API cache.
Incident details use one typed composition for API and simulated incidents. The
page includes metadata, related latency/error telemetry, chronological timeline,
plain-text notes, owner assignment and the following status transitions:

```text
investigating → identified | monitoring
identified → monitoring
monitoring → resolved
resolved → terminal
```

API status, owner and note mutations patch the `getIncident` RTK Query cache in
`onQueryStarted`. A rejected request calls the patch undo function, so the
incident, timeline and temporary note return to the confirmed server state.
Successful mutations invalidate the incident/list tags and reconcile with the
validated response. In real mode, notes and mutation history persist in local
D1 across reloads; with MSW they remain session-local and resettable.

The simulated incident follows the same UI but keeps every mutation in
`simulationSlice`: owner changes, identified status and notes never call the API
or enter RTK Query server state. Moving to monitoring dispatches the existing
`beginRecovery` action, and resolution remains the result of the established
listener sequence.

MTTA is the interval from `startedAt` to the earliest `status_changed` or
`owner_changed` event at or after the incident start. MTTR is the interval from
`startedAt` to `resolvedAt`. Missing, invalid or negative intervals display as
`Not available`; the deterministic UI does not calculate a wall-clock running
duration.

The Services catalog presents all four monitored services with textual health,
30-day uptime, SLO target/result and absolute UTC deploy time. The SLO result is
only the direct comparison `uptime30d >= sloTarget`; PulseOps does not invent an
error-budget calculation from unavailable data. Service details reuse the
accessible entity-layer telemetry chart and add reliability, recent incidents,
canonical filtered incident navigation and a simple `Depends on` list.

`GET /api/services/:id` now returns `{ service, dependencies, incidents,
metrics }`. Dependencies are direct and deterministic: Checkout Web depends on
Payments API and Identity, Payments API depends on Identity, Notifications
depends on Identity, and Identity has none. Zod rejects self-dependencies and
duplicate dependency IDs.

The service simulation overlay is a pure client boundary over validated RTK
Query data. It can override only Payments API health in the catalog, details and
dependency rows, and merge the client-only demo incident only into Payments
recent incidents. Source arrays, RTK Query cache and MSW remain unchanged; the
resolved incident stays visible until Reset demo. The client-only simulated
incident is never written to D1.

KPI interaction uses an adapted TypeScript + CSS version of React Bits
[Border Glow](https://reactbits.dev/components/border-glow). The official source
uses React and CSS only, so no additional runtime dependency was required.

## Quality and test suites

Install the Chromium binary once after a clean clone:

```bash
npx playwright install chromium
```

The test layers are intentionally separate:

- `npm run test:run` runs unit and React component tests with Vitest, Testing
  Library, jsdom and Node MSW;
- `npm run test:api` builds the app, resets local D1 and runs the Pages + Hono +
  Drizzle integration and persistence suite;
- `npm run test:e2e` starts its own Vite server in deterministic browser-MSW
  mode, runs real Chromium tests at 1440 px, 768 px and 360 px, and then closes
  the server and browser processes.

Playwright covers the complete simulated incident workflow, canonical incident
filters across reload, route smoke checks, keyboard-only dialog behavior,
route-level network splitting and horizontal-overflow checks. Axe scans the
stable routes, open dialog and degraded/reduced-motion states without broad
rule exclusions. Reduced-motion emulation confirms decorative CSS motion is
disabled while the deterministic workflow remains functional.

Run the complete local quality pipeline with:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run test:api
npm run test:e2e
npm run build
npm audit --omit=dev
```

Use `npm test` for Vitest watch mode. Playwright stores failure screenshots and
traces under ignored `test-results/` and its HTML report under ignored
`playwright-report/`.

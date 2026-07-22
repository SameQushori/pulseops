# Prompt — Stage 9: Real backend

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 9 — Real backend**.
Не начинай Stage 10, даже если останется время.

## Обязательный контекст

Перед любыми изменениями полностью прочитай:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt.

После чтения:

- проверь, что Stage 8 отмечен как `complete`;
- проверь `git status` и сохрани существующую работу;
- изучи все RTK Query endpoints, Zod schemas, MSW handlers/database/fixtures,
  mutation logic и Services dependency contract;
- подтверди, что активная стадия в `PROJECT_STATUS.md` совпадает с этим prompt.

## Проверенное исходное состояние

- Stage 0–8 frontend scope завершён;
- frontend обращается к same-origin `/api`;
- MSW реализует 8 API operations;
- все success responses проходят Zod validation;
- incident mutations имеют optimistic RTK Query updates;
- API error shape уже определён;
- deterministic fixtures содержат services, dependencies, incidents, events,
  notes и metrics;
- ServiceDetails contract:
  `{ service, dependencies, incidents, metrics }`;
- simulation остаётся client-only и не должна сохраняться в backend;
- текущая test suite содержит 171 тест;
- production Cloudflare project/database/credentials ещё не созданы;
- `.openai/hosting.json` отсутствует;
- Stage 9 должен работать полностью локально.

## Актуальные официальные источники

Перед настройкой проверь актуальную документацию:

- Pages Functions:
  `https://developers.cloudflare.com/pages/functions/get-started/`
- Pages Wrangler configuration:
  `https://developers.cloudflare.com/pages/functions/wrangler-configuration/`
- D1 bindings/local development:
  `https://developers.cloudflare.com/pages/functions/bindings/`
  `https://developers.cloudflare.com/d1/best-practices/local-development/`
- Hono Cloudflare Pages:
  `https://hono.dev/docs/getting-started/cloudflare-pages`
- Drizzle + D1:
  `https://orm.drizzle.team/docs/connect-cloudflare-d1`

Hono сейчас рекомендует Workers для новых full-stack projects, но утверждённый
scope PulseOps использует Pages Functions. Не меняй platform architecture в этой
стадии без согласования с пользователем.

Не копируй устаревшие config snippets вслепую. Используй установленную актуальную
версию Wrangler и её schema.

## Цель стадии

Реализовать небольшой настоящий backend:

- Cloudflare Pages Functions;
- Hono;
- local Cloudflare D1;
- Drizzle ORM schema/migrations;
- deterministic seed;
- тот же REST contract, что у MSW;
- persistence status/owner/note mutations;
- frontend switch MSW ↔ real API без изменений page components.

Stage 9 не создаёт production D1, Cloudflare project или deployment.

## 1. Dependencies

Добавь только необходимые пакеты.

Runtime:

- `hono`;
- `drizzle-orm`.

Development:

- `wrangler`;
- `drizzle-kit`;
- актуальные Cloudflare Workers types, если Wrangler type generation не
  покрывает проект;
- маленький cross-platform helper для integration server допускается только при
  доказанной необходимости.

Не устанавливай Express, Fastify, Prisma, better-sqlite3, Docker, dotenv runtime,
отдельный validation framework или второй test runner.

Зафиксируй точные версии в lockfile и используй официально совместимые версии.

## 2. Wrangler local configuration

Используй актуальный `wrangler.jsonc` или другой формат, рекомендуемый текущей
документацией.

Конфигурация должна содержать:

- schema reference;
- project name `pulseops`;
- explicit `compatibility_date` не позднее текущей даты;
- `pages_build_output_dir: "./dist"`;
- D1 binding `DB`;
- local database name;
- migrations directory;
- только действительно необходимые compatibility flags.

Требования:

- config является source of truth;
- никаких account IDs, API tokens или secrets;
- production `database_id` не выдумывать;
- если Wrangler требует ID для local mode, используй явно документированный
  local placeholder и комментарий `replace in Stage 11`;
- не выполнять `wrangler d1 create`;
- не выполнять `wrangler pages deploy`;
- local D1 state хранится в ignored `.wrangler/`;
- добавить `.dev.vars.example` только если реально требуется, без секретов;
- `.dev.vars` и `.wrangler` добавить в `.gitignore`.

## 3. Backend structure

Используй согласованную структуру:

```text
functions/
  api/
    [[route]].ts
server/
  app.ts
  env.ts
  db/
    client.ts
    schema.ts
    seed.sql или deterministic seed module
  routes/
    health.ts
    overview.ts
    incidents.ts
    services.ts
  lib/
    errors.ts
    validation.ts
drizzle/
  ...
```

`functions/api/[[route]].ts` должен быть тонким Pages adapter для Hono app.
Business/query logic не размещай в catch-all file.

Типизируй binding:

```ts
type Bindings = {
  DB: D1Database;
};
```

Предпочитай Wrangler-generated runtime types, если это актуальный официальный
путь. Не используй `any`.

## 4. Drizzle database schema

Создай SQLite/D1 tables:

### services

- id text primary key;
- name;
- slug unique;
- description;
- status;
- slo target;
- uptime 30d;
- last deploy timestamp.

### incidents

- id text primary key;
- service foreign key;
- title;
- summary;
- severity;
- status;
- owner nullable;
- started/created/updated/resolved timestamps.

### incident_events

- id text primary key;
- incident foreign key;
- type;
- message;
- created timestamp.

### incident_notes

- id text primary key;
- incident foreign key;
- author;
- body;
- created timestamp.

### metric_snapshots

- stable primary key или composite key;
- service foreign key, если series service-specific;
- timestamp;
- latency;
- error rate;
- throughput.

### service_dependencies

- service ID;
- dependency service ID;
- composite primary key;
- оба foreign keys;
- self-dependency запрещена application/schema validation.

Добавь необходимые indexes:

- incidents service/status/severity/started;
- events incident/created;
- notes incident/created;
- metrics service/timestamp;
- dependencies service.

Требования:

- Drizzle schema — источник migration generation;
- enums проверяются shared Zod/application logic; SQLite checks допустимы, но не
  заменяют Zod;
- timestamps хранятся в одном ISO UTC/text convention;
- numeric values round-trip без потери contract semantics;
- foreign keys включены;
- migrations генерируются и trackable;
- не использовать auto-generated numeric IDs для существующих string contracts.

## 5. Deterministic seed

Seed должен воспроизводить текущий MSW baseline:

- 4 services;
- direct dependency map Stage 8;
- 6 incidents;
- existing events/notes;
- 13 baseline metric points;
- stable IDs/timestamps/ordering.

Требования:

- повторный reset/seed даёт одно и то же состояние;
- seed либо idempotent, либо reset script явно очищает local DB перед seed;
- no `Math.random()`/current time;
- relation checks;
- production runtime не auto-seed на каждом request;
- local reset/seed имеет отдельную npm command;
- fixtures и database seed contract drift покрыт tests.

Можно хранить seed SQL, если он генерируется/проверяется из typed deterministic
data. Не делай огромную ручную дублирующую копию без contract test.

## 6. Hono app and middleware

Создай Hono app для `/api`.

Нужно:

- JSON content type;
- centralized not-found;
- centralized error handling;
- documented `ApiError` shape;
- request input validation через существующие Zod schemas;
- safe internal error message без stack trace;
- same-origin use, без ненужного permissive CORS;
- no authentication;
- prepared/Drizzle queries, без SQL interpolation user input;
- route modules по responsibility.

Error shape:

```ts
interface ApiError {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}
```

Status expectations:

- 400 malformed JSON;
- 404 unknown entity/route;
- 422 validation error;
- 500 safe internal error.

Не возвращай raw D1/Drizzle/Zod internals.

## 7. Required routes and exact contract

### GET `/api/health`

```json
{ "status": "ok" }
```

Проверь database availability маленьким safe query, чтобы health отражал binding,
а не только Hono process.

### GET `/api/overview`

Возвращает существующий `OverviewResponse`:

- status;
- KPI;
- services;
- baseline metrics;
- newest recent events.

Derive:

- latest KPI из последней metric snapshot;
- active incident count из unresolved incidents;
- overall status из service statuses;
- deterministic ordering.

Не возвращай simulation data.

### GET `/api/incidents`

Поддержи точные params:

- `query`;
- `status`;
- `severity`;
- `serviceId`;
- `sort=newest|oldest|severity`.

Semantics должны совпасть с MSW:

- case-insensitive title/summary search;
- default newest;
- severity order sev1 → sev2 → sev3;
- stable ID tie-breaker;
- `{ items, total }`;
- invalid enum/sort → 422, а не silent fallback;
- query trim/max length совпадает с frontend parser.

### GET `/api/incidents/:id`

Возвращает:

```ts
{
  (incident, service, timeline, notes);
}
```

- timeline/notes chronological ascending;
- unknown ID 404.

### PATCH `/api/incidents/:id`

- body existing `UpdateIncidentRequest`;
- минимум status или owner;
- update incident;
- resolvedAt устанавливается при resolved;
- updatedAt обновляется;
- status/owner changes создают timeline events;
- одна logical mutation согласована transaction/batch;
- response — updated Incident;
- unknown 404, invalid 422.

Используй real current UTC timestamp для настоящей backend mutation. Tests не
должны ожидать конкретное wall-clock значение, только валидность/ordering.

### POST `/api/incidents/:id/notes`

- body existing `AddIncidentNoteRequest`;
- создаёт note;
- создаёт `note_added` event;
- одна logical mutation;
- response created IncidentNote, status 201;
- safe unique string IDs;
- unknown 404, invalid 422.

### GET `/api/services`

- `{ items, total }`;
- stable name/ID ordering;
- все 4 services.

### GET `/api/services/:id`

Поддержи ID или slug, как текущий MSW.

Возвращает:

```ts
{
  (service, dependencies, incidents, metrics);
}
```

- direct dependencies;
- incidents newest first;
- metrics chronological;
- unknown 404.

## 8. Query implementation

Требования:

- Drizzle query builder/prepared statements;
- no N+1 loops для простых details responses, где можно batch/query set;
- deterministic ordering всегда explicit;
- map database rows → shared API types в одном data layer;
- каждый route response перед возвратом проходит соответствующую Zod schema;
- null handling соответствует frontend schemas;
- D1 result quirks не просачиваются в UI.

Не добавляй repository/service-class abstraction на каждую таблицу без пользы.

## 9. Mutation identity and timestamps

Для real backend:

- `crypto.randomUUID()` допустим для new note/event IDs;
- current UTC допустим для user mutations;
- seed IDs/timestamps остаются deterministic;
- event timestamp не раньше updated mutation timestamp;
- если mutation меняет status и owner одновременно, создай два events с
  deterministic ordering или один clearly documented combined event;
- frontend не должен зависеть от exact generated ID.

Integration tests проверяют shape/ordering/persistence, не hardcode runtime UUID.

## 10. MSW parity

MSW остаётся:

- default isolated frontend development;
- unit/component tests;
- forced error tests;
- fast deterministic reset.

Не удаляй MSW handlers/fixtures.

Создай contract parity table/test:

- method/path;
- input;
- success schema;
- error shape;
- sorting/filtering semantics;
- mutation side effects.

Если обнаружен drift, исправь оба backend implementation и MSW, сохранив
frontend contract. Не меняй components.

## 11. Frontend environment switch

Сохрани `baseApi` same-origin `/api`.

Modes:

```text
VITE_ENABLE_MSW=true   → Vite + MSW
VITE_ENABLE_MSW=false  → real Pages Function /api
```

Требования:

- production default — MSW off;
- test setup продолжает использовать Node MSW;
- real mode не регистрирует service worker;
- смена mode не требует изменения component/API code;
- README содержит точные команды;
- stale browser MSW worker не перехватывает real API mode — документируй reload/
  unregister behavior, если требуется.

## 12. npm scripts

Добавь понятные cross-platform scripts, адаптируя под актуальный Wrangler:

- generate migrations;
- apply local migrations;
- reset/seed local D1;
- build frontend;
- run Pages locally against built `dist`;
- verify real API;
- generate/check Cloudflare types;
- existing `dev` остаётся быстрым Vite+MSW flow.

Имена могут быть:

```text
db:generate
db:migrate:local
db:seed:local
db:reset:local
dev:pages
test:api
types:cloudflare
```

Не создавай script, который случайно применяет migration/seed к remote database.
Remote commands должны появиться только в Stage 11.

## 13. Integration tests

Нужны тесты именно real Hono + D1 boundary.

Покрой:

- health with DB;
- overview schema;
- incidents default/filter/search/all sort modes;
- invalid params 422;
- incident details timeline/notes ordering;
- unknown incident/service 404;
- PATCH status persistence after subsequent GET;
- PATCH owner persistence;
- PATCH invalid/malformed body;
- POST note persistence;
- note event appears in timeline;
- services list;
- service by ID and slug;
- dependencies contract;
- seed reset restores baseline;
- error responses match `ApiError`;
- all responses pass the same frontend Zod schemas.

Предпочти официальный Workers/Pages-compatible test path. Если Vitest Workers
pool плохо совместим с Pages Functions, допускается integration suite против
локального `wrangler pages dev` с надёжным cross-platform start/stop.

Требования:

- tests используют isolated local D1 state;
- no remote Cloudflare calls;
- no credentials;
- no fixed port leaks;
- server/process обязательно останавливается;
- failed test не оставляет background process;
- test command не сообщает false success при skipped backend suite.

Сохрани существующие 171 frontend tests.

## 14. Local full-app verification

Подготовь documented flow:

1. build frontend;
2. reset/migrate/seed local D1;
3. start Pages dev with D1 binding;
4. open same origin;
5. use `VITE_ENABLE_MSW=false`;
6. verify frontend uses real `/api`.

Проверь:

- Overview/Incidents/Services load from D1;
- filters/sorting;
- incident status/owner/note persist after full page reload;
- timeline event persists;
- service dependencies work;
- client simulation remains non-persistent and overlays real API snapshot;
- error/404 responses render correctly;
- browser console clean;
- no requests intercepted by MSW;
- process/port stopped afterward.

## 15. Documentation

Обнови README:

- architecture: browser → RTK Query → `/api` → Hono → Drizzle → D1;
- MSW versus real mode;
- local prerequisites;
- migrations/reset/seed;
- real full-stack run commands;
- integration tests;
- persistence boundary;
- no auth and no production deployment yet;
- Stage 11 remote database/deploy boundary.

Добавь короткий backend contract document, если README становится перегружен,
например `docs/API.md`.

Не добавляй реальные credentials или invented Cloudflare IDs.

## Не делай

- не создавать remote D1 database;
- не логиниться/не менять Cloudflare account;
- не выполнять production/preview deploy;
- не добавлять auth;
- не сохранять simulation;
- не добавлять WebSocket/SSE;
- не добавлять Docker;
- не менять React UI без contract bug;
- не заменять Pages Functions на Workers без согласования;
- не удалять MSW;
- не исправлять frontend bundle splitting Stage 10;
- не устанавливать Playwright browsers;
- не создавать commit, remote или PR;
- не начинать Stage 10.

## Обязательные проверки

Запусти:

```text
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

Также запусти:

- local migration/reset/seed;
- backend integration suite;
- full app через Pages dev + local D1;
- persistence flow с reload.

`npm run test:e2e` пока не требуется, если Playwright ещё не настроен.

## Exit criteria

Stage 9 можно отметить `complete`, только если:

- local Pages Function работает с D1;
- Drizzle schema и migrations воспроизводимы;
- seed deterministic;
- все 8 operations совпадают с MSW contract;
- dependencies Stage 8 сохранены;
- status/owner/note mutations persist;
- timeline side effects persist;
- invalid input возвращает корректные 4xx/ApiError;
- frontend переключается MSW/real без component changes;
- integration tests работают без remote Cloudflare;
- config не содержит secrets/real IDs;
- local processes корректно останавливаются;
- обязательные проверки и full-stack browser flow проходят.

## Завершение стадии

Перед финальным ответом обнови `PROJECT_STATUS.md`:

- Stage 9 отметь `complete` только после всех exit criteria;
- активной установи `10 — Quality and polish`;
- `Active prompt` установи в `not_created`;
- запиши версии Hono/Drizzle/Wrangler;
- запиши migration/seed/integration commands и число tests;
- зафиксируй local D1 binding/config;
- перечисли contract parity и persistence evidence;
- обнови implementation summary, risks и stage history.

Если принято решение, влияющее на Stage 10/11, добавь его в Decision log
`DEVELOPMENT_PLAN.md`.

Не создавай prompt Stage 10 и не начинай polish в этом чате.

В финальном ответе укажи:

- backend architecture;
- database tables/migrations/seed;
- реализованные routes;
- MSW parity;
- persistence/integration results;
- как переключать frontend modes;
- оставшиеся риски;
- подтверждение отсутствия remote resources/deploy;
- подтверждение, что Stage 10 не начинался.

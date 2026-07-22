# Prompt — Stage 2: Domain, Redux store and MSW API

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 2 — Domain, Redux store and MSW API**.
Не начинай Stage 3, даже если останется время.

## Обязательный контекст

Перед любыми изменениями полностью прочитай:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt.

После чтения:

- проверь, что Stage 1 отмечен как `complete`;
- проверь `git status`, не удаляй и не перезаписывай существующую работу;
- изучи текущие router, AppShell, placeholder pages, shared UI, test setup и
  `package.json`;
- подтверди, что активная стадия в `PROJECT_STATUS.md` совпадает с этим prompt.

## Проверенное исходное состояние

- Vite 8, React 19, TypeScript strict и React Router настроены;
- AppShell, public route, app routes и 8 базовых UI-примитивов реализованы;
- Redux Toolkit, React Redux, Zod и MSW уже установлены;
- Vitest и React Testing Library настроены;
- 12 тестов Stage 1 проходят;
- Redux store, RTK Query API, доменные модели, fixtures и MSW handlers ещё не
  существуют;
- Overview, Incidents и Services пока являются placeholder pages;
- `test:e2e` остаётся намеренно падающей заглушкой и не входит в Stage 2.

Не обновляй зависимости без необходимости и не меняй утверждённую визуальную
систему Stage 1.

## Цель стадии

Создать полностью типизированный data layer, который:

- описывает домен PulseOps;
- хранит server state только в RTK Query;
- валидирует каждый API response через Zod;
- работает через детерминированный MSW API в development и тестах;
- сохраняет тот же контракт для будущего Cloudflare backend;
- предоставляет страницам loading, success, empty и error branches без
  реализации финального продуктового UI.

## Архитектурные ограничения

Соблюдай направление зависимостей:

```text
app/pages → features → entities → shared
```

Рекомендуемое размещение:

```text
src/
  app/
    providers/
    store/
  entities/
    service/
      api/
      model/
    incident/
      api/
      model/
    metric/
      model/
    event/
      model/
  features/
    overview-data/
      api/
  shared/
    api/
      mocks/
    lib/
```

Можно скорректировать имена файлов, но:

- primitive entity schemas должны находиться в соответствующих `entities`;
- composed response schemas размещай в слое, который имеет право импортировать
  нужные entities;
- `shared` не должен импортировать из `entities`, `features` или `pages`;
- pages не должны содержать API business logic;
- избегай глобальных barrel-файлов и циклических импортов.

## 1. Доменные модели и Zod schemas

Реализуй типы из раздела Domain model в `DEVELOPMENT_PLAN.md`:

- `ServiceStatus`;
- `IncidentSeverity`;
- `IncidentStatus`;
- `Service`;
- `Incident`;
- `IncidentEvent`;
- `IncidentNote`;
- `MetricPoint`.

Добавь минимально необходимые составные модели:

```ts
type OverallStatus = 'operational' | 'degraded' | 'outage';

interface OverviewKpis {
  latencyMs: number;
  errorRate: number;
  throughput: number;
  activeIncidents: number;
}

interface OverviewResponse {
  status: OverallStatus;
  kpis: OverviewKpis;
  services: Service[];
  metrics: MetricPoint[];
  recentEvents: IncidentEvent[];
}

interface ListResponse<T> {
  items: T[];
  total: number;
}

interface IncidentDetailsResponse {
  incident: Incident;
  service: Service;
  timeline: IncidentEvent[];
  notes: IncidentNote[];
}

interface ServiceDetailsResponse {
  service: Service;
  incidents: Incident[];
  metrics: MetricPoint[];
}
```

Требования:

- источником TypeScript types должны быть Zod schemas через `z.infer`, где это
  разумно;
- все timestamps — ISO 8601 UTC strings с Zod-проверкой;
- числовые проценты и метрики должны иметь разумные ограничения;
- nullable поля должны соответствовать плану;
- не использовать `any`, type assertions для обхода валидации или дублирующие
  ручные интерфейсы;
- экспортировать только реально используемые схемы и типы.

## 2. Redux store и providers

Создай:

- `createAppStore()` для изолированных store в тестах;
- singleton store для browser runtime;
- `RootState` и `AppDispatch`;
- typed hooks `useAppDispatch` и `useAppSelector`;
- `AppProviders`, подключающий React Redux Provider;
- RTK Query base API reducer и middleware.

На этой стадии:

- не создавай `simulationSlice`, `preferencesSlice` или UI slices;
- Redux store должен содержать только RTK Query infrastructure;
- не дублируй API entities в обычном Redux state;
- RouterProvider должен продолжать работать внутри корректного provider tree;
- тесты должны получать новый store, когда требуется изоляция.

## 3. RTK Query API

Создай базовый API на `fetchBaseQuery` с `baseUrl: '/api'` и endpoints для:

| Method | Path                   | Hook/operation           |
| ------ | ---------------------- | ------------------------ |
| GET    | `/health`              | health query             |
| GET    | `/overview`            | overview query           |
| GET    | `/incidents`           | incidents list query     |
| GET    | `/incidents/:id`       | incident details query   |
| PATCH  | `/incidents/:id`       | update incident mutation |
| POST   | `/incidents/:id/notes` | add note mutation        |
| GET    | `/services`            | services list query      |
| GET    | `/services/:id`        | service details query    |

Контракты:

- list endpoints возвращают `ListResponse<T>`;
- PATCH body: `{ status?: IncidentStatus; owner?: string | null }`, минимум одно
  изменяемое поле;
- PATCH возвращает обновлённый `Incident`;
- POST note body: `{ author: string; body: string }`;
- POST note возвращает созданный `IncidentNote`;
- health response: `{ status: 'ok' }`;
- каждый response проходит соответствующий Zod schema parse до попадания в
  component;
- некорректный payload превращается в контролируемую query error, а не silently
  принимается как корректный тип;
- определить tags для incidents/services там, где они понадобятся будущим
  mutations, без преждевременной сложной cache logic.

Поддержи параметры incidents query:

- `status`;
- `severity`;
- `serviceId`;
- `query`;
- `sort`: `newest | oldest | severity`.

Не реализуй URL filter UI — это Stage 6.

## 4. Нормализация ошибок

Реализуй единый API error contract:

```ts
interface ApiError {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}
```

Добавь небольшую функцию нормализации неизвестной RTK Query/Zod/network ошибки
в безопасную UI-модель. Не показывай пользователю stack traces или внутренние
сообщения Zod.

Обработай минимум:

- network/fetch error;
- 4xx/5xx error с корректным API payload;
- malformed error payload;
- response schema validation failure;
- unknown error.

## 5. Детерминированные fixtures

Создай стабильные fixtures:

- ровно 4 services;
- 6 historical incidents с разными status/severity;
- минимум один resolved Payments API incident;
- timeline events и notes для detail endpoints;
- стабильный initial metrics series;
- overview KPI и recent events.

Требования:

- никаких `Math.random()`;
- никаких timestamps, зависящих от `Date.now()` во время импорта;
- все IDs, timestamps, порядок и значения воспроизводимы;
- данные реалистичны и согласованы между endpoints;
- relations не содержат ссылок на отсутствующие entities;
- fixtures проходят собственные Zod schemas.

## 6. MSW mock API

Настрой MSW 2 для browser development и Vitest:

- browser worker;
- Node test server;
- shared handlers;
- mock database/state с функцией полного reset между тестами;
- `public/mockServiceWorker.js` штатным способом MSW;
- development startup до первого React render, чтобы избежать гонки запросов;
- строгий `onUnhandledRequest: 'error'` в тестах;
- в browser разреши только необходимые Vite/static requests, не скрывай
  случайные `/api/*` запросы.

Реализуй все endpoints из раздела RTK Query API.

Поведение handlers:

- incidents list фильтрует и сортирует данные согласно query params;
- unknown incident/service возвращает 404 в общем `ApiError` формате;
- invalid PATCH/note body возвращает 400/422 с field errors;
- PATCH и POST изменяют только mock state текущей сессии;
- reset восстанавливает точные исходные fixtures;
- list totals соответствуют отфильтрованным данным;
- детали возвращают связанные service/timeline/notes.

Используй environment flag для MSW development startup, например
`VITE_ENABLE_MSW`, с безопасным и документированным default для локальной
разработки. Production build не должен случайно запускать mock worker.

## 7. Подключение placeholder pages

Не реализуя финальный UI:

- Overview placeholder вызывает overview query;
- Incidents placeholder вызывает incidents list query;
- Services placeholder вызывает services list query;
- success показывает только компактное подтверждение подключённых данных,
  например количество записей и общий status;
- loading использует существующий `LoadingState`;
- empty использует `EmptyState`;
- error использует `ErrorState` и нормализованное безопасное сообщение;
- retry action должен повторять запрос;
- никакие полноценные KPI cards, tables, charts, filters или simulation controls
  пока не создаются.

Detail pages можно подключить к соответствующим query по route param, если это
не раздувает scope; минимум их hooks и contracts должны быть полностью покрыты
API/contract tests.

## 8. Тесты

Обнови test setup для MSW lifecycle и добавь тесты.

Обязательное покрытие:

### Schemas/fixtures

- каждый fixture проходит Zod validation;
- malformed timestamp или enum отклоняется;
- composed response schema отклоняет malformed nested payload.

### Store/API

- `createAppStore()` создаёт изолированные stores;
- overview, incidents и services queries возвращают validated data;
- unknown ID возвращает нормализуемую 404 error;
- malformed MSW success payload не попадает в UI как успешные данные;
- cache не дублируется в обычном slice.

### MSW contract

- health и все GET endpoints имеют success tests;
- incidents filters и sorting проверены;
- PATCH status/owner success и invalid body проверены;
- POST note success и validation error проверены;
- reset mock state исключает протекание между тестами.

### Pages

- Overview, Incidents и Services покрыты loading/success/error;
- хотя бы одна page покрыта empty branch;
- retry action действительно инициирует повторный запрос;
- существующие route/UI tests продолжают проходить.

Не проверяй внутренности RTK Query и не делай snapshot tests больших деревьев.

## 9. Документация

Обнови README только необходимыми сведениями:

- Stage 2 data layer;
- как запускается MSW в development;
- используемые environment variables;
- что real backend появится в Stage 9;
- команды проверок.

Если появляется `.env.example`, в нём не должно быть секретов.

## Не делай

- не реализуй публичную landing page Stage 3;
- не создавай финальный Overview Stage 4;
- не добавляй React Bits, Border Glow или charts;
- не создавай simulation/preferences slices;
- не реализуй filters UI или incident workflow UI;
- не создавай Cloudflare, Hono, D1 или Drizzle файлы;
- не добавляй authentication;
- не устанавливай новый state manager, query library или form library;
- не устанавливай Playwright browsers;
- не создавай commit, remote или pull request;
- не начинай Stage 3.

## Обязательная проверка

Запусти приложение с включённым MSW и проверь:

- `/app/overview` получает mock overview data без console errors;
- `/app/incidents` получает 6 incidents;
- `/app/services` получает 4 services;
- прямые переходы и навигация Stage 1 не сломаны;
- loading сменяется success state без визуального скачка layout;
- network panel не содержит запросов к реальному backend;
- dev server остановлен после проверки.

## Обязательные команды

Добейся успешного результата:

```text
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

`npm run test:e2e` запускать не требуется: Playwright ещё не настроен.

## Exit criteria

Stage 2 можно отметить `complete`, только если:

- Overview, Incidents и Services получают typed data через RTK Query;
- каждый API success response валидируется Zod;
- malformed payload проверенно становится error;
- MSW реализует весь согласованный API contract;
- success/error/filter/mutation/reset contracts покрыты тестами;
- server state существует только в RTK Query, без дублирующих slices;
- все обязательные команды проходят;
- browser verification проходит без console errors.

## Завершение стадии

Перед финальным ответом обнови `PROJECT_STATUS.md` по разделу
`Required completion update`:

- Stage 2 отметь `complete` только после всех exit criteria;
- активной установи `3 — Public presentation page`;
- `Active prompt` установи в `not_created`;
- запиши точные команды, количество тестов и browser verification;
- обнови implementation summary, blockers/risks и stage history.

Если архитектурное решение влияет на следующие стадии, добавь его в Decision log
файла `DEVELOPMENT_PLAN.md`.

Не создавай prompt Stage 3 и не начинай его реализацию в этом чате.

В финальном ответе укажи:

- какие domain schemas и API endpoints созданы;
- как устроены store, providers и MSW lifecycle;
- результаты команд и количество тестов;
- результат browser verification;
- оставшиеся риски;
- подтверждение, что Stage 3 не начинался.

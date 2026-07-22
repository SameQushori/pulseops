# Prompt — Stage 8: Services

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 8 — Services**.
Не начинай Stage 9, даже если останется время.

## Обязательный контекст

Перед любыми изменениями полностью прочитай:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt.

После чтения:

- проверь, что Stage 7 отмечен как `complete`;
- проверь `git status` и сохрани существующую работу;
- изучи service API/models/fixtures, Services placeholders, reusable metric
  chart, incident list/detail links и simulation selectors;
- подтверди, что активная стадия в `PROJECT_STATUS.md` совпадает с этим prompt.

## Проверенное исходное состояние

- Stage 0–7 завершены;
- service API предоставляет list и details endpoints;
- list содержит ровно 4 services;
- details response содержит service, related incidents и metrics;
- Services list/details pages пока placeholders;
- reusable accessible Recharts component находится в metric entity layer;
- Incidents URL filters поддерживают `serviceId`;
- Incident details service links уже ведут на service details route;
- simulation предоставляет Payments API status override и client-only incident;
- API/simulated Incident details workflow готов;
- текущая test suite содержит 154 теста;
- persistence появится в Stage 9;
- bundle splitting и Playwright относятся к Stage 10.

## Цель стадии

Закрыть frontend product scope:

- реализовать понятный каталог сервисов;
- реализовать Service details;
- показать health, SLO, uptime и last deploy;
- показать telemetry;
- показать прямые dependencies простым списком;
- показать recent incidents;
- связать Services и Incidents навигацией;
- отражать текущую simulation для Payments API;
- обработать loading, empty, partial и error states.

Не создавай интерактивный dependency graph.

## 1. Service API contract: dependencies

Текущий details response не содержит dependencies, хотя они входят в scope.
Минимально расширь `ServiceDetailsResponse`:

```ts
interface ServiceDetailsResponse {
  service: Service;
  dependencies: Service[];
  incidents: Incident[];
  metrics: MetricPoint[];
}
```

Требования:

- `dependencies` — только прямые upstream dependencies;
- элементы проходят существующий `serviceSchema`;
- список не содержит сам service;
- нет duplicate IDs;
- response shape обновлён в Zod schema;
- MSW handler и fixtures реализуют тот же contract;
- Stage 9 backend должен будет повторить этот contract;
- изменение записать в Decision log `DEVELOPMENT_PLAN.md`.

Используй небольшую deterministic dependency map:

- Checkout Web → Payments API, Identity;
- Payments API → Identity;
- Notifications → Identity;
- Identity → empty list.

Если domain semantics требуют другой направленности, используй один понятный
вариант `Depends on` и не смешивай upstream/downstream в одном списке.

Не добавляй отдельные dependency endpoints или graph model.

## 2. Simulation service overlay

Создай pure utility/selector boundary:

- базовый service list остаётся RTK Query data;
- только Payments API получает `serviceStatusOverride`, когда он существует;
- исходные service objects/arrays не мутируются;
- отсутствие simulation возвращает эквивалентные API данные;
- Service details использует тот же overlay;
- dependencies не получают ложный override, кроме Payments, если он находится в
  dependencies list;
- status возвращается к operational после recovery;
- reset полностью убирает overlay.

Simulated incident:

- добавляется в recent incidents только на Payments API details;
- deduplicate по ID;
- сортируется newest first;
- resolved остаётся видимым до Reset demo;
- не записывается в RTK Query или MSW.

Не создавай новый Redux slice.

## 3. Services list page

Замени placeholder `/app/services`.

### Header

- eyebrow `Service catalog`;
- `<h1>Services</h1>`;
- короткое объяснение;
- result summary `4 monitored services` или фактическое число;
- overall breakdown operational/degraded/outage текстом.

### Service records

Покажи каждую service как плотную рабочую строку/card:

- name как link на `/app/services/:serviceId`;
- description;
- textual status badge;
- uptime 30d;
- SLO target;
- last deploy absolute UTC;
- indicator `Meeting SLO` или `Below SLO`, вычисленный только сравнением
  `uptime30d >= sloTarget`;
- явная отметка `Simulated degradation`, если status изменён overlay.

Не вычисляй error budget consumption или другие показатели без достаточных
данных.

### Layout

- desktop: 2-column grid или компактный list;
- mobile: одна колонка;
- одинаковые карточки не должны выглядеть маркетинговыми feature cards;
- обычные operational services используют static border;
- разрешено применить существующий Border Glow только к текущему degraded/outage
  service, не ко всем карточкам;
- link/focus должен быть очевидным;
- не делай всю карточку вложенной ссылкой вокруг других links.

При четырёх записях не нужны search, filters, sort или pagination.

## 4. Service details page

Реализуй `/app/services/:serviceId`.

### Navigation/header

- breadcrumb/back link `Services`;
- eyebrow с service ID/slug;
- `<h1>` service name;
- description;
- status;
- compact link `View related incidents`, ведущий на canonical
  `/app/incidents?serviceId=<id>`;
- simulation marker для Payments API при override.

### Reliability summary

Покажи:

- SLO target;
- uptime 30d;
- SLO result `Meeting SLO`/`Below SLO`;
- last deploy UTC;
- current status.

Не добавляй fake SLA, owners, teams, regions или deploy hashes.

### Telemetry

Используй reusable metric chart из entity layer:

- latency/error rate;
- accessible title/description/fallback;
- initial animation disabled;
- responsive;
- visible units;
- section-local loading/empty/error handling;
- не импортируй компоненты из Overview page.

Если service endpoint возвращает одинаковый fixture series для всех services,
честно называй его `Service telemetry sample`, не выдавай за real monitoring.

### Direct dependencies

Покажи section `Depends on`:

- service name;
- status;
- description или короткая relationship copy;
- link на dependency service details;
- empty state `No direct dependencies`.

Используй простой list. Не добавляй canvas, SVG graph, draggable nodes, arrows,
zoom или topology editor.

### Recent incidents

Покажи related incidents:

- newest first;
- title link;
- severity;
- status;
- startedAt UTC;
- owner/unassigned;
- simulated incident marker;
- empty state;
- secondary link на filtered Incidents list.

Не дублируй полный Stage 6 table. Достаточен компактный contextual list.

## 5. Cross-navigation

Проверь и сохрани:

- Overview service links → Service details;
- Services list → Service details;
- Service details dependency → another Service details;
- Service details incident → Incident details;
- Service details `View related incidents` → canonical filtered URL;
- Incident details service link → Service details;
- browser back возвращает предыдущий filter/details state.

Для canonical incident URL используй существующий
`serializeIncidentFilters`/feature API, а не ручную строковую конкатенацию, если
это возможно без нарушения dependency direction.

## 6. Data states

### Services list loading

- skeleton сохраняет будущую grid geometry;
- accessible label.

### Services list empty

- `No services configured`;
- не предлагай создать service, потому что CRUD не входит в scope.

### Services list error

- normalized error;
- retry;
- AppShell остаётся доступным.

### Details loading

- header/summary/chart skeleton.

### Unknown service

- service-specific not-found;
- ссылка назад в Services;
- не generic crash.

### Partial metrics/dependencies/incidents

Поскольку один details response содержит sections вместе, malformed response
остаётся общей validation error. Но валидные empty arrays должны давать отдельные
neutral empty states для chart/dependencies/incidents.

Simulation overlay не должен скрывать API error.

## 7. Pure utilities

Создай отдельно тестируемые utilities:

- apply service status overlay;
- merge simulated service incident;
- SLO comparison;
- service status breakdown;
- UTC formatting при необходимости;
- dependency uniqueness validation, если это не полностью покрывает Zod refine.

Не дублируй incident/status formatting, если можно безопасно вынести существующий
generic mapping из page layer в entity/shared lower layer. Не делай большой
рефакторинг без пользы.

## 8. Файловая структура

Предпочтительно:

```text
src/pages/services/
  ServicesPage.tsx
  ServicesPage.module.css
  components/
    ServiceCard.tsx
    ServicesSkeleton.tsx
  lib/
src/pages/service-details/
  ServiceDetailsPage.tsx
  ServiceDetailsPage.module.css
  components/
    ServiceReliability.tsx
    DependencyList.tsx
    ServiceIncidentList.tsx
    ServiceDetailsSkeleton.tsx
  lib/
```

Можно скорректировать количество файлов. Не создавай giant components и не
импортируй из одной page в другую.

## 9. Tests

Добавь/обнови тесты.

### Contract/fixtures

- details schema требует dependencies;
- dependency map соответствует rules;
- no self/duplicate dependency;
- каждый endpoint response проходит Zod;
- unknown service 404 сохраняется.

### Overlay/utilities

- no simulation;
- Payments degraded/recovered;
- other services unchanged;
- inputs immutable;
- dependency Payments status overlay;
- simulated incident only on Payments;
- dedup/newest sort;
- SLO meeting/below;
- status breakdown.

### Services list

- loading/success/empty/error/retry;
- 4 services;
- values/status/links;
- simulated degradation marker;
- no unnecessary search/pagination.

### Service details

- loading/success/not-found;
- reliability values;
- chart accessible/empty;
- dependencies/empty;
- incidents/empty;
- canonical filtered incident link;
- simulated incident integration;
- service/dependency/incident links.

### Navigation/accessibility

- one `<h1>`;
- semantic list/sections;
- badge text;
- keyboard links;
- browser back/canonical URL behavior where practical.

Существующие 154 теста должны продолжить проходить. Не используй large snapshots
или CSS implementation assertions вместо behavior.

## 10. README

Обнови README:

- Services list/details готовы;
- service details contract теперь содержит direct dependencies;
- SLO semantics;
- simulation overlay boundary;
- frontend feature scope Stage 0–8 завершён;
- persistence ещё относится к Stage 9.

Не превращай README в финальный portfolio case study до Stage 11.

## Не делай

- не создавай service CRUD;
- не добавляй interactive dependency graph;
- не добавляй teams/owners/regions/deploy history API;
- не добавляй search/filter/pagination для четырёх services;
- не добавляй новые Redux slices;
- не мутируй RTK Query cache для simulation;
- не добавляй React Bits component; разрешено только переиспользовать Border
  Glow для единственного degraded service;
- не добавляй backend/Cloudflare Stage 9;
- не исправляй bundle splitting Stage 10;
- не устанавливай Playwright browsers;
- не создавай commit, remote или PR;
- не начинай Stage 9.

## Обязательная визуальная проверка

Проверь:

1. Default Services показывает 4 operational services.
2. Каждая details page открывается напрямую.
3. Checkout показывает Payments API и Identity dependencies.
4. Identity показывает neutral empty dependencies state.
5. Service incident links открывают details.
6. `View related incidents` открывает правильный service filter URL.
7. Запусти simulation и проверь Payments degraded на Overview, Services list и
   Payments details.
8. Проверь Demo incident на Payments details.
9. Дождись recovery/reset и проверь согласованное восстановление.
10. Проверь loading/empty/error/not-found states.

Также:

- 360/768/1440 без overflow;
- keyboard/focus по service/dependency/incident links;
- reduced motion не скрывает status;
- browser back сохраняет navigation context;
- console содержит 0 errors и 0 warnings;
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

`npm run test:e2e` запускать не требуется.

## Exit criteria

Stage 8 можно отметить `complete`, только если:

- все 4 services видимы и имеют корректные health/SLO/deploy values;
- Service details реализован;
- direct dependencies contract и UI работают;
- related telemetry/incidents реализованы;
- cross-navigation не содержит dead links;
- simulation overlay согласован на всех service surfaces;
- loading/empty/error/not-found states различимы;
- dependency list остаётся простым, без graph editor;
- 360/768/1440 и keyboard проверены;
- обязательные команды/browser flow проходят.

## Завершение стадии

Перед финальным ответом обнови `PROJECT_STATUS.md`:

- Stage 8 отметь `complete` только после всех exit criteria;
- активной установи `9 — Real backend`;
- `Active prompt` установи в `not_created`;
- запиши команды, число тестов и browser flow;
- зафиксируй расширение ServiceDetails contract;
- зафиксируй dependency map и simulation overlay behavior;
- обнови implementation summary, risks и stage history.

Добавь contract decision в Decision log `DEVELOPMENT_PLAN.md`.

Не создавай prompt Stage 9 и не начинай backend в этом чате.

В финальном ответе укажи:

- как устроены Services list/details;
- dependency contract;
- telemetry/incidents/cross-navigation;
- simulation overlay;
- результаты команд/browser flow;
- оставшиеся риски;
- подтверждение, что Stage 9 не начинался.

# Prompt — Stage 6: Incidents list

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 6 — Incidents list**.
Не начинай Stage 7, даже если останется время.

## Обязательный контекст

Перед любыми изменениями полностью прочитай:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt.

После чтения:

- проверь, что Stage 5 отмечен как `complete`;
- проверь `git status` и сохрани существующую работу;
- изучи incident/service APIs, schemas, MSW filters, simulation selectors,
  current Incidents placeholder, shared badges и route tests;
- подтверди, что активная стадия в `PROJECT_STATUS.md` совпадает с этим prompt.

## Проверенное исходное состояние

- Stage 0–5 завершены;
- `useGetIncidentsQuery` уже поддерживает `status`, `severity`, `serviceId`,
  `query` и `sort`;
- MSW фильтрует/sorts 6 deterministic incidents;
- `useGetServicesQuery` предоставляет 4 services для filter labels;
- simulation хранит client-only incident с ID
  `incident-simulated-payments-degradation`;
- `selectSimulatedIncident` является границей для объединения со списком;
- simulated incident не существует в MSW database и теряется после reload;
- Incident details route существует, но полноценный workflow относится к Stage 7;
- текущая test suite содержит 99 тестов;
- bundle size advisory и Playwright остаются Stage 10 concerns.

Не меняй API contract и simulation state machine без обнаруженной ошибки.

## Цель стадии

Создать полноценный список инцидентов, в котором пользователь может:

- увидеть API и simulated incidents в одном согласованном списке;
- искать по title/summary;
- фильтровать по status, severity и service;
- сортировать по newest, oldest и severity;
- делиться URL с текущими фильтрами;
- использовать browser back/forward;
- открыть incident details route;
- отличить loading, empty, no-results и error states.

URL search parameters — единственный источник истины для применённых фильтров.
Не создавай filters slice в Redux.

## 1. URL filter model

Создай feature:

```text
src/features/incident-filters/
  model/
    incidentFilters.ts
  ui/
    IncidentFilters.tsx
```

Можно скорректировать разбиение, но parsing/serialization должны быть pure и
отдельно тестируемыми.

### Supported URL params

```text
query
status
severity
serviceId
sort
```

Допустимые значения:

- `status`: `investigating | identified | monitoring | resolved`;
- `severity`: `sev1 | sev2 | sev3`;
- `serviceId`: non-empty ID из services response;
- `sort`: `newest | oldest | severity`;
- `query`: trimmed string с разумным maximum length.

### Rules

- default sort — `newest`;
- default sort можно не записывать в URL;
- пустые/default params удаляются из URL;
- неизвестные enum values не передаются в API;
- повторяющиеся params обрабатываются предсказуемо, используется одно значение;
- unrelated search params не сохраняй, если они не принадлежат странице;
- порядок сериализации params стабилен;
- parsing не бросает exception;
- применённые filters полностью восстанавливаются после refresh/back/forward.

Используй Zod или существующие domain schemas для enum validation, не дублируй
строковые unions вручную без необходимости.

## 2. Search behavior

Search input может иметь локальный draft, но применённое значение хранится
только в URL.

Предпочтительный UX:

- native `<form role="search">`;
- submit применяет trimmed query;
- clear удаляет query;
- при back/forward draft синхронизируется с URL;
- Enter работает;
- пустой submit удаляет query;
- не добавляй debounce timer без необходимости;
- visible label или корректный accessible label;
- maximum length совпадает с parser.

Не отправляй запрос на каждую введённую букву, если используется submit UX.

## 3. Filter controls

Добавь controls:

- Status: `All statuses` + 4 values;
- Severity: `All severities` + 3 values;
- Service: `All services` + данные `useGetServicesQuery`;
- Sort: `Newest`, `Oldest`, `Severity`;
- `Clear filters`, только когда есть применённые filters/non-default sort.

Используй native `<select>` и существующие tokens. Не устанавливай Radix только
ради обычных selects.

Требования:

- каждый control имеет `<label>`;
- изменение select сразу обновляет URL;
- обновление одного filter сохраняет остальные;
- clear возвращает canonical empty URL;
- service select корректно ведёт себя при loading/error services query;
- failure services query не скрывает incidents list;
- controls переносятся на mobile без горизонтального scrolling;
- показывай компактное количество active filters, если это помогает, но не
  превращай всё в pills.

## 4. API query ownership

`IncidentsPage`:

1. читает URL;
2. получает validated filters;
3. передаёт их в `useGetIncidentsQuery`;
4. получает `selectSimulatedIncident` из Redux;
5. pure-функцией объединяет API items и simulated incident;
6. рендерит итоговый список/result count.

Не храни API result в local/Redux state.

RTK Query cache keys должны зависеть от applied filters. Browser back/forward
должен использовать корректный query arg и cache entry.

## 5. Simulated incident merge

Создай pure utility, например:

```ts
mergeIncidentList({
  apiItems,
  simulatedIncident,
  filters,
}): Incident[]
```

Требования:

- не мутировать API array или simulated incident;
- deduplicate по ID;
- simulated incident включается только если проходит текущие query/status/
  severity/service filters;
- text query проверяет title и summary case-insensitive;
- сортировка полностью совпадает с MSW semantics;
- `severity` order: `sev1`, `sev2`, `sev3`;
- newest/oldest используют `startedAt`;
- tie-breaker стабилен, например ID;
- resolved simulated incident остаётся видимым до Reset demo, если проходит
  filters;
- total/result count соответствует объединённому списку;
- отсутствие simulation не меняет API result.

Не записывай simulated incident в RTK Query cache или MSW database.

## 6. Page composition

### Header

- eyebrow `Response workspace`;
- `<h1>Incidents</h1>`;
- короткое объяснение списка;
- result count: `Showing N incidents`;
- если filter активен, формулировка остаётся понятной;
- ссылка/кнопка `Reset demo` здесь не нужна — simulation controls остаются на
  Overview.

### Filters

- search form;
- четыре selects;
- clear action;
- логичная tab order;
- filters располагаются как один рабочий toolbar, а не набор декоративных cards.

### Incident list

Desktop должен читаться как table со столбцами:

- Incident;
- Service;
- Severity;
- Status;
- Started;
- Owner.

Mobile превращает те же записи в stacked readable rows без второго
дублирующего DOM-списка, если это возможно.

Каждая запись:

- title — link на `/app/incidents/:incidentId`;
- optional short summary;
- service name, не raw ID;
- существующий `SeverityBadge`;
- status label/badge;
- startedAt в однозначном absolute UTC формате;
- owner или `Unassigned`;
- simulated incident имеет короткую текстовую отметку `Demo incident`, а не
  только особый цвет;
- строки доступны с клавиатуры, но вся row не должна становиться вложенной
  кнопкой вокруг controls.

Не добавляй row actions, bulk selection, pagination, saved views или export.
При 6–7 records pagination не нужна.

## 7. Incident detail link boundary

Каждая строка должна иметь рабочий details link.

Для API incidents используй существующий route.

Для client-only simulated incident:

- текущий details API вернёт 404, поэтому не оставляй dead flow;
- разрешено минимально адаптировать `IncidentDetailsPage`, чтобы она сначала
  сравнивала route ID с `selectSimulatedIncident`;
- если ID совпадает, покажи только безопасный Stage 6 handoff placeholder:
  title, severity, current status, owner и сообщение, что detailed response
  workflow будет подключён на Stage 7;
- не добавляй timeline, status controls, owner controls или notes;
- если simulation отсутствует и API ID unknown, сохрани нормальную 404/error
  обработку;
- Stage 7 полностью заменит этот минимальный simulated branch.

Такой placeholder нужен только для отсутствия сломанной ссылки и не считается
реализацией Stage 7.

## 8. Status presentation

Создай typed mapping incident status → label/tone/icon при необходимости:

- investigating;
- identified;
- monitoring;
- resolved.

Требования:

- label понятен без цвета;
- не менять общий `StatusBadge` API чрезмерно;
- severity и status визуально различаются;
- active SEV-1/SEV-2 заметны, но list не покрыт Border Glow;
- React Bits effects на этой странице не добавлять.

## 9. Data states

Реализуй разные состояния.

### Loading

- table/list skeleton сохраняет layout;
- filters не должны исчезать без необходимости;
- accessible loading label.

### API empty

- когда API пуст, filters отсутствуют и simulation отсутствует;
- сообщение `No incidents yet`;
- объяснение, что demo incident можно создать с Overview;
- ссылка на `/app/overview` допустима.

### No results

- данные существуют, но filters не дали совпадений;
- отображай текущий result count 0;
- предложи `Clear filters`;
- не называй это API empty.

### Error

- normalizeApiError;
- retry вызывает `refetch`;
- filters остаются доступными;
- simulated incident можно показать отдельно только если это не маскирует API
  failure. Предпочтительно сохранить явное error state и не притворяться, что
  список полностью загружен.

### Partial service-data error

- incidents с raw fallback service label остаются читаемыми;
- service filter disabled/объяснён;
- list не исчезает.

## 10. Файловая структура

Предпочтительно:

```text
src/pages/incidents/
  IncidentsPage.tsx
  IncidentsPage.module.css
  components/
    IncidentsTable.tsx
    IncidentRow.tsx
    IncidentsSkeleton.tsx
  lib/
    mergeIncidentList.ts
    formatIncident.ts
src/features/incident-filters/
  model/
    incidentFilters.ts
  ui/
    IncidentFilters.tsx
    IncidentFilters.module.css
```

Не обязательно создавать каждый файл. Не оставляй всю parsing, merging и JSX
в одном giant page component.

## 11. Tests

Добавь/обнови тесты.

### URL model

- empty/default params;
- каждое valid value;
- invalid enum/query handling;
- stable serialization;
- updating one filter preserves others;
- clear produces canonical URL;
- query trim/max length.

### Merge utility

- no simulation;
- simulated incident prepended/sorted;
- dedup by ID;
- each filter applies to simulated incident;
- all sort modes including tie-breaker;
- input arrays/objects are not mutated;
- resolved simulation behavior.

### Page

- loading;
- success with correct count and service names;
- API empty;
- filtered no-results;
- error/retry;
- partial service error;
- search submit and clear;
- select changes URL;
- browser back/forward restores UI and query data;
- detail links;
- simulated incident marker/link;
- unknown/simulated detail boundary.

### Accessibility

- search landmark;
- every control has label;
- result count announced appropriately without noisy repeated alerts;
- table/list structure has accessible names;
- badges include text;
- tab order follows visual order.

Существующие 99 тестов должны продолжить проходить. Не используй snapshot всей
страницы и не тестируй CSS breakpoints как implementation details.

## 12. README

Обнови README кратко:

- Incidents list теперь готов;
- перечисли URL params;
- объясни, что filters shareable/back-forward safe;
- укажи client merge simulated incident;
- не утверждай, что details workflow готов до Stage 7.

## Не делай

- не реализуй полный Incident details Stage 7;
- не добавляй status/owner mutations UI;
- не добавляй notes/dialog/timeline;
- не реализуй Services Stage 8;
- не создавай filters Redux slice;
- не добавляй pagination/saved views/bulk actions;
- не записывай simulation в MSW/RTK Query;
- не меняй simulation timers;
- не добавляй React Bits effect;
- не добавляй новую form/table/UI library;
- не исправляй bundle splitting Stage 10;
- не устанавливай Playwright browsers;
- не создавай commit, remote или PR;
- не начинай Stage 7.

## Обязательная визуальная проверка

Запусти приложение с MSW и проверь:

1. Default list показывает 6 API incidents, newest first.
2. Запусти simulation на Overview и вернись в Incidents — список показывает 7
   записей и `Demo incident`.
3. Проверь status, severity, service, query и все sort modes.
4. Скопируй filtered URL, открой напрямую и проверь восстановление controls.
5. Используй browser back/forward после нескольких изменений filters.
6. Открой API incident details link.
7. Открой simulated incident link и убедись, что нет 404/dead page.
8. Проверь clear filters, API empty/no-results/error/retry различия.

Также:

- 360 px: stacked rows и controls без overflow;
- 768 px: переходная layout остаётся читаемой;
- 1440 px: table columns выровнены;
- keyboard: search, selects, clear и links имеют visible focus;
- reduced motion ничего не скрывает;
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

Stage 6 можно отметить `complete`, только если:

- filters и sort полностью восстанавливаются из URL;
- refresh/share/back/forward работают;
- API и simulated incident объединяются без mutation/duplication;
- default, filtered и simulated counts корректны;
- desktop table и mobile rows доступны и не overflow;
- loading, API empty, no-results, error и partial service error различимы;
- каждый incident имеет рабочий details link;
- filter/merge/page behavior покрыты тестами;
- saved views/pagination не добавлены;
- обязательные команды и browser flow проходят.

## Завершение стадии

Перед финальным ответом обнови `PROJECT_STATUS.md` по разделу
`Required completion update`:

- Stage 6 отметь `complete` только после всех exit criteria;
- активной установи `7 — Incident details workflow`;
- `Active prompt` установи в `not_created`;
- запиши команды, число тестов и browser verification;
- зафиксируй canonical URL rules и simulated merge behavior;
- укажи временный simulated-details boundary для Stage 7;
- обнови implementation summary, risks и stage history.

Если решение влияет на следующие стадии, добавь его в Decision log
`DEVELOPMENT_PLAN.md`.

Не создавай prompt Stage 7 и не начинай его реализацию в этом чате.

В финальном ответе укажи:

- как устроены URL filters;
- как объединяется simulated incident;
- как реализованы desktop/mobile list и states;
- результаты команд/browser flow;
- оставшиеся риски;
- подтверждение, что Stage 7 не начинался.

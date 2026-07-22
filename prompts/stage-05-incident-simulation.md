# Prompt — Stage 5: Incident simulation

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 5 — Incident simulation**.
Не начинай Stage 6, даже если останется время.

## Обязательный контекст

Перед любыми изменениями полностью прочитай:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt.

После чтения:

- проверь, что Stage 4 отмечен как `complete`;
- проверь `git status` и сохрани существующую работу;
- изучи Redux store, `preferencesSlice`, Overview components, overview API,
  fixtures, domain schemas и тесты;
- подтверди, что активная стадия в `PROJECT_STATUS.md` совпадает с этим prompt.

## Проверенное исходное состояние

- Stage 0–4 завершены;
- `/app/overview` — готовый data-driven экран;
- Overview получает operational snapshot через RTK Query;
- 4 KPI, chart, services и activity используют validated API data;
- `preferencesSlice` хранит глобальный time range;
- metric fixture содержит 13 deterministic points за 6 часов;
- React Bits Border Glow уже адаптирован;
- store пока содержит только preferences и RTK Query;
- simulation slice, listener middleware и live overlay отсутствуют;
- текущая test suite содержит 72 теста;
- initial production bundle имеет известный size advisory, его исправление
  отложено до Stage 10.

Не обновляй зависимости и не меняй API contract без обнаруженной ошибки.

## Цель стадии

Реализовать полностью детерминированный интерактивный сценарий:

```text
idle
  → degrading
  → incident-created
  → investigating
  → recovering
  → resolved
  → idle
```

Пользователь должен увидеть изменение метрик, деградацию Payments API, появление
SEV-2 incident, activity events, восстановление сервиса и итоговый resolved state
без перезагрузки страницы.

Симуляция является client workflow. Исходные RTK Query entities не копируются и
не мутируются. UI получает derived overlay: API snapshot + simulation state.

## 1. Simulation domain

Создай feature:

```text
src/features/incident-simulation/
  model/
    simulationSlice.ts
    simulationListeners.ts
    simulationSelectors.ts
    simulationScenario.ts
  lib/
    applySimulationOverlay.ts
  ui/
    SimulationControls.tsx
    SimulationStatus.tsx
```

Можно скорректировать разбиение, но не смешивай state machine, таймеры и Overview
rendering в одном компоненте.

### Phase type

Используй точные состояния:

```ts
type SimulationPhase =
  | 'idle'
  | 'degrading'
  | 'incident-created'
  | 'investigating'
  | 'recovering'
  | 'resolved';
```

### State

Храни только simulation-specific данные:

- current phase;
- run identifier/counter, если нужен для отмены stale effects;
- appended metric points;
- simulated incident или `null`;
- generated incident events;
- service status override для Payments API;
- optional completion/progress index;
- последнее пользовательское feedback message, если toast выводится из state.

Не копируй в slice:

- весь `OverviewResponse`;
- базовые services/incidents;
- RTK Query cache;
- time range preference;
- данные других страниц.

Simulation state должен удовлетворять существующим `Incident`,
`IncidentEvent`, `MetricPoint` и `ServiceStatus` schemas.

## 2. Deterministic scenario

Вынеси сценарий в immutable constants/pure builders.

Требования:

- никаких `Math.random()`;
- никаких `Date.now()` для domain timestamps;
- timestamps строятся от последнего timestamp API metric series;
- IDs фиксированы и стабильны между run/reset;
- повторный запуск после reset создаёт идентичные значения;
- metric sequences проходят `metricPointSchema`;
- incident/events проходят свои Zod schemas.

Рекомендуемый сценарий:

### Stable baseline

- используется последний API metric point;
- Payments API operational;
- simulation incident отсутствует.

### Degrading

Добавь 4–5 точек с фиксированным виртуальным шагом:

- latency последовательно растёт;
- error rate последовательно растёт;
- throughput умеренно снижается;
- overall status становится `degraded` не на первом, а на пороговом tick;
- Payments API становится `degraded` на том же пороге.

### Incident created

Создай один SEV-2 incident:

- service — Payments API;
- status — `investigating` после перехода через `incident-created`;
- owner — `null`;
- title/summary конкретно описывают latency/error-rate degradation;
- active incident count увеличивается относительно API snapshot на 1;
- activity получает `metric_alert`, `created` и `status_changed` events.

### Recovering

После пользовательского `Begin recovery`:

- incident переходит в `monitoring`;
- добавляются 4–5 declining metric points;
- latency/error rate возвращаются к baseline;
- throughput восстанавливается;
- Payments API возвращается в `operational` только после recovery threshold.

### Resolved

- incident получает status `resolved`;
- `resolvedAt` и `updatedAt` получают deterministic timestamp;
- active incident count возвращается к базовому API значению;
- overall/service status operational;
- activity получает status event;
- итоговое состояние остаётся видимым до `Reset demo`.

Не меняй базовые historical incidents и не обещай сохранение после reload.

## 3. Redux slice и state machine

Создай actions/reducers с явными допустимыми переходами.

Минимальные user intents:

- `startSimulation`;
- `beginRecovery`;
- `resetSimulation`.

Внутренние actions могут включать:

- degradation tick;
- incident created;
- investigating entered;
- recovery tick;
- resolved;
- workflow cancelled/invalidated.

Требования:

- invalid action для текущей phase ничего не ломает;
- повторный `startSimulation` во время active run не создаёт второй workflow;
- reset мгновенно очищает simulation-only state;
- selector API скрывает внутреннюю структуру slice;
- selectors имеют typed `RootState`;
- derived booleans (`canStart`, `canRecover`, `canReset`, `isRunning`) не
  вычисляются вручную в компонентах;
- reducers остаются pure.

Подключи reducer в `createAppStore()` без нарушения изоляции store tests.

## 4. Listener middleware и timers

Используй Redux Toolkit `createListenerMiddleware`.

Требования:

- listener middleware создаётся/подключается предсказуемо для каждого store;
- fake timers могут управлять всем сценарием;
- используй cancellable listener effects, а не `setTimeout` внутри React;
- новый start/reset отменяет stale tasks;
- один store не делит listener state с другим тестовым store;
- React StrictMode не запускает сценарий дважды;
- навигация с Overview и обратно не создаёт второй timer chain;
- unmount компонентов не оставляет component-owned timers;
- store workflow может продолжаться между app routes без дублирования;
- reset после любой phase прекращает будущие ticks;
- не оставлять unresolved promises/open handles после тестов.

Сценарий должен быть достаточно быстрым для портфолио: деградация становится
понятной за несколько секунд, но не мгновенно. В тестах длительность полностью
контролируется fake timers.

Не учитывай `prefers-reduced-motion` изменением business timing/state sequence:
это изменило бы поведение продукта. Reduced motion влияет только на CSS/visual
transitions.

## 5. Simulation overlay

Создай pure функцию/selector composition:

```ts
applySimulationOverlay(apiOverview, simulationState) => OverviewResponse
```

Overlay должен:

- оставить API object неизменным;
- append simulation metric points без duplicate timestamps;
- заменить только Payments API status;
- вычислить current KPI из последней simulation point;
- увеличить active incident count только пока simulation incident unresolved;
- prepend generated events и сохранить newest-first ordering;
- изменить overall status согласно phase;
- вернуть schema-compatible `OverviewResponse`;
- быть детерминированным и отдельно тестируемым.

Не записывай overlay обратно в RTK Query cache.

Simulated incident хранится как client workflow entity намеренно. Добавь selector,
который Stage 6 сможет использовать для объединения с incidents list. Не
реализуй само объединение списка сейчас.

## 6. Overview integration

Интегрируй overlay с существующим Overview без переписывания готовой композиции.

Добавь compact simulation panel рядом с header/перед KPI:

- текущая phase человеческим текстом;
- короткое объяснение следующего действия;
- progress/status indicator с текстовыми labels;
- `Start simulation` в idle;
- `Begin recovery` в investigating;
- `Reset demo` после start и в resolved;
- во время автоматических phases кнопки корректно disabled/hidden;
- `aria-live="polite"` сообщает важные переходы.

UI updates:

- KPI меняются по overlay;
- chart получает appended visible points;
- Payments API status меняется;
- activity получает simulation events;
- Border Glow tone для latency/error/active incident становится warning во
  время degradation/incident и возвращается к stable после resolution;
- status header меняется operational/degraded;
- resolved summary показывает, что система восстановлена.

Не добавляй modal, wizard, confetti, sound или постоянно мигающие alerts.

## 7. Toast/live feedback

Добавь один небольшой accessible feedback mechanism без новой библиотеки:

- visual toast/status message для ключевых переходов;
- `role="status"` или подходящий `aria-live`;
- одновременно показывается не более одного сообщения;
- сообщение не является единственным источником информации;
- toast не требует таймера для понимания состояния;
- если auto-dismiss реализован, его timer должен быть cancellable и покрыт
  тестами;
- critical `role="alert"` используй только для настоящей ошибки, а не для
  обычного progression.

Не создавай глобальную сложную notification system. Shared `Toast` допустим,
только если остаётся маленьким и пригодится Stage 7.

## 8. Landing entry

Теперь симуляция существует, поэтому обнови только primary demo entry:

- hero/final CTA может называться `Start simulation`;
- ссылка ведёт на `/app/overview?demo=start`;
- Overview один раз считывает `demo=start`, запускает simulation только из idle
  и удаляет query parameter через replace;
- React StrictMode/back-forward не запускают второй workflow;
- обычный `/app/overview` остаётся стабильным до нажатия control.

Header CTA `Open demo` можно оставить обычным входом без auto-start.

Не меняй остальной landing content.

## 9. Incident route boundary

Stage 6 и Stage 7 ещё не реализованы.

Поэтому:

- подготовь stable simulated incident ID и selector;
- не добавляй dead `View incident` link, если текущая detail page ответит 404;
- не реализуй incidents list/details в этой стадии;
- не добавляй create-incident API endpoint;
- не записывай simulated incident в MSW database;
- зафиксируй в code comments/README, что Stage 6 объединит simulated incident со
  списком, а Stage 7 подключит workflow details.

## 10. Tests

Добавь тесты с fake timers.

### Slice/state machine

- initial idle;
- каждый допустимый transition;
- invalid transitions ignored;
- reset из каждой active phase;
- repeated start не дублирует run;
- selectors возвращают корректные capabilities.

### Listener workflow

- полный idle → resolved sequence;
- degradation ticks в правильном порядке;
- incident создаётся один раз;
- begin recovery разрешён только в investigating;
- reset отменяет remaining ticks;
- start/reset/start выдаёт идентичные points/IDs/timestamps;
- два `createAppStore()` не делят timers/state;
- navigation/remount не создаёт duplicate chain;
- после теста нет pending timers/open handles.

### Overlay

- base Overview не мутируется;
- KPI/status/services/events корректны для каждой phase;
- metric timestamps уникальны;
- resolved возвращает operational status и baseline active count;
- output проходит `overviewResponseSchema`.

### UI

- idle controls;
- automatic phase feedback;
- investigating recovery control;
- resolved summary/reset;
- `aria-live` semantics;
- query-param auto-start ровно один раз;
- reduced-motion не скрывает state changes;
- существующие Overview loading/empty/error tests проходят.

Не используй реальные sleep в тестах. Не делай snapshot всей страницы.

## 11. README

Обнови README кратко:

- simulation теперь реализована;
- опиши deterministic state machine;
- объясни, что telemetry client-simulated и не persistence-backed;
- добавь короткий demo flow;
- не утверждай, что incidents list/details уже готовы;
- сохрани Stage 10 bundle advisory как известный будущий polish item.

## Не делай

- не реализуй Incidents list Stage 6;
- не реализуй Incident details/status form Stage 7;
- не меняй service pages Stage 8;
- не создавай backend/API create endpoint;
- не мутируй MSW fixtures во время simulation;
- не записывай весь API response в Redux slice;
- не добавляй WebSocket/SSE;
- не используй random/current wall-clock data;
- не добавляй новую animation/UI/state library;
- не исправляй bundle splitting Stage 10;
- не устанавливай Playwright browsers;
- не создавай commit, remote или PR;
- не начинай Stage 6.

## Обязательная визуальная проверка

Запусти приложение с MSW и проверь полный сценарий:

1. Открой stable `/app/overview`.
2. Нажми `Start simulation`.
3. Убедись, что latency/error растут, Payments API становится degraded и
   появляется SEV-2.
4. Дождись investigating.
5. Нажми `Begin recovery`.
6. Убедись, что metrics возвращаются к baseline, service operational и incident
   resolved.
7. Нажми `Reset demo` и повтори start.
8. Проверь вход с `/app/overview?demo=start`.

Также проверь:

- 360/768/1440 px без overflow;
- keyboard focus/order для controls;
- aria-live не повторяет сообщения бесконечно;
- reduced motion сохраняет все phase changes без декоративного движения;
- навигация away/back не создаёт второй workflow;
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

Stage 5 можно отметить `complete`, только если:

- полный state machine завершается без reload;
- repeated start/reset детерминирован;
- timers cancellable и не дублируются после reset/navigation;
- API snapshot не мутируется и не дублируется в slice;
- overlay корректно обновляет Overview;
- Payments API, KPI, chart, events и incident согласованы;
- controls и feedback доступны с клавиатуры/screen reader;
- fake timers покрывают каждый transition;
- reduced motion не меняет business state;
- обязательные команды проходят;
- полный browser flow проходит без console errors.

## Завершение стадии

Перед финальным ответом обнови `PROJECT_STATUS.md` по разделу
`Required completion update`:

- Stage 5 отметь `complete` только после всех exit criteria;
- активной установи `6 — Incidents list`;
- `Active prompt` установи в `not_created`;
- запиши команды, число тестов и полный browser flow;
- укажи deterministic phase timing и количество metric points;
- зафиксируй simulated incident ID и boundary для Stage 6/7;
- обнови implementation summary, risks и stage history.

Если решение влияет на следующие стадии, добавь его в Decision log
`DEVELOPMENT_PLAN.md`.

Не создавай prompt Stage 6 и не начинай его реализацию в этом чате.

В финальном ответе укажи:

- как устроены state machine, listener middleware и cancellation;
- как overlay меняет Overview;
- как работает landing auto-start;
- результаты команд и browser flow;
- оставшиеся риски;
- подтверждение, что Stage 6 не начинался.

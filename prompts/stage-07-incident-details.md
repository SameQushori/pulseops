# Prompt — Stage 7: Incident details workflow

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 7 — Incident details workflow**.
Не начинай Stage 8, даже если останется время.

## Обязательный контекст

Перед любыми изменениями полностью прочитай:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt.

После чтения:

- проверь, что Stage 6 отмечен как `complete`;
- проверь `git status` и сохрани существующую работу;
- изучи IncidentDetails placeholder, incident/service APIs, MSW handlers,
  simulation slice/selectors/scenario, list links, metric chart и tests;
- подтверди, что активная стадия в `PROJECT_STATUS.md` совпадает с этим prompt.

## Проверенное исходное состояние

- Stage 0–6 завершены;
- Incidents list имеет shareable URL filters и рабочие details links;
- API details возвращает incident, service, timeline и notes;
- service details API уже возвращает service, incidents и metrics;
- API mutations `updateIncident` и `addIncidentNote` существуют;
- MSW PATCH/POST mutations валидируют payload и сохраняют session-local state;
- simulated incident существует только в `simulationSlice`;
- simulated incident ID: `incident-simulated-payments-degradation`;
- simulated details branch сейчас read-only;
- simulation slice содержит generated events, но не simulated notes/owner actions;
- Recharts metric UI сейчас находится внутри Overview page;
- текущая test suite содержит 142 теста;
- bundle splitting и Playwright остаются Stage 10 concerns.

Не меняй общий REST contract и не перемещай simulated incident в MSW.

## Цель стадии

Создать полноценную Incident details page, где пользователь может:

- понять impact и текущее состояние;
- увидеть service, severity, owner и timestamps;
- изучить related telemetry;
- прочитать chronological timeline;
- изменить status;
- назначить owner;
- добавить note;
- увидеть optimistic UI;
- получить rollback и понятную ошибку при неудаче;
- увидеть MTTA/MTTR, когда их можно корректно вычислить;
- пройти тот же workflow для client-only simulated incident.

## 1. Unified details view model

API и simulated branches должны рендерить одну общую page composition.

Создай typed view model/pure adapter, например:

```ts
interface IncidentDetailsViewModel {
  incident: Incident;
  service: Service;
  timeline: IncidentEvent[];
  notes: IncidentNote[];
  metrics: MetricPoint[];
  source: 'api' | 'simulation';
}
```

Требования:

- API branch строится из `useGetIncidentQuery` и service metrics query;
- simulated branch строится из `selectSimulatedIncident`,
  `selectSimulation.generatedEvents`, simulated notes и Payments service query;
- page component не содержит два почти одинаковых JSX дерева;
- unknown API ID сохраняет нормальную 404/error обработку;
- если simulation reset удалил incident во время открытой страницы, показать
  понятный state с возвратом в Incidents/Overview;
- service/metrics query error не должен скрывать incident metadata/timeline;
- данные не копируются в новый Redux slice.

## 2. Page composition

### Breadcrumb/back navigation

- ссылка `Incidents` → `/app/incidents`;
- текущий incident title может быть последним текстовым элементом;
- browser back остаётся естественным;
- не добавляй custom history manager.

### Incident header

Покажи:

- eyebrow с incident ID и `Demo incident`, если simulated;
- `<h1>` title;
- summary;
- `SeverityBadge`;
- status badge;
- service name со ссылкой на `/app/services/:serviceId`;
- owner или `Unassigned`;
- started/updated/resolved timestamps в absolute UTC;
- compact actions для status, owner и add note.

Не перегружай header dropdown-меню, icon-only actions или duplicate badges.

### Impact/response summary

Добавь компактный блок:

- current impact based only on incident/service fields;
- MTTA;
- MTTR;
- duration/status context.

Не придумывай affected users, revenue impact или root cause, которых нет в API.

### Related telemetry

- latency/error-rate chart;
- incident period/related service clearly labelled;
- accessible name/description;
- visible units;
- screen-reader fallback values;
- initial animation off;
- empty/error metrics state distinct from whole-page error.

### Timeline

- chronological ascending order;
- visual vertical timeline;
- event type icon + visible text label;
- message;
- absolute UTC timestamp;
- empty state;
- new API/simulated events appear without full page reload.

### Notes

- chronological notes list;
- author, body, timestamp;
- optimistic note visually marked `Saving…` while pending;
- empty state не выглядит ошибкой;
- user-provided body rendered as text, never HTML.

## 3. Reusable metric chart boundary

Нельзя импортировать `pages/overview/*` из IncidentDetails page.

Вынеси reusable chart foundation в entity/shared lower layer, например:

```text
src/entities/metric/ui/MetricPerformanceChart/
```

Сохрани:

- Overview behavior и tests;
- отдельные axes latency/error;
- tooltip;
- accessible description/fallback;
- disabled initial animation;
- responsive sizing.

Overview может оставить thin wrapper со своим heading/time-range copy.
Incident Details использует reusable chart с incident-specific labels.

Не создавай второй почти идентичный Recharts implementation.

## 4. MTTA и MTTR

Создай pure utilities с явно задокументированной семантикой.

Используй:

- acknowledgement time — earliest `status_changed` или `owner_changed` event
  после incident `startedAt`;
- `MTTA = acknowledgedAt - startedAt`;
- `MTTR = resolvedAt - startedAt`;
- отрицательные/invalid intervals не отображаются как валидные;
- если данных нет, label `Not available`;
- durations форматируются понятно: `8m`, `1h 12m`;
- timestamps считаются в UTC;
- никаких Date.now-based running values в deterministic UI.

Если выбранная operational семантика отличается, зафиксируй её в Decision log и
tests. Не называй произвольную величину MTTA.

## 5. Status workflow

Определи разрешённые переходы:

```text
investigating → identified | monitoring
identified    → monitoring
monitoring    → resolved
resolved      → terminal
```

Требования:

- current status видим всегда;
- UI предлагает только допустимые next statuses;
- native select/buttons имеют label;
- resolved incident не показывает фиктивный следующий статус;
- mutation pending блокирует только конфликтующие actions;
- successful API mutation обновляет details и list cache;
- failure откатывает optimistic state и показывает безопасную ошибку;
- статус не меняется silent-образом.

Не добавляй reopen/escalate workflow без scope change.

## 6. Owner workflow

Используй маленький фиксированный список из существующих demo names:

- `Unassigned`;
- `Maya Chen`;
- `Noah Williams`;
- ещё максимум один согласованный demo owner при необходимости.

Требования:

- native labelled select;
- выбор current owner;
- API mutation отправляет только `{ owner }`;
- optimistic update;
- rollback/error feedback;
- no free-form owner input;
- no users/teams API;
- no authentication assumptions.

## 7. Add-note dialog/form

Реализуй доступный dialog без новой библиотеки, если native `<dialog>` достаточно.

Разрешён небольшой shared `Dialog`, только если он действительно обеспечивает:

- modal semantics;
- focus entry;
- Escape close;
- возврат focus к trigger;
- labelled title/description;
- form submit;
- no background interaction while open.

Форма:

- Author — select из demo owners;
- Note — textarea;
- Zod `addIncidentNoteRequestSchema`;
- body required, trimmed, max 1000;
- visible validation;
- character count;
- submit/cancel;
- pending state;
- input сохраняется при mutation failure;
- success закрывает/reset form;
- пользовательский текст не интерпретируется как HTML.

Не устанавливай form library или UI-kit.

## 8. API optimistic updates

Реализуй optimistic behavior в API/data layer, не вручную через duplicate local
incident state.

### updateIncident

Предпочтительно использовать `onQueryStarted`:

- patch `getIncident(id)` cache;
- применить status/owner;
- await `queryFulfilled`;
- заменить optimistic fields серверным response при необходимости;
- `undo()` при failure;
- list tags остаются invalidated/refetched после success;
- не patch неизвестные query caches небезопасно.

### addIncidentNote

- optimistic note получает явно temporary ID;
- добавляется в details notes;
- visibly pending;
- success заменяет/подтверждает server note или refetch согласует результат;
- failure удаляет temporary note;
- form остаётся открытой с error;
- duplicate note после invalidation/refetch не допускается.

Сохрани Zod response validation.

MSW mutation handlers должны:

- иметь короткую deterministic delay, чтобы optimistic state наблюдался;
- PATCH добавлять timeline event при status/owner change;
- POST note добавлять note и `note_added` timeline event;
- генерировать stable session-local IDs/timestamps;
- reset между tests;
- возвращать прежний documented mutation response shape;
- validation/404 errors сохранять общий `ApiError` format.

Не меняй контракт только ради UI convenience.

## 9. Simulated incident mutations

Simulated incident остаётся client workflow data.

Расширь `simulationSlice` минимально:

- `simulatedNotes: IncidentNote[]`;
- action для owner assignment;
- action для `identified` transition;
- action для add simulated note;
- generated timeline event для owner/status/note changes;
- selectors для notes/details data.

Требования:

- payloads проходят существующие schemas до dispatch или создаются pure builder;
- IDs/timestamps детерминированы относительно simulation scenario, не wall clock;
- reset очищает notes/owner additions;
- replay создаёт тот же baseline scenario;
- status `monitoring` должен запускать существующий `beginRecovery`, а не второй
  recovery implementation;
- resolved остаётся результатом существующего listener flow;
- UI не предлагает transition, несовместимый с simulation phase;
- owner/note updates не ломают runId/timers;
- simulated mutations не вызывают API;
- list сразу отражает owner/status через существующий selector merge.

Для перехода в monitoring переиспользуй существующий scenario event/beginRecovery
path. Не дублируй recovery sequence.

## 10. Feedback/errors

Добавь компактную feedback область:

- success status для сохранения;
- error role/сообщение при failure;
- не полагаться только на toast;
- error связан с конкретным status/owner/note action;
- retry не должен повторять mutation без явного user action;
- новая action очищает старую неактуальную ошибку;
- API error normalization не показывает stack/Zod internals.

Не создавай сложную global notification architecture.

## 11. Loading, partial and error states

### Full loading

- details skeleton сохраняет header + main columns;
- accessible loading label.

### Unknown/not found

- incident-specific 404;
- ссылка назад;
- не показывать generic crash.

### Partial metrics failure

- incident metadata, workflow, timeline и notes остаются доступны;
- chart показывает local error/retry или empty.

### Timeline/notes empty

- отдельные neutral empty states;
- не скрывать add-note action.

### Mutation errors

- optimistic rollback виден;
- данные остаются интерактивными после error.

## 12. Responsive layout

Desktop:

- header/actions собраны;
- main content: telemetry + timeline, notes/response metadata разумно сгруппированы;
- chart остаётся доминирующим data block.

Mobile:

- actions становятся full-width/stacked;
- dialog помещается в viewport;
- timeline не обрезается;
- notes wrap long text;
- chart не overflow;
- bottom navigation не перекрывает final action.

Не используй horizontal scrolling для основного workflow.

## 13. Tests

Добавь/обнови тесты.

### Utilities

- allowed status transitions;
- MTTA/MTTR valid/missing/invalid;
- duration formatting;
- timeline sorting;
- view-model adaptation;
- inputs не мутируются.

### API optimistic behavior

- status optimistic success;
- status failure rollback;
- owner optimistic success/failure;
- note optimistic insertion;
- note failure removes temporary item;
- no duplicate after success/refetch;
- timeline event appears;
- malformed response remains error.

### Simulated workflow

- owner update;
- identified transition;
- monitoring reuses existing recovery;
- note deterministic ID/timestamp;
- reset clears details additions;
- list selector sees owner/status update;
- no API request from simulated actions;
- existing 6-phase listener tests remain valid.

### Page

- API loading/success/not-found;
- simulated success/reset disappearance;
- header metadata;
- chart success/empty/error;
- timeline chronological order;
- notes empty/list;
- status allowed options;
- resolved terminal state;
- owner select;
- dialog open/Escape/cancel/focus return;
- note validation/max length;
- mutation pending/success/failure feedback;
- back/service links.

### Accessibility

- one `<h1>`;
- labelled status/owner fields;
- dialog accessible name/description;
- errors associated with fields/actions;
- timeline/list semantics;
- chart accessible fallback;
- keyboard flow.

Существующие 142 теста должны продолжить проходить. Не используй real sleep,
large snapshots или CSS selector tests вместо behavior.

## 14. README

Обнови README:

- Incident details workflow готов;
- status transition rules;
- optimistic update + rollback;
- simulated/API mutation boundary;
- MTTA/MTTR semantics;
- notes session-local до Stage 9;
- не утверждай, что Services Stage 8 готов.

## Не делай

- не реализуй Services list/details Stage 8;
- не переносить simulated incident в MSW/RTK Query;
- не добавлять auth/users/teams;
- не добавлять reopen/escalation/root-cause editor;
- не добавлять markdown/rich-text notes;
- не добавлять attachments;
- не добавлять WebSocket/SSE;
- не менять incident filters Stage 6 без bug;
- не добавлять новый chart/form/dialog library;
- не добавлять React Bits effect на details page;
- не исправлять bundle splitting Stage 10;
- не устанавливать Playwright browsers;
- не создавать commit, remote или PR;
- не начинать Stage 8.

## Обязательная визуальная проверка

Проверь два полных flow.

### API incident

1. Открой incident из списка.
2. Проверь metadata, chart, timeline, notes и metrics.
3. Измени owner.
4. Измени status по допустимому переходу.
5. Добавь note.
6. Убедись, что optimistic state виден и после success данные согласованы.
7. Форсируй MSW error в тестовом/временном handler и проверь rollback.

### Simulated incident

1. Запусти simulation.
2. Открой Demo incident из списка.
3. Назначь owner и добавь note.
4. Переведи в identified/monitoring.
5. Убедись, что monitoring запускает существующую recovery sequence.
6. Дождись resolved и проверь MTTR/timeline.
7. Reset demo и проверь понятный unavailable state.

Также:

- 360/768/1440 без overflow;
- keyboard status/owner/dialog/note flow;
- Escape и focus return dialog;
- reduced motion не скрывает updates;
- browser back возвращает filtered Incidents URL;
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

Stage 7 можно отметить `complete`, только если:

- API и simulated incidents используют одну details composition;
- metadata, related metrics, timeline и notes реализованы;
- status/owner/note workflows работают;
- API updates optimistic и rollback-tested;
- simulated updates не вызывают API и не ломают state machine;
- MTTA/MTTR имеют документированную корректную семантику;
- unknown/reset/partial/error states покрыты;
- dialog и controls доступны с клавиатуры;
- 360/768/1440 проверены;
- обязательные команды и оба browser flow проходят.

## Завершение стадии

Перед финальным ответом обнови `PROJECT_STATUS.md`:

- Stage 7 отметь `complete` только после всех exit criteria;
- активной установи `8 — Services`;
- `Active prompt` установи в `not_created`;
- запиши команды, число тестов и оба browser flow;
- зафиксируй optimistic cache strategy;
- зафиксируй simulated mutation boundary;
- укажи MTTA/MTTR semantics;
- обнови implementation summary, risks и stage history.

Если решение влияет на следующие стадии, добавь его в Decision log
`DEVELOPMENT_PLAN.md`.

Не создавай prompt Stage 8 и не начинай его реализацию в этом чате.

В финальном ответе укажи:

- как устроен unified details view;
- status/owner/note workflow;
- optimistic update/rollback;
- simulated incident integration;
- MTTA/MTTR semantics;
- результаты команд/browser flows;
- оставшиеся риски;
- подтверждение, что Stage 8 не начинался.

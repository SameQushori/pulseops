# Prompt — Stage 4: Overview screen

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 4 — Overview screen**.
Не начинай Stage 5, даже если останется время.

## Обязательный контекст

Перед любыми изменениями полностью прочитай:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt.

После чтения:

- проверь, что Stage 3 отмечен как `complete`;
- проверь `git status` и сохрани существующую работу;
- изучи Overview placeholder, overview schema/API, fixtures, AppShell, tokens,
  shared UI и landing preview;
- подтверди, что активная стадия в `PROJECT_STATUS.md` совпадает с этим prompt.

## Проверенное исходное состояние

- Stage 0–3 завершены;
- `/app/overview` получает через RTK Query валидированный `OverviewResponse`;
- response содержит overall status, KPI, 4 services, metric points и recent
  events;
- MSW, Zod и error normalization работают;
- AppShell и responsive navigation готовы;
- Recharts и date-fns уже установлены;
- landing page содержит только статичный preview и не является источником
  дизайна/логики для Overview;
- React Bits ещё не добавлялся;
- simulation state и live updates ещё не реализованы;
- текущая test suite содержит 56 тестов.

Не изменяй API contract без обнаруженной ошибки.

## Цель стадии

Превратить `/app/overview` в законченный рабочий экран operations console,
использующий реальные данные RTK Query:

- общий статус системы;
- четыре KPI;
- график производительности;
- состояние сервисов;
- последние события;
- общий временной диапазон.

Экран должен быть полезным и читаемым без анимаций. `Border Glow` используется
как аккуратный сигнал интерактивности/состояния, а не как постоянный неоновый
декор.

## 1. Page composition

Реализуй следующую иерархию.

### Page header

- eyebrow `System workspace`;
- `<h1>Overview</h1>`;
- короткое пояснение текущего состояния;
- overall status с текстом и icon/badge;
- отметка `Simulated environment`;
- time-range control справа или ниже на узком экране.

Не используй персональное приветствие или вымышленное имя пользователя.

### KPI row

Ровно четыре KPI:

1. `P95 latency`;
2. `Error rate`;
3. `Throughput`;
4. `Active incidents`.

Требования:

- значения берутся из `data.kpis`;
- единицы отображаются последовательно;
- форматирование вынеси в небольшие pure utilities;
- каждая карточка имеет понятный label и context;
- active incidents может вести на `/app/incidents`;
- цвет не является единственным носителем состояния;
- не придумывай trend percentages, которых нет в API;
- не показывай fake comparison с прошлым периодом.

### Performance chart

Используй Recharts:

- latency — основная line;
- error rate — вторичная line/axis;
- throughput не добавляй третьей линией, если это ухудшает читаемость;
- X axis отображает время;
- tooltip показывает timestamp, latency и error rate;
- grid/axes остаются спокойными и соответствуют tokens;
- responsive container не должен получать нулевую высоту;
- chart не должен анимироваться при первом render;
- при `prefers-reduced-motion` никаких декоративных transitions.

Accessibility:

- видимый heading и unit labels;
- контейнер графика имеет accessible name/description;
- добавь компактный screen-reader fallback или таблицу данных, доступную
  assistive technology;
- tooltip не является единственным способом узнать значения.

### Services health

Покажи все 4 services:

- name;
- текстовый status;
- uptime 30d;
- SLO target;
- last deploy в стабильном UTC/absolute формате;
- ссылка на `/app/services/:serviceId`.

Используй существующий `StatusBadge`, расширяя его API только при необходимости.
Не реализуй dependency graph или service detail content — это Stage 8.

### Recent activity

Покажи recent events:

- type/icon;
- message;
- absolute timestamp или однозначный UTC timestamp;
- логичная сортировка newest first;
- связь с incident details только если event содержит валидный incidentId.

Не вычисляй `x minutes ago` относительно текущего времени для фиксированных
fixtures: это делает демо нестабильным.

### Secondary navigation

Разрешены только полезные переходы:

- `View all incidents`;
- `View all services`.

Не добавляй settings, export, notification bell, search или profile menu.

## 2. Time range и Redux ownership

Создай минимальный `preferencesSlice`, потому что time range является
cross-screen preference по `DEVELOPMENT_PLAN.md`.

Тип:

```ts
type TimeRange = '30m' | '1h' | '6h';
```

Требования:

- default `30m`;
- typed selector/action;
- slice подключён через `createAppStore()`;
- не использовать local state как второй источник истины;
- control реализован как доступная группа buttons/radio semantics;
- active option имеет текстовый/semantic state;
- metric points фильтруются относительно последнего timestamp в dataset, а не
  `Date.now()`;
- выбор не требует нового API request на этой стадии;
- не добавлять localStorage persistence.

Если текущих 5 metric points недостаточно, расширь deterministic fixture до
разумного ряда, покрывающего 6 часов. Не меняй response shape, IDs и связи.
Обнови связанные fixture tests и зафиксированные ожидания.

## 3. React Bits Border Glow

Используй официальный бесплатный компонент:

`https://reactbits.dev/components/border-glow`

Порядок:

1. Открой актуальную документацию.
2. Выбери TypeScript + CSS вариант.
3. Скопируй и адаптируй исходник в:

```text
src/shared/ui/react-bits/BorderGlow/
```

4. Установи только dependency, явно указанную официальной документацией.
5. Добавь короткий комментарий с URL источника.

Адаптация:

- component принимает обычный `children` и `className`;
- использует существующие CSS tokens;
- не ломает семантику вложенной ссылки/карточки;
- decorative effect имеет `aria-hidden`;
- stable KPI показывает очень слабое свечение только на hover/focus-within;
- warning/critical variants могут быть заметнее, но остаются сдержанными;
- `prefers-reduced-motion` останавливает движение и оставляет статичную рамку;
- high-contrast/readability важнее эффекта;
- touch UI не зависит от hover;
- отсутствие анимации не скрывает status.

Используй Border Glow только для KPI cards и при необходимости одной карточки
активного инцидента. Не оборачивай им chart, service rows, activity feed и весь
экран.

Если официальный компонент требует Tailwind-вариант, выбери CSS-вариант.
Не устанавливай Tailwind и не заменяй компонент другим React Bits effect.

## 4. Loading, empty и error states

Overview должен иметь полноценные состояния:

### Loading

- skeleton/layout сохраняет геометрию header, KPI row и основных panels;
- нет скачка всей страницы после загрузки;
- loading label доступен screen reader.

### Error

- используется нормализованное безопасное сообщение;
- retry action вызывает `refetch`;
- AppShell остаётся доступным;
- ошибка не выглядит как empty state.

### Empty

- отдельное состояние для отсутствующих services/metrics;
- понятный текст без обвинения пользователя;
- не рендерить пустой chart;
- если часть данных существует, показывать доступные sections и локальный empty
  state вместо полного скрытия страницы.

Используй существующие primitives и дорабатывай их только при реальной
необходимости.

## 5. Файловая структура

Предпочтительно:

```text
src/pages/overview/
  OverviewPage.tsx
  OverviewPage.module.css
  components/
    OverviewHeader.tsx
    MetricCard.tsx
    PerformanceChart.tsx
    ServiceHealthList.tsx
    ActivityFeed.tsx
    TimeRangeControl.tsx
  lib/
    formatOverviewValue.ts
    filterMetricPoints.ts
src/features/time-range/
  model/
    preferencesSlice.ts
```

Не обязательно создавать каждый перечисленный файл. Выноси компоненты по
ответственности и не создавай один гигантский `OverviewPage.tsx`.

Не импортируй из `pages` в `features/entities/shared`.

## 6. Visual direction

Соблюдай approved mockup:

- строгая dashboard grid;
- графитовые поверхности;
- lime accent только для healthy/interactive состояния;
- warning/critical colors только по смыслу;
- заметные числовые значения;
- тонкие borders;
- свободное пространство между группами;
- без glassmorphism, gradients на каждой карточке и excessive pills.

Desktop:

- 4 KPI в одной строке, если ширина позволяет;
- chart — доминирующий блок;
- activity feed — вторичный блок;
- services читаются без горизонтального scrolling.

Mobile:

- header и time-range control переносятся;
- KPI становятся 1–2 columns;
- chart остаётся читаемым и не вызывает overflow;
- service rows перестраиваются, а не сжимаются;
- mobile bottom navigation не перекрывает последний content.

## 7. Тесты

Добавь/обнови тесты.

### Page states

- loading;
- success с четырьмя KPI;
- partial empty;
- full empty;
- error и retry.

### Data rendering

- overall status;
- KPI formatting;
- 4 services;
- recent events в правильном порядке;
- корректные links.

### Time range

- default `30m`;
- переключение `1h`/`6h`;
- Redux store содержит единственный источник значения;
- filtering использует latest dataset timestamp;
- `createAppStore()` остаётся изолированным.

### Chart/accessibility

- chart имеет accessible name/description;
- fallback содержит значения;
- empty metrics не создаёт пустой chart;
- initial animation отключена.

### Border Glow

- сохраняет children/semantics;
- variant/state передаётся корректно;
- эффект decorative;
- reduced-motion fallback присутствует в CSS/observable behavior.

Не тестируй внутреннюю SVG-разметку Recharts и не создавай snapshot всей
страницы.

Существующие 56 тестов должны продолжить проходить; обновляй старые ожидания
только когда Overview placeholder действительно заменён финальным Stage 4 UI.

## 8. README

Обнови README кратко:

- Overview больше не placeholder;
- перечисли его реальные возможности;
- упомяни Border Glow attribution/source;
- не описывай simulation как готовую;
- не превращай README в финальный case study до Stage 11.

## Не делай

- не реализуй incident simulation Stage 5;
- не создавай `simulationSlice` или timers;
- не изменяй service/incident workflow;
- не реализуй incidents filters Stage 6;
- не реализуй service details Stage 8;
- не добавляй backend/Cloudflare;
- не добавляй новый chart library;
- не добавляй второй React Bits component;
- не копируй landing preview вместо настоящего data-driven UI;
- не придумывай trends/alerts, отсутствующие в response;
- не устанавливай Tailwind/UI-kit;
- не устанавливай Playwright browsers;
- не создавай commit, remote или PR;
- не начинай Stage 5.

## Обязательная визуальная проверка

Запусти приложение с MSW и проверь:

- 360 px: KPI, time range, chart, services и activity не создают overflow;
- 768 px: layout сохраняет ясную иерархию;
- 1440 px: chart доминирует, KPI образуют аккуратную строку;
- keyboard: time range, KPI links, service links и secondary navigation имеют
  логичный порядок и visible focus;
- `prefers-reduced-motion`: Border Glow статичен, контент не меняется;
- loading → success не вызывает крупного layout shift;
- error/retry и empty states визуально различимы;
- `/` landing и остальные `/app/*` routes не сломаны;
- console содержит 0 errors и 0 warnings.

После проверки останови dev server.

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

Stage 4 можно отметить `complete`, только если:

- Overview полностью использует typed RTK Query data;
- 4 KPI, performance chart, services и activity реализованы;
- Border Glow адаптирован из официального TS+CSS source;
- time range хранится в Redux и корректно фильтрует metrics;
- loading/partial empty/full empty/error/retry покрыты;
- chart и controls доступны с клавиатуры/screen reader;
- 360/768/1440 и reduced motion проверены;
- обязательные команды проходят;
- browser console чиста.

## Завершение стадии

Перед финальным ответом обнови `PROJECT_STATUS.md` по разделу
`Required completion update`:

- Stage 4 отметь `complete` только после всех exit criteria;
- активной установи `5 — Incident simulation`;
- `Active prompt` установи в `not_created`;
- запиши команды, число тестов и browser verification;
- укажи точный источник Border Glow и добавленную dependency;
- зафиксируй изменение количества metric fixtures, если оно было;
- обнови implementation summary, risks и stage history.

Если решение влияет на следующие стадии, добавь его в Decision log
`DEVELOPMENT_PLAN.md`.

Не создавай prompt Stage 5 и не начинай его реализацию в этом чате.

В финальном ответе укажи:

- какие Overview sections реализованы;
- как подключён Border Glow;
- как устроен Redux time range;
- результаты команд и визуальных проверок;
- оставшиеся риски;
- подтверждение, что Stage 5 не начинался.

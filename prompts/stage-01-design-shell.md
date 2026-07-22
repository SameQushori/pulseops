# Prompt — Stage 1: Design tokens, routes and AppShell

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 1 — Design tokens, routes and AppShell**.
Не начинай Stage 2, даже если останется время.

## Обязательный контекст

Перед любыми изменениями полностью прочитай:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt.

После чтения:

- проверь, что Stage 0 отмечен как `complete`;
- проверь `git status` и сохрани существующие изменения;
- изучи текущие `package.json`, `src/app/App.tsx`,
  `src/app/styles/global.css`, `src/main.tsx` и тестовую конфигурацию;
- подтверди, что активная стадия в `PROJECT_STATUS.md` совпадает с этим prompt.

## Исходное состояние

Stage 0 завершён и проверен:

- Vite 8, React 19 и strict TypeScript настроены;
- React Router, Lucide React и остальные утверждённые runtime-зависимости уже
  установлены;
- Vitest и React Testing Library настроены;
- приложение пока показывает только минимальную заглушку;
- Redux store, API, MSW handlers, React Bits и backend ещё не реализованы;
- `test:e2e` остаётся намеренно падающей заглушкой и не относится к этой стадии.

Не обновляй версии пакетов без реальной необходимости для Stage 1.

## Цель стадии

Создать визуальный фундамент и навигационный каркас приложения: общие токены,
доступные базовые UI-примитивы, маршруты, desktop sidebar и mobile bottom
navigation. Все продуктовые страницы на этой стадии остаются содержательными
заглушками.

## Выполни

### 1. Глобальные стили и токены

Переработай `src/app/styles/global.css` и при необходимости раздели стили на
небольшие файлы внутри `src/app/styles/`.

Добавь:

- корректный CSS reset;
- `color-scheme: dark`;
- цвета canvas, raised/hover surfaces, primary/muted text, neutral border;
- lime accent;
- warning и critical severity colors;
- focus ring;
- шкалу spacing;
- радиусы;
- тени;
- типографические токены;
- предсказуемые responsive breakpoints в стилях;
- базовые стили текста, ссылок, кнопок и form controls;
- глобальный `:focus-visible`;
- обработку `prefers-reduced-motion`;
- защиту от горизонтального overflow.

Сохрани направление из `PRODUCT.md`: тёмный operations UI, тёплый светлый текст,
графитовые поверхности и один лаймовый акцент. Не используй Tailwind и не
подключай внешний UI-kit.

### 2. Маршрутизация

Настрой React Router со следующими маршрутами:

```text
/                              public presentation placeholder
/app                           redirect to /app/overview
/app/overview                  Overview placeholder
/app/incidents                 Incidents placeholder
/app/incidents/:incidentId     Incident details placeholder
/app/services                  Services placeholder
/app/services/:serviceId       Service details placeholder
*                              Not found
```

Требования:

- public route `/` не должен отображаться внутри AppShell;
- все `/app/*` маршруты используют общий AppShell и nested routing;
- прямой переход по каждому URL должен работать;
- browser back/forward должен работать;
- неизвестный маршрут показывает доступную страницу 404;
- не реализуй настоящий контент landing page — это Stage 3.

Предпочтительная структура:

```text
src/app/
  App.tsx
  providers/
  router/
  styles/
src/pages/
  landing/
  overview/
  incidents/
  incident-details/
  services/
  service-details/
  not-found/
```

Можно немного скорректировать имена файлов, но не архитектурные слои.

### 3. AppShell

Создай AppShell для `/app/*`:

- бренд PulseOps;
- desktop sidebar;
- ссылки Overview, Incidents и Services;
- активное состояние через React Router;
- компактная нижняя навигация на мобильных экранах;
- `<main>` с `<Outlet />`;
- skip link «Skip to content»;
- семантические landmarks;
- корректные aria-label;
- Lucide icons.

Иконки рядом с видимым текстом должны быть декоративными с
`aria-hidden="true"`. Icon-only controls должны иметь доступное имя.

Не добавляй несуществующие разделы, профиль пользователя, уведомления, поиск,
настройки или fake live data.

### 4. Базовые UI-примитивы

Создай минимальные строго типизированные компоненты:

- `Button`;
- `IconButton`;
- `StatusBadge`;
- `SeverityBadge`;
- `LoadingState` или `Skeleton`;
- `ErrorState`;
- `EmptyState`;
- `VisuallyHidden`.

Требования:

- компоненты принимают стандартные HTML props;
- `Button` поддерживает необходимые визуальные варианты без чрезмерного API;
- badges содержат текст и не полагаются только на цвет;
- loading state имеет корректную семантику;
- error/empty state могут принимать action, но не зависят от Router;
- не создавай большую дизайн-систему или barrel-файлы с циклическими импортами;
- React Bits и `BorderGlowCard` пока не добавляй — они относятся к Stage 4.

### 5. Placeholder pages

Каждый маршрут должен иметь собственный небольшой компонент страницы:

- уникальный `<h1>`;
- одна короткая строка, объясняющая будущую функцию экрана;
- при необходимости демонстрация одного базового состояния.

Не добавляй метрики, таблицы, графики, фикстуры или бизнес-логику.

### 6. Тесты

Обнови smoke test и добавь минимально достаточные тесты для Stage 1:

- корневой public route доступен;
- `/app` перенаправляет на Overview;
- каждый основной app route рендерит правильный heading;
- AppShell присутствует только на `/app/*`;
- sidebar показывает активную ссылку;
- неизвестный route показывает 404;
- базовые Button/Badge/ErrorState имеют доступную семантику;
- при тестировании маршрутов не должен загрязняться глобальный browser history.

Тестируй поведение, а не внутреннюю реализацию или CSS-классы, кроме случая,
когда active state невозможно проверить семантически.

### 7. Документация

Обнови README только в части:

- текущего состояния Stage 1;
- доступных маршрутов;
- существующих команд.

Не добавляй финальное портфолио-описание раньше Stage 11.

## Не делай

- не создавай Redux store, slices, RTK Query или MSW handlers;
- не добавляй доменные модели и фикстуры;
- не реализуй landing page из Stage 3;
- не реализуй Overview из Stage 4;
- не добавляй React Bits, графики или симуляцию;
- не устанавливай Tailwind, Radix, styled-components или новый UI-kit;
- не настраивай Cloudflare/backend;
- не устанавливай Playwright browsers;
- не создавай commit, remote или pull request;
- не начинай Stage 2.

## Обязательная визуальная проверка

Запусти приложение и проверь минимум:

- 360 px: sidebar скрыт, нижняя навигация видима, нет горизонтального overflow;
- 768 px: layout не перекрывается и остаётся читаемым;
- 1440 px: sidebar и content layout выглядят собранно;
- keyboard Tab: skip link, навигация и действия имеют видимый focus;
- каждый маршрут открывается напрямую;
- browser console не содержит ошибок и предупреждений.

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

`npm run test:e2e` на этой стадии запускать не требуется: это всё ещё намеренно
падающая заглушка.

## Exit criteria

Stage 1 можно отметить `complete`, только если:

- каждый маршрут достижим напрямую;
- AppShell используется только для `/app/*`;
- активная навигация работает;
- layout проверен на 360 px, 768 px и 1440 px;
- клавиатурная навигация и focus видимы;
- отсутствует горизонтальный overflow;
- обязательные команды прошли;
- console errors/warnings отсутствуют.

## Завершение стадии

Перед финальным ответом обнови `PROJECT_STATUS.md` по разделу
`Required completion update`:

- Stage 1 отметь `complete` только после проверки всех exit criteria;
- активной установи `2 — Domain, Redux store and MSW API`;
- `Active prompt` установи в `not_created`;
- запиши точные команды, количество тестов и результаты визуальной проверки;
- обнови implementation summary, blockers/risks и stage history.

Если решение повлияло на следующие стадии, добавь его в Decision log файла
`DEVELOPMENT_PLAN.md`.

Не создавай prompt Stage 2 и не начинай его реализацию в этом чате.

В финальном ответе укажи:

- какие маршруты и компоненты созданы;
- результаты всех команд;
- результаты проверки 360/768/1440 и клавиатуры;
- оставшиеся риски;
- подтверждение, что Stage 2 не начинался.

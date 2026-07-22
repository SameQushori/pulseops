# Prompt — Stage 10: Quality and polish

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 10 — Quality and polish**. Не начинай
Stage 11, не создавай production D1/Cloudflare resources и не выполняй deploy,
даже если останется время.

## Обязательный контекст

До любых изменений полностью прочитай в указанном порядке:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt;
6. актуальные router/AppShell, страницы, общие UI-компоненты, стили, тесты,
   Vite/Vitest/Wrangler config и npm scripts.

Затем:

- проверь, что Stage 9 имеет статус `complete`, а активная стадия — Stage 10;
- выполни `git status` и сохрани всю существующую работу пользователя;
- назови в первом сообщении точную стадию и задачу;
- составь короткий рабочий план и выполняй его до полного exit criteria;
- не изменяй продуктовый scope и не делай несвязанный рефакторинг.

## Проверенное исходное состояние

- Stage 0–9 завершены;
- приложение имеет семь route patterns и полноценный local Pages + Hono + D1
  backend с тем же контрактом, что MSW;
- текущая frontend suite: 29 файлов и 176 тестов;
- backend integration suite: 16 тестов;
- `test:e2e` сейчас является намеренно падающим placeholder;
- Playwright и browser binaries ещё не настроены;
- production build проходит, но содержит один application chunk размером около
  844.03 kB minified;
- route pages сейчас импортируются синхронно в `src/app/router/routes.tsx`;
- real API mode и MSW mode должны продолжить работать без изменений page
  components;
- client simulation намеренно не переживает reload, а реальные
  status/owner/note mutations сохраняются в D1;
- production D1, repository URL и deployment остаются Stage 11.

Перед реализацией перепроверь эти факты по репозиторию. Если числа уже отличаются,
используй фактическое состояние и зафиксируй его в финальном отчёте.

## Цель стадии

Довести уже реализованный продукт до состояния убедительного portfolio demo:

- заменить E2E placeholder настоящей воспроизводимой Playwright suite;
- закрыть серьёзные accessibility и keyboard проблемы;
- обеспечить корректный reduced-motion режим;
- сделать route-level code splitting и уменьшить initial load;
- отполировать responsive/data/error states и пользовательский текст;
- удалить доказанно неиспользуемый код и зависимости;
- получить чистый полный verification pipeline.

Stage 10 не добавляет новые продуктовые возможности. Исправления должны улучшать
существующий опыт, доступность, производительность и надёжность.

## 1. Baseline audit до изменений

Сначала зафиксируй baseline:

- структуру route graph и какие страницы тянут Recharts/тяжёлые модули;
- фактические Vite build artifacts: entry chunks, lazy chunks и размеры;
- все существующие landmarks, heading levels, skip links и dialogs;
- keyboard flow основных действий;
- `prefers-reduced-motion` rules и JS motion paths;
- console warnings/errors в основных маршрутах;
- loading, empty, error и skeleton states каждой data-driven страницы;
- состояние на ширинах 360 px и desktop;
- package dependencies, generated artifacts и placeholder scripts.

Не делай массовый рефакторинг по предположению. Оптимизируй rerenders только если
нашёл конкретную причину через React DevTools/Profiler, inspection или понятный
state/data-flow анализ. Не добавляй `memo`, `useMemo` и `useCallback` повсеместно.

## 2. Playwright E2E

Установи и настрой минимально необходимый актуальный Playwright stack. Предпочти:

- `@playwright/test`;
- Chromium как обязательный browser для локального portfolio pipeline;
- никаких Cypress, Selenium или второго E2E runner;
- `@axe-core/playwright` для browser accessibility checks.

Проверь актуальную официальную документацию Playwright и axe integration перед
настройкой. Зафиксируй точные версии в lockfile. Установи browser binary, нужный
для реального запуска тестов.

Создай `playwright.config.ts` и понятную структуру `tests/e2e/` (или аналогичную,
если текущая архитектура обоснованно требует другое). Конфигурация должна:

- иметь стабильный `baseURL`;
- самостоятельно запускать и корректно останавливать test web server;
- быть cross-platform для Windows/Linux CI;
- использовать deterministic MSW mode для основной UI suite;
- сохранять trace на retry, screenshot при падении и разумный timeout;
- запускать desktop Chromium и минимум один mobile viewport 360 px либо отдельный
  обязательный responsive project;
- исключать unit/component tests;
- не зависеть от уже запущенного вручную dev server;
- не оставлять Node/Wrangler/browser процессы после завершения.

Замени падающий placeholder реальным `npm run test:e2e`. Удали placeholder-файл,
если он больше нигде не используется. Не делай script, который молча пропускает
тесты при отсутствии browser/server.

Основной E2E path должен проверять поведением, а не только screenshots:

1. открыть Overview;
2. запустить incident simulation;
3. увидеть degradation Payments API;
4. открыть созданный simulated incident;
5. изменить его status;
6. добавить note;
7. провести workflow через monitoring/resolved;
8. подтвердить восстановление Overview;
9. проверить Reset/replay, если это необходимо для изоляции и детерминизма.

Второй обязательный path:

1. открыть Incidents напрямую;
2. применить severity и status filters;
3. проверить canonical URL;
4. обновить страницу;
5. подтвердить сохранение фильтров и корректных результатов.

Добавь компактные smoke checks для Landing, Services, Service details, API-backed
Incident details и 404. Не дублируй всю component suite в E2E.

Используй role/name/label/text selectors. Добавляй `data-testid` только когда нет
стабильного семантического селектора и объяснимая причина действительно есть.
Каждый тест должен быть независимым и не полагаться на порядок запуска.

### Real backend coverage

Stage 9 уже имеет Pages+D1 integration suite. Сохрани её и добавь небольшой
full-stack browser smoke path только если его можно сделать воспроизводимым и
cross-platform на базе существующих reset/start helpers без хрупкого process
orchestration. Такой path должен reset/seed local D1 и проверить persistence хотя
бы одной разрешённой mutation после reload.

Если отдельный full-stack E2E script добавлен, он обязан реально запускаться в
финальной проверке. Если integration suite + ручной built-app browser verification
лучше покрывают этот boundary, не создавай формальный дублирующий script; явно
зафиксируй принятое решение в evidence.

## 3. Automated accessibility и ручной аудит

Запусти axe checks минимум на стабильных состояниях:

- public Landing;
- Overview;
- Incidents;
- Incident details;
- Services;
- Service details;
- 404;
- открытый Add note dialog;
- ключевое degraded/resolved simulation state.

Не допускай `critical` и `serious` violations. Не отключай axe rules глобально и
не добавляй broad exclusions. Любое точечное исключение требует конкретного
обоснования в коде и финальном отчёте.

Проведи ручной аудит и исправь найденное:

- один логичный `h1` и последовательные headings на каждом route;
- корректные `header`, `nav`, `main`, `aside`, `section` landmarks без лишнего
  дублирования;
- skip link переводит focus в основной контент после route navigation;
- видимый focus для каждого интерактивного элемента;
- логичный tab order без положительных `tabIndex`;
- все primary actions полностью доступны с клавиатуры;
- icon-only controls имеют доступные имена;
- statuses/severity/health не передаются только цветом;
- charts имеют текстовое accessible summary и не создают шум для screen reader;
- loading/error/success updates объявляются ровно там, где это полезно;
- dialog имеет имя, focus trap/initial focus, Escape и возврат focus trigger;
- validation error связан с полем;
- mobile navigation и одинаковые desktop/mobile links не создают двойной tab
  order в одном breakpoint;
- contrast текста, границ и focus indicator достаточен в утверждённой dark theme.

Не меняй английский язык интерфейса и не добавляй i18n.

## 4. Reduced motion

Проверь все CSS animation/transition, Border Glow, simulation feedback, skeletons,
scroll/focus behavior и любые timer-driven visual effects.

При `prefers-reduced-motion: reduce`:

- декоративная анимация отключена или сведена к статическому состоянию;
- контент и status feedback остаются понятными;
- workflow остаётся функциональным;
- не возникает flashing/pulsing эффекта;
- никакая важная операция не зависит от завершения анимации.

Добавь automated coverage там, где режим наблюдаем через browser/UI, и проведи
ручную проверку с Playwright media emulation. Не удаляй саму детерминированную
simulation timing/state machine только из-за reduced motion — упрощай визуальное
движение.

## 5. Route-level code splitting и initial load

Раздели route pages на lazy chunks средствами React Router/React, совместимыми с
установленной версией. Требования:

- Landing не должна загружать Recharts и application-only page code до перехода;
- Overview, Incidents, Incident details, Services и Service details должны иметь
  осмысленные route-level boundaries;
- AppShell/shared primitives не должны бессмысленно дублироваться в chunks;
- route fallback должен быть доступным, визуально согласованным и без заметного
  layout shift;
- lazy import failure должен приводить к понятному route/application error UI, а
  не к пустому экрану;
- существующие route tests и navigation behavior должны сохраниться.

Сначала предпочти естественные dynamic imports. Не добавляй сложный `manualChunks`
без измеренного выигрыша. Не добавляй новую bundler-analysis dependency, если
достаточно Vite output и browser network inspection.

После изменений сравни build с baseline и зафиксируй:

- entry chunk и основные route chunks;
- minified и gzip sizes, доступные из build output;
- подтверждение, что public initial route не тянет Recharts/console pages;
- отсутствие Vite large-chunk warning либо конкретное объяснение оставшегося
  lazy route chunk, если он не влияет на initial Landing load.

Не подгоняй числа искусственным разбиением каждого файла. Цель — разумная
начальная загрузка и понятные boundaries, а не максимальное количество chunks.

## 6. Responsive и UI polish

Проверь минимум 360×800 и desktop 1440×900, а также промежуточную ширину около
768 px на всех основных routes и ключевых состояниях.

Исправь только реальные дефекты:

- никакого горизонтального scroll на 360 px;
- navigation, tables/cards, filters, charts, dialogs и long text не обрезаются;
- mobile primary actions остаются достижимыми и не перекрываются bottom nav;
- touch targets разумного размера;
- skeleton geometry соответствует финальному layout;
- loading, empty, no-results, 404 и recoverable error states имеют ясное действие;
- длинные incident titles, owner names, notes и service descriptions переносятся;
- focus/scroll position после navigation не создаёт ловушек;
- Border Glow остаётся выборочным акцентом, не распространяется на все карточки;
- на одном экране сохраняется максимум один доминирующий animated effect.

Не выполняй визуальный redesign. Сохрани утверждённую dark operations-console
direction, tokens и существующий React Bits Border Glow.

## 7. Copy consistency

Проверь весь пользовательский текст:

- одинаковые названия `Payments API`, `Checkout Web`, `Identity`,
  `Notifications`;
- единые labels для incident statuses, severity, owner, notes, time range и
  simulation actions;
- последовательные capitalization, punctuation, UTC/time formatting;
- честное указание, где telemetry/simulation являются демонстрационными;
- отсутствие lorem ipsum, generic AI copy, fake real-time claims, fake customers,
  testimonials и недоказанных production claims;
- отсутствие пользовательских упоминаний `Stage N`, тестовых инструкций и
  технических placeholder сообщений.

Repository link не выдумывай. При пустом `VITE_REPOSITORY_URL` UI должен оставаться
завершённым без пустой/нерабочей ссылки.

## 8. Cleanup без изменения scope

Удаляй только доказанно неиспользуемое:

- placeholder E2E script после замены;
- dead imports/exports/components/styles;
- неиспользуемые dependencies;
- случайные `console.log`, debugger statements и временные test artifacts;
- generated logs/reports, если они не являются пользовательскими исходниками;
- stale README statements о ненастроенном E2E.

Убедись, что `.gitignore` покрывает Playwright reports/results и browser artifacts.
Не удаляй пользовательские файлы или неизвестные изменения. Не делай breaking
dependency upgrades ради `npm audit`; dev-only advisory Drizzle Kit сначала
оцени, затем документируй, если безопасного non-breaking fix нет.

Проверь отсутствие interval/listener leaks после route changes. Сохрани
client-only simulation boundary и существующие backend write restrictions.

## 9. Тесты и обязательная финальная проверка

Добавь/обнови unit и component tests только для изменённого поведения. Не снижай
существующее покрытие и не переписывай стабильные assertions в бессодержательные.

Перед завершением Stage 10 обязательно выполни как минимум:

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

Также выполни отдельный full-stack E2E script, если он был добавлен. Не объявляй
стадию завершённой, если test command пропущен, browser не установлен, тест
skipped без причины или server/process cleanup не подтверждён.

Browser verification должна включать:

- основной simulation flow на desktop;
- incidents filter + reload flow;
- Landing и application routes на 360 px;
- keyboard-only critical flow, включая dialog;
- reduced-motion emulation;
- axe scan ключевых routes/states;
- clean console без errors и warnings;
- network/build evidence route splitting;
- проверку закрытия локальных test server ports/processes.

Если для исправления затронуты реальные API/D1 paths, дополнительно выполни
`npm run db:reset:local` и соответствующий built-app Pages+D1 smoke flow.

## 10. Documentation

Обнови README только в части, которая реально изменилась в Stage 10:

- настоящий `test:e2e` command и установка Playwright browser для clean clone;
- distinction unit/component, API integration и E2E suites;
- MSW test mode и, если есть, full-stack browser test command;
- accessibility/reduced-motion verification;
- актуальные build/quality commands.

Не пиши финальный portfolio case study и deployment guide — это Stage 11.

`DEVELOPMENT_PLAN.md` decision log обновляй только если принято решение, влияющее
на Stage 11 или дальнейшую архитектуру: например, E2E mode, route-loading boundary
или осознанно оставшийся bundle tradeoff.

## Ограничения

Запрещено в Stage 10:

- начинать Stage 11;
- создавать production D1/Cloudflare project;
- выполнять `wrangler pages deploy` или иные remote writes;
- добавлять auth, roles, organizations, billing, WebSockets/SSE, AI, email,
  second theme, i18n или admin panel;
- менять REST contract или database schema без доказанной Stage 10 ошибки;
- заменять Redux Toolkit/RTK Query/MSW/Hono/D1/Drizzle;
- добавлять UI framework или новую animation library;
- превращать stage в redesign;
- скрывать accessibility, TypeScript, lint или test failures;
- отмечать Stage 10 завершённой при непроверенном exit criterion.

## Exit criteria

Stage 10 завершена только если одновременно доказано:

- typecheck, lint, format, unit/component, API integration, E2E и build проходят;
- `test:e2e` больше не placeholder и действительно запускает Chromium tests;
- основной simulation flow и filter/reload path покрыты E2E;
- main flows работают при 360 px и desktop;
- critical keyboard flow работает без мыши;
- серьёзных axe/accessibility нарушений нет;
- reduced-motion режим проверен и функционален;
- console не содержит errors/warnings;
- route-level code splitting подтверждён artifacts/network evidence;
- initial Landing load больше не включает тяжёлый application/chart code;
- loading/empty/error/skeleton/copy states согласованы;
- неиспользуемый код/dependencies удалён только по evidence;
- README и `PROJECT_STATUS.md` соответствуют фактическому состоянию;
- никакие production resources не созданы.

## Завершение стадии и handoff

В конце обнови `PROJECT_STATUS.md` по его completion protocol:

1. отметь Stage 10 как `complete` только при выполнении всех exit criteria;
2. внеси конкретное completion evidence: версии Playwright/axe, количество и
   проекты E2E tests, axe result, responsive/keyboard/reduced-motion evidence,
   bundle before/after и все команды с результатами;
3. поставь `Overall status: ready_for_stage_11`;
4. поставь `Active stage: 11 — Deployment and portfolio handoff`;
5. поставь `Active prompt: not_created`;
6. поставь `Last completed stage: 10 — Quality and polish`;
7. укажи `Next action`: создать Stage 11 prompt в новом чате, не начинать Stage 11
   в текущем;
8. обнови implementation summary, blockers/risks и stage history;
9. явно оставь repository URL, production D1 ID, Cloudflare project/deploy как
   Stage 11 prerequisites, если они всё ещё отсутствуют.

Если хотя бы один exit criterion не проверен, оставь Stage 10 `in_progress` или
`blocked`, точно опиши причину и не переходи к Stage 11.

Финальный ответ должен кратко перечислить:

- что улучшено;
- какие E2E/a11y/performance решения приняты;
- полный список выполненных команд и результаты;
- bundle before/after;
- browser verification;
- изменённые ключевые файлы;
- оставшиеся риски и следующий шаг.

# Prompt — Stage 11: Deployment and portfolio handoff

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 11 — Deployment and portfolio handoff**.
Это финальная стадия portfolio release. Не добавляй новые продуктовые возможности
и не расширяй утверждённый scope.

## Обязательное чтение и preflight

До любых изменений полностью прочитай в указанном порядке:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt;
6. `README.md`, `docs/API.md`, `wrangler.jsonc`, `package.json`, `.env.example`;
7. migrations/seed, Pages adapter, deployment-relevant scripts, Landing/site
   config, metadata и текущие Playwright tests.

После чтения:

- проверь, что Stage 10 имеет статус `complete`, а активная стадия — Stage 11;
- выполни `git status`, `git remote -v` и сохрани всю существующую работу;
- проверь фактические версии Wrangler/Node и текущую официальную документацию;
- назови в первом сообщении точную стадию и текущую фазу;
- создай короткий план с отдельными checkpoints: preflight, repository, D1,
  deploy, production verification, media/README, clean-clone verification;
- не отмечай стадию завершённой до выполнения всех exit criteria.

## Проверенное исходное состояние

- Stage 0–10 завершены;
- frontend, local Pages Functions + Hono + Drizzle + D1 backend и 8-operation
  API contract готовы;
- unit/component suite содержит 176 тестов, API suite — 16, Playwright — 29
  Chromium E2E tests и 25 axe scans;
- route-level code splitting готов: public Landing не загружает Recharts;
- `wrangler.jsonc` содержит project name `pulseops`, binding `DB`, local database
  name и all-zero placeholder вместо production D1 ID;
- production D1, Cloudflare Pages project и deployment ещё не существуют;
- Git repository не имеет remote, все файлы могут быть пока untracked;
- `VITE_REPOSITORY_URL` пуст, поэтому public source links скрыты;
- screenshots/GIF для README отсутствуют;
- production audit чист, известные Drizzle Kit advisories dev-only;
- client simulation остаётся детерминированной и неперсистентной.

Перед работой перепроверь эти факты по репозиторию. Используй фактические данные,
если состояние изменилось.

## Актуальные официальные источники

Перед remote operations сверь команды и ограничения только по официальным docs:

- Pages Direct Upload:
  `https://developers.cloudflare.com/pages/get-started/direct-upload/`
- Pages Functions Wrangler configuration:
  `https://developers.cloudflare.com/pages/functions/wrangler-configuration/`
- Pages Functions + D1 bindings:
  `https://developers.cloudflare.com/pages/functions/bindings/`
- D1 getting started:
  `https://developers.cloudflare.com/d1/get-started/`
- D1 migrations:
  `https://developers.cloudflare.com/d1/reference/migrations/`
- D1 local development/`preview_database_id`:
  `https://developers.cloudflare.com/d1/best-practices/local-development/`

Не копируй устаревшие snippets вслепую. Используй установленную версию Wrangler
и её schema. Не меняй Pages Functions на Workers и не меняй platform architecture.

## Цель стадии

Опубликовать PulseOps как проверяемый portfolio project:

- публичный исходный репозиторий с чистой историей и без секретов;
- production D1 с migrations и deterministic seed;
- один Cloudflare Pages project с Pages Functions и binding `DB`;
- рабочий live URL;
- проверенный production health/API/main simulation flow;
- сильный README с архитектурой, tradeoffs, командами и настоящими screenshots;
- воспроизводимый clean-clone setup для внешнего reviewer.

## 1. Обязательные пользовательские данные и необратимые решения

Начни с read-only preflight:

- `npx wrangler whoami`;
- `npx wrangler pages project list`;
- `npx wrangler d1 list`;
- проверка Git/GitHub authentication без создания ресурсов;
- проверка существующего remote/repository URL;
- проверка доступности желаемых names.

Не показывай access tokens, account IDs, cookies или другие credentials в ответе,
логах и tracked files.

Если Cloudflare не авторизован, попроси пользователя выполнить/разрешить
интерактивный `npx wrangler login`. Не пытайся обходить login и не проси прислать
API token в чат.

Если GitHub repository отсутствует, запроси у пользователя:

- GitHub account/organization;
- подтверждение имени repository (рекомендация: `pulseops`);
- подтверждение public visibility;
- разрешение создать repository и push initial branch.

Не выдумывай repository URL и не создавай repository в случайном аккаунте.

### Deployment mode checkpoint

До создания Pages project объясни пользователю коротко и попроси подтвердить один
режим:

1. **Git integration — рекомендуется для портфолио:** публичный repository
   является источником automatic builds/deployments;
2. **Wrangler Direct Upload:** agent выполняет controlled local build + upload,
   но созданный Direct Upload project нельзя позднее переключить на Git
   integration без нового Pages project.

Не создавай Pages project до ответа. Это обязательный checkpoint, потому что
выбор трудно отменить. Не создавай платные продукты, custom domain, analytics,
R2/KV/Queues или иные Cloudflare resources.

Если имя `pulseops` занято в аккаунте, предложи короткое профессиональное имя,
например `pulseops-demo`, и получи подтверждение до создания.

## 2. Repository release

Подготовь публичный repository как профессиональный source handoff:

- убедись, что `.gitignore` исключает `.env*` secrets, `.dev.vars`, `.wrangler/`,
  `dist/`, Playwright reports/results, logs и editor artifacts;
- проверь staged content на secrets и generated local state;
- не коммить Cloudflare credentials/account secrets;
- не коммить browser binaries, local D1, build output и test reports;
- сохрани planning/status/prompt documents, если пользователь явно не просил
  исключить внутренние workflow docs;
- создай осмысленный initial/release commit только после проверки scope;
- переименуй primary branch в `main`, если это согласуется с новым repository;
- добавь подтверждённый remote и push;
- проверь repository URL через GitHub и отсутствие случайных private данных.

Используй connected GitHub tooling или `gh` только после подтверждения
account/repository/visibility. Не force-push и не переписывай чужую историю.
Если repository уже существует, сначала проверь его состояние и не перезаписывай.

Не добавляй license без явного выбора пользователя. Если license нужен для
публичного portfolio repository, предложи MIT, но не считай отсутствие license
техническим blocker deployment.

## 3. Production D1 configuration

Создай ровно одну production D1 database после Cloudflare preflight и
подтверждения пользователя. Рекомендуемое имя: `pulseops-production`.

Порядок:

1. убедись, что database с таким именем ещё не существует;
2. выполни актуальную команду `wrangler d1 create`;
3. сохрани полученный database ID только там, где требует tracked Wrangler config;
4. сохрани binding name строго `DB`;
5. настрой `database_name`, real `database_id`, `migrations_dir` и актуальный
   `preview_database_id`, чтобы local Pages/D1 commands продолжили работать с
   изолированной local database;
6. удали all-zero placeholder и устаревший Stage 11 comment;
7. проверь config Wrangler schema/type generation;
8. обнови local npm scripts только если фактическая новая config требует этого.

Не ломай `npm run db:reset:local`, `npm run test:api` и `npm run dev:pages`.
Локальные команды обязаны сохранять `--local` и не касаться production D1.

### Remote migrations и seed

- перед mutation выполни read-only `d1 info`/migration list;
- применяй checked-in Drizzle migration только к точной production database с
  явным `--remote`;
- seed выполняй только после подтверждения, что создана новая пустая PulseOps DB;
- перед выполнением прочитай `server/db/seed.sql` полностью и проверь точные
  destructive statements/targets;
- не запускай reset/seed повторно на непустой production DB без отдельного
  подтверждения;
- после seed выполни read-only count/integrity queries по всем PulseOps tables;
- ожидаемую baseline cardinality бери из фактического Stage 9 seed/status;
- не печатай полные пользовательские notes или чувствительные данные в логах.

Добавь явные scripts для remote migration/seed только если они не создают риск
случайного production reset. Предпочти документированные команды с заметным
`--remote` и точным database name. Не добавляй `db:reset:production`.

## 4. Production build configuration

Настрой настоящий repository URL для production build:

- `VITE_REPOSITORY_URL` должен указывать на подтверждённый public repository;
- это public build-time value, не secret;
- для Git integration настрой его как Pages build variable;
- для Direct Upload передай его воспроизводимым документированным способом;
- не добавляй cross-platform dependency ради одной env variable без необходимости;
- `.env.example` должен показывать формат, но не содержать credentials.

Проверь `index.html` и public metadata:

- понятные title и meta description;
- корректный viewport/theme color;
- social metadata только если значения и preview image реальны;
- favicon/app icon без template branding;
- никакого localhost, example.com или placeholder URL в production output.

Не добавляй analytics/tracking. Не генерируй fake Open Graph preview, если нет
реального проверенного asset/URL.

## 5. Cloudflare Pages deployment

Создай ровно один Pages project в подтверждённом режиме.

Общие требования:

- project name совпадает с подтверждённым именем;
- production branch — `main`;
- build command — `npm run build`;
- build output — `dist`;
- Pages Functions из `functions/` включены;
- Wrangler config является source of truth, если выбран соответствующий workflow;
- production binding `DB` указывает на созданную D1 database;
- никаких secrets в config;
- не создавай preview/staging database без отдельной необходимости и согласия;
- не подключай custom domain без явного запроса пользователя.

### Если выбран Git integration

- создай Pages project через подтверждённый GitHub repository/dashboard flow;
- зафиксируй build command/output и production env variable;
- проверь, что config/binding в dashboard и `wrangler.jsonc` не конфликтуют;
- дождись production build и используй его logs при ошибке;
- не создавай параллельно Direct Upload project.

### Если выбран Direct Upload

- сначала выполни production build с настоящим `VITE_REPOSITORY_URL`;
- создай project официальным Wrangler Pages command;
- deploy выполняй Wrangler из repository root, чтобы `functions/` был загружен;
- зафиксируй deployment URL/ID и проверь отсутствие лишнего preview project;
- не обещай automatic Git deployments в README.

Remote commands должны быть точными и минимальными. Не повторяй resource creation
после ambiguous timeout: сначала read-only проверь, был ли resource создан.

## 6. Production verification

После deploy проверь live URL как внешний reviewer, а не только статус команды.

Обязательно:

- `GET <live-url>/api/health` возвращает ожидаемый validated JSON и HTTP 200;
- Landing доступен по HTTPS;
- direct navigation и reload работают для `/app/overview`, `/app/incidents`,
  incident details, services/details и 404;
- production использует real API/D1, а не MSW;
- seeded counts/data видны через API/UI;
- console содержит 0 errors/warnings;
- failed network requests отсутствуют;
- mobile 360 px и desktop 1440 px не имеют overflow;
- source links ведут на настоящий repository;
- route lazy loading остаётся рабочим;
- axe smoke не показывает serious/critical violations.

Полный production demo scenario:

1. открыть Overview;
2. запустить deterministic simulation;
3. увидеть Payments API degradation и generated incident;
4. открыть incident;
5. назначить owner/изменить status/добавить note в client-only simulation;
6. перейти через monitoring/resolved;
7. подтвердить Overview recovery;
8. reset demo и убедиться, что D1 baseline не изменён.

Не добавляй тестовую note в production D1 только ради verification: текущий API не
имеет delete-note endpoint. Для проверки real write persistence используй
status/owner mutation с предварительно записанным baseline и обязательным
восстановлением исходного значения, либо не выполняй mutation, если simulation +
Stage 9 integration уже достаточно доказывают main flow. Любую production data
mutation явно перечисли в финальном отчёте.

Проверь remote D1 read-only counts после demo, чтобы simulation не записалась.

## 7. Portfolio screenshots

Создай настоящие screenshots из финального production build/live deployment.
Используй Playwright или in-app browser; не рисуй фиктивный интерфейс и не
генерируй его image model.

Минимальный набор в `docs/assets/`:

- public Landing desktop;
- Overview в выразительном degraded state desktop;
- Incident details/workflow desktop;
- один mobile 360 px screen.

Требования:

- deterministic state и одинаковые seed/simulation values;
- отсутствие browser chrome, курсора, tooltips и focus artifacts, если они не
  нужны для демонстрации;
- PNG/WebP разумного размера, без огромных несжатых файлов;
- понятные kebab-case filenames и полезный alt text в README;
- никакой личной информации, Cloudflare dashboard, токенов или account IDs;
- screenshot не должен противоречить live UI.

Короткий GIF/видео опционален. Не добавляй тяжёлый media asset, если 3–4
screenshots уже ясно рассказывают сценарий.

## 8. Финальный README

Перепиши README как документ для recruiter/reviewer, сохранив точные operational
инструкции. README должен быть содержательным, но не превращаться в журнал stages.

Рекомендуемая структура:

1. название, короткий product pitch;
2. заметные ссылки **Live demo** и **Source**;
3. hero screenshot;
4. что практически делает пользователь;
5. короткий Detect → Investigate → Resolve demo flow;
6. ключевые возможности;
7. architecture diagram/data flow;
8. state ownership и почему Redux Toolkit + RTK Query;
9. MSW ↔ Pages Functions/Hono/Drizzle/D1 contract parity;
10. почему simulation client-only;
11. accessibility, responsive, performance и test evidence;
12. local setup из clean clone;
13. полный список commands;
14. production/deployment overview без credentials;
15. tradeoffs и честные ограничения.

README обязательно объясняет:

- какую практическую задачу решает PulseOps;
- почему Redux нужен для simulation/cross-page UI, но server state остаётся RTK
  Query, а формы — local state;
- почему MSW использует тот же Zod-validated contract, что real API;
- почему backend намеренно мал и почему нет auth/WebSockets;
- какие writes персистентны, а какие simulation-only;
- как запустить проект через `npm ci`;
- как запустить local MSW mode, local Pages+D1 mode и все test layers;
- как установить Chromium для Playwright;
- реальные test/a11y/bundle numbers из `PROJECT_STATUS.md`;
- live URL и repository URL;
- известные ограничения без оправданий и fake roadmap.

Не используй badges с неизвестным статусом, fake coverage percentage, fake users,
testimonials, production-scale claims или generic AI copy. Не оставляй ссылки на
локальные абсолютные пути.

Добавь компактную Mermaid architecture diagram только если GitHub preview
проверен и диаграмма действительно упрощает понимание. Иначе используй простой
text diagram.

## 9. Clean-clone verification

Проверь repository так, как его получит reviewer:

- создай отдельную безопасную временную папку вне рабочего repository;
- клонируй public repository по опубликованному URL;
- проверь отсутствие локальных untracked dependencies/config assumptions;
- выполни `npm ci`;
- выполни documented local smoke/build commands;
- как минимум запусти typecheck, lint, format check, unit/component tests и build;
- установи/запусти Playwright Chromium и E2E, если среда/время позволяют; для
  Stage 11 exit criteria это обязательно, если не доказано тем же commit в
  основном workspace;
- проверь MSW development startup;
- для local D1 выполни documented migration/seed/Pages smoke path;
- удали временный clone после проверки только убедившись в точном безопасном path,
  либо оставь путь в отчёте, если удаление не разрешено.

Clean-clone verification не должна использовать untracked `.env`, local D1 state
или глобальные unpublished files из исходного workspace.

## 10. Полный verification pipeline

Перед финальным release/deploy commit выполни:

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

Дополнительно:

- `npm run types:cloudflare` после финального D1 config;
- Wrangler config validation/read-only project info;
- remote migration list и read-only table counts;
- production health/API/UI/demo verification;
- clean-clone verification;
- link check для README live/repository/assets links;
- проверка, что test/local server ports и процессы закрыты.

Не скрывай skipped tests и не называй ручную проверку automated. Если remote
verification временно недоступна, Stage 11 остаётся `in_progress` или `blocked`.

## 11. Ограничения

Запрещено:

- добавлять auth, roles, organizations, billing, WebSockets/SSE, email, AI,
  second theme, i18n, admin panel или новую product feature;
- переходить с Pages Functions на Workers;
- создавать больше одного production D1/Pages project без явного согласия;
- создавать платные Cloudflare resources;
- подключать custom domain, analytics или third-party tracking без запроса;
- коммитить credentials, `.env`, `.dev.vars`, `.wrangler`, D1 state или tokens;
- выполнять production reset/reseed после появления данных без подтверждения;
- использовать force push/reset или переписывать чужую Git history;
- выдумывать repository/live URL;
- отмечать Stage 11 завершённой, пока production URL или clean clone не проверены.

## Exit criteria

Stage 11 завершена только если одновременно выполнено:

- public repository доступен по настоящему URL;
- repository не содержит secrets/generated local state;
- production D1 создана, migration и deterministic seed применены;
- production binding `DB` настроен, local D1 workflow не сломан;
- Cloudflare Pages production URL доступен по HTTPS;
- `/api/health` возвращает HTTP 200;
- production UI использует real API/D1, а не MSW;
- complete demo scenario работает в production;
- direct route navigation/reload работает;
- production console/network/a11y/mobile/desktop checks пройдены;
- source links и live links корректны;
- README объясняет продукт, архитектуру, Redux/RTK Query/MSW/D1 decisions,
  tradeoffs, local/test/deployment workflow;
- реальные screenshots добавлены и отображаются в GitHub README;
- reviewer может выполнить setup из clean clone;
- полный local verification pipeline проходит;
- remote resource IDs/URLs зафиксированы без публикации credentials;
- нет лишних Pages/D1 resources, оставшихся после неудачных попыток.

## Завершение проекта и status protocol

В конце обнови `PROJECT_STATUS.md`:

1. `Overall status: complete`;
2. `Active stage: none — portfolio release complete`;
3. `Active prompt: none`;
4. `Last completed stage: 11 — Deployment and portfolio handoff`;
5. Stage 11 = `complete` только после всех exit criteria;
6. в completion evidence укажи live URL, repository URL, production project/D1
   names без secrets, migration/seed evidence, production verification, media,
   clean clone и точные test results;
7. `Blockers: none` только если их действительно нет;
8. `Next action`: portfolio release complete; optional future work requires a
   separately approved scope;
9. обнови Latest verified checks, implementation summary, risks и stage history;
10. не создавай Stage 12.

В `DEVELOPMENT_PLAN.md` decision log добавь только решения, важные для итоговой
архитектуры/handoff: выбранный Pages deployment mode и production/local D1
configuration boundary.

Если deployment, repository, production verification или clean clone не
завершены, оставь Stage 11 `in_progress`/`blocked`, зафиксируй точный blocker и не
объявляй portfolio release готовым.

Финальный ответ должен кратко перечислить:

- live demo URL;
- repository URL;
- созданные Cloudflare resources;
- выбранный deployment mode;
- production verification;
- README/screenshots;
- clean-clone result;
- все выполненные проверки;
- любые оставшиеся риски или стоимость/ручные настройки.

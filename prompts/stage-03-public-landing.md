# Prompt — Stage 3: Public presentation page

Продолжи разработку PulseOps в текущей рабочей папке.

Это отдельный чат только для **Stage 3 — Public presentation page**.
Не начинай Stage 4, даже если останется время.

## Обязательный контекст

Перед любыми изменениями полностью прочитай:

1. `AGENTS.md`;
2. `PRODUCT.md`;
3. `DEVELOPMENT_PLAN.md`;
4. `PROJECT_STATUS.md`;
5. этот prompt.

После чтения:

- проверь, что Stage 2 отмечен как `complete`;
- проверь `git status` и сохрани всю существующую работу;
- изучи текущий `LandingPage`, глобальные токены, Button, Router и тесты;
- подтверди, что активная стадия в `PROJECT_STATUS.md` совпадает с этим prompt.

## Проверенное исходное состояние

- Stage 0–2 завершены;
- public route `/` существует вне AppShell, но пока содержит placeholder;
- `/app/overview` открывает рабочее приложение с MSW data layer;
- дизайн-токены, Button и доступные primitives уже реализованы;
- RTK Query/MSW/Zod data layer содержит 4 services и 6 incidents;
- 51 тест проходит;
- финальный Overview, симуляция, incident workflow и backend ещё не готовы;
- GitHub remote и настоящий repository URL пока не настроены.

Не обновляй зависимости без необходимости и не меняй архитектуру data layer.

## Цель стадии

Превратить `/` в честную презентационную страницу портфолио, которая за первые
30 секунд отвечает на четыре вопроса:

1. Что такое PulseOps?
2. Что посетитель сможет сделать в демо?
3. Какая практическая и инженерная ценность проекта?
4. Куда нажать, чтобы открыть приложение?

Страница должна ощущаться как часть одного продукта с AppShell, но иметь более
свободную editorial-композицию. Это не SaaS-маркетинг и не вымышленный стартап.

## Основное позиционирование

Используй английский язык интерфейса, согласованный с приложением.

Основная формулировка:

```text
Interactive incident-response simulator

See an incident unfold.
Resolve it before users notice.

PulseOps lets you trigger a simulated service failure, investigate validated
telemetry, coordinate the response, and restore the system.
```

Обязательное честное пояснение:

```text
PulseOps uses deterministic simulated telemetry. It is a portfolio project
designed to demonstrate production-style frontend architecture and
incident-management workflows.
```

Можно отредактировать текст ради ритма и адаптивности, но нельзя:

- изображать PulseOps реальным production monitoring provider;
- обещать real-time monitoring внешних систем;
- придумывать клиентов, отзывы, количество пользователей или бизнес-метрики;
- использовать расплывчатые AI/innovation claims.

## 1. Структура страницы

Реализуй в указанном порядке.

### Header

- компактный бренд PulseOps;
- anchor links только к реально существующим секциям: `How it works` и
  `Engineering`;
- primary action `Open demo`, ведущий на `/app/overview`;
- responsive navigation без отдельного hamburger menu, если ссылки помещаются
  через перенос/упрощение;
- не копируй AppShell sidebar на public page.

### Hero

- eyebrow `Interactive incident-response simulator`;
- выразительный `<h1>` из позиционирования выше;
- короткое описание;
- primary CTA `Open interactive demo` → `/app/overview`;
- secondary source action только при наличии реального repository URL;
- строка доверия: `No account required · Deterministic demo · About 3 minutes`;
- небольшой визуальный preview интерфейса рядом или ниже hero.

Не называй CTA `Start simulation` до Stage 5: сейчас нажатие только открывает
Overview. На Stage 5 текст можно будет заменить.

### Product preview

Создай restrained presentational preview, а не второй dashboard:

- подпись `Simulated scenario preview`;
- overall status;
- 2–3 компактных значения, например latency, error rate и active incident;
- простой SVG/CSS trend line;
- один activity event;
- явная подпись `Preview data`, чтобы это не воспринималось как live API.

Preview:

- не делает запросов;
- не использует Recharts;
- не дублирует будущую архитектуру Overview;
- скрывает чисто декоративные части от screen readers;
- имеет доступное текстовое описание как `<figure>`.

### How it works

Покажи последовательность, а не набор одинаковых feature cards:

1. `Detect` — latency и error rate выходят за baseline.
2. `Investigate` — пользователь изучает affected service и timeline.
3. `Resolve` — назначает owner, документирует решение и восстанавливает сервис.

Используй семантический ordered list или timeline. Соедини шаги визуально на
desktop и сохрани естественный вертикальный поток на mobile.

### Demo honesty section

Коротко объясни:

- telemetry детерминирована и симулируется;
- incident actions используют настоящий типизированный API-контракт;
- MSW позже заменяется Cloudflare API без переписывания page components;
- проект предназначен для демонстрации workflow и engineering decisions.

Не перегружай секцию техническими деталями.

### Engineering section

Покажи 3–4 конкретных решения:

- `Typed boundaries` — Zod validation перед попаданием response в UI;
- `Purposeful state` — RTK Query для server state, Redux slices только для
  cross-screen workflows;
- `Deterministic demo` — воспроизводимый сценарий и стабильные тесты;
- `Accessible by default` — keyboard, reduced motion, responsive UI.

Это должны быть компактные строки/пункты, а не четыре одинаковые сияющие карточки.

### Final CTA and footer

- повторный CTA `Open interactive demo`;
- короткая формулировка `Explore the system, trigger an incident, and follow it
through resolution.`;
- footer с `PulseOps`, `React + TypeScript` и текущим годом;
- source link выводится только при наличии настоящего URL.

## 2. Repository URL

Не придумывай GitHub username или repository URL.

Добавь опциональную переменную:

```text
VITE_REPOSITORY_URL=
```

Требования:

- валидируй/нормализуй её в небольшом `siteConfig`;
- если URL отсутствует, не рендери мёртвую кнопку `View source`;
- если URL присутствует, покажи `View source` как external link с понятным
  accessible name;
- обнови `.env.example` и README;
- отсутствие URL не является blocker для Stage 3, но фиксируется как известный
  риск для Stage 11.

## 3. React Bits

Используй React Bits дозированно.

Для Stage 3 разрешён максимум один текстовый/scroll-компонент. Предпочтение:
`Scroll Reveal` в короткой statement-секции.

Если используешь его:

- сначала проверь актуальную бесплатную страницу React Bits;
- возьми TypeScript + CSS вариант и скопируй исходник в
  `src/shared/ui/react-bits/ScrollReveal/`;
- установи только официально указанную минимальную dependency;
- адаптируй цвета и typography под существующие tokens;
- добавь комментарий с URL источника;
- обеспечь статичный читаемый fallback;
- полностью отключи декоративное движение при `prefers-reduced-motion`;
- не применяй эффект к основному `<h1>`, CTA или обязательному пояснению.

Если актуальный бесплатный компонент невозможно корректно получить или он
требует чрезмерной dependency, не имитируй его по памяти. Реализуй landing без
него и зафиксируй причину в `PROJECT_STATUS.md`. Это не блокирует Stage 3:
ключевой React Bits `Border Glow` всё равно относится к Stage 4.

Не добавляй shader, WebGL, cursor trail, parallax, smooth-scroll library или
несколько одновременных эффектов.

## 4. Файловая структура

Предпочтительно:

```text
src/pages/landing/
  LandingPage.tsx
  LandingPage.module.css
  components/
    SystemPreview.tsx
    ...
src/shared/config/
  siteConfig.ts
```

Не используй общий `Page.module.css` для сложной landing-композиции. Не ломай
его, потому что app placeholders всё ещё от него зависят.

Выноси компонент только при наличии отдельной ответственности. Не дроби каждую
строку на отдельный файл.

## 5. Accessibility и responsive

Обязательно:

- один `<h1>`;
- логичная heading hierarchy;
- semantic header/main/sections/footer;
- skip link к основному содержимому;
- visible focus;
- внутренние переходы через React Router Link;
- внешние ссылки безопасны и обозначены;
- decorative SVG имеет `aria-hidden`;
- meaningful figure имеет `figcaption` или accessible description;
- никакая информация не передаётся только цветом;
- `prefers-reduced-motion` сохраняет весь контент;
- 320–360 px не имеет horizontal overflow;
- anchor navigation не прячет заголовок секции;
- CTA не перекрываются и не обрезаются.

## 6. Тесты

Добавь/обнови тесты:

- `/` рендерится вне AppShell;
- hero имеет согласованный `<h1>`;
- присутствует честная формулировка о simulated telemetry;
- primary CTA ведёт на `/app/overview`;
- Detect, Investigate и Resolve присутствуют в правильном порядке;
- Engineering section содержит конкретные решения;
- repository link отсутствует при пустом config;
- repository link корректен при заданном config, если конфигурацию можно
  тестировать без хрупкого module mocking;
- landing page не инициирует API requests;
- существующие 51 тест и route behavior продолжают проходить;
- reduced-motion fallback тестируется, если добавлен React Bits component.

Не делай snapshot test всей страницы и не проверяй декоративные CSS-классы.

## 7. README

Обнови README только необходимым:

- убери слово `placeholder` у public route;
- добавь короткое описание landing page;
- задокументируй `VITE_REPOSITORY_URL`;
- не пиши финальный case study — это Stage 11.

## Не делай

- не реализуй Overview Stage 4;
- не добавляй Border Glow или KPI components приложения;
- не запускай incident simulation;
- не меняй Redux/API/MSW contracts без найденной ошибки;
- не подключай landing к RTK Query;
- не добавляй pricing, testimonials, FAQ, newsletter или contact form;
- не создавай blog/about/resume pages;
- не придумывай repository URL или имя автора;
- не добавляй изображения из случайных stock sources;
- не устанавливай Tailwind, UI-kit или тяжёлую animation stack;
- не настраивай backend/Cloudflare;
- не создавай commit, remote или pull request;
- не начинай Stage 4.

## Обязательная визуальная проверка

Запусти приложение и проверь:

- 360 px: hero, CTA, preview и timeline помещаются без overflow;
- 768 px: композиция сохраняет ясную иерархию;
- 1440 px: hero использует пространство, но строки не становятся чрезмерно
  длинными;
- keyboard Tab проходит через skip link, anchors и CTA логично;
- anchor links приводят к правильным секциям;
- `prefers-reduced-motion` сохраняет читаемый контент;
- `/app/overview` по-прежнему открывается и работает с MSW;
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

Stage 3 можно отметить `complete`, только если:

- посетитель понимает назначение проекта без знания DevOps;
- основной CTA открывает `/app/overview`;
- simulated telemetry обозначена явно;
- Detect → Investigate → Resolve читается как единый сценарий;
- инженерные решения описаны конкретно и без рекламных утверждений;
- layout проверен на 360/768/1440 px;
- клавиатура и reduced motion проверены;
- отсутствуют dead links и придуманные данные о проекте;
- обязательные команды проходят;
- browser console чиста.

## Завершение стадии

Перед финальным ответом обнови `PROJECT_STATUS.md` по разделу
`Required completion update`:

- Stage 3 отметь `complete` только после всех exit criteria;
- активной установи `4 — Overview screen`;
- `Active prompt` установи в `not_created`;
- запиши точные команды, количество тестов и browser verification;
- укажи, был ли использован React Bits и какая dependency добавлена;
- сохрани отсутствие repository URL как риск для Stage 11;
- обнови implementation summary и stage history.

Если принято решение, влияющее на следующие стадии, добавь его в Decision log
`DEVELOPMENT_PLAN.md`.

Не создавай prompt Stage 4 и не начинай его реализацию в этом чате.

В финальном ответе укажи:

- какие секции landing page созданы;
- использован ли React Bits и почему;
- результаты команд и количество тестов;
- результаты 360/768/1440, keyboard и reduced-motion проверки;
- оставшиеся риски;
- подтверждение, что Stage 4 не начинался.

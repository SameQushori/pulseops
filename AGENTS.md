# PulseOps — instructions for coding agents

This file applies to the entire repository.

## Required reading

Before changing code, read these files in order:

1. `PRODUCT.md` — product intent and visual direction.
2. `DEVELOPMENT_PLAN.md` — authoritative implementation plan and scope.
3. `PROJECT_STATUS.md` — authoritative record of completed work and the active stage.
4. The relevant source files and tests for the active stage.

Do not start a later stage while an earlier stage has unmet exit criteria.

## Scope rules

- Build only the PulseOps portfolio project described in `PRODUCT.md`.
- The active scope is the current stage marked in `PROJECT_STATUS.md`.
- Do not add authentication, roles, organizations, billing, WebSockets, email, AI features, a second theme, internationalization, or an admin panel unless the user explicitly changes the scope.
- Do not replace the agreed stack or introduce a new library when the same result is reasonably achievable with the current stack.
- If a decision would change product scope, architecture, deployment cost, or the primary visual direction, stop and ask the user.
- Prefer a small finished feature over a broad unfinished abstraction.

## Technical rules

- Use React, TypeScript strict mode, Redux Toolkit and RTK Query.
- Use local component state for local UI state; do not put every value in Redux.
- Keep server state in RTK Query. Redux slices are for cross-page UI state and the incident simulation workflow.
- Validate API responses with Zod at the transport boundary.
- Use feature-oriented folders defined in `DEVELOPMENT_PLAN.md`.
- Keep domain types free of React and presentation concerns.
- Avoid `any`, non-null assertions, giant components, barrel files with circular dependencies, and speculative abstractions.
- Do not suppress TypeScript, ESLint, accessibility, or test errors to make checks pass.
- React Bits components must be copied into the repository and adapted. Do not reproduce the entire React Bits visual language.

## UI rules

- Match the approved dark operations-console direction.
- Use `Border Glow` selectively for interactive KPI cards and important incident states.
- Do not animate every surface. One dominant animated effect per screen is the maximum.
- All motion must respect `prefers-reduced-motion`.
- Every action must work with a keyboard and have a visible focus state.
- Build mobile layouts alongside desktop layouts; do not postpone responsiveness.
- Every data-driven view must include loading, empty and error states.
- Never use placeholder gradients, excessive pills, glassmorphism everywhere, fake testimonials, generic AI copy, or decorative dashboards without useful interactions.

## Backend rules

- Keep the backend intentionally small: Cloudflare Pages Functions, Hono, D1 and Drizzle.
- No authentication in the portfolio release.
- Live metrics are simulated on the client. Do not add WebSocket or SSE infrastructure.
- MSW and the real API must implement the same documented contract.
- Database writes are limited to incident status/owner updates and incident notes unless the plan is explicitly revised.

## Work protocol

At the start of a coding turn:

1. Read `PRODUCT.md`, `DEVELOPMENT_PLAN.md` and `PROJECT_STATUS.md`.
2. Inspect the current repository and uncommitted changes.
3. Confirm that the prompt matches the active stage in `PROJECT_STATUS.md`.
4. State the exact stage and task being executed.
5. Do not edit unrelated files.

Before declaring a task complete:

1. Run the checks required by that task.
2. Verify the changed UI at desktop and mobile sizes when applicable.
3. Update `PROJECT_STATUS.md` using its completion protocol.
4. Update the decision log in `DEVELOPMENT_PLAN.md` only when a decision affects later work.
5. Report completed behavior, checks run, and any remaining risk.

Never mark a stage complete when one of its exit criteria is unverified. Never begin
the next stage in the same chat. Each stage is executed in a fresh chat with a new
stage-specific prompt.

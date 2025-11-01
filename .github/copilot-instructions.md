## Purpose
Quick, actionable guidance for AI coding agents working on this repo (CourseAI). Focus on where to make changes, important patterns, and the exact commands developers run locally and in CI.

## Big-picture architecture (what to know first)
- This is a Next.js 16+ app using the `app/` directory (server & client components). See `app/layout.tsx` for the global layout and providers.
- Server-side logic and auth: `lib/server-auth.ts`, `middlewares/` and `middleware.ts` implement routing decisions and site-wide behavior (see `config/routes` & `middlewares/core/unified-middleware`).
- State & Providers: global stores and Providers live under `store/` and are wired in `app/layout.tsx` (e.g. `Providers`, `ClientGuestProvider`).
- AI features: embeddings and model integration live in `scripts/` (e.g. `scripts/generate-embeddings.ts`, `scripts/test-ai-providers.ts`) and provider wrappers under `lib/` or `services/` (look for `@langchain`, `@ai-sdk/openai` usages).

## Where to edit / key files
- UI components: `components/` (client components). Prefer adding tests under `__tests__/components`.
- Pages & layouts: `app/` (server-first). `app/layout.tsx` is the global entry point.
- API: `app/api/` and `pages/api/` (if present). Middleware logic: `middleware.ts` and `middlewares/*`.
- Configuration / bundling: `next.config.mjs` (turbopack hints, serverExternalPackages, modularizeImports).
- Database & migrations: `prisma/` and scripts triggered by `npm run dev:migrate` / `npm run prod:migrate`.

## Developer workflows & exact commands
- Install: `npm install` (repo uses `pnpm` in package metadata but npm works). Node 20.x required (see `package.json`).
- Dev server (fast, with Turbopack): `npm run dev` (this runs `next dev --turbo`).
- Build: `npm run build` then `npm run start` (production). Full prod: `npm run prod`.
- Migrations: `npm run dev:migrate` (development) and `npm run prod:migrate` (production).
- Tests: `npm run test` (vitest), `npm run test:watch`, `npm run test:coverage`.
- Lint: `npm run lint` and fast lint: `npm run lint:fast` (eslint cache). The repo also provides VS Code tasks for lint fast.
- AI tasks: `npm run generate-embeddings`, `npm run test:providers`.

## Project-specific conventions & patterns
- Use `app/` server components by default for pages; mark client-only code with `'use client'` and place client providers under `components/` and `store/`.
- Path alias: `@` points to repository root (see `tsconfig.json` and `vitest.config.ts`). Use `@/lib`, `@/components`, `@/store` in imports.
- Feature flags and unified middleware control runtime behavior; check `lib/featureFlags` before changing middleware logic.
- Next.js config silences TS build-time errors (`typescript.ignoreBuildErrors = true`) — do not rely on `next build` to catch type errors. Run type checking separately in CI (there is no explicit `type-check` script; add one if needed).

## Integration points & gotchas
- AI providers: multi-provider support exists. Look at env variables in `README.md` (AI_PROVIDER_TYPE, model env vars). Changing provider wiring often involves `lib/` and `services/` modules.
- Prisma: `postinstall` runs `prisma generate`; ensure `DATABASE_URL` and pgvector (if used) are available for migration scripts.
- Turbopack & serverExternalPackages: `next.config.mjs` excludes packages like `youtubei.js` and some `@langchain` packages from server bundling. When adding heavy server libs, add them to `serverExternalPackages` to avoid build issues.
- Images & CDN: `next.config.mjs` configures remote image patterns and cache headers — update when adding external image sources.

## Suggested small tasks for contributors / AI edits
- To add a new AI provider: update `lib/ai/*` (or `services/ai`), add env vars to `.env.example`, and add quick smoke test under `__tests__/` and `scripts/test-ai-providers.ts`.
- To add an API endpoint: add `app/api/<name>/route.ts` (or `pages/api`) and update middleware routing if it needs to be excluded.

## Where tests & QA live
- Unit & integration tests: `__tests__/` and `app/__tests__` (Vitest + jsdom). Vitest aliases `@` (see `vitest.config.ts`).
- CI quality gates are wired via `scripts` like `quality`, `quality:ci`, `test:quality`. Use `npm run test:quality` locally to reproduce CI checks.

## Quick troubleshooting tips
- If builds fail due to bundling native modules (sharp, youtubei): check `next.config.mjs.serverExternalPackages` and add the package.
- If type errors slip into production builds, add a `type-check` script (e.g. `tsc --noEmit`) and run it in CI; don't expect `next build` to fail due to ts errors because the project ignores them by design.
- When debugging runtime auth/session issues, inspect `getServerAuthSession` usage in `lib/server-auth` and the `Providers` wiring in `app/layout.tsx`.

## Final note
Keep instructions short and specific. If anything in this file seems incorrect or missing, tell me which area (scripts, AI providers, middleware, or tests) and I will refine the instructions.

# EaZi Platform — Build Instructions

You are building the **EaZi Platform**, an on-demand services marketplace for South Africa. Read `@eazi-project-spec.json` — it is the single source of truth for this entire project.

## Critical Rules — NEVER BREAK THESE

- **NEVER** output partial files. Every file must be complete, compilable, and runnable.
- **NEVER** use `// TODO`, `// implement later`, placeholder functions, or mock data that should be real.
- **ALWAYS** handle errors, loading states, and edge cases in every screen and service.
- **ALWAYS** include TypeScript types. No `any`. No untyped variables.
- **ALWAYS** use the six design patterns from the spec (Repository, Strategy, State Machine, Observer, Factory, Facade). These are mandatory, not suggestions.
- All Supabase data access goes through Repository classes. Components never call `supabase.from()` directly.
- All booking status changes go through `BookingStateMachine`. Never update booking status directly.
- All payments go through `PaymentService` which selects the right `IPaymentStrategy`. Never inline payment logic.

## Error Documentation — MANDATORY

Every error encountered during development **must** be recorded in `eazi-claude-code/ErrorDocumentation.md` before moving on. This includes build errors, migration failures, runtime crashes, TypeScript errors, and test failures.

Each entry must follow this format:

```
## Error NNN — <short title>

**Date:** YYYY-MM-DD
**File:** path/to/file
**Command:** command that triggered the error

### Error Output
<exact error message>

### Root Cause
<explanation of why the error occurred>

### Fix Applied
<what was changed and why it resolves the error>
```

Rules:
- Number errors sequentially (001, 002, …).
- Record the error **before** applying the fix, then document the fix after.
- Never skip an error entry, even for trivial or quickly-resolved errors.
- If the same error recurs, add a new entry referencing the original.

## Vercel Deployment — MANDATORY

The app is deployed as an Expo Web app on Vercel. Every phase must be launchable in a browser.

**Vercel project settings (set once in the Vercel dashboard):**
- Framework Preset: `Other`
- Build Command: `npx expo export --platform web`
- Output Directory: `dist`
- Install Command: `npm install`
- Root Directory: `eazi-claude-code/eazi-app`

**Local web commands:**
```bash
npm run build:web   # builds to dist/
npm run preview:web # serves dist/ locally on http://localhost:3000
```

**Deployment flow:** Push to `main` → Vercel auto-deploys → confirm live URL renders.

### Web Compatibility Rules

- Any library that is native-only (e.g., `react-native-maps`, `expo-notifications`) **must** have a web fallback or be conditionally excluded using `Platform.OS === 'web'` checks.
- Never import a native-only module at the top level of a screen that renders on web without guarding it.
- Test the web build locally (`npm run build:web`) before every commit that touches navigation, screens, or native modules.

## Build Order — Follow Phases Sequentially

The spec defines 16 phases (0–15). Build them **in order**. After each phase:
1. Run `npx expo start` and confirm zero errors.
2. Run `npm run build:web` and confirm the web export succeeds with zero errors.
3. Push to `main` — Vercel auto-deploys on every push to `main`.
4. Confirm the Vercel deployment is live and the app renders in a browser.
5. Summarize what was built (files created, features added).
6. Only then proceed to the next phase.

Do NOT attempt to build multiple phases simultaneously.

Every phase gate requires **both** the Expo dev server and the Vercel web build to pass.

## Code Style

- ES modules only (`import/export`), never CommonJS.
- Path alias: `@/` maps to `./src/`.
- Functional components with hooks. No class components.
- `React.memo` for all list item components.
- Zustand selectors for store access, not full subscriptions.
- NativeWind (Tailwind) for all styling. No inline `style={}` objects unless truly dynamic.
- Lucide icons for all iconography.
- date-fns for all date formatting.
- FlashList for any list longer than 20 items.

## File Naming

- Components/Screens: `PascalCase.tsx`
- Services/Hooks/Stores: `camelCase.ts`
- Repositories: `PascalCase.repository.ts` (e.g., `booking.repository.ts`)

## When Creating Files

- Check the `file_structure` section in the spec for exact file paths.
- Check the `screens` section for exact UI requirements per screen.
- Check the `design_system` section for colors, typography, spacing, and component tokens.
- Check the `database` section for table schemas and RLS policies.
- Check the `edge_functions` section for serverless function specifications.

## Testing

- BookingStateMachine must have 100% test coverage (all valid and invalid transitions).
- PaymentService strategy selection must be tested.
- All repositories must have basic CRUD tests.

## Commit Strategy

Commit after **every meaningful change** — not just phases. Keep commits atomic: one logical change per commit.

### Prefixes

| Prefix | When to use | Example |
|---|---|---|
| `feat` | New screen, feature, or capability | `feat(phase-5): booking flow — BookingScreen, BookingRepository, BookingStateMachine` |
| `fix` | Bug fix, crash, incorrect behaviour | `fix(auth): resolve provider UI flash by fetching profile before setting auth state` |
| `chore` | Dependency changes, config, tooling, gitignore | `chore(deps): add react-dom and react-native-web` |
| `docs` | CLAUDE.md, README, ErrorDocumentation, comments | `docs(claude): add error documentation rules and commit strategy` |
| `refactor` | Code restructure with no behaviour change | `refactor(service-repository): replace PostgREST join with manual attachProviders` |
| `style` | NativeWind / design-system changes only | `style(home): adjust card spacing to match design spec` |
| `test` | Adding or fixing tests | `test(booking-state-machine): add invalid transition coverage` |
| `db` | Migration files, RLS policies, functions | `db(migration): fix function ordering — move table-dependent functions after CREATE TABLE` |
| `perf` | Performance improvement | `perf(flashlist): switch ServiceList from FlatList to FlashList` |

### Rules

- **Always** use a scope in parentheses: `fix(auth)`, `feat(phase-5)`, `db(migration)`.
- Phase commits use `feat(phase-N)` and list every file created.
- Bug fixes and refactors between phases use the specific scope of what changed.
- Dependency additions/removals always use `chore(deps)`.
- Every error fix documented in `ErrorDocumentation.md` must have a matching `fix(...)` or `db(...)` commit.
- Never bundle unrelated changes into one commit.

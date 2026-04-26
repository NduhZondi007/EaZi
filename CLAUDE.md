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

## Build Order — Follow Phases Sequentially

The spec defines 16 phases (0–15). Build them **in order**. After each phase:
1. Run `npx expo start` and confirm zero errors.
2. Summarize what was built (files created, features added).
3. Only then proceed to the next phase.

Do NOT attempt to build multiple phases simultaneously.

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

- Commit after completing each phase with message: `feat(phase-N): description`
- Keep commits atomic — one phase per commit.

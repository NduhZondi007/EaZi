Initialize the EaZi Platform project from scratch.

Read `eazi-project-spec.json` and execute Phase 0 (Project Initialization):

1. Create the Expo project: `npx create-expo-app@latest eazi-app --template blank-typescript`
2. `cd eazi-app`
3. Install ALL dependencies listed in the `dependencies` section of the spec — group by category and install in order: core, navigation, state_forms, ui, maps_location, media, notifications, utilities
4. Configure TypeScript (`tsconfig.json`) with strict mode and `@/` path alias mapping to `./src/`
5. Configure NativeWind/Tailwind (`tailwind.config.js`) with the design system colors from the spec
6. Create `.env` with placeholder values for all `environment_variables` from the spec
7. Create the complete `src/` directory structure matching `file_structure` in the spec (directories only, no files yet)
8. Copy `eazi-project-spec.json` into the project root
9. Copy `CLAUDE.md` into the project root
10. Copy `.claude/` directory into the project
11. Run `npx expo start` and verify zero errors
12. Initialize git: `git init && git add . && git commit -m "feat(phase-0): project initialization"`
13. Report: list all directories created and confirm the build compiles

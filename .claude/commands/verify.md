Verify the current state of the EaZi Platform build.

1. Run `npx expo start` — report any compile errors
2. Run `npx tsc --noEmit` — report any TypeScript errors
3. Check which phases have been completed by examining existing files against `eazi-project-spec.json` → `file_structure`
4. For each completed phase, verify:
   - All expected files exist
   - No files contain `// TODO` or `// implement later`
   - No TypeScript `any` types (grep for `: any`)
5. Report:
   - Phases completed: [list]
   - Phases remaining: [list]
   - Errors found: [list or "none"]
   - Files with issues: [list or "none"]
6. Recommend the next phase to build

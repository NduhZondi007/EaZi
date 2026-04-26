Build phase $ARGUMENTS of the EaZi Platform.

Read `eazi-project-spec.json` and find the phase matching this number in `build_phases`.

Follow these steps:
1. Read the phase tasks from the spec
2. For each task, check the relevant sections of the spec (screens, database, design_patterns, etc.)
3. Create every file needed for this phase — complete, typed, no placeholders
4. After all files are created, run `npx expo start` to verify zero compile errors
5. If there are errors, fix them before proceeding
6. Summarize: list every file created and every feature added
7. Commit with message `feat(phase-$ARGUMENTS): <summary>`

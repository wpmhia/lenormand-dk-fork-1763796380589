# AGENTS.md

## Verification workflow: incremental by default

Do **not** treat every edit as a release candidate. Match the verification to the size of the change.

### During development

| Change | What to run |
| --- | --- |
| Comment, copy, or trivial text | Nothing, or the one relevant test file |
| Small logic change | The one relevant test file: `bun x vitest run lib/__tests__/<file>.test.ts` |
| Structural TypeScript change | Targeted tests + `bun run tsc --noEmit` |
| Cross-cutting refactor | Full suite: `bun run test -- --run` |

### Playwright policy

- **Do not run the full E2E suite after routine edits.** It covers multiple desktop and mobile projects and is reserved for release/merge CI or an explicit user request.
- For a UI change, run the focused smoke set: `bun run test:e2e:smoke` (Chromium only, `@smoke` tests, one worker).
- For a critical flow, run only the affected test by title/file, e.g. `bun run test:e2e -- --project=chromium --grep "virtual-deck draw flow"`.
- Per-test timeout is 30 seconds; local E2E has a 5-minute global timeout and no retries. CI allows at most one retry and retains the full desktop/mobile E2E suite.
- Reuse an existing development server when available. Do not rebuild or rerun the full suite repeatedly after a failure; inspect the failed test and report its relevant error first.

### At the end of a coherent change set

Run these once — not after each step:

```bash
bun run test -- --run       # full Vitest suite
bun run lint                # lint
bun run tsc --noEmit        # typecheck
bun run build               # production build (warm)
```

### Do not

- **Do not** run the full suite or a production build after each small change. It is safe but wasteful.
- **Do not** run `rm -rf .next && npx next build` as a routine finish. A cold build throws away the Next.js cache and forces a full recompile.
- **Only** clear `.next` when there is actual evidence of a stale cache — for example, a `PageNotFoundError: Cannot find module for page: ...` on a route that exists on disk, or a build referring to files that were already deleted.

### Rationale

The repo is small enough that targeted tests plus one final full pass gives the same safety as verifying after every micro-step, without the repeated waiting. `.next` is a build cache, not a correctness signal — rebuilding it proves nothing about the code that a warm build does not.

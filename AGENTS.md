# AGENTS.md

## Verification workflow: incremental by default

Do **not** treat every edit as a release candidate. Match the verification to the size of the change.

### During development

| Change | What to run |
| --- | --- |
| Comment, copy, or trivial text | Nothing, or the one relevant test file |
| Small logic change | The one relevant test file: `npx vitest run lib/__tests__/<file>.test.ts` |
| Structural TypeScript change | Targeted tests + `npx tsc -p tsconfig.test.json --noEmit` |
| Cross-cutting refactor | Full suite: `npx vitest run` |

### At the end of a coherent change set

Run these once — not after each step:

```bash
npx vitest run          # full suite
npx next lint           # lint
npx tsc -p tsconfig.test.json --noEmit   # typecheck
npx next build          # production build (warm)
```

### Do not

- **Do not** run the full suite or a production build after each small change. It is safe but wasteful.
- **Do not** run `rm -rf .next && npx next build` as a routine finish. A cold build throws away the Next.js cache and forces a full recompile.
- **Only** clear `.next` when there is actual evidence of a stale cache — for example, a `PageNotFoundError: Cannot find module for page: ...` on a route that exists on disk, or a build referring to files that were already deleted.

### Rationale

The repo is small enough that targeted tests plus one final full pass gives the same safety as verifying after every micro-step, without the repeated waiting. `.next` is a build cache, not a correctness signal — rebuilding it proves nothing about the code that a warm build does not.

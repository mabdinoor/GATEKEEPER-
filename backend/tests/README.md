# Backend tests

Run with:
```
npm test          # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

## Strategy

**No test in this suite touches a real Postgres database.** Both layers of
tests mock at the repository boundary (`repositories/*.js`) instead:

- **`tests/unit/services/`** — imports a service directly, mocks the
  repositories (and `mailer.js`) it depends on, and asserts on the real
  business logic: validation, plan-limit enforcement, error codes, what
  gets passed down to the (mocked) repository.

- **`tests/integration/`** — uses Supertest to drive the actual Express
  app (`app.js`) over HTTP, through real routing and middleware, down to
  the same mocked repositories. This catches wiring bugs unit tests can't
  (wrong route path, forgotten auth middleware, error handler not
  formatting a response correctly) without needing a live database.

This means the full suite runs in CI with zero external dependencies —
no Postgres container, no network access, no `.env` secrets required.

## Why this catches real bugs

- Route wired to the wrong controller method → integration test 404s or
  errors unexpectedly.
- A service throwing a raw `Error` instead of an `AppError` → integration
  test sees a 500 instead of the expected 400/404/409, since only
  `AppError` gets its message shown to the client.
- Plan-limit or validation logic accidentally removed during a refactor →
  the specific unit test asserting `PLAN_LIMIT_OFFICERS` / `PLAN_LIMIT_VISITORS`
  fails immediately.

## What's intentionally NOT covered yet

- Repository layer itself (the actual SQL) — that would need a real or
  containerized Postgres instance (e.g. via `testcontainers`) to test
  meaningfully; mocking the DB driver at that level tests very little.
- Stripe webhook signature verification and the billing routes — Stripe's
  test mode + webhook fixtures are the more useful way to test that, via
  `stripe trigger` and the Stripe CLI's `--forward-to`, not unit tests.
- End-to-end frontend flows — see the code review's suggestion to add
  Playwright/Cypress for that layer separately.

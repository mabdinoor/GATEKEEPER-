import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.js"],
    // Unit tests mock repositories, so they never touch a real database.
    // Integration tests do the same at the repository boundary (see
    // tests/integration/README.md) — none of this suite requires Postgres
    // to be running.
    testTimeout: 10000,
  },
});

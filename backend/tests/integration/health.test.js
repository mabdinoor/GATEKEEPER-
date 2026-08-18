import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../db.js", () => ({
  getDb: vi.fn(),
  ping: vi.fn(),
  pool: {},
}));

const db = await import("../../db.js");
const app = (await import("../../app.js")).default;

describe("GET /api/health", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 and db:connected when the database is reachable", async () => {
    db.ping.mockResolvedValue(true);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "connected" });
  });

  it("returns 503 when the database is unreachable", async () => {
    db.ping.mockRejectedValue(new Error("connection refused"));

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("error");
    expect(res.body.db).toBe("unreachable");
  });

  it("includes a request ID header on every response", async () => {
    db.ping.mockResolvedValue(true);
    const res = await request(app).get("/api/health");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});

describe("Unmatched routes", () => {
  it("returns a structured 404 instead of Express's default plain-text page", async () => {
    const res = await request(app).get("/api/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/route not found/i);
    expect(res.body.requestId).toBeTruthy();
  });
});

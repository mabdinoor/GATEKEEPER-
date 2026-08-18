import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../repositories/companiesRepository.js", () => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByVerifyToken: vi.fn(),
  findByResetToken: vi.fn(),
  listPublic: vi.fn(),
  create: vi.fn(),
  markVerified: vi.fn(),
  setVerifyToken: vi.fn(),
  setResetToken: vi.fn(),
  resetPassword: vi.fn(),
  completeProfile: vi.fn(),
  getPlanKey: vi.fn(),
}));
vi.mock("../../mailer.js", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
}));
vi.mock("../../db.js", () => ({
  getDb: vi.fn(),
  ping: vi.fn().mockResolvedValue(true),
  pool: {},
}));

const companiesRepo = await import("../../repositories/companiesRepository.js");
const app = (await import("../../app.js")).default;

const validBody = {
  name: "Acme Corp",
  email: "hello@acme.com",
  password: "supersecret",
  tos_accepted: true,
};

describe("POST /api/companies/signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400s with a clear message when required fields are missing", async () => {
    const res = await request(app).post("/api/companies/signup").send({ ...validBody, name: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
    expect(res.body.requestId).toBeTruthy();
  });

  it("400s when the Terms of Service checkbox wasn't accepted", async () => {
    const res = await request(app).post("/api/companies/signup").send({ ...validBody, tos_accepted: false });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/terms of service/i);
  });

  it("409s when the email is already registered", async () => {
    companiesRepo.findByEmail.mockResolvedValue({ id: 1, email: "hello@acme.com" });
    const res = await request(app).post("/api/companies/signup").send(validBody);
    expect(res.status).toBe(409);
  });

  it("201s and returns a token + sanitized company on success", async () => {
    companiesRepo.findByEmail.mockResolvedValue(null);
    companiesRepo.create.mockResolvedValue({
      id: 1, name: "Acme Corp", email: "hello@acme.com",
      password_hash: "leaked-if-present", is_registered: 0, email_verified: 0,
    });

    const res = await request(app).post("/api/companies/signup").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.company.password_hash).toBeUndefined();
    expect(res.body.company.email).toBe("hello@acme.com");
  });
});

describe("Protected company routes without a token", () => {
  it("401s when no Authorization header is sent", async () => {
    const res = await request(app).get("/api/companies/officers");
    expect(res.status).toBe(401);
  });

  it("401s with a garbage token", async () => {
    const res = await request(app).get("/api/companies/officers").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../repositories/companiesRepository.js", () => ({
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
vi.mock("../../../mailer.js", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
}));

const companiesRepo = await import("../../../repositories/companiesRepository.js");
const mailer = await import("../../../mailer.js");
const companyAuthService = await import("../../../services/companyAuthService.js");

const validSignup = {
  name: "Acme Corp",
  email: "hello@acme.com",
  password: "supersecret",
  tosAccepted: true,
};

describe("companyAuthService.signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects missing fields", async () => {
    await expect(companyAuthService.signup({ ...validSignup, name: "" }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a short password", async () => {
    await expect(companyAuthService.signup({ ...validSignup, password: "abc" }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an invalid email format", async () => {
    await expect(companyAuthService.signup({ ...validSignup, email: "not-an-email" }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects signup without accepting the Terms of Service", async () => {
    await expect(companyAuthService.signup({ ...validSignup, tosAccepted: false }))
      .rejects.toMatchObject({ statusCode: 400, code: undefined });
  });

  it("rejects when the email is already registered", async () => {
    companiesRepo.findByEmail.mockResolvedValue({ id: 1, email: "hello@acme.com" });
    await expect(companyAuthService.signup(validSignup))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it("creates a company, sends a verification email, and returns a sanitized company + token", async () => {
    companiesRepo.findByEmail.mockResolvedValue(null);
    companiesRepo.create.mockResolvedValue({
      id: 42,
      name: "Acme Corp",
      email: "hello@acme.com",
      password_hash: "should-not-leak",
      verify_token: "should-not-leak-either",
      is_registered: 0,
      email_verified: 0,
    });

    const result = await companyAuthService.signup(validSignup);

    expect(companiesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Acme Corp", email: "hello@acme.com" })
    );
    expect(mailer.sendVerificationEmail).toHaveBeenCalledOnce();
    expect(result.token).toBeTypeOf("string");
    expect(result.company).not.toHaveProperty("password_hash");
    expect(result.company).not.toHaveProperty("verify_token");
    expect(result.company.email).toBe("hello@acme.com");
  });

  it("still returns success even if the verification email fails to send (non-blocking)", async () => {
    companiesRepo.findByEmail.mockResolvedValue(null);
    companiesRepo.create.mockResolvedValue({ id: 1, name: "Acme", email: "hello@acme.com", is_registered: 0, email_verified: 0 });
    mailer.sendVerificationEmail.mockRejectedValue(new Error("SMTP down"));

    const result = await companyAuthService.signup(validSignup);
    expect(result.company.email).toBe("hello@acme.com");
  });
});

describe("companyAuthService.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when the account doesn't exist", async () => {
    companiesRepo.findByEmail.mockResolvedValue(null);
    await expect(companyAuthService.login({ email: "nope@acme.com", password: "whatever1" }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects an unverified account with a specific error code", async () => {
    const bcrypt = await import("bcryptjs");
    companiesRepo.findByEmail.mockResolvedValue({
      id: 1, email: "hello@acme.com",
      password_hash: bcrypt.hashSync("supersecret", 10),
      email_verified: 0,
    });

    await expect(companyAuthService.login({ email: "hello@acme.com", password: "supersecret" }))
      .rejects.toMatchObject({ statusCode: 403, code: "EMAIL_NOT_VERIFIED" });
  });

  it("logs in successfully with correct credentials", async () => {
    const bcrypt = await import("bcryptjs");
    companiesRepo.findByEmail.mockResolvedValue({
      id: 1, name: "Acme", email: "hello@acme.com",
      password_hash: bcrypt.hashSync("supersecret", 10),
      email_verified: 1, is_registered: 1,
    });

    const result = await companyAuthService.login({ email: "hello@acme.com", password: "supersecret" });
    expect(result.token).toBeTypeOf("string");
    expect(result.company.email).toBe("hello@acme.com");
  });
});

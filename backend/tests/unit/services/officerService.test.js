import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../repositories/officersRepository.js", () => ({
  listByCompany: vi.fn(),
  countByCompany: vi.fn(),
  findByBadge: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("../../../repositories/companiesRepository.js", () => ({
  getPlanKey: vi.fn(),
}));

const officersRepo = await import("../../../repositories/officersRepository.js");
const companiesRepo = await import("../../../repositories/companiesRepository.js");
const officerService = await import("../../../services/officerService.js");

describe("officerService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects missing fields", async () => {
    await expect(officerService.create(1, { badgeId: "", name: "", pin: "" }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a PIN shorter than 4 digits", async () => {
    await expect(officerService.create(1, { badgeId: "KE-001", name: "Jane", pin: "12" }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("blocks creating an officer past the plan's limit", async () => {
    companiesRepo.getPlanKey.mockResolvedValue("free"); // free plan: maxOfficers = 2
    officersRepo.countByCompany.mockResolvedValue(2);

    await expect(officerService.create(1, { badgeId: "KE-003", name: "Jane", pin: "1234" }))
      .rejects.toMatchObject({ statusCode: 403, code: "PLAN_LIMIT_OFFICERS" });

    expect(officersRepo.create).not.toHaveBeenCalled();
  });

  it("allows creating an officer under the plan's limit", async () => {
    companiesRepo.getPlanKey.mockResolvedValue("pro"); // pro plan: maxOfficers = 10
    officersRepo.countByCompany.mockResolvedValue(3);
    officersRepo.findByBadge.mockResolvedValue(null);
    officersRepo.create.mockResolvedValue({ id: 5, badge_id: "KE-004", name: "Jane" });

    const officer = await officerService.create(1, { badgeId: "ke-004", name: "Jane", pin: "1234" });

    expect(officersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 1, badgeId: "KE-004", name: "Jane" })
    );
    expect(officer.badge_id).toBe("KE-004");
  });

  it("rejects a duplicate badge ID for the same company", async () => {
    companiesRepo.getPlanKey.mockResolvedValue("pro");
    officersRepo.countByCompany.mockResolvedValue(1);
    officersRepo.findByBadge.mockResolvedValue({ id: 9, badge_id: "KE-001" });

    await expect(officerService.create(1, { badgeId: "KE-001", name: "Jane", pin: "1234" }))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("officerService.remove", () => {
  beforeEach(() => vi.clearAllMocks());

  it("404s when the officer doesn't belong to this company", async () => {
    officersRepo.findById.mockResolvedValue(null);
    await expect(officerService.remove(1, 999)).rejects.toMatchObject({ statusCode: 404 });
    expect(officersRepo.remove).not.toHaveBeenCalled();
  });

  it("deletes the officer when it belongs to the company", async () => {
    officersRepo.findById.mockResolvedValue({ id: 5, company_id: 1 });
    officersRepo.remove.mockResolvedValue({ changes: 1 });

    const result = await officerService.remove(1, 5);
    expect(result).toEqual({ success: true });
    expect(officersRepo.remove).toHaveBeenCalledWith(5);
  });
});

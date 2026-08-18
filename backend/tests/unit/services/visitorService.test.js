import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../repositories/visitorsRepository.js", () => ({
  search: vi.fn(),
  countThisMonth: vi.fn(),
  findById: vi.fn(),
  checkIn: vi.fn(),
  checkOut: vi.fn(),
  countForDate: vi.fn(),
  byTypeForDate: vi.fn(),
  byHourForDate: vi.fn(),
  last7Days: vi.fn(),
  byFloorForDate: vi.fn(),
  recent: vi.fn(),
  avgDurationMinsForDate: vi.fn(),
}));
vi.mock("../../../repositories/companiesRepository.js", () => ({
  getPlanKey: vi.fn(),
}));

const visitorsRepo = await import("../../../repositories/visitorsRepository.js");
const companiesRepo = await import("../../../repositories/companiesRepository.js");
const visitorService = await import("../../../services/visitorService.js");

const validCheckIn = { first_name: "John", last_name: "Doe", id_number: "12345678" };

describe("visitorService.checkIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects missing required fields", async () => {
    await expect(visitorService.checkIn(1, 1, { first_name: "", last_name: "", id_number: "" }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("blocks check-in once the free plan's monthly limit is reached", async () => {
    companiesRepo.getPlanKey.mockResolvedValue("free"); // free plan: 100/month
    visitorsRepo.countThisMonth.mockResolvedValue(100);

    await expect(visitorService.checkIn(1, 1, validCheckIn))
      .rejects.toMatchObject({ statusCode: 403, code: "PLAN_LIMIT_VISITORS" });

    expect(visitorsRepo.checkIn).not.toHaveBeenCalled();
  });

  it("does not enforce a monthly cap on unlimited plans", async () => {
    companiesRepo.getPlanKey.mockResolvedValue("enterprise"); // unlimited
    visitorsRepo.checkIn.mockResolvedValue({ id: 1, first_name: "John" });

    const visitor = await visitorService.checkIn(1, 1, validCheckIn);

    expect(visitorsRepo.countThisMonth).not.toHaveBeenCalled();
    expect(visitor.first_name).toBe("John");
  });

  it("allows check-in under the plan's monthly limit", async () => {
    companiesRepo.getPlanKey.mockResolvedValue("free");
    visitorsRepo.countThisMonth.mockResolvedValue(5);
    visitorsRepo.checkIn.mockResolvedValue({ id: 2, first_name: "John", last_name: "Doe" });

    const visitor = await visitorService.checkIn(1, 7, validCheckIn);

    expect(visitorsRepo.checkIn).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 1, loggedBy: 7, firstName: "John", lastName: "Doe" })
    );
    expect(visitor.id).toBe(2);
  });
});

describe("visitorService.checkOut", () => {
  beforeEach(() => vi.clearAllMocks());

  it("404s for a visitor that doesn't exist in this company", async () => {
    visitorsRepo.findById.mockResolvedValue(null);
    await expect(visitorService.checkOut(1, 999)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects checking out a visitor who already checked out", async () => {
    visitorsRepo.findById.mockResolvedValue({ id: 1, checked_out_at: "2024-01-01T00:00:00Z" });
    await expect(visitorService.checkOut(1, 1)).rejects.toMatchObject({ statusCode: 400 });
    expect(visitorsRepo.checkOut).not.toHaveBeenCalled();
  });

  it("checks out a visitor who is still checked in", async () => {
    visitorsRepo.findById.mockResolvedValue({ id: 1, checked_out_at: null });
    visitorsRepo.checkOut.mockResolvedValue({ id: 1, checked_out_at: "now" });

    const result = await visitorService.checkOut(1, 1);
    expect(result.checked_out_at).toBe("now");
  });
});

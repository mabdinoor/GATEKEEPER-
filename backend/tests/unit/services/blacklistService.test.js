import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../repositories/blacklistRepository.js", () => ({
  findByIdNumber: vi.fn(),
  listByCompany: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  remove: vi.fn(),
}));

const blacklistRepo = await import("../../../repositories/blacklistRepository.js");
const blacklistService = await import("../../../services/blacklistService.js");

describe("blacklistService.check", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports not blocked when there's no match", async () => {
    blacklistRepo.findByIdNumber.mockResolvedValue(null);
    const result = await blacklistService.check(1, { id_number: "999" });
    expect(result).toEqual({ blocked: false, entry: null });
  });

  it("reports blocked when the ID number matches", async () => {
    blacklistRepo.findByIdNumber.mockResolvedValue({ id: 3, id_number: "999", reason: "Trespassing" });
    const result = await blacklistService.check(1, { id_number: "999" });
    expect(result.blocked).toBe(true);
    expect(result.entry.reason).toBe("Trespassing");
  });

  it("does not check at all when no ID number is given (names alone are unreliable)", async () => {
    const result = await blacklistService.check(1, { first_name: "John", last_name: "Doe" });
    expect(result).toEqual({ blocked: false, entry: null });
    expect(blacklistRepo.findByIdNumber).not.toHaveBeenCalled();
  });
});

describe("blacklistService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an entry with no ID number, even if a name is given", async () => {
    await expect(blacklistService.create(1, 2, { first_name: "John", last_name: "Doe" }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(blacklistRepo.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate ID number already on the list", async () => {
    blacklistRepo.findByIdNumber.mockResolvedValue({ id: 1, id_number: "999" });
    await expect(blacklistService.create(1, 2, { id_number: "999" }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it("adds a new entry", async () => {
    blacklistRepo.findByIdNumber.mockResolvedValue(null);
    blacklistRepo.create.mockResolvedValue({ id: 9, id_number: "111" });

    const entry = await blacklistService.create(1, 2, { id_number: "111", reason: "Theft" });
    expect(entry.id).toBe(9);
    expect(blacklistRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 1, addedBy: 2, idNumber: "111", reason: "Theft" })
    );
  });
});

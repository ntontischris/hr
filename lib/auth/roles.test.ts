// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("resolveUserRole", () => {
  const originalEnv = process.env.HR_MANAGER_EMAILS;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.HR_MANAGER_EMAILS = originalEnv;
  });

  it("should return employee for regular email", async () => {
    process.env.HR_MANAGER_EMAILS = "hr@company.gr";
    const { resolveUserRole } = await import("./roles");
    expect(resolveUserRole("user@company.gr")).toBe("employee");
  });

  it("should return hr_manager for HR email", async () => {
    process.env.HR_MANAGER_EMAILS = "hr@company.gr,hr2@company.gr";
    const { resolveUserRole } = await import("./roles");
    expect(resolveUserRole("hr@company.gr")).toBe("hr_manager");
  });

  it("should be case-insensitive", async () => {
    process.env.HR_MANAGER_EMAILS = "HR@Company.gr";
    const { resolveUserRole } = await import("./roles");
    expect(resolveUserRole("hr@company.gr")).toBe("hr_manager");
  });

  it("should return employee when HR_MANAGER_EMAILS is empty", async () => {
    process.env.HR_MANAGER_EMAILS = "";
    const { resolveUserRole } = await import("./roles");
    expect(resolveUserRole("anyone@company.gr")).toBe("employee");
  });
});

// lib/rate-limit.test.ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow request when under limit", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await checkRateLimit({
      userId: "user-1",
      endpoint: "chat",
      maxRequests: 20,
      windowMinutes: 1,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it("should deny request when at limit", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  request_count: 20,
                  window_start: "2026-01-01T00:00:00Z",
                },
                error: null,
              }),
            }),
          }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await checkRateLimit({
      userId: "user-1",
      endpoint: "chat",
      maxRequests: 20,
      windowMinutes: 1,
    });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});

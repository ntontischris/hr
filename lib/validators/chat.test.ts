// @vitest-environment node
import { describe, it, expect } from "vitest";
import { ChatRequestSchema, FeedbackSchema } from "./chat";

describe("ChatRequestSchema", () => {
  it("should accept valid message", () => {
    const result = ChatRequestSchema.safeParse({
      message: "Πόσες μέρες άδεια δικαιούμαι;",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty message", () => {
    const result = ChatRequestSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("should reject message over 2000 chars", () => {
    const result = ChatRequestSchema.safeParse({ message: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("should accept optional sessionId as UUID", () => {
    const result = ChatRequestSchema.safeParse({
      message: "test",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid sessionId", () => {
    const result = ChatRequestSchema.safeParse({
      message: "test",
      sessionId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("FeedbackSchema", () => {
  it("should accept valid feedback", () => {
    const result = FeedbackSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
      feedback: "positive",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid feedback value", () => {
    const result = FeedbackSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
      feedback: "maybe",
    });
    expect(result.success).toBe(false);
  });
});

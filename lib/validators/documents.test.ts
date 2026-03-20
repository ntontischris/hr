// @vitest-environment node
import { describe, it, expect } from "vitest";
import { UploadDocumentSchema, DocumentSearchSchema } from "./documents";

describe("UploadDocumentSchema", () => {
  it("should accept valid upload", () => {
    const result = UploadDocumentSchema.safeParse({
      title: "Πολιτική αδειών",
      category: "policy",
    });
    expect(result.success).toBe(true);
  });

  it("should default accessLevel to all", () => {
    const result = UploadDocumentSchema.safeParse({
      title: "Test",
      category: "faq",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accessLevel).toBe("all");
    }
  });

  it("should reject invalid category", () => {
    const result = UploadDocumentSchema.safeParse({
      title: "Test",
      category: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const result = UploadDocumentSchema.safeParse({
      title: "",
      category: "policy",
    });
    expect(result.success).toBe(false);
  });
});

describe("DocumentSearchSchema", () => {
  it("should accept valid search", () => {
    const result = DocumentSearchSchema.safeParse({
      query: "άδεια μητρότητας",
    });
    expect(result.success).toBe(true);
  });

  it("should provide defaults for threshold and count", () => {
    const result = DocumentSearchSchema.safeParse({ query: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.threshold).toBe(0.5);
      expect(result.data.count).toBe(5);
    }
  });
});

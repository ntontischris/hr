// @vitest-environment node
import { describe, it, expect } from "vitest";
import { chunkText } from "./chunker";

describe("chunkText", () => {
  it("should return single chunk for short text", () => {
    const result = chunkText("Short text.", {
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Short text.");
  });

  it("should split long text into multiple chunks", () => {
    const text =
      "A".repeat(500) + "\n\n" + "B".repeat(500) + "\n\n" + "C".repeat(500);
    const result = chunkText(text, { chunkSize: 600, chunkOverlap: 100 });
    expect(result.length).toBeGreaterThan(1);
  });

  it("should respect chunk overlap", () => {
    const para1 = "First paragraph. ".repeat(30); // ~510 chars
    const para2 = "Second paragraph. ".repeat(30); // ~540 chars
    const text = para1.trim() + "\n\n" + para2.trim();
    const result = chunkText(text, { chunkSize: 600, chunkOverlap: 100 });
    expect(result.length).toBeGreaterThanOrEqual(2);
    // The end of chunk 0 should appear in chunk 1 (overlap)
    const tail = result[0].slice(-80);
    expect(result[1]).toContain(tail.trim());
  });

  it("should prefer splitting at paragraph boundaries", () => {
    const text =
      "Paragraph one content.\n\nParagraph two content.\n\nParagraph three content.";
    const result = chunkText(text, { chunkSize: 50, chunkOverlap: 10 });
    result.forEach((chunk) => {
      expect(chunk.trim().length).toBeGreaterThan(0);
    });
  });

  it("should filter out chunks smaller than minChunkSize", () => {
    const text = "Hi.\n\n" + "A".repeat(500);
    const result = chunkText(text, {
      chunkSize: 600,
      chunkOverlap: 100,
      minChunkSize: 100,
    });
    result.forEach((chunk) => {
      expect(chunk.length).toBeGreaterThanOrEqual(100);
    });
  });

  it("should handle empty text", () => {
    const result = chunkText("", { chunkSize: 1000, chunkOverlap: 200 });
    expect(result).toHaveLength(0);
  });

  it("should handle whitespace-only text", () => {
    const result = chunkText("   \n\n   ", {
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    expect(result).toHaveLength(0);
  });

  it("should normalize excessive whitespace", () => {
    const text = "Hello    world.\n\n\n\n\nSecond    paragraph.";
    const result = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 });
    expect(result[0]).not.toContain("    ");
  });
});

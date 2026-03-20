// lib/documents/processor.test.ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/documents/parser", () => ({
  extractText: vi.fn(),
}));
vi.mock("@/lib/ai/embeddings", () => ({
  generateEmbeddings: vi.fn(),
}));

import { processDocument } from "./processor";
import { extractText } from "@/lib/documents/parser";
import { generateEmbeddings } from "@/lib/ai/embeddings";

const mockExtract = vi.mocked(extractText);
const mockEmbed = vi.mocked(generateEmbeddings);

describe("processDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract text, chunk, and generate embeddings", async () => {
    const longText =
      "Paragraph one. ".repeat(100) + "\n\n" + "Paragraph two. ".repeat(100);
    mockExtract.mockResolvedValue(longText);
    mockEmbed.mockImplementation(async (texts: string[]) =>
      texts.map((_, i) => Array(1536).fill(i === 0 ? 0.1 : 0.2)),
    );

    const file = new File([""], "test.pdf", { type: "application/pdf" });
    const result = await processDocument(file);

    expect(mockExtract).toHaveBeenCalledWith(file);
    expect(result.fullText).toBe(longText);
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.embeddings).toHaveLength(result.chunks.length);
    expect(mockEmbed).toHaveBeenCalledWith(result.chunks);
  });

  it("should return single chunk for short text", async () => {
    mockExtract.mockResolvedValue("Short document content here.");
    mockEmbed.mockResolvedValue([Array(1536).fill(0.1)]);

    const file = new File([""], "test.txt", { type: "text/plain" });
    const result = await processDocument(file);

    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]).toBe("Short document content here.");
    expect(result.embeddings).toHaveLength(1);
  });

  it("should throw for empty document", async () => {
    mockExtract.mockResolvedValue("   ");

    const file = new File([""], "empty.txt", { type: "text/plain" });
    await expect(processDocument(file)).rejects.toThrow("κείμενο");
  });
});

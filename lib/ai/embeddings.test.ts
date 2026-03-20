// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./client", () => ({
  openai: {
    embeddings: {
      create: vi.fn(),
    },
  },
}));

import { generateEmbedding, generateEmbeddings } from "./embeddings";
import { openai } from "./client";

const mockCreate = openai.embeddings.create as unknown as ReturnType<
  typeof vi.fn
>;

describe("generateEmbedding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return embedding array for a single text", async () => {
    const fakeEmbedding = Array.from({ length: 1536 }, () => Math.random());
    mockCreate.mockResolvedValue({
      data: [
        { embedding: fakeEmbedding, index: 0, object: "embedding" as const },
      ],
      model: "text-embedding-3-small",
      object: "list" as const,
      usage: { prompt_tokens: 10, total_tokens: 10 },
    });

    const result = await generateEmbedding("test text");
    expect(result).toEqual(fakeEmbedding);
    expect(result).toHaveLength(1536);
    expect(mockCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "test text",
      dimensions: 1536,
    });
  });
});

describe("generateEmbeddings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should batch-process multiple texts", async () => {
    const fakeEmb1 = Array.from({ length: 1536 }, () => 0.1);
    const fakeEmb2 = Array.from({ length: 1536 }, () => 0.2);

    mockCreate.mockResolvedValue({
      data: [
        { embedding: fakeEmb1, index: 0, object: "embedding" as const },
        { embedding: fakeEmb2, index: 1, object: "embedding" as const },
      ],
      model: "text-embedding-3-small",
      object: "list" as const,
      usage: { prompt_tokens: 20, total_tokens: 20 },
    });

    const result = await generateEmbeddings(["text1", "text2"]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(fakeEmb1);
    expect(result[1]).toEqual(fakeEmb2);
  });

  it("should split into batches of 100", async () => {
    const texts = Array.from({ length: 150 }, (_, i) => `text-${i}`);
    const fakeEmb = Array.from({ length: 1536 }, () => 0.5);

    mockCreate.mockImplementation(async (params: Record<string, unknown>) => {
      const input = params.input as string[];
      return {
        data: input.map((_, idx) => ({
          embedding: fakeEmb,
          index: idx,
          object: "embedding" as const,
        })),
        model: "text-embedding-3-small",
        object: "list" as const,
        usage: {
          prompt_tokens: input.length * 10,
          total_tokens: input.length * 10,
        },
      };
    });

    const result = await generateEmbeddings(texts);
    expect(result).toHaveLength(150);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("should return empty array for empty input", async () => {
    const result = await generateEmbeddings([]);
    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

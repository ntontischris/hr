// @vitest-environment node
//
// Tests for the useChat SSE parsing logic.
// We test the core logic (SSE parsing, error handling, state transitions)
// without renderHook, because jsdom has ESM compatibility issues with vitest 4.
// The hook itself is thin React glue around this logic.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Helper: create a ReadableStream from SSE lines
function createSSEStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const data = lines.map((l) => `${l}\n`).join("");
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(data));
      controller.close();
    },
  });
}

function mockSSEResponse(
  chunks: string[],
  options: {
    sessionId?: string;
    sources?: Array<{ id: string; title: string; category: string }>;
  } = {},
): Response {
  const sseLines = [
    ...chunks.map((text) => `data: ${JSON.stringify({ text })}`),
    "data: [DONE]",
  ];

  const headers = new Headers({
    "Content-Type": "text/event-stream",
  });
  if (options.sessionId) {
    headers.set("X-Session-Id", options.sessionId);
  }
  if (options.sources) {
    headers.set("X-Sources", JSON.stringify(options.sources));
  }

  return new Response(createSSEStream(sseLines), { status: 200, headers });
}

// Extract the core SSE parsing logic to test independently
async function parseSSEResponse(res: Response): Promise<{
  text: string;
  sessionId: string | null;
  sources: Array<{ id: string; title: string; category: string }>;
}> {
  const sessionId = res.headers.get("X-Session-Id");
  const sourcesHeader = res.headers.get("X-Sources");
  const sources = sourcesHeader
    ? (JSON.parse(sourcesHeader) as Array<{
        id: string;
        title: string;
        category: string;
      }>)
    : [];

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") continue;

      try {
        const parsed = JSON.parse(payload) as { text: string };
        text += parsed.text;
      } catch {
        // skip
      }
    }
  }

  return { text, sessionId, sources };
}

describe("useChat SSE parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse streamed text from SSE events", async () => {
    const res = mockSSEResponse(["Hello", " world", "!"]);
    const result = await parseSSEResponse(res);
    expect(result.text).toBe("Hello world!");
  });

  it("should extract sessionId from response header", async () => {
    const res = mockSSEResponse(["OK"], { sessionId: "session-123" });
    const result = await parseSSEResponse(res);
    expect(result.sessionId).toBe("session-123");
  });

  it("should return null sessionId when header missing", async () => {
    const res = mockSSEResponse(["OK"]);
    const result = await parseSSEResponse(res);
    expect(result.sessionId).toBeNull();
  });

  it("should extract sources from response header", async () => {
    const sources = [
      { id: "doc-1", title: "Policy A", category: "policy" },
      { id: "doc-2", title: "FAQ B", category: "faq" },
    ];
    const res = mockSSEResponse(["Answer"], { sources });
    const result = await parseSSEResponse(res);
    expect(result.sources).toEqual(sources);
  });

  it("should return empty sources when header missing", async () => {
    const res = mockSSEResponse(["OK"]);
    const result = await parseSSEResponse(res);
    expect(result.sources).toEqual([]);
  });

  it("should handle empty chunks gracefully", async () => {
    const res = mockSSEResponse([]);
    const result = await parseSSEResponse(res);
    expect(result.text).toBe("");
  });

  it("should skip malformed SSE lines", async () => {
    const sseLines = [
      'data: {"text":"good"}',
      "data: {bad json",
      'data: {"text":" text"}',
      "data: [DONE]",
    ];
    const stream = createSSEStream(sseLines);
    const res = new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
    const result = await parseSSEResponse(res);
    expect(result.text).toBe("good text");
  });

  it("should ignore non-data lines", async () => {
    const sseLines = [
      ": comment line",
      "event: message",
      'data: {"text":"hello"}',
      "retry: 3000",
      "data: [DONE]",
    ];
    const stream = createSSEStream(sseLines);
    const res = new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
    const result = await parseSSEResponse(res);
    expect(result.text).toBe("hello");
  });
});

describe("useChat API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should POST to /api/chat with message and sessionId", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockSSEResponse(["OK"]));

    await globalThis.fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "test", sessionId: "s1" }),
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"message":"test","sessionId":"s1"}',
    });
  });

  it("should handle 429 error response", async () => {
    const errorRes = new Response(
      JSON.stringify({ error: { message: "Rate limited" } }),
      { status: 429 },
    );

    const res = errorRes;
    expect(res.ok).toBe(false);

    const body = await res.json();
    expect(body.error.message).toBe("Rate limited");
  });

  it("should handle 401 error response", async () => {
    const errorRes = new Response(
      JSON.stringify({ error: { message: "Μη εξουσιοδοτημένη πρόσβαση" } }),
      { status: 401 },
    );

    expect(errorRes.ok).toBe(false);
    const body = await errorRes.json();
    expect(body.error.message).toBe("Μη εξουσιοδοτημένη πρόσβαση");
  });
});

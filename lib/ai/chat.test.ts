// lib/ai/chat.test.ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./client", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

import { streamChatResponse } from "./chat";
import { openai } from "./client";

const mockCreate = vi.mocked(openai.chat.completions.create);

async function* fakeStream(texts: string[]) {
  for (const text of texts) {
    yield {
      choices: [{ delta: { content: text }, index: 0, finish_reason: null }],
    };
  }
}

async function consumeStream(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

describe("streamChatResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a ReadableStream with SSE events", async () => {
    (mockCreate as any).mockResolvedValue(fakeStream(["Hello", " world"]));

    const { stream } = await streamChatResponse({
      message: "test",
      context: "some context",
      conversationHistory: [],
      userRole: "employee",
      language: "el",
    });

    const output = await consumeStream(stream);
    expect(output).toContain('data: {"text":"Hello"}');
    expect(output).toContain('data: {"text":" world"}');
    expect(output).toContain("data: [DONE]");
  });

  it("should call OpenAI with correct model and low temperature", async () => {
    (mockCreate as any).mockResolvedValue(fakeStream(["OK"]));

    const { stream } = await streamChatResponse({
      message: "test",
      context: "",
      conversationHistory: [],
      userRole: "employee",
      language: "el",
    });

    await consumeStream(stream);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5-mini",
        temperature: 0.3,
        stream: true,
      }),
    );
  });

  it("should include conversation history in messages", async () => {
    (mockCreate as any).mockResolvedValue(fakeStream(["OK"]));

    const { stream } = await streamChatResponse({
      message: "follow up",
      context: "",
      conversationHistory: [
        { role: "user", content: "first message" },
        { role: "assistant", content: "first answer" },
      ],
      userRole: "employee",
      language: "el",
    });

    await consumeStream(stream);

    const callArgs = mockCreate.mock.calls[0][0] as any;
    const messages = callArgs.messages;
    expect(messages).toHaveLength(4);
    expect(messages[1].content).toBe("first message");
    expect(messages[2].content).toBe("first answer");
  });

  it("should collect full response text via fullResponsePromise", async () => {
    (mockCreate as any).mockResolvedValue(fakeStream(["Hello", " world"]));

    const { stream, fullResponsePromise } = await streamChatResponse({
      message: "test",
      context: "",
      conversationHistory: [],
      userRole: "employee",
      language: "el",
    });

    await consumeStream(stream);
    const fullText = await fullResponsePromise;
    expect(fullText).toBe("Hello world");
  });
});

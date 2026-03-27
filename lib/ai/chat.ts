import { openai } from "./client";
import { buildSystemPrompt } from "./prompts";

interface ChatParams {
  message: string;
  context: string;
  conversationHistory: Array<{ role: string; content: string }>;
  userRole: string;
  language: "el" | "en";
}

interface ChatResult {
  stream: ReadableStream;
  fullResponsePromise: Promise<string>;
}

export async function streamChatResponse(
  params: ChatParams,
): Promise<ChatResult> {
  const { message, context, conversationHistory, userRole, language } = params;

  const systemPrompt = buildSystemPrompt({ role: userRole, language });

  const contextBlock = context
    ? `ΔΙΑΘΕΣΙΜΑ ΕΓΓΡΑΦΑ HR:\n---\n${context}\n---\n\n`
    : "";

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: `${contextBlock}ΕΡΩΤΗΣΗ:\n${message}\n\nΑπάντησε με βάση τα παραπάνω έγγραφα.`,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_completion_tokens: 2048,
    temperature: 0.3,
    stream: true,
  });

  let fullResponse = "";
  let resolveFullResponse: (text: string) => void;
  const fullResponsePromise = new Promise<string>((resolve) => {
    resolveFullResponse = resolve;
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion as AsyncIterable<{
          choices: Array<{ delta: { content?: string } }>;
        }>) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        resolveFullResponse!(fullResponse);
      } catch (err) {
        controller.error(err);
        resolveFullResponse!(fullResponse);
      }
    },
  });

  return { stream, fullResponsePromise };
}

import { z } from "zod/v4";

export const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Το μήνυμα δεν μπορεί να είναι κενό")
    .max(2000, "Μέγιστο 2000 χαρακτήρες"),
  sessionId: z.uuid().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const FeedbackSchema = z.object({
  messageId: z.uuid(),
  feedback: z.enum(["positive", "negative"]),
});

export type FeedbackRequest = z.infer<typeof FeedbackSchema>;

import { z } from "zod/v4";

export const SetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Οι κωδικοί δεν ταιριάζουν",
    path: ["confirmPassword"],
  });

export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;

export const ResetPasswordSchema = z.object({
  email: z.email("Μη έγκυρο email"),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

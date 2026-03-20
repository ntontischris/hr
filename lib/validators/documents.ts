import { z } from "zod/v4";

export const DocumentCategorySchema = z.enum([
  "policy",
  "regulation",
  "onboarding",
  "faq",
  "template",
  "job_description",
  "benefits",
  "evaluation",
  "disciplinary",
  "payroll",
]);

export type DocumentCategory = z.infer<typeof DocumentCategorySchema>;

export const AccessLevelSchema = z.enum(["all", "hr_only"]);

export type AccessLevel = z.infer<typeof AccessLevelSchema>;

export const UploadDocumentSchema = z.object({
  title: z.string().min(1, "Ο τίτλος είναι υποχρεωτικός").max(200),
  category: DocumentCategorySchema,
  accessLevel: AccessLevelSchema.default("all"),
});

export type UploadDocumentRequest = z.infer<typeof UploadDocumentSchema>;

export const DocumentSearchSchema = z.object({
  query: z.string().min(1, "Η αναζήτηση δεν μπορεί να είναι κενή").max(500),
  threshold: z.number().min(0).max(1).default(0.5),
  count: z.number().min(1).max(20).default(5),
});

export type DocumentSearchRequest = z.infer<typeof DocumentSearchSchema>;

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: DocumentCategorySchema.optional(),
  accessLevel: AccessLevelSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDocumentRequest = z.infer<typeof UpdateDocumentSchema>;

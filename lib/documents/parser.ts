// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf: (
  buffer: Buffer,
) => Promise<{ text: string }> = require("pdf-parse/lib/pdf-parse.js");
import mammoth from "mammoth";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_TYPES = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

type SupportedType = (typeof SUPPORTED_TYPES)[number];

function isSupportedType(type: string): type is SupportedType {
  return (SUPPORTED_TYPES as readonly string[]).includes(type);
}

function normalizeText(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

export async function extractText(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Το αρχείο υπερβαίνει το μέγιστο μέγεθος (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
    );
  }

  if (!isSupportedType(file.type)) {
    throw new Error(
      `Μη υποστηριζόμενος τύπος αρχείου: ${file.type}. Υποστηρίζονται: PDF, DOCX, TXT`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  switch (file.type) {
    case "text/plain": {
      return normalizeText(buffer.toString("utf-8"));
    }
    case "application/pdf": {
      const text = await extractPdfText(buffer);
      return normalizeText(text);
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({ buffer });
      return normalizeText(result.value);
    }
    default: {
      throw new Error(`Μη υποστηριζόμενος τύπος αρχείου: ${file.type}`);
    }
  }
}

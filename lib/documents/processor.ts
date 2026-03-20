import { extractText } from "@/lib/documents/parser";
import { chunkText } from "@/lib/documents/chunker";
import { generateEmbeddings } from "@/lib/ai/embeddings";

interface ProcessResult {
  fullText: string;
  chunks: string[];
  embeddings: number[][];
}

export async function processDocument(file: File): Promise<ProcessResult> {
  const fullText = await extractText(file);

  if (!fullText.trim()) {
    throw new Error("Το έγγραφο δεν περιέχει κείμενο");
  }

  const chunks = chunkText(fullText, {
    chunkSize: 1000,
    chunkOverlap: 200,
    minChunkSize: 100,
  });

  const finalChunks = chunks.length > 0 ? chunks : [fullText];

  const embeddings = await generateEmbeddings(finalChunks);

  return { fullText, chunks: finalChunks, embeddings };
}

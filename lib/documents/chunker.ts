interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  minChunkSize?: number;
}

export function chunkText(text: string, options: ChunkOptions): string[] {
  const { chunkSize, chunkOverlap, minChunkSize = 0 } = options;

  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return [];
  }

  if (normalized.length <= chunkSize) {
    return [normalized];
  }

  const paragraphs = normalized.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;

    const wouldBe = currentChunk
      ? `${currentChunk}\n\n${trimmedPara}`
      : trimmedPara;

    if (wouldBe.length <= chunkSize) {
      currentChunk = wouldBe;
      continue;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    if (trimmedPara.length > chunkSize) {
      const sentenceChunks = splitLongText(
        trimmedPara,
        chunkSize,
        chunkOverlap,
      );
      chunks.push(...sentenceChunks);
      currentChunk = "";
    } else {
      const overlap = getOverlapText(currentChunk, chunkOverlap);
      currentChunk = overlap ? `${overlap}\n\n${trimmedPara}` : trimmedPara;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter((chunk) => chunk.trim().length >= minChunkSize);
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLongText(
  text: string,
  chunkSize: number,
  overlap: number,
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastPeriod = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf(".\n"),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("? "),
      );

      if (lastPeriod > chunkSize * 0.5) {
        end = start + lastPeriod + 1;
      }
    } else {
      end = text.length;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    start = end - overlap;

    if (start >= end) {
      start = end;
    }
  }

  return chunks;
}

function getOverlapText(text: string, overlapSize: number): string {
  if (!text || overlapSize <= 0) return "";
  return text.slice(-overlapSize).trim();
}

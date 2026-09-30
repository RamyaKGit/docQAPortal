/**
 * Chunks text using a fixed character size and overlap strategy.
 * 
 * @param text The input text to chunk
 * @param chunkSize Maximum character length of each chunk (default 500)
 * @param overlap Character overlap between consecutive chunks (default 50)
 * @returns Array of text chunk strings
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const trimmed = text.trim();
  if (trimmed.length <= chunkSize) {
    return [trimmed];
  }

  const chunks: string[] = [];
  const effectiveOverlap = Math.min(overlap, chunkSize - 1);
  const step = Math.max(1, chunkSize - effectiveOverlap);

  let start = 0;
  while (start < trimmed.length) {
    const end = Math.min(start + chunkSize, trimmed.length);
    const chunk = trimmed.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    if (end === trimmed.length) {
      break;
    }
    start += step;
  }

  return chunks;
}

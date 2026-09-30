export interface ContextChunk {
  docId: string;
  title: string;
  chunkText: string;
}

/**
 * Builds a RAG prompt combining question and context chunks.
 * Explicitly instructs the LLM to answer only using the provided context.
 */
export function buildPrompt(question: string, chunks: ContextChunk[]): string {
  const contextText = chunks.length > 0
    ? chunks.map((c, i) => `[Source ${i + 1} - ${c.title} (${c.docId})]\n${c.chunkText}`).join('\n\n')
    : 'No relevant context found.';

  return `You are a helpful Q&A assistant. Answer the user's question using ONLY the provided context below.
If the answer cannot be found in the provided context, state clearly: "I cannot answer this question based on the provided documents."

--- CONTEXT START ---
${contextText}
--- CONTEXT END ---

User Question: ${question}

Answer:`;
}

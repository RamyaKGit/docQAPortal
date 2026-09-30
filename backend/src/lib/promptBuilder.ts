export interface ContextChunk {
  docId: string;
  title: string;
  chunkText: string;
}

/**
 * Builds system and user messages for OpenAI Chat Completion using RAG context.
 */
export function buildMessages(question: string, chunks: ContextChunk[]) {
  const contextText = chunks.length > 0
    ? chunks.map((c, i) => `[Source ${i + 1}: ${c.title} (${c.docId})]\n${c.chunkText}`).join('\n\n')
    : 'No relevant context found.';

  return [
    {
      role: 'system' as const,
      content: 'You are a helpful document Q&A assistant. Answer the user\'s question using ONLY the provided context. If the answer cannot be found in the provided context, state clearly: "I cannot answer this question based on the provided documents."',
    },
    {
      role: 'user' as const,
      content: `Context:\n${contextText}\n\nQuestion: ${question}`,
    },
  ];
}

/**
 * Legacy single-string prompt builder (for unit test compatibility).
 */
export function buildPrompt(question: string, chunks: ContextChunk[]): string {
  const messages = buildMessages(question, chunks);
  return `${messages[0].content}\n\n${messages[1].content}`;
}

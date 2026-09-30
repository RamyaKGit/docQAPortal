import OpenAI from 'openai';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey });
}

/**
 * Generates vector embeddings for a list of text strings using OpenAI SDK.
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  const openai = getOpenAIClient();
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  const response = await openai.embeddings.create({
    model,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

/**
 * Generates a vector embedding for a single text string.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const embeddings = await getEmbeddings([text]);
  return embeddings[0];
}

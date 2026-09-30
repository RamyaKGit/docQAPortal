import { AskRequest, AskResponse, Source } from '../types.js';
import { getEmbedding } from '../lib/embeddings.js';
import { querySimilarChunks } from '../lib/pinecone.js';
import { buildPrompt } from '../lib/promptBuilder.js';
import { generateAnswer } from '../lib/llm.js';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

/**
 * Core business logic for Q&A query processing.
 */
export async function processAsk(data: AskRequest): Promise<AskResponse> {
  if (!data || !data.question || typeof data.question !== 'string' || data.question.trim().length === 0) {
    throw new Error('Invalid request: "question" must be a non-empty string');
  }

  const topK = typeof data.topK === 'number' && data.topK > 0 ? data.topK : 3;

  // 1. Embed question
  const questionVector = await getEmbedding(data.question);

  // 2. Query topK chunks from Pinecone
  const retrievedChunks = await querySimilarChunks(questionVector, topK);

  // 3. Build RAG prompt
  const prompt = buildPrompt(data.question, retrievedChunks);

  // 4. Call OpenAI LLM
  const answer = await generateAnswer(prompt);

  // 5. Extract unique sources by docId
  const sourceMap = new Map<string, Source>();
  for (const chunk of retrievedChunks) {
    if (chunk.docId && !sourceMap.has(chunk.docId)) {
      sourceMap.set(chunk.docId, { docId: chunk.docId, title: chunk.title });
    }
  }

  return {
    answer,
    sources: Array.from(sourceMap.values()),
  };
}

/**
 * AWS Lambda handler for POST /ask
 */
export async function handler(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    const body: AskRequest = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const result = await processAsk(body);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error('Ask error:', err);
    return {
      statusCode: err.message?.startsWith('Invalid') ? 400 : 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
}

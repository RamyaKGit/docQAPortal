import { IngestRequest, IngestResponse, VectorChunk } from '../types.js';
import { chunkText } from '../lib/chunker.js';
import { getEmbeddings } from '../lib/embeddings.js';
import { deleteDocChunks, upsertChunks } from '../lib/pinecone.js';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

/**
 * Core business logic for document ingestion.
 */
export async function processIngest(data: IngestRequest): Promise<IngestResponse> {
  if (!data || !Array.isArray(data.documents) || data.documents.length === 0) {
    throw new Error('Invalid request: "documents" must be a non-empty array');
  }

  let totalDocs = 0;
  let totalChunks = 0;

  for (const doc of data.documents) {
    if (!doc.id || typeof doc.id !== 'string' || !doc.title || !doc.content) {
      throw new Error(`Invalid document format: each doc must have id, title, and content`);
    }

    // 1. Delete old chunks for this docId first (prevents duplicates on re-ingestion)
    await deleteDocChunks(doc.id);

    // 2. Chunk document content
    const textChunks = chunkText(doc.content);
    if (textChunks.length === 0) {
      continue;
    }

    // 3. Generate embeddings
    const embeddings = await getEmbeddings(textChunks);

    // 4. Build vector objects with metadata
    const vectorChunks: VectorChunk[] = textChunks.map((chunkText, i) => ({
      id: `${doc.id}#chunk-${i}`,
      values: embeddings[i],
      metadata: {
        docId: doc.id,
        title: doc.title,
        chunkText,
      },
    }));

    // 5. Upsert to Pinecone
    await upsertChunks(vectorChunks);

    totalDocs += 1;
    totalChunks += vectorChunks.length;
  }

  return {
    ingestedDocuments: totalDocs,
    ingestedChunks: totalChunks,
  };
}

/**
 * AWS Lambda handler for POST /ingest
 */
export async function handler(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    const body: IngestRequest = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const result = await processIngest(body);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error('Ingest error:', err);
    return {
      statusCode: err.message?.startsWith('Invalid') ? 400 : 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
}

import { Pinecone } from '@pinecone-database/pinecone';
import { VectorChunk, ChunkMetadata } from '../types.js';

function getPineconeIndex() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is required');
  }
  if (!indexName) {
    throw new Error('PINECONE_INDEX environment variable is required');
  }

  const pc = new Pinecone({ apiKey });
  return pc.index<ChunkMetadata>(indexName);
}

/**
 * Deletes all existing chunks for a given docId by listing IDs with prefix `${docId}#chunk-`
 */
export async function deleteDocChunks(docId: string): Promise<void> {
  const index = getPineconeIndex();
  const prefix = `${docId}#chunk-`;

  try {
    let paginationToken: string | undefined = undefined;
    const idsToDelete: string[] = [];

    do {
      const listResponse = await index.listPaginated({
        prefix,
        paginationToken,
      });

      if (listResponse.vectors && listResponse.vectors.length > 0) {
        for (const v of listResponse.vectors) {
          if (v.id) {
            idsToDelete.push(v.id);
          }
        }
      }

      paginationToken = listResponse.pagination?.next;
    } while (paginationToken);

    if (idsToDelete.length > 0) {
      await index.deleteMany(idsToDelete);
    }
  } catch (error) {
    console.warn(`Warning deleting chunks for docId ${docId}:`, error);
  }
}

/**
 * Upserts vector chunks into the Pinecone index.
 */
export async function upsertChunks(chunks: VectorChunk[]): Promise<void> {
  if (chunks.length === 0) return;
  const index = getPineconeIndex();
  
  // Pinecone supports batch upsert
  await index.upsert(chunks);
}

/**
 * Queries Pinecone for topK similar vector chunks.
 */
export async function querySimilarChunks(
  queryVector: number[],
  topK: number = 3
): Promise<Array<{ docId: string; title: string; chunkText: string }>> {
  const index = getPineconeIndex();

  const response = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  const results: Array<{ docId: string; title: string; chunkText: string }> = [];

  if (response.matches) {
    for (const match of response.matches) {
      if (match.metadata) {
        results.push({
          docId: String(match.metadata.docId || ''),
          title: String(match.metadata.title || ''),
          chunkText: String(match.metadata.chunkText || ''),
        });
      }
    }
  }

  return results;
}

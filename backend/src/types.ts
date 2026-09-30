export interface Doc {
  id: string;
  title: string;
  content: string;
}

export interface IngestRequest {
  documents: Doc[];
}

export interface IngestResponse {
  ingestedDocuments: number;
  ingestedChunks: number;
}

export interface AskRequest {
  question: string;
  topK?: number;
}

export interface Source {
  docId: string;
  title: string;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
}

export interface ChunkMetadata {
  docId: string;
  title: string;
  chunkText: string;
  [key: string]: unknown;
}

export interface VectorChunk {
  id: string;
  values: number[];
  metadata: ChunkMetadata;
}

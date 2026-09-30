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

function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export async function ingestDocuments(data: IngestRequest): Promise<IngestResponse> {
  const baseUrl = getApiUrl();
  const res = await fetch(`${baseUrl}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await res.json();
  if (!res.ok) {
    throw new Error(responseData.error || `Failed to ingest document (status ${res.status})`);
  }

  return responseData;
}

export async function askQuestion(data: AskRequest): Promise<AskResponse> {
  const baseUrl = getApiUrl();
  const res = await fetch(`${baseUrl}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await res.json();
  if (!res.ok) {
    throw new Error(responseData.error || `Failed to fetch answer (status ${res.status})`);
  }

  return responseData;
}

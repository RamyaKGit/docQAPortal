# Document QA Portal

A Document Q&A portal where you can upload documents and ask questions.

---

## 🛠️ 1. Tools Used

- **Frontend**: Next.js (App Router, static export `output: 'export'`), React, TypeScript, Vanilla CSS.
- **Backend**: Node.js, TypeScript, minimal HTTP server (`tsx` for local dev), AWS Lambda.
- **Vector Database**: Pinecone (official `@pinecone-database/pinecone` SDK).
- **Embeddings & LLM**: OpenAI SDK (`text-embedding-3-small` for vector embeddings, `gpt-4o-mini` for chat completions).
- **Infrastructure as Code**: AWS CDK (TypeScript) deploying 2 Lambdas & REST API Gateway.
- **Testing**: Vitest.

---

## 🔄 2. RAG Pipeline & Steps Followed

```
[Ingestion Pipeline]
Document Input ──► Chunk Text (500 chars) ──► Cleanup Stale Vectors ──► Generate Embeddings ──► Upsert to Pinecone

[Query Pipeline]
User Question ──► Generate Embedding ──► Query Top-K Vector Matches ──► Build Guardrail Prompt ──► OpenAI LLM ──► Answer + Sources
```

### Ingestion Flow (`POST /ingest`)
1. **Input Validation**: Validates document array (`id`, `title`, `content`).
2. **Text Chunking**: Splits content into fixed 500-character chunks with 50-character overlap.
3. **Stale Cleanup**: Deletes any leftover vectors from prior versions matching prefix `<docId>#chunk-`.
4. **Vector Embedding**: Calls OpenAI `text-embedding-3-small` for 1536-dimensional vector embeddings.
5. **Pinecone Upsert**: Upserts vector chunks with metadata `{ docId, title, chunkText }`.

### Query Flow (`POST /ask`)
1. **Input Validation**: Validates question string and `topK` parameter (default 3).
2. **Question Embedding**: Embeds the user question using OpenAI embeddings.
3. **Vector Similarity Search**: Queries Pinecone for top `K` matching chunks.
4. **Prompt Construction**: Formats retrieved chunks into strict system and user chat messages.
5. **LLM Completion**: Calls OpenAI `gpt-4o-mini` to generate the final answer.
6. **Source Citation**: Deduplicates and returns cited source documents (`docId`, `title`).

---

## 💻 3. Local Setup & How to Run Locally

### Prerequisites
- Node.js 20 or higher
- An OpenAI API key and a Pinecone API key
- A Pinecone index created in the Pinecone console: serverless, dense, dimension `1536`, metric `cosine` (matches `text-embedding-3-small`). The code connects to it by name and does not create it.
- For deployment only: an AWS account with credentials configured (`aws configure`)

### Environment Variables

#### Backend Environment Variables (`backend/.env`)
Create `backend/.env`:
```ini
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_existing_pinecone_index_name
OPENAI_API_KEY=your_openai_api_key
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini
```

#### Frontend Environment Variables (`frontend/.env.local`)
Create `frontend/.env.local`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Steps to Run Locally

1. **Run Unit Tests**:
   ```bash
   cd backend
   npm test
   ```

2. **Start Backend Local Server** (Port 3001):
   ```bash
   cd backend
   npm install
   npm run local
   ```

3. **Start Frontend Dev Server** (Port 3000):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 4. Example API Requests

### Ingest Document (`POST /ingest`)
```bash
curl -X POST http://localhost:3001/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "refund-policy",
        "title": "Refund Policy",
        "content": "Full refund within 30 days with receipt. No refunds on digital goods."
      }
    ]
  }'
```
**Response**: `{"ingestedDocuments": 1, "ingestedChunks": 1}`

### Ask Question (`POST /ask`)
```bash
curl -X POST http://localhost:3001/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the rules for refunds and digital goods?",
    "topK": 3
  }'
```
**Response**:
```json
{
  "answer": "A full refund is available within 30 days with a receipt. However, there are no refunds on digital goods.",
  "sources": [
    {
      "docId": "refund-policy",
      "title": "Refund Policy"
    }
  ]
}
```

---

## ☁️ 5. High-Level Deployment Steps (AWS CDK)

To deploy backend infrastructure to AWS (2 Lambdas + API Gateway):

```bash
cd infra
npm install
npm run cdk bootstrap   # Required once per AWS account/region
set -a; source ../backend/.env; set +a   # load keys so CDK can pass them to the Lambdas
npm run cdk deploy
```

Update `frontend/.env.local` with your deployed `ApiUrl` (e.g. `NEXT_PUBLIC_API_URL=https://<api-id>.execute-api.us-west-2.amazonaws.com/prod/`) to connect the frontend to the cloud backend.
Requires `backend/.env` to be filled in. CDK passes those values to the Lambdas as environment variables at deploy time. After deploying, the `ApiUrl` output is the base URL for `/ingest` and `/ask`.

The backend stack was deployed to AWS (us-west-2) and tested with the same requests as above. The frontend runs locally and is not hosted.
---

## ⚖️ 6. Assumptions, Trade-Offs & Chunking Strategy

- **Chunking Strategy**: Fixed windowing (500 chars, 50 overlap) maintains context continuity while keeping vector size optimal.
- **Deduplication**: Re-ingesting a document updates vector contents and removes stale extra chunks matching prefix `<docId>#chunk-`.
- **Existing Pinecone Index**: Connects to an existing index by name (`PINECONE_INDEX`).
- **Static Export**: Next.js frontend uses `output: 'export'` for static hosting. Client-side routing handles `/` -> `/ask`.
- **Secrets**: API keys are passed to the Lambdas as plain environment variables for simplicity.
- **CORS**: the API allows all origins (`*`), which is fine for a demo but should be restricted in production.
---

## 🔮 7. If I Had More Time, I Would...

- Add a better, more feature-rich UI.
- Add a CI/CD pipeline to automate building, testing, and deploying the code.
- Add more test cases (integration and end-to-end testing).
- Add RAG evaluation using Ragas / TruLens to measure Faithfulness, Context Precision, and Answer Relevance across a test benchmark dataset.
- Store API keys in AWS Secrets Manager instead of Lambda environment variables.
- Add API authentication and rate limiting, and restrict CORS to the frontend's origin.
- Host the frontend on S3 and CloudFront.

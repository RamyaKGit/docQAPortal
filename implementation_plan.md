# Implementation Plan: Document Q&A (RAG) Portal

## Architecture
- **Frontend**: Next.js (App Router, static export `output: 'export'`), TypeScript, client-side pages (`/docs`, `/ask`), client-side redirect (`/` -> `/ask`).
- **Backend**: AWS API Gateway -> Lambda (Node.js 22 runtime, TypeScript handlers `/ingest` & `/ask`), plus `localServer.ts` for local testing via `tsx`.
- **Vector Store**: Pinecone (official `@pinecone-database/pinecone` SDK). Connect to existing index by name (`PINECONE_INDEX`); do not create or modify index in code. For re-ingestion, delete old chunks by listing vector IDs with prefix `<docId>#chunk-` and deleting them.
- **Embeddings & LLM**: OpenAI (official `openai` SDK) using `text-embedding-3-small` (or configured model) and `gpt-4o-mini` (or configured model).
- **IaC**: AWS CDK (TypeScript) deploying 2 Lambda functions, API Gateway routes, and required IAM permissions.
- **Tests**: Vitest for unit tests of chunking logic and prompt construction.

## Folder Tree
```
doctorQAPortal/
├── prompts/project_prompt.md
├── implementation_plan.md
├── .gitignore
├── README.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── ask/page.tsx
│   │   │   └── docs/page.tsx
│   │   └── lib/api.ts
│   ├── .env.example
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── ingest.ts
│   │   │   └── ask.ts
│   │   ├── lib/
│   │   │   ├── chunker.ts
│   │   │   ├── embeddings.ts
│   │   │   ├── pinecone.ts
│   │   │   ├── llm.ts
│   │   │   └── promptBuilder.ts
│   │   ├── localServer.ts
│   │   └── types.ts
│   ├── tests/
│   │   ├── chunker.test.ts
│   │   └── promptBuilder.test.ts
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
└── infra/
    ├── bin/
    │   └── app.ts
    ├── lib/
    │   └── doc-qa-stack.ts
    ├── tsconfig.json
    └── package.json
```

## Environment Variables
- `backend/.env.example`:
  - `PINECONE_API_KEY`: API key for Pinecone vector database.
  - `PINECONE_INDEX`: Existing Pinecone index name.
  - `OPENAI_API_KEY`: OpenAI API key.
  - `EMBEDDING_MODEL`: Embedding model (e.g., `text-embedding-3-small`).
  - `LLM_MODEL`: Chat model (e.g., `gpt-4o-mini`).
- `frontend/.env.example`:
  - `NEXT_PUBLIC_API_URL`: Backend API URL (e.g., `http://localhost:3001` or API Gateway URL).

## File List
- `implementation_plan.md`: Architecture & plan document.
- `.gitignore`: Git exclusions for secrets (`.env*`), dependencies (`node_modules`), build outputs (`cdk.out`, `.next`).
- `backend/.env.example`: Backend environment variable template.
- `frontend/.env.example`: Frontend environment variable template.
- `backend/src/types.ts`: TypeScript interfaces (`Doc`, `IngestRequest`, `IngestResponse`, `AskRequest`, `Source`, `AskResponse`).
- `backend/src/lib/chunker.ts`: Text chunking function with fixed size & overlap.
- `backend/src/lib/embeddings.ts`: OpenAI vector embedding utility.
- `backend/src/lib/pinecone.ts`: Pinecone upsert, list-prefix & delete chunks helper (connects to existing index).
- `backend/src/lib/llm.ts`: OpenAI completion utility.
- `backend/src/lib/promptBuilder.ts`: RAG prompt builder function.
- `backend/tests/chunker.test.ts`: Vitest chunker unit tests.
- `backend/tests/promptBuilder.test.ts`: Vitest promptBuilder unit tests.
- `backend/src/handlers/ingest.ts`: `/ingest` endpoint Lambda handler.
- `backend/src/handlers/ask.ts`: `/ask` endpoint Lambda handler.
- `backend/src/localServer.ts`: Minimal HTTP server on port 3001 for local dev (`tsx`).
- `infra/bin/app.ts`: CDK application entry point.
- `infra/lib/doc-qa-stack.ts`: CDK stack defining Lambdas & API Gateway.
- `frontend/src/app/layout.tsx`: Root layout with Navigation header (Docs | Ask).
- `frontend/src/app/page.tsx`: Client-side redirect `/` -> `/ask`.
- `frontend/src/app/docs/page.tsx`: Document upload form & ingestion UI.
- `frontend/src/app/ask/page.tsx`: Q&A input UI with source citations.
- `frontend/src/lib/api.ts`: Client API layer calling `/ingest` and `/ask`.
- `README.md`: Setup, local run guide, curl examples, chunking strategy, trade-offs.

## Build Order & Workflow
1. **Step 1**: Write `implementation_plan.md` & `.gitignore`. Stop for approval & commit.
2. **Phase 1**: Backend lib modules + 2 Vitest unit tests (`npm test`).
3. **Phase 2**: `/ingest` handler + `localServer.ts` (`npm run local`). Test ingestion & prefix-based re-ingest deduplication via curl.
4. **Phase 3**: `/ask` handler. Test question-answering via curl.
5. **Phase 4**: CDK Infrastructure stack definition.
6. **Phase 5**: Frontend pages (`/docs`, `/ask`) & integration with backend.
7. **Phase 6**: Complete `README.md` & trade-off analysis.

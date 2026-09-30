# TASK
Build a Document Q&A (RAG) portal app. Users add documents, then ask questions and get answers with sources. Keep it simple, since it needs to be finished in about 4 hours.

# GENERAL RULES
1. PLAN FIRST: Before any code, write `implementation_plan.md` (architecture, folder tree, file list, env vars, build order). Keep it to one page. Stop and wait for my approval.
2. ONLY THESE TECHNOLOGIES (no extras, ask me before adding anything):
   - Frontend: Next.js (App Router) + TypeScript
   - Backend: AWS API Gateway -> Lambda (Node.js, TypeScript)
   - Vector store: Pinecone (official SDK)
   - Embeddings + LLM: OpenAI (official SDK)
   - Infrastructure-as-Code: AWS CDK in TypeScript
   - Tests: Vitest
   - Local dev only: tsx (to run the local server)
   - Config via environment variables only
3. KEEP CODE SIMPLE: small functions, no over-abstraction, no extra libraries, short comments on the "why".
4. REGENERABLE: this prompt is saved as `prompts/project_prompt.md`. Do not create other prompt files.

# FOLDER STRUCTURE
Workspace root is the current folder (doctorQAPortal). Create everything directly inside it, with no extra parent folder.
```
├── prompts/project_prompt.md
├── implementation_plan.md
├── frontend/
│   ├── src/app/
│   │   ├── layout.tsx          # root layout with simple nav links (Docs | Ask)
│   │   ├── page.tsx            # redirects "/" to "/ask"
│   │   ├── ask/page.tsx
│   │   └── docs/page.tsx
│   ├── src/lib/api.ts          # calls /ingest and /ask, declares its own response types
│   ├── .env.local              # local env for frontend
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── handlers/{ingest.ts, ask.ts}
│   │   ├── lib/{chunker.ts, embeddings.ts, pinecone.ts, llm.ts, promptBuilder.ts}
│   │   ├── localServer.ts      # local testing only
│   │   └── types.ts            # shared request/response TypeScript types, no logic
│   ├── .env.example              # local env for backend  
│   ├── tests/chunker.test.ts     # Vitest chunker unit tests
│   └── package.json
├── infra/                      # CDK: 2 Lambdas, API Gateway routes, IAM
│   ├── bin/app.ts
│   ├── lib/doc-qa-stack.ts
│   └── package.json
├── .gitignore
└── README.md
```

# REQUIREMENTS

## Frontend (two simple pages)
- `/docs`: form to add one or more documents (id, title, content in a textarea). Calls `POST /ingest`. Shows success or error.
- `/ask`: question input. Calls `POST /ask`. Shows the answer and a list of sources (docId + title).
- Backend URL from `NEXT_PUBLIC_API_URL`.
- Keep the frontend compatible with Next.js static export (`output: 'export'`): client-side pages only, no server-side features. The "/" redirect to "/ask" must be a client-side redirect.

## Backend

### types.ts (backend/src/types.ts)
```ts
export interface Doc { id: string; title: string; content: string }
export interface IngestRequest { documents: Doc[] }
export interface IngestResponse { ingestedDocuments: number; ingestedChunks: number }
export interface AskRequest { question: string; topK?: number }
export interface Source { docId: string; title: string }
export interface AskResponse { answer: string; sources: Source[] }
```

### POST /ingest
Request:
```json
{ "documents": [ { "id": "refund-policy", "title": "Refund Policy", "content": "Full refund within 30 days with receipt. No refunds on digital goods." } ] }
```
- Chunk content with a simple strategy (fixed size with small overlap). Document it in the README.
- Embed each chunk and upsert to Pinecone with id `<docId>#chunk-<n>`, vector, and metadata `{ docId, title, chunkText }`.
- Re-ingesting the same doc id must update, not duplicate: delete that doc's old chunks first by listing ids with the prefix `<docId>#chunk-` and deleting them (use a metadata-filter delete only if it works on serverless).

### POST /ask
Request: `{ "question": "Can I get a refund on a digital product?", "topK": 3 }`
- Embed the question, query Pinecone for topK chunks, build a prompt from question + chunks, call the LLM.
- Prompt must tell the LLM to answer only from the context and say so if the answer isn't there.
Response:
```json
{ "answer": "Digital products are not eligible for refunds.", "sources": [ { "docId": "refund-policy", "title": "Refund Policy" } ] }
```
- De-duplicate sources by docId.

### Local run
- Add `backend/src/localServer.ts`: a minimal Node `http` server on port 3001 that routes POST /ingest and POST /ask to the same handler functions used by Lambda, and loads env vars from `backend/.env`. Add an `npm run local` script (use `tsx`). Nothing else.

### Common
- Validate input, return JSON errors (400/500), enable CORS.
- Env vars: `PINECONE_API_KEY`, `PINECONE_INDEX`, `OPENAI_API_KEY`, `EMBEDDING_MODEL`, `LLM_MODEL`. Provide `backend/.env.example`. The frontend uses `NEXT_PUBLIC_API_URL` from `frontend/.env.local`, with its own `frontend/.env.example`.
- Do not create or modify the Pinecone index in code. Connect to the existing index by name only.
- Lambda runtime: Node.js 22 (nodejs22.x).

## Infra (CDK)
- Two Lambdas, routes `POST /ingest` and `POST /ask`, minimal IAM, env vars passed to the Lambdas.

## Tests (Vitest, 2 small unit tests, no network calls)
- Chunker (size, overlap, empty input)
- Prompt builder (contains question and chunks)

## README
- How to run locally, env vars, high-level deploy steps
- Example curl requests for /ingest and /ask
- Chunking strategy, assumptions, trade-offs, "If I had more time, I would..."

# WORKFLOW
Work in phases. After each phase, STOP, tell me exactly what to run to test it, and wait for me to reply "next". Never start the next phase on your own.

1. Write `implementation_plan.md` and create `.gitignore` (excluding `.env`, `node_modules`, `cdk.out`, `.next`). STOP for approval.
2. Phase 1: backend lib (chunker, embeddings, pinecone, llm, promptBuilder, types) + 2 unit tests. Test: `npm test`.
3. Phase 2: `/ingest` handler + `localServer.ts` (`npm run local`). Test: curl /ingest, re-ingest same id, confirm no duplicates.
4. Phase 3: `/ask` handler. Test: curl /ask.
5. Phase 4: CDK infra. Give me the exact deploy commands and the curl commands for the deployed API URL.
6. Phase 5: frontend (/docs, /ask). Test against local backend first, then the cloud URL via `NEXT_PUBLIC_API_URL`.
7. Phase 6: README, including example requests and trade-offs.
At the end, list any assumptions you made.

Keys: at the start of each phase, before I test, list exactly which env vars or credentials that phase needs and where to put them (backend/.env for local, Lambda env vars for cloud). Never ask me to paste secrets into the chat, and never commit `.env` files.

Git: after each phase passes my test and I reply "next", run `git add` and `git commit` with a clear message (e.g. "Phase 2: ingest handler and local server"). Do not push; I will push myself. Never commit secrets.
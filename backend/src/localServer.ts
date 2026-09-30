import http from 'node:http';
import dotenv from 'dotenv';
import { handler as ingestHandler } from './handlers/ingest.js';
import { handler as askHandler } from './handlers/ask.js';

// Load environment variables from backend/.env
dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  if (req.method !== 'POST' || (url !== '/ingest' && url !== '/ask')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Not found: ${req.method} ${url}` }));
    return;
  }

  let bodyData = '';
  req.on('data', (chunk) => {
    bodyData += chunk;
  });

  req.on('end', async () => {
    try {
      const mockEvent = {
        httpMethod: 'POST',
        body: bodyData,
      };

      const lambdaResult = url === '/ingest'
        ? await ingestHandler(mockEvent)
        : await askHandler(mockEvent);

      res.writeHead(lambdaResult.statusCode, lambdaResult.headers);
      res.end(lambdaResult.body);
    } catch (err: any) {
      console.error('Server error handling request:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[localServer] Backend server running at http://localhost:${PORT}`);
});

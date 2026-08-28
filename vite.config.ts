import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import {
  getProblemMetadata,
  checkDuplicateProblem,
  saveSolution,
  listOrganizedProblems,
  getProblemContents,
} from './server/api';

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // 1. GET /api/problems/:num
        if (url.startsWith('/api/problems/') && req.method === 'GET') {
          const match = url.match(/\/api\/problems\/(\d+)/);
          if (match) {
            const problemNumber = parseInt(match[1], 10);
            const forceRefresh = url.includes('refresh=true');
            try {
              const result = await getProblemMetadata(problemNumber, forceRefresh);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            } catch (err: any) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Problem not found.' }));
              return;
            }
          }
        }

        // 2. GET /api/solutions/check?number=...
        if (url.startsWith('/api/solutions/check') && req.method === 'GET') {
          const parsedUrl = new URL(url, 'http://localhost:3000');
          const numberParam = parsedUrl.searchParams.get('number');
          const problemNumber = parseInt(numberParam || '0', 10);
          try {
            const check = checkDuplicateProblem(problemNumber);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(check));
            return;
          } catch (err: any) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 3. POST /api/solutions
        if (url === '/api/solutions' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const result = await saveSolution(data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Failed to save solution' }));
            }
          });
          return;
        }

        // 4. GET /api/solutions/:folder/content
        if (url.startsWith('/api/solutions/') && url.endsWith('/content') && req.method === 'GET') {
          const parts = url.split('/');
          const folderName = decodeURIComponent(parts[3]);
          try {
            const result = getProblemContents(folderName);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
            return;
          } catch (err: any) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 5. GET /api/solutions
        if (url === '/api/solutions' && req.method === 'GET') {
          try {
            const problems = listOrganizedProblems();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ solutions: problems }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), localApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

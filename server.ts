import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getProblemMetadata,
  checkDuplicateProblem,
  saveSolution,
  listOrganizedProblems,
  getProblemContents,
} from './server/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API Endpoints
app.get('/api/problems/:num', async (req, res) => {
  const problemNumber = parseInt(req.params.num, 10);
  const forceRefresh = req.query.refresh === 'true';
  try {
    const result = await getProblemMetadata(problemNumber, forceRefresh);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Problem not found.' });
  }
});

app.get('/api/solutions/check', (req, res) => {
  const problemNumber = parseInt((req.query.number as string) || '0', 10);
  try {
    const check = checkDuplicateProblem(problemNumber);
    res.json(check);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/solutions', async (req, res) => {
  try {
    const result = await saveSolution(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save solution' });
  }
});

app.get('/api/solutions', (req, res) => {
  try {
    const problems = listOrganizedProblems();
    res.json({ solutions: problems });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/solutions/:folder/content', (req, res) => {
  try {
    const result = getProblemContents(req.params.folder);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// Serve frontend static assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LeetCode Solutions running at http://0.0.0.0:${PORT}`);
});

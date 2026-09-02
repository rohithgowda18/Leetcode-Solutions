import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ProblemMetadata, Difficulty } from '../src/types';
import { convertHtmlToMarkdown } from '../src/services/htmlToMarkdown';
import { generateFolderName, generateReadme, validateProblemNumber } from '../src/services/readmeGenerator';
import { MOCK_PROBLEM_FIXTURES } from '../src/services/mockFixtures';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, 'problems-cache.json');
const DSA_OUTPUT_DIR = path.resolve(process.cwd(), 'dsa');
const DATABASE_OUTPUT_DIR = path.resolve(process.cwd(), 'database');

// Ensure base directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DSA_OUTPUT_DIR)) {
  fs.mkdirSync(DSA_OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(DATABASE_OUTPUT_DIR)) {
  fs.mkdirSync(DATABASE_OUTPUT_DIR, { recursive: true });
}

// In-memory cache synced with disk
let diskCache: Record<number, ProblemMetadata> = {};

function loadDiskCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      diskCache = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading problems-cache.json:', err);
    diskCache = {};
  }
}

function saveDiskCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(diskCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving problems-cache.json:', err);
  }
}

loadDiskCache();

/**
 * Determine category (database or dsa) based on topics or code
 */
export function detectCategory(metadata?: Partial<ProblemMetadata>, code?: string, filename?: string): 'dsa' | 'database' {
  if (filename && filename.endsWith('.sql')) return 'database';
  if (filename && filename.endsWith('.java')) return 'dsa';

  const topics = metadata?.topics || [];
  const isDbTopic = topics.some(t => /database|sql|pandas/i.test(t));
  if (isDbTopic) return 'database';

  if (code) {
    const trimmed = code.trim();
    if (
      /^(\s*--|\s*\/\*|\s*#|\s*select|\s*with|\s*update|\s*insert|\s*create|\s*delete)/i.test(trimmed) &&
      !trimmed.includes('public class') &&
      !trimmed.includes('class Solution')
    ) {
      return 'database';
    }
  }

  return 'dsa';
}

/**
 * Fetch public LeetCode problem metadata using public unauthenticated methods
 */
export async function fetchPublicLeetCodeMetadata(problemNumber: number): Promise<ProblemMetadata> {
  // 1. Try public GraphQL with questionTitle query (works for many public mirrors and LeetCode public endpoints)
  try {
    // First, resolve title slug via public all-questions API or direct GraphQL
    const allQuestionsRes = await fetch('https://leetcode.com/api/problems/all/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        Accept: 'application/json',
      },
    });

    if (allQuestionsRes.ok) {
      const data = await allQuestionsRes.json();
      const question = data.stat_status_pairs?.find(
        (q: any) => q.stat?.frontend_question_id === problemNumber || q.stat?.question_id === problemNumber
      );

      if (question) {
        const titleSlug = question.stat.question__title_slug;
        const title = question.stat.question__title;
        const level = question.difficulty?.level;
        const difficulty: Difficulty = level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Hard';

        // Now fetch question details via public GraphQL query
        const gqlRes = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            query: `
              query getQuestionDetail($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                  questionFrontendId
                  title
                  titleSlug
                  content
                  difficulty
                  topicTags {
                    name
                    slug
                  }
                }
              }
            `,
            variables: { titleSlug },
          }),
        });

        if (gqlRes.ok) {
          const gqlData = await gqlRes.json();
          const qData = gqlData.data?.question;
          if (qData) {
            const descriptionHtml = qData.content || '';
            const descriptionMarkdown = convertHtmlToMarkdown(descriptionHtml);
            const topics = (qData.topicTags || []).map((t: any) => t.name);
            const category = detectCategory({ topics });

            return {
              number: problemNumber,
              title: qData.title || title,
              slug: qData.titleSlug || titleSlug,
              difficulty: (qData.difficulty as Difficulty) || difficulty,
              descriptionHtml,
              descriptionMarkdown,
              topics,
              category,
              url: `https://leetcode.com/problems/${titleSlug}/`,
            };
          }
        }
      }
    }
  } catch (netErr) {
    console.warn(`Public LeetCode network fetch failed for problem #${problemNumber}:`, netErr);
  }

  // 2. Fallback to mock fixtures / offline database
  if (MOCK_PROBLEM_FIXTURES[problemNumber]) {
    const fixture = MOCK_PROBLEM_FIXTURES[problemNumber];
    return {
      ...fixture,
      category: detectCategory(fixture),
    };
  }

  throw new Error(`Could not retrieve problem #${problemNumber} metadata. Check your internet connection and try again.`);
}

/**
 * Get problem metadata with local caching
 */
export async function getProblemMetadata(
  problemNumber: number,
  forceRefresh: boolean = false
): Promise<{ metadata: ProblemMetadata; fromCache: boolean }> {
  const validation = validateProblemNumber(problemNumber);
  if (!validation.valid || !validation.number) {
    throw new Error(validation.error || 'Invalid problem number.');
  }

  const num = validation.number;

  // If cached and not forcing refresh, return immediately
  if (!forceRefresh && diskCache[num]) {
    const cached = diskCache[num];
    if (!cached.category) cached.category = detectCategory(cached);
    return { metadata: { ...cached, fromCache: true }, fromCache: true };
  }

  try {
    const fetched = await fetchPublicLeetCodeMetadata(num);
    diskCache[num] = fetched;
    saveDiskCache();
    return { metadata: fetched, fromCache: false };
  } catch (err: any) {
    // If we have cached version even if refresh failed, fall back to cached
    if (diskCache[num]) {
      const cached = diskCache[num];
      if (!cached.category) cached.category = detectCategory(cached);
      return { metadata: { ...cached, fromCache: true }, fromCache: true };
    }
    throw err;
  }
}

/**
 * Check if solution folder & solution file already exist
 */
export function checkDuplicateProblem(problemNumber: number, explicitCategory?: 'dsa' | 'database') {
  const validation = validateProblemNumber(problemNumber);
  if (!validation.valid || !validation.number) {
    return { folderExists: false, folderName: '', solutionFileExists: false, existingFiles: [] };
  }

  const num = validation.number;
  const cachedMeta = diskCache[num] || MOCK_PROBLEM_FIXTURES[num];
  const category = explicitCategory || cachedMeta?.category || detectCategory(cachedMeta);
  const folderName = generateFolderName(num, cachedMeta?.slug, cachedMeta?.title);

  // Check in specific category dir and fallback to root/both
  const catDir = category === 'database' ? DATABASE_OUTPUT_DIR : DSA_OUTPUT_DIR;
  const targetDir = path.join(catDir, folderName);

  if (!fs.existsSync(targetDir)) {
    return {
      folderExists: false,
      folderName,
      solutionFileExists: false,
      existingFiles: [],
      problemTitle: cachedMeta?.title,
      category,
    };
  }

  const existingFiles = fs.readdirSync(targetDir);
  const solutionFileExists = existingFiles.some(f => f.toLowerCase().startsWith('solution.'));

  return {
    folderExists: true,
    folderName,
    solutionFileExists,
    existingFiles,
    problemTitle: cachedMeta?.title,
    category,
  };
}

/**
 * Save organized solution (creates folder, README.md, Solution.java / Solution.sql)
 */
export async function saveSolution(params: {
  problemNumber: number;
  solutionContent: string;
  overwriteSolution?: boolean;
  category?: 'dsa' | 'database';
  filename?: string;
}) {
  const { problemNumber, solutionContent, overwriteSolution = true, filename } = params;

  // Retrieve metadata
  const { metadata } = await getProblemMetadata(problemNumber, false);
  const category = params.category || detectCategory(metadata, solutionContent, filename);
  metadata.category = category;

  const folderName = generateFolderName(problemNumber, metadata.slug, metadata.title);
  const baseDir = category === 'database' ? DATABASE_OUTPUT_DIR : DSA_OUTPUT_DIR;
  const targetDir = path.join(baseDir, folderName);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const solFileName = filename || (category === 'database' ? 'Solution.sql' : 'Solution.java');
  const readmePath = path.join(targetDir, 'README.md');
  const solutionPath = path.join(targetDir, solFileName);

  // Generate and write all-in-one README.md with embedded solution code
  const readmeContent = generateReadme({
    metadata,
    category,
    solutionCode: solutionContent,
    solutionFilename: solFileName,
  });
  fs.writeFileSync(readmePath, readmeContent, 'utf-8');

  // If a legacy Solution file existed in the folder, clean it up
  if (fs.existsSync(solutionPath)) {
    try {
      fs.unlinkSync(solutionPath);
    } catch {
      // ignore
    }
  }

  const relPath = `${category}/${folderName}`;

  return {
    folderName,
    category,
    fullPath: relPath,
    readmePath: `${relPath}/README.md`,
    metadata,
  };
}

/**
 * List all organized problems from dsa and database subdirectories
 */
export function listOrganizedProblems() {
  const results: any[] = [];

  function scanDirectory(dir: string, cat: 'dsa' | 'database') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const match = entry.name.match(/^(\d{4})-(.*)$/);
        const problemNumber = match ? parseInt(match[1], 10) : 0;
        const folderPath = path.join(dir, entry.name);
        const files = fs.readdirSync(folderPath);

        const hasSolution = files.some(f => f.toLowerCase().startsWith('solution.'));
        const hasReadme = files.some(f => f.toLowerCase() === 'readme.md');

        const cached = diskCache[problemNumber] || MOCK_PROBLEM_FIXTURES[problemNumber];

        results.push({
          problemNumber: problemNumber || 1,
          title: cached?.title || entry.name.replace(/^\d{4}-/, '').replace(/-/g, ' '),
          slug: cached?.slug || entry.name.replace(/^\d{4}-/, ''),
          difficulty: cached?.difficulty || 'Medium',
          category: cat,
          folderName: entry.name,
          fullPath: `${cat}/${entry.name}`,
          topics: cached?.topics || [],
          url: cached?.url || `https://leetcode.com/problems/${entry.name.replace(/^\d{4}-/, '')}/`,
          hasSolution,
          hasReadme,
        });
      }
    }
  }

  scanDirectory(DSA_OUTPUT_DIR, 'dsa');
  scanDirectory(DATABASE_OUTPUT_DIR, 'database');

  return results.sort((a, b) => a.problemNumber - b.problemNumber);
}

/**
 * Get problem folder contents (README.md & Solution file) for revision
 */
export function getProblemContents(folderName: string, category?: string) {
  let targetDir = '';

  if (category === 'database') {
    targetDir = path.join(DATABASE_OUTPUT_DIR, folderName);
  } else if (category === 'dsa') {
    targetDir = path.join(DSA_OUTPUT_DIR, folderName);
  } else {
    // Search in dsa and database
    const dsaPath = path.join(DSA_OUTPUT_DIR, folderName);
    const dbPath = path.join(DATABASE_OUTPUT_DIR, folderName);

    if (fs.existsSync(dsaPath)) targetDir = dsaPath;
    else if (fs.existsSync(dbPath)) targetDir = dbPath;
  }

  if (!targetDir || !fs.existsSync(targetDir)) {
    throw new Error('Problem folder not found.');
  }

  const readmePath = path.join(targetDir, 'README.md');
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf-8') : '';

  const files = fs.readdirSync(targetDir);
  const solFile = files.find(f => f.toLowerCase().startsWith('solution.')) || 'Solution.java';
  const solutionPath = path.join(targetDir, solFile);
  const solution = fs.existsSync(solutionPath) ? fs.readFileSync(solutionPath, 'utf-8') : '';

  return {
    folderName,
    readme,
    solution,
    solutionFilename: solFile,
  };
}

/**
 * Get current Git Remote configuration and status
 */
export function getGitRemoteStatus() {
  try {
    const remotes = execSync('git remote -v', { encoding: 'utf-8' });
    const match = remotes.match(/origin\s+([^\s]+)\s+\(push\)/) || remotes.match(/origin\s+([^\s]+)/);
    const remoteUrl = match ? match[1] : '';

    let currentBranch = 'main';
    try {
      currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim() || 'main';
    } catch {
      // default main
    }

    return {
      hasRemote: !!remoteUrl,
      remoteUrl,
      branch: currentBranch,
    };
  } catch (err: any) {
    return {
      hasRemote: false,
      remoteUrl: '',
      branch: 'main',
    };
  }
}

/**
 * Configure or update Git remote URL and branch
 */
export function configureGitRemote(params: { remoteUrl: string; branch?: string }) {
  const { remoteUrl, branch = 'main' } = params;
  try {
    // Check if git is initialized
    try {
      execSync('git status', { stdio: 'ignore' });
    } catch {
      execSync('git init', { stdio: 'ignore' });
    }

    // Check existing origin
    try {
      execSync('git remote remove origin', { stdio: 'ignore' });
    } catch {
      // No existing origin
    }

    if (remoteUrl) {
      execSync(`git remote add origin ${remoteUrl}`, { stdio: 'ignore' });
    }

    if (branch) {
      try {
        execSync(`git branch -M ${branch}`, { stdio: 'ignore' });
      } catch {
        // ignore
      }
    }

    return getGitRemoteStatus();
  } catch (err: any) {
    throw new Error(`Failed to configure remote: ${err.message}`);
  }
}

/**
 * Execute Git Sync (Add, Commit, Push)
 */
export function syncGitRemote(params: { commitMessage?: string; branch?: string }) {
  const { commitMessage, branch = 'main' } = params;
  const logs: string[] = [];

  try {
    logs.push('Staging changes (git add .)...');
    execSync('git add .gitignore README.md dsa database', { encoding: 'utf-8' });

    const msg = commitMessage?.trim() || `Sync LeetCode solutions: ${new Date().toISOString().split('T')[0]}`;
    logs.push(`Committing changes (git commit -m "${msg}")...`);
    try {
      const commitOutput = execSync(`git commit -m "${msg}"`, { encoding: 'utf-8' });
      logs.push(commitOutput);
    } catch (commitErr: any) {
      logs.push('Working tree clean (nothing new to commit).');
    }

    logs.push(`Pushing to remote origin/${branch}...`);
    const pushOutput = execSync(`git push origin ${branch}`, { encoding: 'utf-8' });
    logs.push(pushOutput || 'Push completed successfully.');

    return {
      success: true,
      logs,
      status: getGitRemoteStatus(),
    };
  } catch (err: any) {
    throw new Error(err.message || 'Git sync failed');
  }
}


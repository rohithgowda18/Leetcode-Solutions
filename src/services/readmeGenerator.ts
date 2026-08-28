import { ProblemMetadata } from '../types';

export interface ReadmeOptions {
  metadata: ProblemMetadata;
  solutionFilename?: string;
  category?: 'dsa' | 'database';
}

/**
 * Generates clean, GitHub-ready README.md for LeetCode solutions.
 */
export function generateReadme(options: ReadmeOptions): string {
  const { metadata, solutionFilename, category } = options;
  const sections: string[] = [];

  // 1. Title
  sections.push(`# ${metadata.number}. ${metadata.title}`);

  // 2. Metadata info
  const catBadge = category === 'database' ? 'Database' : 'DSA';
  sections.push(`**Difficulty:** ${metadata.difficulty} | **Category:** ${catBadge}\n\n**LeetCode:** ${metadata.url}`);

  // 3. Description
  const description = metadata.descriptionMarkdown?.trim() || 'No description available.';
  sections.push(`## Description\n\n${description}`);

  // 4. Topics (if available)
  if (metadata.topics && metadata.topics.length > 0) {
    const topicList = metadata.topics.map(t => `- ${t}`).join('\n');
    sections.push(`## Topics\n\n${topicList}`);
  }

  // 5. Solution reference
  const solFile = solutionFilename || (category === 'database' ? 'Solution.sql' : 'Solution.java');
  const solHeader = solFile.endsWith('.sql') ? 'SQL Solution' : solFile.endsWith('.java') ? 'Java Solution' : 'Solution';
  sections.push(`## ${solHeader}\n\nSee \`${solFile}\`.`);

  return sections.join('\n\n') + '\n';
}

/**
 * Generates normalized 4-digit zero-padded folder name.
 * Examples:
 * 1 -> 0001-two-sum
 * 20 -> 0020-valid-parentheses
 * 121 -> 0121-best-time-to-buy-and-sell-stock
 * 1000 -> 1000-minimum-cost-to-merge-stones
 */
export function generateFolderName(problemNumber: number, slug?: string, title?: string): string {
  const paddedNumber = String(problemNumber).padStart(4, '0');

  let normalizedSlug = '';
  if (slug && slug.trim().length > 0) {
    normalizedSlug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  } else if (title && title.trim().length > 0) {
    normalizedSlug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return normalizedSlug ? `${paddedNumber}-${normalizedSlug}` : `${paddedNumber}-problem-${problemNumber}`;
}

/**
 * Validates a LeetCode problem number
 */
export function validateProblemNumber(input: number | string): { valid: boolean; number?: number; error?: string } {
  if (input === '' || input === null || input === undefined) {
    return { valid: false, error: 'Problem number is required.' };
  }

  const num = typeof input === 'number' ? input : parseInt(String(input).trim(), 10);

  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid numeric problem number.' };
  }

  if (num <= 0) {
    return { valid: false, error: 'Problem number must be greater than 0.' };
  }

  if (num > 5000) {
    return { valid: false, error: 'Problem number is out of expected LeetCode range (>5000).' };
  }

  return { valid: true, number: num };
}

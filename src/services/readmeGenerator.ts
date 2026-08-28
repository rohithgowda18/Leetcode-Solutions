import { ProblemMetadata } from '../types';

export interface ReadmeOptions {
  metadata: ProblemMetadata;
  solutionFilename?: string;
  category?: 'dsa' | 'database';
}

/**
 * Generates authentic, LeetCode-styled README.md with badges, clean tags, and accurate problem UI layout.
 */
export function generateReadme(options: ReadmeOptions): string {
  const { metadata, solutionFilename, category } = options;
  const sections: string[] = [];

  // Difficulty badge colors
  const diffColor =
    metadata.difficulty === 'Easy' ? 'green' : metadata.difficulty === 'Medium' ? 'orange' : 'red';
  const diffBadge = `![${metadata.difficulty}](https://img.shields.io/badge/Difficulty-${metadata.difficulty}-${diffColor}?style=for-the-badge)`;
  const catBadge = `![Category](https://img.shields.io/badge/Category-${category === 'database' ? 'Database' : 'DSA'}-blue?style=for-the-badge)`;

  // 1. Header with Badges
  sections.push(`# [${metadata.number}. ${metadata.title}](${metadata.url})\n\n${diffBadge} ${catBadge}`);

  // 2. Problem Description
  const description = metadata.descriptionMarkdown?.trim() || 'No description available.';
  sections.push(description);

  // 3. Topic Tags as badges or clean chips
  if (metadata.topics && metadata.topics.length > 0) {
    const topicTags = metadata.topics.map(t => `\`${t}\``).join(' ');
    sections.push(`**Related Topics:**  \n${topicTags}`);
  }

  // 4. Solution Reference
  const solFile = solutionFilename || (category === 'database' ? 'Solution.sql' : 'Solution.java');
  const solLang = solFile.endsWith('.sql') ? 'SQL' : solFile.endsWith('.java') ? 'Java' : 'Solution';
  sections.push(`---\n\n### ${solLang} Solution\n\n- [\`${solFile}\`](./${solFile})`);

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

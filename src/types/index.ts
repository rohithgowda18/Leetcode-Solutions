export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type ProblemCategory = 'dsa' | 'database';
export type SolutionLanguage = 'java' | 'sql' | 'cpp' | 'python' | 'javascript';

export interface ProblemMetadata {
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  descriptionHtml: string;
  descriptionMarkdown: string;
  topics: string[];
  url: string;
  category?: ProblemCategory;
  fromCache?: boolean;
}

export interface JavaSolutionConfig {
  problemNumber: number;
  solutionContent: string;
  overwriteSolution?: boolean;
  category?: ProblemCategory;
  language?: string;
  filename?: string;
}

export interface DuplicateCheckResult {
  folderExists: boolean;
  folderName: string;
  solutionFileExists: boolean;
  problemTitle?: string;
  existingFiles: string[];
}

export interface OrganizedProblem {
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  folderName: string;
  fullPath: string;
  topics: string[];
  url: string;
  hasSolution: boolean;
  hasReadme: boolean;
  updatedAt?: string;
}

import { MOCK_PROBLEM_FIXTURES } from './mockFixtures';

export interface ParsedJavaFileInfo {
  file: File;
  fileName: string;
  codeContent: string;
  detectedNumber: number | null;
  detectedTitleOrSlug?: string;
  className?: string;
}

/**
 * Extracts class name from Java source code.
 * Matches: public class Solution1, class TwoSum, class _0001_TwoSum, etc.
 */
export function extractJavaClassName(codeContent: string): string | null {
  // Regex to find primary class name: [public/abstract/final] class <ClassName>
  const classMatch = codeContent.match(/(?:public\s+|abstract\s+|final\s+)?class\s+([A-Za-z0-9_$]+)/);
  if (classMatch && classMatch[1]) {
    return classMatch[1];
  }
  return null;
}

/**
 * Maps Java file to LeetCode problem number by parsing:
 * 1. Numeric prefix in filename (e.g., "1.java", "0001-two-sum.java", "0121_Best_Time.java")
 * 2. Problem/LeetCode prefixes in filename (e.g., "Problem1.java", "LeetCode_146.java", "LC20.java")
 * 3. Class name in Java source code (e.g., "class Solution1", "class Problem121", "class _0001_TwoSum")
 * 4. URL or problem comment in code (e.g., "// https://leetcode.com/problems/two-sum/", "// #1", "// LeetCode 1")
 * 5. Matching title or slug from class name (e.g., class TwoSum -> 1)
 */
export function parseProblemFromFile(fileName: string, codeContent: string): {
  problemNumber: number | null;
  className?: string;
  detectionSource?: 'numeric_prefix' | 'filename_pattern' | 'class_name' | 'code_comment' | 'slug_match';
} {
  const cleanFileName = fileName.trim();
  const className = extractJavaClassName(codeContent) || undefined;

  // 1. Numeric prefix in file name (e.g., "1.java", "0001-two-sum.java", "0121_Best_Time.java", "1_TwoSum.java")
  const prefixMatch = cleanFileName.match(/^(\d{1,5})/);
  if (prefixMatch) {
    const num = parseInt(prefixMatch[1], 10);
    if (num > 0 && num <= 5000) {
      return { problemNumber: num, className, detectionSource: 'numeric_prefix' };
    }
  }

  // 2. Pattern in file name (e.g., "Problem1.java", "Problem_121.java", "LeetCode20.java", "LC146.java", "Solution_1.java", "p20.java")
  const filePatternMatch = cleanFileName.match(/(?:problem|leetcode|solution|lc|p)[_\-\s]*(\d{1,5})/i);
  if (filePatternMatch) {
    const num = parseInt(filePatternMatch[1], 10);
    if (num > 0 && num <= 5000) {
      return { problemNumber: num, className, detectionSource: 'filename_pattern' };
    }
  }

  // 3. Class name in Java code containing problem number (e.g., "Solution1", "Problem121", "_0001_TwoSum", "LC146", "P70", "TwoSum_1")
  if (className) {
    // Number prefix or suffix in class name: _0001_TwoSum, Solution1, Problem121, LC121
    const classNumMatch = className.match(/(?:(?:problem|solution|lc|p|_)[_\s]*)?(\d{1,5})/i);
    if (classNumMatch && classNumMatch[1]) {
      const num = parseInt(classNumMatch[1], 10);
      if (num > 0 && num <= 5000) {
        return { problemNumber: num, className, detectionSource: 'class_name' };
      }
    }
  }

  // 4. Code comments or URLs inside Java file
  // Example: "https://leetcode.com/problems/two-sum/" or "// LeetCode #1" or "// Problem 1: Two Sum"
  const commentMatch = codeContent.match(/(?:leetcode|problem|#)\s*[:#\-]?\s*(\d{1,5})/i);
  if (commentMatch && commentMatch[1]) {
    const num = parseInt(commentMatch[1], 10);
    if (num > 0 && num <= 5000) {
      return { problemNumber: num, className, detectionSource: 'code_comment' };
    }
  }

  // 5. Slug or Title matching from class name (e.g., TwoSum -> two-sum -> Problem #1)
  if (className) {
    const normalizedClass = className
      .replace(/^[_\$]+/, '')
      .replace(/Solution$/, '')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();

    // Check against mock fixtures
    for (const [idStr, fixture] of Object.entries(MOCK_PROBLEM_FIXTURES)) {
      if (fixture.slug === normalizedClass || fixture.slug.replace(/-/g, '') === className.toLowerCase()) {
        return { problemNumber: parseInt(idStr, 10), className, detectionSource: 'slug_match' };
      }
    }
  }

  return { problemNumber: null, className };
}

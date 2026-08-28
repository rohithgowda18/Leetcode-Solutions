import { validateProblemNumber, generateFolderName, generateReadme } from '../services/readmeGenerator';
import { convertHtmlToMarkdown, decodeHtmlEntities } from '../services/htmlToMarkdown';
import { MOCK_PROBLEM_FIXTURES } from '../services/mockFixtures';
import { extractJavaClassName, parseProblemFromFile } from '../services/problemParser';
import { ProblemMetadata } from '../types';

// Standalone lightweight test runner for local testing without external frameworks
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Test assertion failed: ${message}`);
  }
}

export function runOrganizerTests() {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  // 1. Problem Number Validation
  test('validates positive integers', () => {
    assert(validateProblemNumber(1).valid === true, '1 should be valid');
    assert(validateProblemNumber(1).number === 1, 'number should be 1');
    assert(validateProblemNumber('121').valid === true, '"121" should be valid');
    assert(validateProblemNumber('121').number === 121, 'number should be 121');
  });

  test('rejects invalid inputs', () => {
    assert(validateProblemNumber(0).valid === false, '0 should be invalid');
    assert(validateProblemNumber(-5).valid === false, '-5 should be invalid');
    assert(validateProblemNumber('abc').valid === false, 'abc should be invalid');
    assert(validateProblemNumber('').valid === false, 'empty string should be invalid');
  });

  // 2. Folder Name Generation & Zero-Padding
  test('pads single digit numbers to 4 digits', () => {
    const folder = generateFolderName(1, 'two-sum');
    assert(folder === '0001-two-sum', `Expected 0001-two-sum, got ${folder}`);
  });

  test('pads two digit numbers to 4 digits', () => {
    const folder = generateFolderName(20, 'valid-parentheses');
    assert(folder === '0020-valid-parentheses', `Expected 0020-valid-parentheses, got ${folder}`);
  });

  test('pads three digit numbers to 4 digits', () => {
    const folder = generateFolderName(121, 'best-time-to-buy-and-sell-stock');
    assert(folder === '0121-best-time-to-buy-and-sell-stock', `Expected 0121-best-time-to-buy-and-sell-stock, got ${folder}`);
  });

  test('handles four digit numbers', () => {
    const folder = generateFolderName(1000, 'minimum-cost-to-merge-stones');
    assert(folder === '1000-minimum-cost-to-merge-stones', `Expected 1000-minimum-cost-to-merge-stones, got ${folder}`);
  });

  test('falls back to title normalization if slug is missing', () => {
    const folder = generateFolderName(1, undefined, 'Two Sum');
    assert(folder === '0001-two-sum', `Expected 0001-two-sum, got ${folder}`);
  });

  // 3. HTML to Markdown Conversion
  test('converts HTML tags and constraints cleanly', () => {
    const rawHtml = '<p>Given an array of integers <code>nums</code>.</p><p><strong>Constraints:</strong></p><ul><li><code>1 &le; nums.length</code></li></ul>';
    const md = convertHtmlToMarkdown(rawHtml);
    assert(md.includes('Given an array of integers `nums`.'), 'Paragraph & inline code should match');
    assert(md.includes('### Constraints:'), 'Constraints header should match');
    assert(md.includes('- `1 <= nums.length`'), 'List item & entity should match');
  });

  test('decodes HTML entities properly', () => {
    assert(decodeHtmlEntities('&le;') === '<=', '&le; decoded');
    assert(decodeHtmlEntities('&ge;') === '>=', '&ge; decoded');
    assert(decodeHtmlEntities('&amp;') === '&', '&amp; decoded');
    assert(decodeHtmlEntities('&quot;') === '"', '&quot; decoded');
  });

  // 4. README Generation
  test('generates exact README format for Java', () => {
    const mockMeta: ProblemMetadata = MOCK_PROBLEM_FIXTURES[1];
    const readme = generateReadme({ metadata: mockMeta });

    assert(readme.includes('# 1. Two Sum'), 'Must contain title header');
    assert(readme.includes('**Difficulty:** Easy'), 'Must contain difficulty');
    assert(readme.includes('**LeetCode:** https://leetcode.com/problems/two-sum/'), 'Must contain url');
    assert(readme.includes('## Description'), 'Must contain Description section');
    assert(readme.includes('## Topics\n\n- Array\n- Hash Table'), 'Must contain Topics');
    assert(readme.includes('## Java Solution\n\nSee `Solution.java`.'), 'Must contain Java Solution');
    assert(!readme.includes('## Approach'), 'Must not invent approach');
  });

  // 5. Java Class Name and Problem Number Parser
  test('parses numeric prefix in filenames', () => {
    const res1 = parseProblemFromFile('1.java', 'class Solution {}');
    assert(res1.problemNumber === 1, '1.java should map to problem #1');

    const res20 = parseProblemFromFile('0020-valid-parentheses.java', 'class Solution {}');
    assert(res20.problemNumber === 20, '0020-valid-parentheses.java should map to problem #20');

    const res121 = parseProblemFromFile('0121_BestTimeToBuyStock.java', 'class Solution {}');
    assert(res121.problemNumber === 121, '0121_BestTimeToBuyStock.java should map to problem #121');
  });

  test('parses class names and comments in Java source code', () => {
    const resClass = parseProblemFromFile('Solution.java', 'public class Problem146 { }');
    assert(resClass.problemNumber === 146, 'Problem146 class should map to problem #146');

    const resTwoSumClass = parseProblemFromFile('TwoSum.java', 'public class TwoSum { }');
    assert(resTwoSumClass.problemNumber === 1, 'TwoSum class should map to problem #1');

    const resComment = parseProblemFromFile('Solution.java', '// LeetCode #70: Climbing Stairs\nclass Solution {}');
    assert(resComment.problemNumber === 70, 'Comment #70 should map to problem #70');
  });

  // 6. Mock Problem Fixtures
  test('mock problem fixtures are populated', () => {
    assert(MOCK_PROBLEM_FIXTURES[1].title === 'Two Sum', 'Two Sum fixture');
    assert(MOCK_PROBLEM_FIXTURES[121].title === 'Best Time to Buy and Sell Stock', 'Problem 121 fixture');
    assert(MOCK_PROBLEM_FIXTURES[20].difficulty === 'Easy', 'Problem 20 fixture');
  });

  return results;
}

// Auto-run if executed directly via tsx/node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('organizer.test.ts')) {
  console.log('Running LeetCode Java Organizer Unit Tests...\n');
  const results = runOrganizerTests();
  let passedCount = 0;
  for (const r of results) {
    if (r.passed) {
      console.log(`✓ ${r.name}`);
      passedCount++;
    } else {
      console.error(`✗ ${r.name}: ${r.error}`);
    }
  }
  console.log(`\nResults: ${passedCount}/${results.length} tests passed.`);
}

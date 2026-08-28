import { ProblemMetadata } from '../types';

export const MOCK_PROBLEM_FIXTURES: Record<number, ProblemMetadata> = {
  1: {
    number: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    descriptionHtml: `<p>Given an array of integers <code>nums</code>&nbsp;and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
<p>You may assume that each input would have <strong><em>exactly</em> one solution</strong>, and you may not use the <em>same</em> element twice.</p>
<p>You can return the answer in any order.</p>
<p>&nbsp;</p>
<p><strong class="example">Example 1:</strong></p>
<pre><strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
<strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].
</pre>
<p><strong class="example">Example 2:</strong></p>
<pre><strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]
</pre>
<p><strong class="example">Example 3:</strong></p>
<pre><strong>Input:</strong> nums = [3,3], target = 6
<strong>Output:</strong> [0,1]
</pre>
<p>&nbsp;</p>
<p><strong>Constraints:</strong></p>
<ul>
	<li><code>2 &le; nums.length &le; 10<sup>4</sup></code></li>
	<li><code>-10<sup>9</sup> &le; nums[i] &le; 10<sup>9</sup></code></li>
	<li><code>-10<sup>9</sup> &le; target &le; 10<sup>9</sup></code></li>
	<li><strong>Only one valid answer exists.</strong></li>
</ul>`,
    descriptionMarkdown: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.

You can return the answer in any order.

### Example 1:

\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Example 2:

\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

### Example 3:

\`\`\`
Input: nums = [3,3], target = 6
Output: [0,1]
\`\`\`

### Constraints:

- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Only one valid answer exists.**`,
    topics: ['Array', 'Hash Table'],
    url: 'https://leetcode.com/problems/two-sum/',
  },
  2: {
    number: 2,
    title: 'Add Two Numbers',
    slug: 'add-two-numbers',
    difficulty: 'Medium',
    descriptionHtml: `<p>You are given two <strong>non-empty</strong> linked lists representing two non-negative integers. The digits are stored in <strong>reverse order</strong>, and each of their nodes contains a single digit. Add the two numbers and return the sum&nbsp;as a linked list.</p>
<p>You may assume the two numbers do not contain any leading zero, except the number 0 itself.</p>
<p><strong class="example">Example 1:</strong></p>
<pre><strong>Input:</strong> l1 = [2,4,3], l2 = [5,6,4]
<strong>Output:</strong> [7,0,8]
<strong>Explanation:</strong> 342 + 465 = 807.
</pre>`,
    descriptionMarkdown: `You are given two **non-empty** linked lists representing two non-negative integers. The digits are stored in **reverse order**, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

### Example 1:

\`\`\`
Input: l1 = [2,4,3], l2 = [5,6,4]
Output: [7,0,8]
Explanation: 342 + 465 = 807.
\`\`\``,
    topics: ['Linked List', 'Math', 'Recursion'],
    url: 'https://leetcode.com/problems/add-two-numbers/',
  },
  20: {
    number: 20,
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    descriptionHtml: `<p>Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.</p>
<p>An input string is valid if:</p>
<ol>
	<li>Open brackets must be closed by the same type of brackets.</li>
	<li>Open brackets must be closed in the correct order.</li>
	<li>Every close bracket has a corresponding open bracket of the same type.</li>
</ol>`,
    descriptionMarkdown: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{\'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.`,
    topics: ['String', 'Stack'],
    url: 'https://leetcode.com/problems/valid-parentheses/',
  },
  70: {
    number: 70,
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    descriptionHtml: `<p>You are climbing a staircase. It takes <code>n</code> steps to reach the top.</p>
<p>Each time you can either climb <code>1</code> or <code>2</code> steps. In how many distinct ways can you climb to the top?</p>`,
    descriptionMarkdown: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    topics: ['Math', 'Dynamic Programming', 'Memoization'],
    url: 'https://leetcode.com/problems/climbing-stairs/',
  },
  121: {
    number: 121,
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    descriptionHtml: `<p>You are given an array <code>prices</code> where <code>prices[i]</code> is the price of a given stock on the <code>i<sup>th</sup></code> day.</p>
<p>You want to maximize your profit by choosing a <strong>single day</strong> to buy one stock and choosing a <strong>different day in the future</strong> to sell that stock.</p>`,
    descriptionMarkdown: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i^th\` day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.`,
    topics: ['Array', 'Dynamic Programming'],
    url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
  },
  146: {
    number: 146,
    title: 'LRU Cache',
    slug: 'lru-cache',
    difficulty: 'Medium',
    descriptionHtml: `<p>Design a data structure that follows the constraints of a <strong><a href="https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU" target="_blank">Least Recently Used (LRU) cache</a></strong>.</p>`,
    descriptionMarkdown: `Design a data structure that follows the constraints of a **[Least Recently Used (LRU) cache](https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU)**.`,
    topics: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'],
    url: 'https://leetcode.com/problems/lru-cache/',
  },
};

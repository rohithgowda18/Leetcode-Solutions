/**
 * High-fidelity HTML to Markdown converter tailored for LeetCode problem descriptions.
 * Formats problem descriptions exactly like the LeetCode platform on GitHub.
 */
export function convertHtmlToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let text = html;

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove scripts, styles, comments, and leetcode internal trackers
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Handle LeetCode Example headers with bold style
  text = text.replace(/<p>\s*<strong class="example">\s*Example\s*(\d+):?\s*<\/strong>\s*<\/p>/gi, '\n\n<strong class="example">Example $1:</strong>\n\n');
  text = text.replace(/<strong class="example">\s*Example\s*(\d+):?\s*<\/strong>/gi, '\n\n<strong class="example">Example $1:</strong>\n\n');
  text = text.replace(/<p>\s*<strong>\s*Example\s*(\d+):?\s*<\/strong>\s*<\/p>/gi, '\n\n<strong class="example">Example $1:</strong>\n\n');

  // Handle Constraints headers
  text = text.replace(/<p>\s*<strong class="example">\s*Constraints:?\s*<\/strong>\s*<\/p>/gi, '\n\n**Constraints:**\n\n');
  text = text.replace(/<p>\s*<strong>\s*Constraints:?\s*<\/strong>\s*<\/p>/gi, '\n\n**Constraints:**\n\n');
  text = text.replace(/<strong>\s*Constraints:?\s*<\/strong>/gi, '\n\n**Constraints:**\n\n');

  // Handle code blocks: <pre> ... </pre> (format with nice indentation)
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, codeContent) => {
    // Strip tags but decode entities
    let cleanCode = decodeHtmlEntities(codeContent.replace(/<[^>]+>/g, '')).trim();
    return `\n\n\`\`\`\n${cleanCode}\n\`\`\`\n\n`;
  });

  // Handle superscript and subscript (e.g., 10<sup>4</sup> -> 10^4 or 10⁴)
  text = text.replace(/<sup>([\s\S]*?)<\/sup>/gi, '^$1');
  text = text.replace(/<sub>([\s\S]*?)<\/sub>/gi, '_$1');

  // Handle inline code: <code> ... </code>
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, codeContent) => {
    const clean = decodeHtmlEntities(codeContent.replace(/<[^>]+>/g, '')).trim();
    return `\`${clean}\``;
  });

  // Handle strong/bold & em/italic
  text = text.replace(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
  text = text.replace(/<(?:em|i)\b[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');

  // Handle links
  text = text.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Handle unordered & ordered list items
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '\n$1\n');
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '\n$1\n');

  // Handle paragraphs and breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');

  // Remove any other remaining HTML tags (except standard img or allowed format tags)
  text = text.replace(/<(?!\/?(img|sub|sup|strong|code)\b)[^>]+>/g, '');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Clean up whitespace & multiple blank lines
  text = text
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

/**
 * Decode common HTML entities into their plain text / math equivalents
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';

  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&le;': '≤',
    '&ge;': '≥',
    '&minus;': '-',
    '&times;': '×',
    '&plusmn;': '±',
    '&infin;': '∞',
    '&ne;': '≠',
    '&middot;': '·',
    '&hellip;': '…',
    '&bull;': '•',
    '&deg;': '°',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#32;': ' ',
    '&#160;': ' ',
  };

  let decoded = str;

  // Replace named entities
  for (const [entity, replacement] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(replacement);
  }

  // Replace numeric decimal entities (e.g. &#60;)
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => {
    try {
      return String.fromCharCode(parseInt(code, 10));
    } catch {
      return _;
    }
  });

  // Replace numeric hex entities (e.g. &#x3C;)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return _;
    }
  });

  return decoded;
}

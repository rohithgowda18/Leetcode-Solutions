import { ProblemMetadata } from '../types';
import { convertHtmlToMarkdown } from './htmlToMarkdown';
import { MOCK_PROBLEM_FIXTURES } from './mockFixtures';
import { validateProblemNumber } from './readmeGenerator';

export class ProblemMetadataService {
  private localCache: Map<number, ProblemMetadata> = new Map();
  private readonly CACHE_STORAGE_KEY = 'leetcode_organizer_problem_cache';

  constructor() {
    this.loadClientCache();
  }

  private loadClientCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.CACHE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.values(parsed).forEach((item: any) => {
            if (item && item.number) {
              this.localCache.set(item.number, item);
            }
          });
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private saveClientCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const obj: Record<number, ProblemMetadata> = {};
        this.localCache.forEach((value, key) => {
          obj[key] = value;
        });
        localStorage.setItem(this.CACHE_STORAGE_KEY, JSON.stringify(obj));
      }
    } catch {
      // Ignore localStorage write errors
    }
  }

  /**
   * Get metadata for a LeetCode problem by its number.
   * Public retrieval: Never asks for cookies, session, CSRF tokens or authentication.
   */
  async getProblem(
    problemNumber: number,
    forceRefresh: boolean = false
  ): Promise<{ metadata: ProblemMetadata; fromCache: boolean }> {
    const validation = validateProblemNumber(problemNumber);
    if (!validation.valid || !validation.number) {
      throw new Error(validation.error || 'Invalid problem number.');
    }

    const num = validation.number;

    // 1. Check local cache if not forcing refresh
    if (!forceRefresh && this.localCache.has(num)) {
      const cached = this.localCache.get(num)!;
      return { metadata: { ...cached, fromCache: true }, fromCache: true };
    }

    // 2. Try fetching from the local server backend /api/problems/:num
    try {
      const endpoint = forceRefresh ? `/api/problems/${num}?refresh=true` : `/api/problems/${num}`;
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.metadata) {
          const metadata: ProblemMetadata = {
            ...result.metadata,
            descriptionMarkdown:
              result.metadata.descriptionMarkdown ||
              convertHtmlToMarkdown(result.metadata.descriptionHtml || ''),
          };

          this.localCache.set(num, metadata);
          this.saveClientCache();

          return {
            metadata,
            fromCache: Boolean(result.fromCache && !forceRefresh),
          };
        }
      }
    } catch {
      // Backend fetch failed or in offline mode, continue to fallbacks
    }

    // 3. Fallback to mock fixtures / offline database if available
    if (MOCK_PROBLEM_FIXTURES[num]) {
      const fixture = MOCK_PROBLEM_FIXTURES[num];
      this.localCache.set(num, fixture);
      this.saveClientCache();
      return {
        metadata: { ...fixture, fromCache: true },
        fromCache: true,
      };
    }

    // 4. If we have any cached version even if forceRefresh failed, use it
    if (this.localCache.has(num)) {
      const cached = this.localCache.get(num)!;
      return { metadata: { ...cached, fromCache: true }, fromCache: true };
    }

    // 5. If everything failed, throw user-friendly error
    throw new Error(
      `Could not retrieve problem #${num} metadata. Check your internet connection or verify the problem number.`
    );
  }

  /**
   * Get all currently cached problems
   */
  getAllCached(): ProblemMetadata[] {
    return Array.from(this.localCache.values()).sort((a, b) => a.number - b.number);
  }

  /**
   * Manually put/update metadata into cache
   */
  setCache(metadata: ProblemMetadata) {
    this.localCache.set(metadata.number, metadata);
    this.saveClientCache();
  }

  /**
   * Clear client cache
   */
  clearCache() {
    this.localCache.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.CACHE_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }
}

export const problemMetadataService = new ProblemMetadataService();

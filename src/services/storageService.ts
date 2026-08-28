import JSZip from 'jszip';
import {
  DuplicateCheckResult,
  OrganizedProblem,
  JavaSolutionConfig,
  ProblemMetadata,
} from '../types';
import { generateFolderName, generateReadme } from './readmeGenerator';

export class StorageService {
  private outputDirectory = 'leetcode-solutions';

  /**
   * Check if problem already exists locally
   */
  async checkDuplicate(problemNumber: number): Promise<DuplicateCheckResult> {
    try {
      const res = await fetch(`/api/solutions/check?number=${problemNumber}`);
      if (res.ok) {
        const data = await res.json();
        return {
          folderExists: Boolean(data.folderExists),
          folderName: data.folderName,
          solutionFileExists: Boolean(data.solutionFileExists),
          problemTitle: data.problemTitle,
          existingFiles: data.existingFiles || [],
        };
      }
    } catch {
      // Fallback
    }

    return {
      folderExists: false,
      folderName: ``,
      solutionFileExists: false,
      existingFiles: [],
    };
  }

  /**
   * Save organized Java problem: creates folder, README.md, Solution.java
   */
  async saveJavaSolution(
    metadata: ProblemMetadata,
    config: JavaSolutionConfig
  ): Promise<{
    folderName: string;
    fullPath: string;
    readmePath: string;
    solutionPath: string;
    readmeContent: string;
    modeUsed: 'server' | 'zip_download';
    zipBlob?: Blob;
  }> {
    const folderName = generateFolderName(config.problemNumber, metadata.slug, metadata.title);
    const readmeContent = generateReadme({ metadata });

    // 1. Primary: Save directly to local filesystem via server
    try {
      const response = await fetch('/api/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemNumber: config.problemNumber,
          solutionContent: config.solutionContent,
          overwriteSolution: config.overwriteSolution ?? true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          folderName: result.folderName || folderName,
          fullPath: result.fullPath || `${this.outputDirectory}/${folderName}`,
          readmePath: result.readmePath || `${this.outputDirectory}/${folderName}/README.md`,
          solutionPath: result.solutionPath || `${this.outputDirectory}/${folderName}/Solution.java`,
          readmeContent,
          modeUsed: 'server',
        };
      }
    } catch {
      // Fallback to browser ZIP if server unreachable
    }

    // 2. Client ZIP Fallback
    const zip = new JSZip();
    const folder = zip.folder(folderName);
    if (folder) {
      folder.file('README.md', readmeContent);
      folder.file('Solution.java', config.solutionContent);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return {
      folderName,
      fullPath: `${this.outputDirectory}/${folderName}`,
      readmePath: `${this.outputDirectory}/${folderName}/README.md`,
      solutionPath: `${this.outputDirectory}/${folderName}/Solution.java`,
      readmeContent,
      modeUsed: 'zip_download',
      zipBlob,
    };
  }

  /**
   * List all saved Java solutions
   */
  async listOrganizedSolutions(): Promise<OrganizedProblem[]> {
    try {
      const res = await fetch('/api/solutions');
      if (res.ok) {
        const data = await res.json();
        return data.solutions || [];
      }
    } catch {
      //
    }
    return [];
  }

  /**
   * Get contents for revision (README.md and Solution.java)
   */
  async getProblemContents(folderName: string): Promise<{ readme: string; solution: string }> {
    try {
      const res = await fetch(`/api/solutions/${encodeURIComponent(folderName)}/content`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      //
    }
    return { readme: '', solution: '' };
  }
}

export const storageService = new StorageService();

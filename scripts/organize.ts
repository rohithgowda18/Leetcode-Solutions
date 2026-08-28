import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { saveSolution, detectCategory } from '../server/api';

/**
 * Extracts problem number from a filename or argument.
 * Examples: '1.java' -> 1, '610.sql' -> 610, '121-two-sum.java' -> 121
 */
function extractProblemNumber(str: string): number | null {
  const base = path.basename(str);
  const match = base.match(/^(\d+)/) || base.match(/[^\d](\d+)[^\d]/) || base.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return null;
}

const SUPPORTED_EXTENSIONS = ['.java', '.sql', '.py', '.cpp', '.js', '.ts'];

/**
 * Find all loose solution files in a directory
 */
function findLooseSolutionFiles(searchDir: string, defaultCategory?: 'dsa' | 'database'): { filePath: string; category?: 'dsa' | 'database' }[] {
  if (!fs.existsSync(searchDir)) return [];
  const entries = fs.readdirSync(searchDir, { withFileTypes: true });
  const results: { filePath: string; category?: 'dsa' | 'database' }[] = [];

  for (const entry of entries) {
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext) && !entry.name.toLowerCase().startsWith('solution.')) {
        const cat = defaultCategory || (ext === '.sql' ? 'database' : undefined);
        results.push({
          filePath: path.join(searchDir, entry.name),
          category: cat,
        });
      }
    }
  }

  return results;
}

async function run() {
  const args = process.argv.slice(2);
  const shouldPush = args.includes('--push');
  const shouldClean = args.includes('--clean');

  // Filter out flags from positional args
  const positionalArgs = args.filter(arg => !arg.startsWith('--'));

  console.log('🚀 LeetCode Solution Organizer (DSA & Database)\n');

  const filesToProcess: { filePath: string; problemNumber: number; category?: 'dsa' | 'database' }[] = [];

  if (positionalArgs.length >= 2 && !isNaN(parseInt(positionalArgs[0], 10))) {
    // Usage: npx tsx scripts/organize.ts <problemNumber> <filePath>
    const problemNumber = parseInt(positionalArgs[0], 10);
    const filePath = path.resolve(positionalArgs[1]);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    const cat = filePath.endsWith('.sql') ? 'database' : undefined;
    filesToProcess.push({ filePath, problemNumber, category: cat });
  } else if (positionalArgs.length === 1 && fs.existsSync(positionalArgs[0])) {
    const targetPath = path.resolve(positionalArgs[0]);
    const stat = fs.statSync(targetPath);

    if (stat.isDirectory()) {
      const catHint = targetPath.toLowerCase().includes('database') ? 'database' : targetPath.toLowerCase().includes('dsa') ? 'dsa' : undefined;
      const files = findLooseSolutionFiles(targetPath, catHint);
      for (const item of files) {
        const num = extractProblemNumber(item.filePath);
        if (num) {
          filesToProcess.push({ filePath: item.filePath, problemNumber: num, category: item.category });
        } else {
          console.warn(`⚠️ Could not detect problem number from: ${path.basename(item.filePath)}. Skipping.`);
        }
      }
    } else if (stat.isFile()) {
      const num = extractProblemNumber(targetPath);
      if (num) {
        const cat = targetPath.endsWith('.sql') ? 'database' : undefined;
        filesToProcess.push({ filePath: targetPath, problemNumber: num, category: cat });
      } else {
        console.error(`❌ Could not detect problem number from filename: ${path.basename(targetPath)}`);
        process.exit(1);
      }
    }
  } else {
    // Default: Check input-solutions/dsa, input-solutions/database, input-solutions/, and root
    const dsaFiles = findLooseSolutionFiles(path.join(process.cwd(), 'input-solutions', 'dsa'), 'dsa');
    const dbFiles = findLooseSolutionFiles(path.join(process.cwd(), 'input-solutions', 'database'), 'database');
    const generalInputFiles = findLooseSolutionFiles(path.join(process.cwd(), 'input-solutions'));
    const rootFiles = findLooseSolutionFiles(process.cwd());

    const combined = [...dsaFiles, ...dbFiles, ...generalInputFiles, ...rootFiles];

    // Remove duplicates if any
    const seen = new Set<string>();
    for (const item of combined) {
      if (!seen.has(item.filePath)) {
        seen.add(item.filePath);
        const num = extractProblemNumber(item.filePath);
        if (num) {
          filesToProcess.push({ filePath: item.filePath, problemNumber: num, category: item.category });
        }
      }
    }
  }

  if (filesToProcess.length === 0) {
    console.log('ℹ️ No loose solution files found to organize.');
    console.log('💡 How to organize:');
    console.log('   - Drop DSA files (.java) in:      input-solutions/dsa/      (e.g., 1.java, 121.java)');
    console.log('   - Drop SQL files (.sql) in:       input-solutions/database/ (e.g., 180.sql, 610.sql)');
    console.log('   - Run: npm run organize          (to organize locally without pushing)');
    console.log('   - Run: npm run organize:push     (to organize, commit, and push in ONE step)');
    return;
  }

  console.log(`📦 Found ${filesToProcess.length} solution file(s) to process:\n`);

  const processedProblems: string[] = [];

  for (const { filePath, problemNumber, category } of filesToProcess) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const filename = ext === '.sql' ? 'Solution.sql' : ext === '.java' ? 'Solution.java' : `Solution${ext}`;
      const solutionContent = fs.readFileSync(filePath, 'utf-8');

      console.log(`⏳ Processing Problem #${problemNumber} (${path.basename(filePath)})...`);

      const result = await saveSolution({
        problemNumber,
        solutionContent,
        overwriteSolution: true,
        category,
        filename,
      });

      console.log(`   ✅ [${result.category.toUpperCase()}] Saved to: ${result.fullPath}`);
      console.log(`   📄 Created: ${result.solutionPath} & README.md`);
      processedProblems.push(`[${result.category.toUpperCase()}] #${problemNumber} ${result.metadata.title}`);

      // Clean up source loose file if --clean flag is present
      if (shouldClean) {
        fs.unlinkSync(filePath);
        console.log(`   🧹 Cleaned up source file: ${path.basename(filePath)}`);
      }
    } catch (err: any) {
      console.error(`   ❌ Failed to process #${problemNumber}: ${err.message}`);
    }
  }

  console.log('\n🎉 Organization complete!');

  // Handle Git workflow if --push flag is present
  if (shouldPush) {
    console.log('\n🔄 Git automation started...');
    try {
      console.log('   👉 Running: git add .');
      execSync('git add .', { stdio: 'inherit' });

      const commitMsg =
        processedProblems.length === 1
          ? `Add LeetCode solution: ${processedProblems[0]}`
          : `Add ${processedProblems.length} LeetCode solutions: ${processedProblems.map(p => p.split(' ')[1]).join(', ')}`;

      console.log(`   👉 Running: git commit -m "${commitMsg}"`);
      try {
        execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
      } catch (commitErr: any) {
        console.log('   ℹ️ Nothing new to commit or already up to date.');
      }

      console.log('   👉 Running: git push');
      execSync('git push', { stdio: 'inherit' });

      console.log('\n🚀 Successfully pushed to Git repository!');
    } catch (gitErr: any) {
      console.error('\n❌ Git command failed:', gitErr.message);
    }
  } else {
    console.log('\n💡 Next steps (Manual Git workflow):');
    console.log('   git add .');
    console.log('   git commit -m "Add LeetCode solutions"');
    console.log('   git push');
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

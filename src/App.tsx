import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Upload,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  Folder
} from 'lucide-react';
import { ProblemMetadata } from './types';
import { problemMetadataService } from './services/problemMetadataService';
import { storageService } from './services/storageService';
import { parseProblemFromFile } from './services/problemParser';

export default function App() {
  const [problemNumber, setProblemNumber] = useState<string>('1');
  const [solutionCode, setSolutionCode] = useState<string>(
`class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`
  );
  const [fileName, setFileName] = useState<string>('Solution.java');
  const [metadata, setMetadata] = useState<ProblemMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    number: number;
    title: string;
    folderName: string;
    category: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch metadata whenever problem number changes
  useEffect(() => {
    const num = parseInt(problemNumber.trim(), 10);
    if (!isNaN(num) && num > 0) {
      fetchMetadata(num);
    } else {
      setMetadata(null);
      setMetaError(null);
    }
  }, [problemNumber]);

  async function fetchMetadata(num: number) {
    setLoadingMeta(true);
    setMetaError(null);
    try {
      const result = await problemMetadataService.getProblem(num, false);
      setMetadata(result.metadata);
    } catch (err: any) {
      setMetaError(err.message || `Problem #${num} not found.`);
      setMetadata(null);
    } finally {
      setLoadingMeta(false);
    }
  }

  // Handle uploaded file (extracts number from filename, sets code & name)
  async function handleFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSubmitError(null);
    setSuccessInfo(null);

    const file = files[0];
    const text = await file.text();
    const parsed = parseProblemFromFile(file.name, text);

    setFileName(file.name);
    setSolutionCode(text);

    if (parsed.problemNumber) {
      setProblemNumber(String(parsed.problemNumber));
    }
  }

  // Submit and organize
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessInfo(null);

    const num = parseInt(problemNumber.trim(), 10);
    if (isNaN(num) || num <= 0) {
      setSubmitError('Please enter a valid problem number.');
      return;
    }

    if (!solutionCode.trim()) {
      setSubmitError('Please enter or upload solution code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isSql = fileName.toLowerCase().endsWith('.sql') || solutionCode.toLowerCase().includes('select ');
      const category = isSql ? 'database' : 'dsa';
      const actualFileName = isSql ? 'Solution.sql' : 'Solution.java';

      const res = await fetch('/api/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemNumber: num,
          solutionContent: solutionCode,
          overwriteSolution: true,
          category,
          filename: actualFileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save solution.');
      }

      setSuccessInfo({
        number: num,
        title: data.metadata?.title || metadata?.title || `Problem #${num}`,
        folderName: data.folderName || `${num}`,
        category: (data.category || category).toUpperCase(),
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to organize solution.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".java,.sql,.py,.cpp"
        onChange={e => handleFile(e.target.files)}
        className="hidden"
      />

      <div className="w-full max-w-2xl space-y-6">
        {/* Minimal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-inner">
              <Code2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-100">LeetCode Solution Organizer</h1>
              <p className="text-xs text-neutral-400">Save code & auto-generate LeetCode README</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>

        {/* Single Form Box */}
        <form onSubmit={handleSubmit} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-5">
          {/* Top Row: Problem # & Auto-detected Problem Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Problem Number */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-neutral-300">Problem #</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  value={problemNumber}
                  onChange={e => setProblemNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 font-mono outline-none"
                />
                {loadingMeta && (
                  <div className="absolute right-3 top-2.5">
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Problem Name & Metadata (Auto-populated) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-300">Problem Name</label>
              <div className="min-h-[42px] bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2">
                {metadata ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] shrink-0 ${
                        metadata.difficulty === 'Easy'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : metadata.difficulty === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {metadata.difficulty}
                    </span>
                    <span className="font-semibold text-neutral-200 text-xs truncate">
                      #{metadata.number}. {metadata.title}
                    </span>
                  </div>
                ) : loadingMeta ? (
                  <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    Fetching LeetCode title...
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500">Auto-detected from problem #</span>
                )}

                {metadata && (
                  <a
                    href={metadata.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-400 hover:text-amber-400 p-1 transition-colors shrink-0"
                    title="View on LeetCode"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {metaError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {metaError}
            </p>
          )}

          {/* Solution Code */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Code</span>
                <span className="text-[11px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {fileName}
                </span>
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
              >
                Choose File
              </button>
            </div>

            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                handleFile(e.dataTransfer.files);
              }}
              className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/40"
            >
              <textarea
                value={solutionCode}
                onChange={e => setSolutionCode(e.target.value)}
                rows={12}
                spellCheck={false}
                placeholder="Paste code or drop a solution file..."
                className="w-full bg-transparent p-4 font-mono text-xs sm:text-sm text-neutral-200 outline-none resize-y leading-relaxed"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Upload / Save Button */}
          <button
            type="submit"
            disabled={isSubmitting || loadingMeta}
            className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Organizing Solution...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>UPLOAD & ORGANIZE SOLUTION</span>
              </>
            )}
          </button>
        </form>

        {/* Success Card */}
        {successInfo && (
          <div className="bg-neutral-900/90 border border-emerald-500/40 rounded-2xl p-5 shadow-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-100">
                  ✓ Organized #{successInfo.number} {successInfo.title}!
                </h2>
                <p className="text-xs text-neutral-400">
                  Created folder and README in <span className="font-mono text-amber-400">{successInfo.category.toLowerCase()}/{successInfo.folderName}/</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

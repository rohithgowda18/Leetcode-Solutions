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
  Trash2,
  X
} from 'lucide-react';
import { ProblemMetadata } from './types';
import { problemMetadataService } from './services/problemMetadataService';
import { parseProblemFromFile } from './services/problemParser';

interface QueueItem {
  id: string;
  file: File;
  fileName: string;
  problemNumber: number | null;
  codeContent: string;
  category: 'dsa' | 'database';
  metadata: ProblemMetadata | null;
  status: 'pending' | 'loading' | 'ready' | 'saving' | 'done' | 'error';
  errorMsg?: string;
}

export default function App() {
  // Single mode state - empty by default
  const [problemNumber, setProblemNumber] = useState<string>('');
  const [solutionCode, setSolutionCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Solution.java');
  const [metadata, setMetadata] = useState<ProblemMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Bulk / Multi-File state
  const [fileQueue, setFileQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [queueProgress, setQueueProgress] = useState<{ current: number; total: number } | null>(null);

  // General submission & result state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    count: number;
    details: { number: number; title: string; category: string; folder: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch metadata for single mode with debounce
  useEffect(() => {
    if (fileQueue.length === 0) {
      const num = parseInt(problemNumber.trim(), 10);
      if (!isNaN(num) && num > 0) {
        const timer = setTimeout(() => {
          fetchSingleMetadata(num);
        }, 350);
        return () => clearTimeout(timer);
      } else {
        setMetadata(null);
        setMetaError(null);
      }
    }
  }, [problemNumber, fileQueue.length]);

  async function fetchSingleMetadata(num: number) {
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

  // Handle uploaded file(s) - Supports 1 file or 100 files (DSA & Database)
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSubmitError(null);
    setSuccessInfo(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const ext = files[i].name.toLowerCase();
      if (ext.endsWith('.java') || ext.endsWith('.sql') || ext.endsWith('.py') || ext.endsWith('.cpp')) {
        validFiles.push(files[i]);
      }
    }

    if (validFiles.length === 0) {
      setSubmitError('Please select valid solution files (.java or .sql).');
      return;
    }

    // If exactly 1 file is selected, populate single form directly
    if (validFiles.length === 1 && fileQueue.length === 0) {
      const file = validFiles[0];
      const text = await file.text();
      const parsed = parseProblemFromFile(file.name, text);
      const isSql = file.name.toLowerCase().endsWith('.sql') || text.toLowerCase().includes('select ');

      setFileName(file.name);
      setSolutionCode(text);
      if (parsed.problemNumber) {
        setProblemNumber(String(parsed.problemNumber));
      }
      return;
    }

    // Multiple files: build queue
    const newItems: QueueItem[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const text = await file.text();
      const parsed = parseProblemFromFile(file.name, text);
      const isSql = file.name.toLowerCase().endsWith('.sql') || text.toLowerCase().includes('select ');

      newItems.push({
        id: `${file.name}-${Date.now()}-${i}`,
        file,
        fileName: file.name,
        problemNumber: parsed.problemNumber,
        codeContent: text,
        category: isSql ? 'database' : 'dsa',
        metadata: null,
        status: parsed.problemNumber ? 'loading' : 'pending',
      });
    }

    setFileQueue(prev => [...prev, ...newItems]);

    // Fetch LeetCode titles for each file
    newItems.forEach(item => {
      if (item.problemNumber) {
        fetchQueueItemMetadata(item.id, item.problemNumber);
      }
    });
  }

  async function fetchQueueItemMetadata(itemId: string, num: number) {
    try {
      const res = await problemMetadataService.getProblem(num, false);
      setFileQueue(prev =>
        prev.map(it => (it.id === itemId ? { ...it, problemNumber: num, metadata: res.metadata, status: 'ready' } : it))
      );
    } catch {
      setFileQueue(prev =>
        prev.map(it => (it.id === itemId ? { ...it, problemNumber: num, status: 'ready' } : it))
      );
    }
  }

  function updateItemNumber(id: string, val: string) {
    const num = parseInt(val.trim(), 10);
    const validNum = !isNaN(num) && num > 0 ? num : null;
    setFileQueue(prev =>
      prev.map(it => (it.id === id ? { ...it, problemNumber: validNum, status: validNum ? 'loading' : 'pending' } : it))
    );
    if (validNum) {
      fetchQueueItemMetadata(id, validNum);
    }
  }

  function removeItem(id: string) {
    setFileQueue(prev => prev.filter(it => it.id !== id));
  }

  function clearQueue() {
    setFileQueue([]);
    setSuccessInfo(null);
    setSubmitError(null);
  }

  // Submit single problem or entire queue
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessInfo(null);

    // MODE 1: Process Multi-File Bulk Queue
    if (fileQueue.length > 0) {
      const missingNum = fileQueue.find(it => !it.problemNumber || it.problemNumber <= 0);
      if (missingNum) {
        setSubmitError(`Please provide problem numbers for all files in queue (missing on: ${missingNum.fileName}).`);
        return;
      }

      setIsProcessingQueue(true);
      const results: { number: number; title: string; category: string; folder: string }[] = [];

      for (let i = 0; i < fileQueue.length; i++) {
        const item = fileQueue[i];
        setQueueProgress({ current: i + 1, total: fileQueue.length });

        // Update item status
        setFileQueue(prev => prev.map(it => (it.id === item.id ? { ...it, status: 'saving' } : it)));

        try {
          const actualFileName = item.category === 'database' ? 'Solution.sql' : 'Solution.java';
          const res = await fetch('/api/solutions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemNumber: item.problemNumber,
              solutionContent: item.codeContent,
              overwriteSolution: true,
              category: item.category,
              filename: actualFileName,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            results.push({
              number: item.problemNumber!,
              title: data.metadata?.title || item.metadata?.title || `Problem #${item.problemNumber}`,
              category: (data.category || item.category).toUpperCase(),
              folder: data.folderName || `${item.problemNumber}`,
            });
            setFileQueue(prev => prev.map(it => (it.id === item.id ? { ...it, status: 'done' } : it)));
          } else {
            setFileQueue(prev =>
              prev.map(it => (it.id === item.id ? { ...it, status: 'error', errorMsg: data.error } : it))
            );
          }
        } catch (err: any) {
          setFileQueue(prev =>
            prev.map(it => (it.id === item.id ? { ...it, status: 'error', errorMsg: err.message } : it))
          );
        }
      }

      setIsProcessingQueue(false);
      setQueueProgress(null);
      setSuccessInfo({
        count: results.length,
        details: results,
      });
      return;
    }

    // MODE 2: Process Single Problem
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
        count: 1,
        details: [
          {
            number: num,
            title: data.metadata?.title || metadata?.title || `Problem #${num}`,
            category: (data.category || category).toUpperCase(),
            folder: data.folderName || `${num}`,
          },
        ],
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
        multiple
        accept=".java,.sql,.py,.cpp"
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
      />

      <div className="w-full max-w-3xl space-y-6">
        {/* Minimal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-inner">
              <Code2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-100">LeetCode Solution Organizer</h1>
              <p className="text-xs text-neutral-400">Single or Bulk Upload for DSA (.java) and Database (.sql)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              Upload File(s)
            </button>

            {fileQueue.length > 0 && (
              <button
                type="button"
                onClick={clearQueue}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs rounded-xl transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Main Box */}
        <form onSubmit={handleSubmit} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-5">
          {/* VIEW A: Bulk Queue (when multiple files uploaded) */}
          {fileQueue.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-semibold text-neutral-200">
                  Bulk Files to Organize ({fileQueue.length} Files: {fileQueue.filter(f => f.category === 'dsa').length} DSA, {fileQueue.filter(f => f.category === 'database').length} Database)
                </span>
                <span className="text-[11px] text-neutral-500">Problem numbers auto-mapped from file names</span>
              </div>

              <div className="border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800 bg-neutral-950 max-h-96 overflow-y-auto">
                {fileQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-neutral-900/40 transition-colors"
                  >
                    {/* File Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono text-[10px] text-neutral-400 shrink-0">
                        {idx + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        item.category === 'database'
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.category.toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-neutral-200 font-medium truncate">{item.fileName}</p>
                        {item.metadata && (
                          <p className="text-[11px] text-neutral-400 truncate">
                            #{item.metadata.number}. {item.metadata.title} ({item.metadata.difficulty})
                          </p>
                        )}
                        {item.errorMsg && <p className="text-[11px] text-rose-400">{item.errorMsg}</p>}
                      </div>
                    </div>

                    {/* Problem Number Input & Status */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] text-neutral-500 font-mono">#</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Num"
                          value={item.problemNumber || ''}
                          onChange={e => updateItemNumber(item.id, e.target.value)}
                          className="w-16 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-200 font-mono focus:border-amber-500/60 outline-none"
                        />
                      </div>

                      <div className="w-20 text-right">
                        {item.status === 'done' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Saved
                          </span>
                        ) : item.status === 'saving' ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                          </span>
                        ) : item.status === 'loading' ? (
                          <span className="text-neutral-500 text-[11px] flex items-center gap-1 justify-end">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Fetching
                          </span>
                        ) : (
                          <span className="text-amber-300 text-[11px]">Ready</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-neutral-800 hover:border-amber-500/40 rounded-xl p-3 text-center cursor-pointer transition-colors bg-neutral-950/40 text-xs text-neutral-500 hover:text-neutral-300"
              >
                + Drop more .java or .sql files here to add to bulk queue
              </div>
            </div>
          ) : (
            /* VIEW B: Single Problem Flow */
            <div className="space-y-5">
              {/* Problem # and Auto-detected Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    Upload File(s)
                  </button>
                </div>

                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    handleFiles(e.dataTransfer.files);
                  }}
                  className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/40"
                >
                  <textarea
                    value={solutionCode}
                    onChange={e => setSolutionCode(e.target.value)}
                    rows={11}
                    spellCheck={false}
                    placeholder="Paste code or drop solution file (.java / .sql)..."
                    className="w-full bg-transparent p-4 font-mono text-xs sm:text-sm text-neutral-200 outline-none resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || isProcessingQueue || loadingMeta}
            className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessingQueue ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  Processing {queueProgress?.current || 1} of {queueProgress?.total || fileQueue.length}...
                </span>
              </>
            ) : isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Organizing Solution...</span>
              </>
            ) : fileQueue.length > 0 ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>UPLOAD & ORGANIZE ALL ({fileQueue.length} FILES)</span>
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
                  ✓ Successfully Organized {successInfo.count} Solution{successInfo.count > 1 ? 's' : ''}!
                </h2>
                <div className="text-xs text-neutral-400 mt-1 space-y-0.5">
                  {successInfo.details.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded">
                        [{d.category}]
                      </span>
                      <span>#{d.number}. {d.title}</span>
                      <span className="text-neutral-500 text-[10px]">({d.category.toLowerCase()}/{d.folder}/)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

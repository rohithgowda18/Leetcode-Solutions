import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Folder,
  FileCode2,
  FileText,
  Upload,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Code2,
  Filter,
  Plus,
  Trash2,
  ListOrdered,
  X,
  Play,
  GitFork,
  Cloud,
  Settings,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';
import { ProblemMetadata, OrganizedProblem, DuplicateCheckResult } from './types';
import { problemMetadataService } from './services/problemMetadataService';
import { storageService } from './services/storageService';
import { generateFolderName } from './services/readmeGenerator';
import { parseProblemFromFile } from './services/problemParser';

export interface FileQueueItem {
  id: string;
  file?: File;
  fileName: string;
  codeContent: string;
  className?: string;
  problemNumber: number | null;
  detectionSource?: string;
  metadata: ProblemMetadata | null;
  status: 'pending' | 'loading_meta' | 'ready' | 'processing' | 'done' | 'error';
  errorMsg?: string;
}

export default function App() {
  // Single/Direct Mode Input State (when 1 file is active or manual entry)
  const [problemNumberInput, setProblemNumberInput] = useState<string>('1');
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

  // Metadata State for single problem
  const [metadata, setMetadata] = useState<ProblemMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // File Queue State for Single or Multiple Files
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [queueProgress, setQueueProgress] = useState<{ current: number; total: number } | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    count: number;
    problems: { number: number; title: string; folderName: string }[];
    gitCommands: string;
    zipBlob?: Blob;
  } | null>(null);

  // Duplicate Check Dialog
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    folderName: string;
    number: number;
    title: string;
    onConfirm: () => void;
  } | null>(null);

  // Revision & Solved Problems
  const [solvedList, setSolvedList] = useState<OrganizedProblem[]>([]);
  const [activeTab, setActiveTab] = useState<'add' | 'revise'>('add');
  const [selectedRevision, setSelectedRevision] = useState<{
    problem: OrganizedProblem;
    readme: string;
    solution: string;
  } | null>(null);
  const [loadingRevision, setLoadingRevision] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('All');

  // Git Remote Sync State
  const [showGitSync, setShowGitSync] = useState<boolean>(true);
  const [gitRemoteUrl, setGitRemoteUrl] = useState<string>('');
  const [gitBranch, setGitBranch] = useState<string>('main');
  const [customCommitMsg, setCustomCommitMsg] = useState<string>('');
  const [hasRemoteConfigured, setHasRemoteConfigured] = useState<boolean>(false);
  const [isSyncingGit, setIsSyncingGit] = useState<boolean>(false);
  const [gitSyncStatusMsg, setGitSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load Git status on mount
  useEffect(() => {
    loadGitStatus();
  }, []);

  async function loadGitStatus() {
    try {
      const res = await fetch('/api/git/status');
      if (res.ok) {
        const data = await res.json();
        setHasRemoteConfigured(data.hasRemote);
        if (data.remoteUrl) setGitRemoteUrl(data.remoteUrl);
        if (data.branch) setGitBranch(data.branch);
      }
    } catch {
      // ignore
    }
  }

  async function handleSaveGitConfig() {
    setGitSyncStatusMsg(null);
    try {
      const res = await fetch('/api/git/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteUrl: gitRemoteUrl, branch: gitBranch }),
      });
      const data = await res.json();
      if (res.ok) {
        setHasRemoteConfigured(data.hasRemote);
        setGitSyncStatusMsg({ type: 'success', text: 'Git remote configuration saved successfully!' });
      } else {
        setGitSyncStatusMsg({ type: 'error', text: data.error || 'Failed to save config.' });
      }
    } catch (err: any) {
      setGitSyncStatusMsg({ type: 'error', text: err.message || 'Network error.' });
    }
  }

  async function handleSyncWithRemote() {
    setIsSyncingGit(true);
    setGitSyncStatusMsg({ type: 'info', text: 'Syncing with remote repository...' });
    try {
      const res = await fetch('/api/git/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMessage: customCommitMsg, branch: gitBranch }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGitSyncStatusMsg({ type: 'success', text: 'Successfully synced solutions with remote GitHub repo!' });
        loadSolvedProblems();
      } else {
        setGitSyncStatusMsg({ type: 'error', text: data.error || 'Git sync failed.' });
      }
    } catch (err: any) {
      setGitSyncStatusMsg({ type: 'error', text: err.message || 'Sync failed.' });
    } finally {
      setIsSyncingGit(false);
    }
  }

  // UI helpers
  const [copiedGit, setCopiedGit] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load problem metadata for single problem number input
  useEffect(() => {
    if (fileQueue.length === 0) {
      const num = parseInt(problemNumberInput.trim(), 10);
      if (!isNaN(num) && num > 0) {
        fetchMetadata(num, false);
      } else {
        setMetadata(null);
        setMetaError(null);
      }
    }
  }, [problemNumberInput, fileQueue.length]);

  // Load existing solved problems on mount
  useEffect(() => {
    loadSolvedProblems();
  }, []);

  async function loadSolvedProblems() {
    try {
      const list = await storageService.listOrganizedSolutions();
      setSolvedList(list);
    } catch {
      // ignore
    }
  }

  async function fetchMetadata(num: number, forceRefresh: boolean = false) {
    setLoadingMeta(true);
    setMetaError(null);
    try {
      const result = await problemMetadataService.getProblem(num, forceRefresh);
      setMetadata(result.metadata);
    } catch (err: any) {
      setMetaError(err.message || `Could not retrieve problem #${num} metadata.`);
      setMetadata(null);
    } finally {
      setLoadingMeta(false);
    }
  }

  // --- MULTI-FILE SELECTION & PARSING HANDLER ---
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

    // Process all files and extract problem numbers
    const newItems: FileQueueItem[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const text = await file.text();
      const parsed = parseProblemFromFile(file.name, text);

      newItems.push({
        id: `${file.name}-${Date.now()}-${i}`,
        file,
        fileName: file.name,
        codeContent: text,
        className: parsed.className,
        problemNumber: parsed.problemNumber,
        detectionSource: parsed.detectionSource,
        metadata: null,
        status: parsed.problemNumber ? 'loading_meta' : 'pending',
      });
    }

    if (validFiles.length === 1) {
      // If 1 file was uploaded, populate filename, code, and auto-extracted problem number
      setFileName(newItems[0].fileName);
      setSolutionCode(newItems[0].codeContent);
      if (newItems[0].problemNumber) {
        setProblemNumberInput(String(newItems[0].problemNumber));
      }
      setFileQueue([]);
      return;
    }

    setFileQueue(prev => [...prev, ...newItems]);

    // Fetch metadata asynchronously for all queued items
    newItems.forEach(item => {
      if (item.problemNumber) {
        loadQueueItemMetadata(item.id, item.problemNumber);
      }
    });
  }

  async function loadQueueItemMetadata(itemId: string, num: number) {
    try {
      const metaRes = await problemMetadataService.getProblem(num, false);
      setFileQueue(prev =>
        prev.map(it =>
          it.id === itemId
            ? {
                ...it,
                problemNumber: num,
                metadata: metaRes.metadata,
                status: 'ready',
                errorMsg: undefined,
              }
            : it
        )
      );
    } catch {
      setFileQueue(prev =>
        prev.map(it =>
          it.id === itemId
            ? {
                ...it,
                problemNumber: num,
                status: 'ready',
                errorMsg: 'Could not fetch metadata from LeetCode (offline/cached)',
              }
            : it
        )
      );
    }
  }

  function updateQueueItemNumber(itemId: string, numStr: string) {
    const num = parseInt(numStr.trim(), 10);
    if (isNaN(num) || num <= 0) {
      setFileQueue(prev =>
        prev.map(it =>
          it.id === itemId
            ? { ...it, problemNumber: null, metadata: null, status: 'pending' }
            : it
        )
      );
      return;
    }

    setFileQueue(prev =>
      prev.map(it =>
        it.id === itemId
          ? { ...it, problemNumber: num, status: 'loading_meta' }
          : it
      )
    );
    loadQueueItemMetadata(itemId, num);
  }

  function removeQueueItem(itemId: string) {
    setFileQueue(prev => prev.filter(it => it.id !== itemId));
  }

  function clearQueue() {
    setFileQueue([]);
    setSuccessInfo(null);
    setSubmitError(null);
  }

  // --- QUEUE PROCESSOR: ADD PROBLEM WORKFLOW ---
  async function processQueue() {
    if (fileQueue.length === 0) {
      // Fallback to single manual problem
      await handleAddSingleProblem();
      return;
    }

    // Check if any items are missing problem numbers
    const missingNumber = fileQueue.find(it => !it.problemNumber || it.problemNumber <= 0);
    if (missingNumber) {
      setSubmitError(
        `Please specify the problem number for "${missingNumber.fileName}". We could not auto-detect it from the file name or class name.`
      );
      return;
    }

    setSubmitError(null);
    setIsProcessingQueue(true);
    const addedProblems: { number: number; title: string; folderName: string }[] = [];

    const itemsToProcess = fileQueue.filter(it => it.status !== 'done');
    setQueueProgress({ current: 0, total: itemsToProcess.length });

    for (let i = 0; i < fileQueue.length; i++) {
      const item = fileQueue[i];
      if (!item.problemNumber || item.status === 'done') continue;

      setFileQueue(prev =>
        prev.map(it => (it.id === item.id ? { ...it, status: 'processing' } : it))
      );

      setQueueProgress({ current: addedProblems.length + 1, total: itemsToProcess.length });

      try {
        // Ensure metadata is fetched
        let meta = item.metadata;
        if (!meta) {
          const metaRes = await problemMetadataService.getProblem(item.problemNumber, false);
          meta = metaRes.metadata;
        }

        // Save solution
        const saveRes = await storageService.saveJavaSolution(meta, {
          problemNumber: item.problemNumber,
          solutionContent: item.codeContent,
          overwriteSolution: true,
        });

        addedProblems.push({
          number: item.problemNumber,
          title: meta.title,
          folderName: saveRes.folderName,
        });

        setFileQueue(prev =>
          prev.map(it => (it.id === item.id ? { ...it, metadata: meta, status: 'done' } : it))
        );
      } catch (err: any) {
        setFileQueue(prev =>
          prev.map(it =>
            it.id === item.id ? { ...it, status: 'error', errorMsg: err.message || 'Failed' } : it
          )
        );
      }
    }

    setIsProcessingQueue(false);
    setQueueProgress(null);
    loadSolvedProblems();

    if (addedProblems.length > 0) {
      const titles = addedProblems.map(p => p.title).slice(0, 3).join(', ');
      const moreStr = addedProblems.length > 3 ? ` and ${addedProblems.length - 3} more` : '';
      const commitMsg = addedProblems.length === 1
        ? `Add ${addedProblems[0].title}`
        : `Add ${titles}${moreStr}`;

      setSuccessInfo({
        count: addedProblems.length,
        problems: addedProblems,
        gitCommands: `git add .\ngit commit -m "${commitMsg}"\ngit push`,
      });
    }
  }

  // Handle single manual problem submit
  async function handleAddSingleProblem(overrideDuplicate: boolean = false) {
    const num = parseInt(problemNumberInput.trim(), 10);
    if (isNaN(num) || num <= 0) {
      setSubmitError('Please enter a valid positive problem number.');
      return;
    }

    if (!solutionCode || solutionCode.trim().length === 0) {
      setSubmitError('Java solution cannot be empty. Please select or paste your Solution.java code.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      let currentMeta = metadata;
      if (!currentMeta || currentMeta.number !== num) {
        const metaRes = await problemMetadataService.getProblem(num, false);
        currentMeta = metaRes.metadata;
        setMetadata(currentMeta);
      }

      if (!overrideDuplicate) {
        const dupCheck: DuplicateCheckResult = await storageService.checkDuplicate(num);
        if (dupCheck.folderExists && dupCheck.solutionFileExists) {
          setDuplicateModal({
            isOpen: true,
            folderName: dupCheck.folderName,
            number: num,
            title: currentMeta.title,
            onConfirm: () => handleAddSingleProblem(true),
          });
          setIsSubmitting(false);
          return;
        }
      }

      const saveRes = await storageService.saveJavaSolution(currentMeta, {
        problemNumber: num,
        solutionContent: solutionCode,
        overwriteSolution: true,
      });

      const gitCommands = `git add .\ngit commit -m "Add ${currentMeta.title}"\ngit push`;

      setSuccessInfo({
        count: 1,
        problems: [{ number: num, title: currentMeta.title, folderName: saveRes.folderName }],
        gitCommands,
        zipBlob: saveRes.zipBlob,
      });

      loadSolvedProblems();
      setDuplicateModal(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to organize problem. Check connection or filesystem.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function openRevision(problem: OrganizedProblem) {
    setSelectedRevision(null);
    setLoadingRevision(true);
    try {
      const contents = await storageService.getProblemContents(problem.folderName);
      setSelectedRevision({
        problem,
        readme: contents.readme,
        solution: contents.solution,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRevision(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2000);
  }

  // Extract unique sorted list of topics across all solved problems
  const availableTopics = React.useMemo(() => {
    const set = new Set<string>();
    solvedList.forEach(p => {
      p.topics?.forEach(t => set.add(t));
    });
    return Array.from(set).sort();
  }, [solvedList]);

  // Filtered problems for revision search
  const filteredProblems = solvedList.filter(p => {
    const q = searchFilter.toLowerCase().trim();
    if (q) {
      const matchNumber = p.problemNumber.toString().includes(q);
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchTopics = p.topics.some(t => t.toLowerCase().includes(q));
      if (!matchNumber && !matchTitle && !matchTopics) {
        return false;
      }
    }

    if (difficultyFilter !== 'All') {
      if (p.difficulty !== difficultyFilter) {
        return false;
      }
    }

    if (selectedTopicFilter !== 'All') {
      if (!p.topics.includes(selectedTopicFilter)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center py-8 px-4 sm:px-6 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".java"
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Top Header */}
      <header className="w-full max-w-4xl flex items-center justify-between pb-6 mb-6 border-b border-neutral-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-inner">
            <Code2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
              LeetCode Solutions
            </h1>
            <p className="text-xs text-neutral-400">
              Personal repository for organizing and revising Java solutions offline
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1">
          <button
            id="tab-add"
            onClick={() => {
              setActiveTab('add');
              setSuccessInfo(null);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Add Problem {fileQueue.length > 0 && `(${fileQueue.length})`}
          </button>
          <button
            id="tab-revise"
            onClick={() => {
              setActiveTab('revise');
              loadSolvedProblems();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'revise'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Revise Solved ({solvedList.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl space-y-6">
        {activeTab === 'add' ? (
          <div className="grid grid-cols-1 gap-6">
            {/* Primary Card */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm space-y-6">
              {/* Card Header with Multi-File Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                <div>
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-amber-400" />
                    {fileQueue.length > 1 ? `Multi-File Queue (${fileQueue.length} Files)` : 'Add Java Solution'}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Select one or multiple Java files. Problem numbers are auto-mapped from file names & class names.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                    Select Java Files
                  </button>

                  {fileQueue.length > 0 && (
                    <button
                      type="button"
                      onClick={clearQueue}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear Queue
                    </button>
                  )}
                </div>
              </div>

              {/* VIEW 1: Multi-File Queue Table (when >1 files are in queue) */}
              {fileQueue.length > 1 ? (
                <div className="space-y-4">
                  <div className="border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800 bg-neutral-950">
                    {fileQueue.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-neutral-900/40 transition-colors"
                      >
                        {/* File details */}
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono text-[11px] text-neutral-400 shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-neutral-200 font-medium truncate">
                                {item.fileName}
                              </span>
                              {item.className && (
                                <span className="bg-neutral-900 text-neutral-400 px-1.5 py-0.2 rounded text-[10px] font-mono border border-neutral-800">
                                  class {item.className}
                                </span>
                              )}
                            </div>

                            {item.metadata ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    item.metadata.difficulty === 'Easy'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : item.metadata.difficulty === 'Medium'
                                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {item.metadata.difficulty}
                                </span>
                                <span className="text-neutral-300 font-medium">
                                  #{item.metadata.number}. {item.metadata.title}
                                </span>
                              </div>
                            ) : item.errorMsg ? (
                              <p className="text-rose-400 text-[11px] mt-0.5">{item.errorMsg}</p>
                            ) : null}
                          </div>
                        </div>

                        {/* Input & Status controls */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] text-neutral-500 font-mono">#</label>
                            <input
                              type="number"
                              min="1"
                              placeholder="Problem #"
                              value={item.problemNumber || ''}
                              onChange={e => updateQueueItemNumber(item.id, e.target.value)}
                              className="w-20 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 font-mono focus:border-amber-500/60 outline-none"
                            />
                          </div>

                          {/* Status */}
                          <div className="w-24 text-right">
                            {item.status === 'done' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> Added
                              </span>
                            ) : item.status === 'processing' ? (
                              <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                              </span>
                            ) : item.status === 'loading_meta' ? (
                              <span className="text-neutral-500 text-[11px] flex items-center gap-1 justify-end">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Fetching
                              </span>
                            ) : item.status === 'ready' ? (
                              <span className="text-amber-300 text-[11px] font-medium">Ready</span>
                            ) : (
                              <span className="text-neutral-500 text-[11px]">Enter Number</span>
                            )}
                          </div>

                          <button
                            onClick={() => removeQueueItem(item.id)}
                            title="Remove from queue"
                            className="text-neutral-500 hover:text-rose-400 p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add more files drop hint */}
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-neutral-800 hover:border-amber-500/40 rounded-xl p-3 text-center cursor-pointer transition-colors bg-neutral-950/40 text-xs text-neutral-500 hover:text-neutral-300"
                  >
                    + Drop more solution files here (.java / .sql) or click to add
                  </div>
                </div>
              ) : (
                /* VIEW 2: Clean Single Problem Input Flow */
                <div className="space-y-5">
                  {/* Step 1: Upload File or Problem Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Problem Number Input */}
                    <div className="sm:col-span-1 space-y-1.5">
                      <label
                        htmlFor="problem-number-input"
                        className="text-xs font-semibold text-neutral-300 flex items-center justify-between"
                      >
                        <span>Problem #</span>
                        {metadata && (
                          <span className="text-[10px] text-amber-400">Detected</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          id="problem-number-input"
                          type="number"
                          min="1"
                          placeholder="e.g. 1"
                          value={problemNumberInput}
                          onChange={e => setProblemNumberInput(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 font-mono transition-all outline-none"
                        />
                        {loadingMeta && (
                          <div className="absolute right-3 top-2.5">
                            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Problem Name & Metadata (Auto-detected from file or number) */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300">
                        Problem Name & Info
                      </label>
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
                            Fetching problem details...
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500">
                            Enter problem # or upload file (e.g. 1.java, 610.sql)
                          </span>
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

                  {/* Step 2: Solution Code Editor */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
                        <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Solution Code</span>
                        <span className="text-[11px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {fileName}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Solution File
                      </button>
                    </div>

                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        handleFiles(e.dataTransfer.files);
                      }}
                      className="relative border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all"
                    >
                      <textarea
                        id="solution-code-textarea"
                        value={solutionCode}
                        onChange={e => setSolutionCode(e.target.value)}
                        rows={11}
                        spellCheck={false}
                        placeholder="Paste your solution code here, or upload a .java / .sql file above..."
                        className="w-full bg-transparent p-4 font-mono text-xs sm:text-sm text-neutral-200 outline-none resize-y leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {submitError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Primary Action Button: 'UPLOAD & ORGANIZE' */}
              <button
                id="add-problem-btn"
                type="button"
                disabled={isSubmitting || isProcessingQueue || loadingMeta}
                onClick={processQueue}
                className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
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
                    <span>Organizing Problem...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>UPLOAD & ORGANIZE SOLUTION</span>
                  </>
                )}
              </button>
            </div>

            {/* Success Result Card */}
            {successInfo && (
              <div className="bg-neutral-900/90 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                        ✓ Organized {successInfo.count} Java Solution{successInfo.count > 1 ? 's' : ''}!
                      </h2>
                      <p className="text-xs text-neutral-400">
                        {successInfo.count === 1
                          ? `Added #${successInfo.problems[0]?.number} ${successInfo.problems[0]?.title}`
                          : `Created folders, READMEs, and Solution.java files in leetcode-solutions/`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Folder Structure Preview */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300 space-y-1">
                  <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5" />
                    leetcode-solutions/
                  </div>
                  {successInfo.problems.map((p, i) => (
                    <div key={i} className="pl-4 text-neutral-300">
                      ├── <span className="text-amber-300 font-semibold">{p.folderName}/</span>
                      <span className="text-neutral-500 text-[10px] ml-2">(README.md & Solution.java)</span>
                    </div>
                  ))}
                </div>

                {/* Manual Git Push Instructions */}
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                    <span className="font-semibold text-neutral-300">Manual Git Commands:</span>
                    <button
                      onClick={() => copyToClipboard(successInfo.gitCommands)}
                      className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      {copiedGit ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Commands</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 font-mono text-xs text-emerald-400 overflow-x-auto selection:bg-emerald-500/20">
                    {successInfo.gitCommands}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Revision View - Solved Problems Explorer */
          <div className="space-y-6">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    Solved Java Repository ({solvedList.length})
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Click any problem to view description and Java solution side-by-side
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Search problem #, title, or topic..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 outline-none focus:border-amber-500/60 w-full sm:w-64"
                />
              </div>

              {/* Quick Filters: Difficulty & Topics */}
              <div className="space-y-3 pt-3 border-t border-neutral-800/80 mb-6">
                {/* Difficulty Filters */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-neutral-500 font-medium text-[11px] uppercase tracking-wider mr-1">
                    Difficulty:
                  </span>
                  {(['All', 'Easy', 'Medium', 'Hard'] as const).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setDifficultyFilter(diff)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        difficultyFilter === diff
                          ? diff === 'Easy'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : diff === 'Medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                            : diff === 'Hard'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 border border-neutral-800/80 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}

                  {(difficultyFilter !== 'All' || selectedTopicFilter !== 'All' || searchFilter) && (
                    <button
                      onClick={() => {
                        setDifficultyFilter('All');
                        setSelectedTopicFilter('All');
                        setSearchFilter('');
                      }}
                      className="text-[11px] text-neutral-500 hover:text-amber-400 underline ml-auto transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                {/* Topic Filters */}
                {availableTopics.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-neutral-500 font-medium text-[11px] uppercase tracking-wider mr-1">
                      Topic:
                    </span>
                    <button
                      onClick={() => setSelectedTopicFilter('All')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        selectedTopicFilter === 'All'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                          : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                      }`}
                    >
                      All Topics
                    </button>
                    {availableTopics.map(topic => (
                      <button
                        key={topic}
                        onClick={() => setSelectedTopicFilter(topic)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          selectedTopicFilter === topic
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Results count */}
              <div className="text-xs text-neutral-400 mb-3 flex items-center justify-between">
                <span>
                  Showing <strong className="text-neutral-200">{filteredProblems.length}</strong> of{' '}
                  <strong className="text-neutral-200">{solvedList.length}</strong> problems
                </span>
              </div>

              {filteredProblems.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                  No problems found. Add a problem using the Add Problem tab!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProblems.map(p => (
                    <button
                      key={p.folderName}
                      onClick={() => openRevision(p)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${
                        selectedRevision?.problem.folderName === p.folderName
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                          : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              p.difficulty === 'Easy'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : p.difficulty === 'Medium'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {p.difficulty}
                          </span>
                          <span className="font-mono text-xs text-neutral-400">
                            #{String(p.problemNumber).padStart(4, '0')}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-amber-400 transition-colors">
                          {p.title}
                        </h3>
                        <p className="font-mono text-[11px] text-neutral-500">
                          {p.folderName}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Problem Revision Pane */}
            {loadingRevision && (
              <div className="p-8 text-center bg-neutral-900 border border-neutral-800 rounded-2xl">
                <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-neutral-400">Loading problem solution...</p>
              </div>
            )}

            {selectedRevision && !loadingRevision && (
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                      #{selectedRevision.problem.problemNumber}. {selectedRevision.problem.title}
                    </h3>
                    <p className="font-mono text-xs text-neutral-500">
                      leetcode-solutions/{selectedRevision.problem.folderName}/
                    </p>
                  </div>
                  <a
                    href={selectedRevision.problem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-300 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                  >
                    <span>LeetCode</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Problem README.md */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>README.md</span>
                    </div>
                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-300 h-96 overflow-y-auto font-sans leading-relaxed whitespace-pre-wrap selection:bg-amber-500/20">
                      {selectedRevision.readme}
                    </div>
                  </div>

                  {/* Right: Solution.java */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <FileCode2 className="w-4 h-4 text-emerald-400" />
                        <span>Solution.java</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedRevision.solution)}
                        className="text-neutral-400 hover:text-amber-400 flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </button>
                    </div>
                    <pre className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-emerald-300 font-mono h-96 overflow-y-auto leading-relaxed selection:bg-emerald-500/20">
                      {selectedRevision.solution}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Duplicate Problem Dialog Modal */}
      {duplicateModal && duplicateModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-100">
                  Problem #{duplicateModal.number} already exists
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Folder <code className="text-amber-300 font-mono">{duplicateModal.folderName}</code> and <code className="text-neutral-300 font-mono">Solution.java</code> already exist in your local repository.
                </p>
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-400">
              Replacing will update <span className="text-emerald-400 font-mono">Solution.java</span> with your latest code while preserving the problem README.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="duplicate-cancel-btn"
                onClick={() => setDuplicateModal(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="duplicate-replace-btn"
                onClick={() => {
                  setDuplicateModal(null);
                  duplicateModal.onConfirm();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Replace Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

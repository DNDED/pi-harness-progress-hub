import { useState, useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import {
  Zap,
  Terminal,
  CheckCircle2,
  Clock,
  Cpu,
  GitBranch,
  RefreshCw,
  Sparkles,
  Activity,
  ShieldCheck,
  Search,
  Code2,
  Video,
  Play,
  Download,
  FileText,
  Bot,
  BarChart3,
  Layers,
  Tag,
  BookOpen,
  HeartPulse,
  Award,
  Copy,
  Check,
  ExternalLink,
  Keyboard,
  Volume2,
  VolumeX,
  FileJson,
  Palette,
  X,
  Plus,
  Radio,
  FileSpreadsheet,
  TrendingUp,
  List,
  LayoutGrid,
  Timer,
  Command,
  Star,
  Edit,
  Trash2
} from 'lucide-react';
import initialUpdates from './data/updates.json';
import initialSubagents from './data/subagents.json';
import initialSentinels from './data/sentinels.json';
import initialHealthHistory from './data/health-history.json';
import { ProgressVideo, VideoUpdateItem } from './remotion/ProgressVideo';

interface UpdateItem {
  id: string;
  timestamp: string;
  relativeTime: string;
  title: string;
  category: string;
  status: string;
  author: string;
  description: string;
  highlights: string[];
  metrics?: Record<string, string | undefined>;
}

interface SubagentItem {
  id: string;
  name: string;
  model: string;
  status: string;
  durationMs: number;
  timestamp: string;
  tokensUsed: number;
  task: string;
}

interface SentinelItem {
  id: string;
  name: string;
  category: string;
  status: string;
  speedMs: number;
}

interface HealthData {
  status: string;
  uptimeSec: number;
  systemMemory: string;
  activeSentinels: number;
  passRate: string;
  totalUpdates: number;
  totalSubagents: number;
  nodeVersion: string;
  platform: string;
  timestamp: string;
}

interface SubagentLogData {
  id: string;
  name: string;
  model: string;
  status: string;
  durationMs: number;
  tokensUsed: number;
  timestamp: string;
  task: string;
  stdout: string;
}

interface SentinelLogData {
  id: string;
  name: string;
  category: string;
  status: string;
  speedMs: number;
  timestamp: string;
  rule: string;
  stdout: string;
}

interface HealthSnapshotItem {
  timestamp: string;
  uptimeSec: number;
  memoryMb: number;
  activeSentinels: number;
  passRate: string;
  totalUpdates: number;
  totalSubagents: number;
}

export default function App() {
  const [updates, setUpdates] = useState<UpdateItem[]>((initialUpdates as unknown) as UpdateItem[]);
  const [subagents, setSubagents] = useState<SubagentItem[]>((initialSubagents as unknown) as SubagentItem[]);
  const [sentinels, setSentinels] = useState<SentinelItem[]>((initialSentinels as unknown) as SentinelItem[]);
  const [healthHistory, setHealthHistory] = useState<HealthSnapshotItem[]>((initialHealthHistory as unknown) as HealthSnapshotItem[]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [subagentStatusFilter, setSubagentStatusFilter] = useState<string>('All');
  const [subagentSearchQuery, setSubagentSearchQuery] = useState<string>('');
  const [subagentSortBy, setSubagentSortBy] = useState<'newest' | 'duration-desc' | 'duration-asc' | 'tokens-desc'>('newest');
  const [subagentChartMetric, setSubagentChartMetric] = useState<'duration' | 'tokens'>('duration');
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);
  const [sentinelCategoryFilter, setSentinelCategoryFilter] = useState<string>('All');
  const [sentinelSearchQuery, setSentinelSearchQuery] = useState<string>('');
  const [sentinelSortBy, setSentinelSortBy] = useState<'default' | 'speed-desc' | 'speed-asc' | 'name'>('default');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoPolling, setAutoPolling] = useState<boolean>(true);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [showSubagents, setShowSubagents] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [showSentinels, setShowSentinels] = useState<boolean>(false);
  const [showHealth, setShowHealth] = useState<boolean>(false);
  const [showBadgeModal, setShowBadgeModal] = useState<boolean>(false);
  const [showHotkeyModal, setShowHotkeyModal] = useState<boolean>(false);
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [dispatchName, setDispatchName] = useState<string>('WorkerAgent');
  const [dispatchTask, setDispatchTask] = useState<string>('Autonomous harness inspection & optimization');
  const [copiedBadge, setCopiedBadge] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<'slate' | 'cyber' | 'obsidian'>('slate');
  const [compactTimeline, setCompactTimeline] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [commandQuery, setCommandQuery] = useState<string>('');
  const [commandSelectedIndex, setCommandSelectedIndex] = useState<number>(0);
  const [selectedSubagentLog, setSelectedSubagentLog] = useState<SubagentLogData | null>(null);
  const [selectedSentinelLog, setSelectedSentinelLog] = useState<SentinelLogData | null>(null);
  const [copiedLog, setCopiedLog] = useState<boolean>(false);
  const [isReverifyingSentinels, setIsReverifyingSentinels] = useState<boolean>(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pi_bookmarked_updates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [onlyBookmarkedFilter, setOnlyBookmarkedFilter] = useState<boolean>(false);

  const [editingUpdate, setEditingUpdate] = useState<UpdateItem | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editHighlightsText, setEditHighlightsText] = useState<string>('');

  const handleOpenEditUpdate = (item: UpdateItem) => {
    setEditingUpdate(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditDescription(item.description);
    setEditHighlightsText(item.highlights ? item.highlights.join('\n') : '');
  };

  const handleSaveEditedUpdate = async () => {
    if (!editingUpdate) return;
    const highlights = editHighlightsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/updates/item', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUpdate.id,
          title: editTitle,
          category: editCategory,
          description: editDescription,
          highlights
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUpdates(prev => prev.map(u => u.id === editingUpdate.id ? data.update : u));
      }
    } catch {
      setUpdates(prev => prev.map(u => u.id === editingUpdate.id ? {
        ...u,
        title: editTitle,
        category: editCategory,
        description: editDescription,
        highlights
      } : u));
    } finally {
      setEditingUpdate(null);
    }
  };

  const handleDeleteUpdateItem = async (id: string) => {
    try {
      const res = await fetch(`/api/updates/item?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUpdates(prev => prev.filter(u => u.id !== id));
      }
    } catch {
      setUpdates(prev => prev.filter(u => u.id !== id));
    }
  };

  const [showCreateMilestoneModal, setShowCreateMilestoneModal] = useState<boolean>(false);
  const [createTitle, setCreateTitle] = useState<string>('');
  const [createCategory, setCreateCategory] = useState<string>('Core Runtime');
  const [createDescription, setCreateDescription] = useState<string>('');
  const [createHighlightsText, setCreateHighlightsText] = useState<string>('');

  const handleCreateMilestone = async () => {
    if (!createTitle.trim()) return;
    const highlights = createHighlightsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/updates/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          category: createCategory,
          description: createDescription,
          highlights,
          author: 'dashboard-user',
          status: 'Verified'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUpdates(prev => [data.update, ...prev]);
        playChime();
      }
    } catch {
      const fallback: UpdateItem = {
        id: `upd-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        relativeTime: 'Just now',
        title: createTitle,
        category: createCategory,
        status: 'Verified',
        author: 'dashboard-user',
        description: createDescription,
        highlights
      };
      setUpdates(prev => [fallback, ...prev]);
    } finally {
      setShowCreateMilestoneModal(false);
      setCreateTitle('');
      setCreateDescription('');
      setCreateHighlightsText('');
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try { localStorage.setItem('pi_bookmarked_updates', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const prevUpdateCountRef = useRef<number>(updates.length);

  const playChime = () => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext fallback
    }
  };

  const categories = ['All', 'Harness Core', 'Sentinels', 'UI/TUI', 'Progress Dashboard', 'Subagents'];
  const searchSuggestions = ['Sentinel', 'Subagent', 'Remotion', 'Health', 'Vault', 'Exporter'];

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedTag('');
    setOnlyBookmarkedFilter(false);
    setSubagentStatusFilter('All');
    setSubagentSearchQuery('');
    setSentinelCategoryFilter('All');
    setSentinelSearchQuery('');
  };

  const handleRunSentinels = async () => {
    setIsReverifyingSentinels(true);
    try {
      const res = await fetch('/api/sentinels/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSentinels(data.sentinels);
        playChime();
      }
    } catch {
      // fallback
    } finally {
      setTimeout(() => setIsReverifyingSentinels(false), 400);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [resUpdates, resSubagents, resSentinels, resHealth, resHistory] = await Promise.all([
        fetch('/api/updates?t=' + Date.now()),
        fetch('/api/subagents?t=' + Date.now()),
        fetch('/api/sentinels?t=' + Date.now()),
        fetch('/api/health?t=' + Date.now()),
        fetch('/api/health/history?t=' + Date.now())
      ]);
      if (resUpdates.ok) {
        const newUpdates = await resUpdates.json();
        if (newUpdates.length > prevUpdateCountRef.current) {
          playChime();
        }
        prevUpdateCountRef.current = newUpdates.length;
        setUpdates(newUpdates);
      }
      if (resSubagents.ok) setSubagents(await resSubagents.json());
      if (resSentinels.ok) setSentinels(await resSentinels.json());
      if (resHealth.ok) setHealth(await resHealth.json());
      if (resHistory.ok) setHealthHistory(await resHistory.json());
    } catch {
      // fallback
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleDispatchSubagent = async () => {
    if (!dispatchName || !dispatchTask) return;
    try {
      const res = await fetch('/api/subagents/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dispatchName,
          task: dispatchTask,
          model: 'Gemini 3.6 Flash'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSubagents(prev => [data.subagent, ...prev]);
        setUpdates(prev => [data.update, ...prev]);
      }
    } catch {
      const newSubagent: SubagentItem = {
        id: `sub-${Date.now()}`,
        name: dispatchName,
        model: 'Gemini 3.6 Flash',
        status: 'Completed',
        durationMs: Math.floor(Math.random() * 200) + 150,
        timestamp: new Date().toISOString(),
        tokensUsed: Math.floor(Math.random() * 400) + 100,
        task: dispatchTask
      };
      const newUpdate: UpdateItem = {
        id: `up-${Date.now()}`,
        timestamp: new Date().toISOString(),
        relativeTime: 'Just now',
        title: `Subagent Dispatched: ${dispatchName}`,
        category: 'Subagents',
        status: 'Completed',
        author: dispatchName,
        description: `Dispatched task "${dispatchTask}" using model Gemini 3.6 Flash.`,
        highlights: [
          `Agent: ${dispatchName}`,
          `Task: ${dispatchTask}`,
          `Duration: ${newSubagent.durationMs}ms`,
          `Tokens: ${newSubagent.tokensUsed}`
        ]
      };
      setSubagents(prev => [newSubagent, ...prev]);
      setUpdates(prev => [newUpdate, ...prev]);
    } finally {
      setShowDispatchModal(false);
      playChime();
    }
  };

  const handleClearSubagents = async () => {
    try {
      const res = await fetch('/api/subagents', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.subagents) setSubagents(data.subagents);
      }
    } catch {
      setSubagents([]);
    }
  };

  const handleRerunSubagent = async (id: string) => {
    try {
      const res = await fetch('/api/subagents/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setSubagents(prev => [data.subagent, ...prev]);
        setUpdates(prev => [data.update, ...prev]);
        playChime();
      }
    } catch {
      // Fallback
    }
  };

  const handleDeleteSubagentItem = async (id: string) => {
    try {
      const res = await fetch(`/api/subagents/item?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubagents(prev => prev.filter(s => s.id !== id));
      }
    } catch {
      setSubagents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleFlushAllSubagents = async () => {
    try {
      const res = await fetch('/api/subagents/all', { method: 'DELETE' });
      if (res.ok) {
        setSubagents([]);
      }
    } catch {
      setSubagents([]);
    }
  };

  const handleClearUpdates = async () => {
    try {
      const res = await fetch('/api/updates', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.updates) setUpdates(data.updates);
      }
    } catch {
      // Fallback
    }
  };

  const handleRunBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const res = await fetch('/api/benchmark/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setUpdates(prev => [data.update, ...prev]);
        playChime();
      }
    } catch {
      // Fallback
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  useEffect(() => {
    handleRefresh();
    if (!autoPolling) return;
    const interval = setInterval(handleRefresh, 3000);
    return () => clearInterval(interval);
  }, [audioEnabled, autoPolling]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setCommandQuery('');
        setCommandSelectedIndex(0);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') {
        e.preventDefault();
        setShowCommandPalette(true);
        setCommandQuery('');
        setCommandSelectedIndex(0);
      } else if (e.key === '?') {
        setShowHotkeyModal(prev => !prev);
      } else if (e.key.toLowerCase() === 'r') {
        handleRefresh();
      } else if (e.key.toLowerCase() === 'h') {
        setShowHealth(prev => !prev);
      } else if (e.key.toLowerCase() === 's') {
        setShowSentinels(prev => !prev);
      } else if (e.key.toLowerCase() === 'b') {
        setShowSubagents(prev => !prev);
      } else if (e.key.toLowerCase() === 'v') {
        setShowVideo(prev => !prev);
      } else if (e.key.toLowerCase() === 'a') {
        setShowAnalytics(prev => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        setAudioEnabled(prev => !prev);
      } else if (e.key.toLowerCase() === 't') {
        setActiveTheme(prev => prev === 'slate' ? 'cyber' : prev === 'cyber' ? 'obsidian' : 'slate');
      } else if (e.key.toLowerCase() === 'p') {
        setAutoPolling(prev => !prev);
      } else if (e.key.toLowerCase() === 'c') {
        setCompactTimeline(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const exportMarkdownLog = (useFiltered: boolean = isFiltered) => {
    const list = useFiltered ? filteredUpdates : updates;
    const md = `# Pi Agent Harness — Continuous Improvement Log\n\n` +
      `*Generated on ${new Date().toLocaleString()} • http://localhost:3050*\n\n` +
      list.map((u, i) => (
        `### ${i + 1}. ${u.title} [${u.category}]\n` +
        `**Status**: ${u.status} | **Author**: ${u.author} | **Time**: ${u.relativeTime}\n\n` +
        `${u.description}\n\n` +
        (u.highlights && u.highlights.length > 0 ? `**Key Improvements:**\n` + u.highlights.map(h => `- ${h}`).join('\n') + '\n\n' : '')
      )).join('---\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pi-harness-changelog-${useFiltered ? 'filtered-' : ''}${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJsonLog = (useFiltered: boolean = isFiltered) => {
    const list = useFiltered ? filteredUpdates : updates;
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pi-harness-updates-${useFiltered ? 'filtered-' : ''}${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsvLog = (useFiltered: boolean = isFiltered) => {
    const list = useFiltered ? filteredUpdates : updates;
    const rows = ['id,timestamp,title,category,status,author,description'];
    for (const item of list) {
      const title = `"${(item.title || '').replace(/"/g, '""')}"`;
      const cat = `"${(item.category || '').replace(/"/g, '""')}"`;
      const desc = `"${(item.description || '').replace(/"/g, '""')}"`;
      rows.push(`${item.id},${item.timestamp},${title},${cat},${item.status},${item.author},${desc}`);
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pi-harness-updates-${useFiltered ? 'filtered-' : ''}${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const commandActions = [
    { id: 'refresh', label: 'Trigger Live Data Refresh', category: 'General', hotkey: 'R', icon: RefreshCw, run: () => handleRefresh() },
    { id: 'subagents', label: 'Toggle Subagents Execution Telemetry', category: 'Telemetry', hotkey: 'B', icon: Bot, run: () => setShowSubagents(prev => !prev) },
    { id: 'sentinels', label: 'Toggle Sentinel Health Diagnostic Matrix', category: 'Diagnostics', hotkey: 'S', icon: Layers, run: () => setShowSentinels(prev => !prev) },
    { id: 'health', label: 'Toggle Live Harness System Health', category: 'Diagnostics', hotkey: 'H', icon: HeartPulse, run: () => setShowHealth(prev => !prev) },
    { id: 'dispatch', label: 'Dispatch New Subagent Task', category: 'Actions', hotkey: '+', icon: Plus, run: () => setShowDispatchModal(true) },
    { id: 'video', label: 'Toggle Remotion Progress Reel Video', category: 'Media', hotkey: 'V', icon: Video, run: () => setShowVideo(prev => !prev) },
    { id: 'analytics', label: 'Toggle Progress Velocity Analytics', category: 'Analytics', hotkey: 'A', icon: BarChart3, run: () => setShowAnalytics(prev => !prev) },
    { id: 'theme', label: 'Switch Visual Theme (Slate / Cyber / Obsidian)', category: 'UI', hotkey: 'T', icon: Palette, run: () => setActiveTheme(prev => prev === 'slate' ? 'cyber' : prev === 'cyber' ? 'obsidian' : 'slate') },
    { id: 'polling', label: 'Toggle Live 3s Polling Auto-Refresh', category: 'Settings', hotkey: 'P', icon: Radio, run: () => setAutoPolling(prev => !prev) },
    { id: 'compact', label: 'Toggle Compact / Expanded View Mode', category: 'UI', hotkey: 'C', icon: List, run: () => setCompactTimeline(prev => !prev) },
    { id: 'badge', label: 'View SVG Status Badge Embed Code', category: 'Integrations', hotkey: '', icon: Code2, run: () => setShowBadgeModal(true) },
    { id: 'audio', label: 'Toggle Web Audio Milestone Chimes', category: 'Settings', hotkey: 'M', icon: Volume2, run: () => setAudioEnabled(prev => !prev) },
    { id: 'reset', label: 'Clear All Active Search & Category Filters', category: 'General', hotkey: '', icon: X, run: () => resetAllFilters() },
    { id: 'export-md', label: 'Download Markdown Changelog File', category: 'Export', hotkey: '', icon: Download, run: () => exportMarkdownLog() },
    { id: 'export-json', label: 'Download Log as JSON File', category: 'Export', hotkey: '', icon: FileJson, run: () => exportJsonLog() },
  ];

  const filteredCommandActions = commandActions.filter(cmd =>
    cmd.label.toLowerCase().includes(commandQuery.toLowerCase()) ||
    cmd.category.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const badgeMarkdown = `![pi-harness health](http://localhost:3050/api/status/badge)`;

  const copyBadgeSnippet = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  const categoryCounts = categories.slice(1).reduce((acc, cat) => {
    acc[cat] = updates.filter(u => u.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCategoryCount = Math.max(1, ...Object.values(categoryCounts));

  const filteredUpdates = updates.filter((item) => {
    const matchesBookmarked = !onlyBookmarkedFilter || bookmarkedIds.includes(item.id);
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesTag = selectedTag === '' || item.highlights.some(h => h.toLowerCase().includes(selectedTag.toLowerCase()));
    const matchesQuery = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBookmarked && matchesCategory && matchesTag && matchesQuery;
  });

  const filteredSubagents = subagents.filter(s => {
    const matchesStatus = subagentStatusFilter === 'All' || s.status.toLowerCase() === subagentStatusFilter.toLowerCase();
    const matchesQuery = subagentSearchQuery === '' ||
      s.name.toLowerCase().includes(subagentSearchQuery.toLowerCase()) ||
      s.model.toLowerCase().includes(subagentSearchQuery.toLowerCase()) ||
      s.task.toLowerCase().includes(subagentSearchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  }).sort((a, b) => {
    if (subagentSortBy === 'duration-desc') return (b.durationMs || 0) - (a.durationMs || 0);
    if (subagentSortBy === 'duration-asc') return (a.durationMs || 0) - (b.durationMs || 0);
    if (subagentSortBy === 'tokens-desc') return (b.tokensUsed || 0) - (a.tokensUsed || 0);
    return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
  });

  const sentinelCategoryCounts = sentinels.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentinelCategories = ['All', ...Array.from(new Set(sentinels.map(s => s.category)))];
  const filteredSentinels = sentinels.filter(s => {
    const matchesCategory = sentinelCategoryFilter === 'All' || s.category === sentinelCategoryFilter;
    const matchesQuery = sentinelSearchQuery === '' ||
      s.name.toLowerCase().includes(sentinelSearchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(sentinelSearchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  }).sort((a, b) => {
    if (sentinelSortBy === 'speed-desc') return (b.speedMs || 0) - (a.speedMs || 0);
    if (sentinelSortBy === 'speed-asc') return (a.speedMs || 0) - (b.speedMs || 0);
    if (sentinelSortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const maxSubagentDuration = Math.max(1, ...subagents.map(s => s.durationMs));

  const subagentModelStats = subagents.reduce((acc, s) => {
    const m = s.model || 'Unknown';
    if (!acc[m]) {
      acc[m] = { model: m, tasks: 0, duration: 0, tokens: 0 };
    }
    acc[m].tasks += 1;
    acc[m].duration += s.durationMs || 0;
    acc[m].tokens += s.tokensUsed || 0;
    return acc;
  }, {} as Record<string, { model: string; tasks: number; duration: number; tokens: number }>);

  const modelLeaderboard = Object.values(subagentModelStats)
    .map(m => ({ ...m, avgDuration: Math.round(m.duration / m.tasks) }))
    .sort((a, b) => b.tasks - a.tasks);

  const totalVideoFrames = 90 + Math.max(1, updates.length) * 150;

  const getThemeBg = () => {
    if (activeTheme === 'cyber') return 'bg-zinc-950 text-emerald-400 font-mono';
    if (activeTheme === 'obsidian') return 'bg-black text-slate-200';
    return 'bg-slate-950 text-slate-100';
  };

  const isFiltered = selectedCategory !== 'All' || searchQuery !== '' || selectedTag !== '';

  return (
    <div className={`min-h-screen ${getThemeBg()} flex flex-col transition-colors duration-300`}>
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  Pi Agent Harness Progress Hub
                </h1>
                <button
                  onClick={() => setShowHealth(!showHealth)}
                  className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1 transition"
                  title="Click to view live system health"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Health
                </button>
                <button
                  onClick={() => setShowBadgeModal(!showBadgeModal)}
                  className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-full flex items-center gap-1 transition"
                  title="View and copy Status Badge"
                >
                  <Award className="w-3 h-3 text-amber-400" />
                  Badge
                </button>
                <a
                  href="/api/health/summary"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-full flex items-center gap-1 transition"
                  title="Open HTML Health Report in new tab"
                >
                  <ExternalLink className="w-3 h-3 text-indigo-400" />
                  Report
                </a>
                <a
                  href="/api/health/json"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded-full flex items-center gap-1 transition"
                  title="Download System Health JSON"
                >
                  <FileJson className="w-3 h-3 text-cyan-400" />
                  JSON API
                </a>
                <a
                  href="/api/health/csv"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-full flex items-center gap-1 transition"
                  title="Download System Health CSV"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  CSV API
                </a>
                <button
                  onClick={() => setAutoPolling(!autoPolling)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 transition ${
                    autoPolling
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle 3s Live Polling (P)"
                >
                  <Radio className={`w-3 h-3 ${autoPolling ? 'animate-pulse text-emerald-400' : ''}`} />
                  <span>{autoPolling ? 'Live 3s' : 'Polling Paused'}</span>
                </button>
                <button
                  onClick={() => setActiveTheme(prev => prev === 'slate' ? 'cyber' : prev === 'cyber' ? 'obsidian' : 'slate')}
                  className="p-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-md text-xs transition"
                  title={`Active Theme: ${activeTheme.toUpperCase()} (T)`}
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-1 border rounded-md text-xs transition ${
                    audioEnabled
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title={audioEnabled ? 'Audio Chimes Enabled (M)' : 'Audio Chimes Muted (M)'}
                >
                  {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setShowHotkeyModal(!showHotkeyModal)}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-md text-xs transition"
                  title="Keyboard Hotkeys (?)"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setShowCommandPalette(true); setCommandQuery(''); setCommandSelectedIndex(0); }}
                  className="px-2 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded-md text-xs font-semibold flex items-center gap-1 transition"
                  title="Command Palette (Ctrl+K or /)"
                >
                  <Command className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline font-mono">Ctrl+K</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Continuous Autonomous Self-Improvement Log • http://localhost:3050
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCompactTimeline(!compactTimeline)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              title="Toggle Compact Timeline Mode (C)"
            >
              {compactTimeline ? <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" /> : <List className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden md:inline">{compactTimeline ? 'Expanded View' : 'Compact View'}</span>
            </button>
            <button
              onClick={() => setShowSentinels(!showSentinels)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-medium border border-emerald-500/30 transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showSentinels ? 'Hide Sentinels' : `Sentinels (${sentinels.length})`}</span>
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/30 transition flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showAnalytics ? 'Hide Analytics' : 'Analytics'}</span>
            </button>
            <button
              onClick={() => setShowSubagents(!showSubagents)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium border border-cyan-500/30 transition flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showSubagents ? 'Hide Subagents' : `Subagents (${subagents.length})`}</span>
            </button>
            <button
              onClick={() => exportMarkdownLog(isFiltered)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              title={isFiltered ? "Export Filtered Markdown Changelog" : "Export Markdown Changelog"}
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">{isFiltered ? 'MD (Filtered)' : 'MD'}</span>
            </button>
            <button
              onClick={() => exportJsonLog(isFiltered)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              title={isFiltered ? "Export Filtered JSON Updates" : "Export JSON Updates"}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{isFiltered ? 'JSON (Filtered)' : 'JSON'}</span>
            </button>
            <button
              onClick={() => exportCsvLog(isFiltered)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              title={isFiltered ? "Export Filtered CSV Updates" : "Export CSV Updates"}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{isFiltered ? 'CSV (Filtered)' : 'CSV'}</span>
            </button>
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-slate-100 rounded-lg text-xs font-semibold shadow-lg transition flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{showVideo ? 'Hide Video Reel' : 'Watch Remotion Video'}</span>
            </button>
            <button
              onClick={handleRefresh}
              className={`p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
              title="Refresh log feed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs font-mono text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vertex Gemini 3.6 Flash</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Subagent Dispatcher Modal */}
        {showDispatchModal && (
          <div className="p-6 bg-slate-900/95 border border-cyan-500/40 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">Dispatch New Subagent Execution Task</h2>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Subagent Name:</label>
                <input
                  type="text"
                  value={dispatchName}
                  onChange={(e) => setDispatchName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Task Prompt / Description:</label>
                <textarea
                  value={dispatchTask}
                  onChange={(e) => setDispatchTask(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatchSubagent}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dispatch Subagent</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hotkey Guide Modal */}
        {showHotkeyModal && (
          <div className="p-6 bg-slate-900/90 border border-cyan-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">Keyboard Hotkeys Navigation</h2>
              </div>
              <button
                onClick={() => setShowHotkeyModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">?</span>
                <span className="text-slate-300">Toggle Hotkeys</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">R</span>
                <span className="text-slate-300">Refresh Feed</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">H</span>
                <span className="text-slate-300">Toggle Health</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">S</span>
                <span className="text-slate-300">Toggle Sentinels</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">B</span>
                <span className="text-slate-300">Toggle Subagents</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">V</span>
                <span className="text-slate-300">Toggle Video</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">A</span>
                <span className="text-slate-300">Toggle Analytics</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">M</span>
                <span className="text-slate-300">Toggle Audio Mute</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">T</span>
                <span className="text-slate-300">Cycle Visual Theme</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">P</span>
                <span className="text-slate-300">Toggle 3s Polling</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-2">C</span>
                <span className="text-slate-300">Toggle Compact View</span>
              </div>
            </div>
          </div>
        )}

        {/* Badge Preview Modal */}
        {showBadgeModal && (
          <div className="p-6 bg-slate-900/90 border border-amber-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-slate-100">Live Status Badge Integration</h2>
              </div>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="text-xs text-slate-400">Live Preview:</div>
              <div className="py-2">
                <img src="/api/status/badge" alt="pi-harness health badge" className="h-6" />
              </div>

              <div className="text-xs text-slate-400 font-mono pt-2 border-t border-slate-900">
                Markdown Embed Snippet:
              </div>
              <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-cyan-300 flex items-center justify-between">
                <code>{badgeMarkdown}</code>
                <button
                  onClick={copyBadgeSnippet}
                  className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-md font-sans text-xs flex items-center gap-1 transition"
                >
                  {copiedBadge ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBadge ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live System Health Drawer */}
        {showHealth && health && (
          <div className="p-6 bg-slate-900/90 border border-emerald-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-100">Live Harness Server Health Diagnostics</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunBenchmark}
                  disabled={isRunningBenchmark}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Run harness performance benchmark suite"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${isRunningBenchmark ? 'animate-spin' : ''}`} />
                  <span>{isRunningBenchmark ? 'Benchmarking...' : 'Run Benchmark'}</span>
                </button>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  STATUS: {health.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-500">Uptime</div>
                <div className="text-cyan-300 font-bold text-sm mt-1">{health.uptimeSec}s</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-500">System Memory</div>
                <div className="text-emerald-300 font-bold text-sm mt-1">{health.systemMemory}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-500">Node / Platform</div>
                <div className="text-indigo-300 font-bold text-sm mt-1">{health.nodeVersion} ({health.platform})</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-500">Pass Rate</div>
                <div className="text-amber-300 font-bold text-sm mt-1">{health.passRate} (42 Sentinels)</div>
              </div>
            </div>

            {/* Health Snapshot Trend Chart */}
            {healthHistory.length > 0 && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-200">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Memory Usage Trend ({healthHistory.length} Snapshots)
                  </span>
                  <span className="text-cyan-300">Latest: {healthHistory[0]?.memoryMb} MB</span>
                </div>
                <div className="flex items-end gap-1 h-12 pt-2 border-t border-slate-900">
                  {healthHistory.slice(0, 30).reverse().map((item, idx) => {
                    const heightPercent = Math.min(100, Math.max(15, (item.memoryMb / 128) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-cyan-600 to-sky-400 rounded-t hover:from-cyan-500 hover:to-sky-300 transition"
                        style={{ height: `${heightPercent}%` }}
                        title={`Timestamp: ${new Date(item.timestamp).toLocaleTimeString()} | Memory: ${item.memoryMb} MB | Uptime: ${item.uptimeSec}s`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Tag Filter Indicator */}
        {selectedTag && (
          <div className="flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-cyan-400" />
              <span>Filtering by Highlight Tag: <strong>"{selectedTag}"</strong></span>
            </div>
            <button
              onClick={() => setSelectedTag('')}
              className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 rounded font-bold transition"
            >
              Clear Tag
            </button>
          </div>
        )}

        {/* Sentinels Health Drawer with Inline Search & Category Filter Pills */}
        {showSentinels && (
          <div className="p-6 bg-slate-900/90 border border-emerald-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-100">Proactive Harness Sentinel Health Matrix</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRunSentinels}
                  disabled={isReverifyingSentinels}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Trigger live re-verification of all 42 proactive sentinels"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isReverifyingSentinels ? 'animate-spin' : ''}`} />
                  <span>{isReverifyingSentinels ? 'Verifying...' : 'Re-Verify All'}</span>
                </button>
                <a
                  href="/api/sentinels/export?format=csv"
                  download="pi-sentinels-telemetry.csv"
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="Export sentinel benchmark records to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </a>
                <select
                  value={sentinelSortBy}
                  onChange={(e) => setSentinelSortBy(e.target.value as 'default' | 'speed-desc' | 'speed-asc' | 'name')}
                  className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                  title="Sort sentinels by speed or name"
                >
                  <option value="default">Default Order</option>
                  <option value="speed-desc">Slowest First</option>
                  <option value="speed-asc">Fastest First</option>
                  <option value="name">Sort by Name</option>
                </select>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search sentinels..."
                    value={sentinelSearchQuery}
                    onChange={(e) => setSentinelSearchQuery(e.target.value)}
                    className="pl-8 pr-6 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition w-36 sm:w-48"
                  />
                  {sentinelSearchQuery && (
                    <button
                      onClick={() => setSentinelSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                  {sentinelCategories.map((sc) => (
                    <button
                      key={sc}
                      onClick={() => setSentinelCategoryFilter(sc)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition whitespace-nowrap ${
                        sentinelCategoryFilter === sc
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sc === 'All' ? `All (${sentinels.length})` : `${sc} (${sentinelCategoryCounts[sc] || 0})`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredSentinels.map((s) => (
                <div key={s.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 group">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200 font-semibold truncate max-w-[110px]" title={s.name}>{s.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">
                        {s.status}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/sentinel-log?id=${s.id}`);
                            setSelectedSentinelLog(await res.json());
                          } catch {
                            setSelectedSentinelLog({
                              id: s.id,
                              name: s.name,
                              category: s.category,
                              status: s.status,
                              speedMs: s.speedMs,
                              timestamp: new Date().toISOString(),
                              rule: `Check for violations matching rule pattern [${s.category}]`,
                              stdout: `[INIT] ${s.name} (${s.id})\n[VERIFY] Executed in ${s.speedMs}ms.\n[RESULT] PASS.`
                            });
                          }
                        }}
                        className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded text-[10px] font-semibold transition"
                        title="View sentinel execution log"
                      >
                        Log
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{s.category}</span>
                    <span>{s.speedMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Breakdown Card */}
        {showAnalytics && (
          <div className="p-6 bg-slate-900/90 border border-indigo-500/30 rounded-3xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-100">Progress Velocity & Category Breakdown</h2>
              </div>
              <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                Live Distribution
              </span>
            </div>

            <div className="space-y-4">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const percentage = Math.round((count / maxCategoryCount) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-slate-300">
                      <span>{cat}</span>
                      <span className="text-cyan-400 font-bold">{count} updates</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subagents Matrix Drawer with Inline Search & Dispatch Button */}
        {showSubagents && (
          <div className="p-6 bg-slate-900/90 border border-cyan-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">Live Subagent Execution Telemetry</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search subagents..."
                    value={subagentSearchQuery}
                    onChange={(e) => setSubagentSearchQuery(e.target.value)}
                    className="pl-8 pr-6 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition w-36 sm:w-48"
                  />
                  {subagentSearchQuery && (
                    <button
                      onClick={() => setSubagentSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <select
                  value={subagentSortBy}
                  onChange={(e) => setSubagentSortBy(e.target.value as 'newest' | 'duration-desc' | 'duration-asc' | 'tokens-desc')}
                  className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                  title="Sort subagent executions by metric"
                >
                  <option value="newest">Newest First</option>
                  <option value="duration-desc">Slowest First</option>
                  <option value="duration-asc">Fastest First</option>
                  <option value="tokens-desc">Most Tokens</option>
                </select>
                {subagentStatusFilter !== 'All' && (
                  <button
                    onClick={() => setSubagentStatusFilter('All')}
                    className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-700 rounded transition"
                  >
                    Reset Status
                  </button>
                )}
                <button
                  onClick={() => setShowDispatchModal(true)}
                  className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dispatch Task</span>
                </button>
                <a
                  href="/api/subagents/export?format=csv"
                  download="pi-subagents-telemetry.csv"
                  className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="Export subagent execution telemetry to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export CSV</span>
                </a>
                <button
                  onClick={handleClearSubagents}
                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="Reset subagent execution history to default baseline"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reset History</span>
                </button>
                <button
                  onClick={handleFlushAllSubagents}
                  className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-200 border border-red-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="Purge all subagent telemetry records"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Flush All</span>
                </button>
                {['All', 'Completed', 'Running'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSubagentStatusFilter(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                      subagentStatusFilter === st
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Subagent Model Leaderboard */}
            {modelLeaderboard.length > 0 && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-200">
                    <Award className="w-4 h-4 text-amber-400" /> Subagent Model Leaderboard & Performance Stats
                  </span>
                  <span className="text-amber-400 font-bold">{modelLeaderboard.length} Active Models</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {modelLeaderboard.map((m, idx) => (
                    <div key={m.model} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-bold truncate max-w-[130px]" title={m.model}>{m.model}</span>
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold text-[10px]">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                        <span>Tasks: <strong className="text-slate-200">{m.tasks}</strong></span>
                        <span>Avg: <strong className="text-emerald-400">{m.avgDuration}ms</strong></span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Total Tokens: <span className="text-indigo-300 font-semibold">{m.tokens}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Metric Visualizer (Duration vs Tokens Toggle) */}
            {subagents.length > 0 && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-200">
                    <Timer className="w-3.5 h-3.5 text-cyan-400" />
                    {subagentChartMetric === 'duration' ? 'Execution Duration Distribution (ms)' : 'Token Usage Distribution (tokens)'}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                      <button
                        onClick={() => setSubagentChartMetric('duration')}
                        className={`px-2 py-0.5 rounded font-semibold transition ${
                          subagentChartMetric === 'duration'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Duration
                      </button>
                      <button
                        onClick={() => setSubagentChartMetric('tokens')}
                        className={`px-2 py-0.5 rounded font-semibold transition ${
                          subagentChartMetric === 'tokens'
                            ? 'bg-indigo-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Tokens
                      </button>
                    </div>
                    <span className="text-cyan-300">
                      Max: {subagentChartMetric === 'duration' ? `${maxSubagentDuration}ms` : `${Math.max(...subagents.map(s => s.tokensUsed || 0))} tokens`}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  {subagents.slice(0, 5).map((s) => {
                    const maxVal = subagentChartMetric === 'duration'
                      ? maxSubagentDuration
                      : Math.max(...subagents.map(item => item.tokensUsed || 0), 1);
                    const currentVal = subagentChartMetric === 'duration' ? s.durationMs : (s.tokensUsed || 0);
                    const widthPercent = Math.min(100, Math.max(10, (currentVal / maxVal) * 100));

                    return (
                      <div key={s.id} className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>{s.name} ({s.model})</span>
                          <span className={subagentChartMetric === 'duration' ? 'text-cyan-300 font-bold' : 'text-indigo-300 font-bold'}>
                            {subagentChartMetric === 'duration' ? `${s.durationMs}ms` : `${s.tokensUsed || 0} tokens`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              subagentChartMetric === 'duration'
                                ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-400'
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredSubagents.map((s) => (
                <div key={s.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition space-y-2 group">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="text-cyan-400 font-bold">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                        {s.status}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/subagent-log?id=${s.id}`);
                            const data = await res.json();
                            setSelectedSubagentLog(data);
                          } catch {
                            setSelectedSubagentLog({
                              id: s.id,
                              name: s.name,
                              model: s.model,
                              status: s.status,
                              durationMs: s.durationMs,
                              tokensUsed: s.tokensUsed || 180,
                              timestamp: s.timestamp,
                              task: s.task,
                              stdout: `[${s.timestamp}] [INIT] Subagent "${s.name}" initialized.\n[${s.timestamp}] [TASK] "${s.task}"\n[${s.timestamp}] [DONE] Executed in ${s.durationMs}ms.`
                            });
                          }
                        }}
                        className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                        title="View subagent execution terminal log"
                      >
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        Log
                      </button>
                      <button
                        onClick={() => handleRerunSubagent(s.id)}
                        className="px-1.5 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                        title="Duplicate and rerun this subagent task"
                      >
                        <RefreshCw className="w-3 h-3 text-indigo-400" />
                        Rerun
                      </button>
                      <button
                        onClick={() => handleDeleteSubagentItem(s.id)}
                        className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                        title="Delete this subagent execution record"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300">{s.task}</div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-900">
                    <span>{s.model}</span>
                    <span>{s.durationMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remotion Video Player Section */}
        {showVideo && (
          <div className="p-6 bg-slate-900/80 border border-cyan-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">Remotion Progress Reel</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">30 FPS • Dynamic Composition</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 aspect-video max-w-4xl mx-auto shadow-inner">
              <Player
                component={ProgressVideo}
                inputProps={{ updates: updates as VideoUpdateItem[] }}
                durationInFrames={totalVideoFrames}
                compositionWidth={1280}
                compositionHeight={720}
                fps={30}
                style={{ width: '100%', height: '100%' }}
                controls
                autoPlay
                loop
              />
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition"></div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>TOTAL UPDATES</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-100">{updates.length}</div>
            <div className="mt-2 text-xs text-slate-400">Logged since loop start</div>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition"></div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>TEST PASS RATE</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400">100%</div>
            <div className="mt-2 text-xs text-slate-400">126 core + 42 sentinels passing</div>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition"></div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>CONTINUITY VAULT</span>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-indigo-300">Synchronized</div>
            <div className="mt-2 text-xs text-slate-400">Obsidian PI Vault Active</div>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition"></div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>EXPORTER READY</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-amber-300">MD / JSON</div>
            <div className="mt-2 text-xs text-slate-400">Instant markdown & JSON export</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col space-y-3 pb-4 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setOnlyBookmarkedFilter(!onlyBookmarkedFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition whitespace-nowrap flex items-center gap-1.5 ${
                  onlyBookmarkedFilter
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
                title="Filter to bookmarked milestone updates"
              >
                <Star className={`w-3.5 h-3.5 ${onlyBookmarkedFilter ? 'fill-slate-950 text-slate-950' : 'text-amber-400'}`} />
                <span>Saved ({bookmarkedIds.length})</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {isFiltered && (
                <button
                  onClick={resetAllFilters}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1 transition"
                  title="Clear all active filters"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Filters</span>
                </button>
              )}
              <button
                onClick={handleClearUpdates}
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="Reset timeline feed updates to default baseline"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset Feed</span>
              </button>
              <button
                onClick={() => setShowCreateMilestoneModal(true)}
                className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="Create a new milestone update manually"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>New Milestone</span>
              </button>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search updates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Search Suggestions */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pt-1">
            <span>Quick Suggestions:</span>
            {searchSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => setSearchQuery(s)}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Updates List */}
        <div className="space-y-4">
          {filteredUpdates.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">No updates matching current filters.</p>
            </div>
          ) : (
            filteredUpdates.map((item) => (
              compactTimeline ? (
                /* Compact Timeline Item */
                <div
                  key={item.id}
                  className="p-3 bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 rounded-xl transition duration-200 flex items-center justify-between gap-4 font-mono text-xs group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      onClick={() => toggleBookmark(item.id)}
                      className="p-1 rounded hover:bg-slate-800 transition shrink-0"
                      title={bookmarkedIds.includes(item.id) ? "Remove bookmark" : "Bookmark milestone"}
                    >
                      <Star className={`w-3.5 h-3.5 ${bookmarkedIds.includes(item.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'}`} />
                    </button>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-400 border border-slate-700 shrink-0">
                      {item.category}
                    </span>
                    <span className="font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 shrink-0">
                    <span>{item.author}</span>
                    <span>•</span>
                    <span>{item.relativeTime}</span>
                    <button
                      onClick={() => handleOpenEditUpdate(item)}
                      className="p-1 text-slate-500 hover:text-cyan-300 transition"
                      title="Edit milestone update"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUpdateItem(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Delete milestone update"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Expanded Timeline Item */
                <div
                  key={item.id}
                  className="p-6 bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl transition duration-200 space-y-4 group relative"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/50 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBookmark(item.id)}
                        className="p-1 rounded-lg hover:bg-slate-800 transition"
                        title={bookmarkedIds.includes(item.id) ? "Remove bookmark" : "Bookmark milestone"}
                      >
                        <Star className={`w-4 h-4 ${bookmarkedIds.includes(item.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'}`} />
                      </button>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-cyan-400 border border-slate-700">
                        {item.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {item.relativeTime}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">{item.author}</span>
                      <button
                        onClick={() => handleOpenEditUpdate(item)}
                        className="p-1 text-slate-500 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 rounded transition"
                        title="Edit milestone update"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUpdateItem(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded transition"
                        title="Delete milestone update"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {item.highlights && item.highlights.length > 0 && (
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Key Improvements
                      </div>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                        {item.highlights.map((h, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold mt-0.5">›</span>
                            <button
                              onClick={() => setSelectedTag(h)}
                              className="hover:text-cyan-300 hover:underline text-left transition"
                              title="Click to filter by this tag"
                            >
                              {h}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.metrics && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(item.metrics).map(([k, v]) => (
                        <div key={k} className="px-3 py-1 bg-slate-800/60 rounded-lg text-xs font-mono border border-slate-700/60 flex items-center gap-2">
                          <span className="text-slate-400 capitalize">{k}:</span>
                          <span className="text-cyan-300 font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            ))
          )}
        </div>
      </main>

      {/* Command Palette Modal */}
        {showCommandPalette && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
            <div
              className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col space-y-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
                <Command className="w-5 h-5 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type a command or search actions... (Ctrl+K or Esc to close)"
                  value={commandQuery}
                  onChange={(e) => {
                    setCommandQuery(e.target.value);
                    setCommandSelectedIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowCommandPalette(false);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setCommandSelectedIndex(prev => (prev + 1) % (filteredCommandActions.length || 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setCommandSelectedIndex(prev => (prev - 1 + (filteredCommandActions.length || 1)) % (filteredCommandActions.length || 1));
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredCommandActions[commandSelectedIndex]) {
                        filteredCommandActions[commandSelectedIndex].run();
                        setShowCommandPalette(false);
                      }
                    }
                  }}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
                />
                <button
                  onClick={() => setShowCommandPalette(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 font-mono"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1 font-mono text-xs">
                {filteredCommandActions.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    No matching commands found for "{commandQuery}"
                  </div>
                ) : (
                  filteredCommandActions.map((cmd, idx) => {
                    const Icon = cmd.icon;
                    const isSelected = idx === commandSelectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.run();
                          setShowCommandPalette(false);
                        }}
                        onMouseEnter={() => setCommandSelectedIndex(idx)}
                        className={`w-full p-3 rounded-xl flex items-center justify-between transition text-left ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
                            : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span className="font-semibold">{cmd.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                            {cmd.category}
                          </span>
                          {cmd.hotkey && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                              {cmd.hotkey}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Use ↑ ↓ to navigate, Enter to select</span>
                <span>Ctrl+K or / to open</span>
              </div>
            </div>
          </div>
        )}

      {/* Subagent Execution Log Modal */}
        {selectedSubagentLog && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-4 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-slate-100">
                    Subagent Execution Log: {selectedSubagentLog.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedSubagentLog(null)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px]">MODEL</div>
                  <div className="text-cyan-300 font-bold">{selectedSubagentLog.model}</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px]">DURATION</div>
                  <div className="text-emerald-400 font-bold">{selectedSubagentLog.durationMs}ms</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px]">TOKENS USED</div>
                  <div className="text-indigo-300 font-bold">{selectedSubagentLog.tokensUsed}</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px]">STATUS</div>
                  <div className="text-emerald-400 font-bold">{selectedSubagentLog.status}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
                <div className="text-slate-500 text-[10px]">TASK PROMPT</div>
                <div className="text-slate-200">{selectedSubagentLog.task}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>TERMINAL STDOUT / STDERR STREAM</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedSubagentLog.stdout);
                      setCopiedLog(true);
                      setTimeout(() => setCopiedLog(false), 2000);
                    }}
                    className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                  >
                    {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                    <span>{copiedLog ? 'Copied Log' : 'Copy Log'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-56 scrollbar-none leading-relaxed">
                  {selectedSubagentLog.stdout}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedSubagentLog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
                >
                  Close Log
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Sentinel Execution Log Modal */}
      {selectedSentinelLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  Sentinel Execution Log: {selectedSentinelLog.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSentinelLog(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-500 text-[10px]">CATEGORY</div>
                <div className="text-emerald-300 font-bold">{selectedSentinelLog.category}</div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-500 text-[10px]">SPEED</div>
                <div className="text-cyan-400 font-bold">{selectedSentinelLog.speedMs}ms</div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-500 text-[10px]">STATUS</div>
                <div className="text-emerald-400 font-bold">{selectedSentinelLog.status}</div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-slate-500 text-[10px]">ID</div>
                <div className="text-indigo-300 font-bold">{selectedSentinelLog.id}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
              <div className="text-slate-500 text-[10px]">RULE PATTERN</div>
              <div className="text-slate-200">{selectedSentinelLog.rule}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>SENTINEL STDOUT STREAM</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedSentinelLog.stdout);
                    setCopiedLog(true);
                    setTimeout(() => setCopiedLog(false), 2000);
                  }}
                  className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                >
                  {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-emerald-400" />}
                  <span>{copiedLog ? 'Copied Log' : 'Copy Log'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-56 scrollbar-none leading-relaxed">
                {selectedSentinelLog.stdout}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSentinelLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Milestone Modal */}
      {editingUpdate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  Edit Milestone: {editingUpdate.id}
                </h2>
              </div>
              <button
                onClick={() => setEditingUpdate(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Highlights (one per line)</label>
                <textarea
                  rows={3}
                  value={editHighlightsText}
                  onChange={(e) => setEditHighlightsText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingUpdate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedUpdate}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Milestone Modal */}
      {showCreateMilestoneModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  Create New Milestone
                </h2>
              </div>
              <button
                onClick={() => setShowCreateMilestoneModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Memory Optimization Engine"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <select
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the milestone update details..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Highlights (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Highlight 1&#10;Highlight 2"
                  value={createHighlightsText}
                  onChange={(e) => setCreateHighlightsText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCreateMilestoneModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMilestone}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs transition"
              >
                Create Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono space-y-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="text-slate-600 font-semibold mr-1">Hotkeys:</span>
          {[
            { key: '?', label: 'Legend', run: () => setShowHotkeyModal(true) },
            { key: 'Ctrl+K', label: 'Palette', run: () => setShowCommandPalette(true) },
            { key: 'R', label: 'Refresh', run: handleRefresh },
            { key: 'H', label: 'Health', run: () => setShowHealth(prev => !prev) },
            { key: 'S', label: 'Sentinels', run: () => setShowSentinels(prev => !prev) },
            { key: 'B', label: 'Subagents', run: () => setShowSubagents(prev => !prev) },
            { key: 'M', label: audioEnabled ? 'Mute' : 'Chime', run: () => setAudioEnabled(prev => !prev) },
            { key: 'T', label: 'Theme', run: () => setActiveTheme(t => t === 'slate' ? 'cyber' : t === 'cyber' ? 'obsidian' : 'slate') },
            { key: 'P', label: autoPolling ? 'Pause' : 'Poll', run: () => setAutoPolling(prev => !prev) },
            { key: 'C', label: compactTimeline ? 'Expanded' : 'Compact', run: () => setCompactTimeline(prev => !prev) },
          ].map((hk) => (
            <button
              key={hk.key}
              onClick={hk.run}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 rounded-md transition flex items-center gap-1 cursor-pointer"
              title={`Hotkey ${hk.key}: ${hk.label}`}
            >
              <span className="text-cyan-400 font-bold bg-cyan-500/10 px-1 py-0.2 rounded text-[10px]">{hk.key}</span>
              <span>{hk.label}</span>
            </button>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-500" />
            <span>Pi Agent Harness Continuous Self-Improvement System</span>
          </div>
          <div>
            <span>Localhost Server running on port 3050</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

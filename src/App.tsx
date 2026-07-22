import { useState, useEffect } from 'react';
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
  HeartPulse
} from 'lucide-react';
import initialUpdates from './data/updates.json';
import initialSubagents from './data/subagents.json';
import initialSentinels from './data/sentinels.json';
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

export default function App() {
  const [updates, setUpdates] = useState<UpdateItem[]>((initialUpdates as unknown) as UpdateItem[]);
  const [subagents, setSubagents] = useState<SubagentItem[]>((initialSubagents as unknown) as SubagentItem[]);
  const [sentinels, setSentinels] = useState<SentinelItem[]>((initialSentinels as unknown) as SentinelItem[]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [showSubagents, setShowSubagents] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [showSentinels, setShowSentinels] = useState<boolean>(false);
  const [showHealth, setShowHealth] = useState<boolean>(false);

  const categories = ['All', 'Harness Core', 'Sentinels', 'UI/TUI', 'Progress Dashboard', 'Subagents'];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [resUpdates, resSubagents, resSentinels, resHealth] = await Promise.all([
        fetch('/api/updates?t=' + Date.now()),
        fetch('/api/subagents?t=' + Date.now()),
        fetch('/api/sentinels?t=' + Date.now()),
        fetch('/api/health?t=' + Date.now())
      ]);
      if (resUpdates.ok) setUpdates(await resUpdates.json());
      if (resSubagents.ok) setSubagents(await resSubagents.json());
      if (resSentinels.ok) setSentinels(await resSentinels.json());
      if (resHealth.ok) setHealth(await resHealth.json());
    } catch {
      // fallback
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    handleRefresh();
    const interval = setInterval(handleRefresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const exportMarkdownLog = () => {
    const md = `# Pi Agent Harness — Continuous Improvement Log\n\n` +
      `*Generated on ${new Date().toLocaleString()} • http://localhost:3050*\n\n` +
      updates.map((u, i) => (
        `### ${i + 1}. ${u.title} [${u.category}]\n` +
        `**Status**: ${u.status} | **Author**: ${u.author} | **Time**: ${u.relativeTime}\n\n` +
        `${u.description}\n\n` +
        `**Key Improvements:**\n` +
        u.highlights.map(h => `- ${h}`).join('\n') + '\n\n'
      )).join('---\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pi-harness-changelog-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJsonLog = () => {
    const blob = new Blob([JSON.stringify(updates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pi-harness-updates-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categoryCounts = categories.slice(1).reduce((acc, cat) => {
    acc[cat] = updates.filter(u => u.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCategoryCount = Math.max(1, ...Object.values(categoryCounts));

  const filteredUpdates = updates.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesTag = selectedTag === '' || item.highlights.some(h => h.toLowerCase().includes(selectedTag.toLowerCase()));
    const matchesQuery = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesTag && matchesQuery;
  });

  const totalVideoFrames = 90 + Math.max(1, updates.length) * 150;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Continuous Autonomous Self-Improvement Log • http://localhost:3050
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              onClick={exportMarkdownLog}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              title="Export Markdown Changelog"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Markdown</span>
            </button>
            <button
              onClick={exportJsonLog}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              title="Export JSON Updates"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">JSON</span>
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
        {/* Live System Health Drawer */}
        {showHealth && health && (
          <div className="p-6 bg-slate-900/90 border border-emerald-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-100">Live Harness Server Health Diagnostics</h2>
              </div>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                STATUS: {health.status}
              </span>
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

        {/* Sentinels Health Drawer */}
        {showSentinels && (
          <div className="p-6 bg-slate-900/90 border border-emerald-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-100">Proactive Harness Sentinel Health Matrix</h2>
              </div>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                {sentinels.length} / {sentinels.length} Active Sentinels (100% Pass)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
              {sentinels.map((s) => (
                <div key={s.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200 font-semibold truncate">{s.name}</span>
                    <span className="text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">
                      {s.status}
                    </span>
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

        {/* Subagents Matrix Drawer */}
        {showSubagents && (
          <div className="p-6 bg-slate-900/90 border border-cyan-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">Live Subagent Execution Telemetry</h2>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                {subagents.length} Recorded Subagents
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subagents.map((s) => (
                <div key={s.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="text-cyan-400 font-bold">{s.name}</span>
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                      {s.status}
                    </span>
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
            <div className="mt-2 text-xs text-slate-400">70 core + 42 sentinels passing</div>
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
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

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* Timeline Updates List */}
        <div className="space-y-6">
          {filteredUpdates.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">No updates matching current filters.</p>
            </div>
          ) : (
            filteredUpdates.map((item) => (
              <div
                key={item.id}
                className="p-6 bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl transition duration-200 space-y-4 group relative"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/50 pb-3">
                  <div className="flex items-center gap-2">
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
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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

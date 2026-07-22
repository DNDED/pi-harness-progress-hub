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
  Layers,
  ShieldCheck,
  Search,
  Code2,
  Video,
  Play,
  Download,
  FileText
} from 'lucide-react';
import initialUpdates from './data/updates.json';
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

export default function App() {
  const [updates, setUpdates] = useState<UpdateItem[]>((initialUpdates as unknown) as UpdateItem[]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(false);

  const categories = ['All', 'Harness Core', 'Sentinels', 'UI/TUI', 'Progress Dashboard', 'Subagents'];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/updates?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setUpdates(data);
      }
    } catch {
      // fallback
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
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

  const filteredUpdates = updates.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
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
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Loop Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Continuous Autonomous Self-Improvement Log • http://localhost:3050
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            <div className="mt-2 text-xs text-slate-400">62 core + 42 sentinels passing</div>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition"></div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>HARNESS SENTINELS</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-indigo-300">42</div>
            <div className="mt-2 text-xs text-slate-400">Active proactive safety sentinels</div>
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
                          <span>{h}</span>
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

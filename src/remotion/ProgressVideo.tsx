import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface VideoUpdateItem {
  id: string;
  title: string;
  category: string;
  description: string;
  highlights: string[];
  metrics?: Record<string, string | undefined>;
}

interface ProgressVideoProps {
  updates: VideoUpdateItem[];
}

export const ProgressVideo: React.FC<ProgressVideoProps> = ({ updates = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Show intro for first 90 frames (3 sec), then 150 frames (5 sec) per update
  const introFrames = 90;
  const updateFrames = 150;

  if (frame < introFrames) {
    // Intro Slide
    const scale = spring({ frame, fps, config: { damping: 12 } });
    const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

    return (
      <AbsoluteFill className="bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-12 font-sans">
        <div style={{ opacity, transform: `scale(${scale})` }} className="text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-sm font-semibold">
            PI AGENT HARNESS • AUTONOMOUS LOG
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Continuous Improvement Update
          </h1>
          <p className="text-slate-400 text-xl font-mono">
            {updates.length} Major Milestones Verified & Deployed
          </p>
        </div>
      </AbsoluteFill>
    );
  }

  // Active Update Slide
  const currentUpdateIndex = Math.min(
    Math.floor((frame - introFrames) / updateFrames),
    Math.max(0, updates.length - 1)
  );
  const activeUpdate = updates[currentUpdateIndex] || updates[0];
  const slideFrame = (frame - introFrames) % updateFrames;

  const opacity = interpolate(slideFrame, [0, 15, updateFrames - 15, updateFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(slideFrame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill className="bg-slate-950 text-slate-100 p-12 flex flex-col justify-between font-sans">
      <div style={{ opacity, transform: `translateY(${translateY}px)` }} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-sm rounded-lg">
              {activeUpdate.category}
            </span>
            <span className="text-slate-400 font-mono text-sm">
              Update #{currentUpdateIndex + 1} of {updates.length}
            </span>
          </div>
          <span className="text-emerald-400 font-mono text-sm font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            ✓ Verified
          </span>
        </div>

        <div>
          <h2 className="text-3xl font-extrabold text-slate-100">{activeUpdate.title}</h2>
          <p className="mt-3 text-slate-300 text-lg leading-relaxed">{activeUpdate.description}</p>
        </div>

        {activeUpdate.highlights && (
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Key Enhancements
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
              {activeUpdate.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">›</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animated Bottom Progress Bar */}
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 h-full transition-all"
          style={{ width: `${((frame + 1) / (introFrames + updates.length * updateFrames)) * 100}%` }}
        />
      </div>
    </AbsoluteFill>
  );
};

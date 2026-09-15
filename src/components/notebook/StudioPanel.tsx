'use client';

import React, { useState } from 'react';
import {
  Headphones,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Loader2,
  Sparkles,
  Clock,
  Radio,
  MessageSquare,
  FileText,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StudioPanelProps {
  sessionId: string;
  episode: {
    id: string;
    title: string;
    status: string;
    summary?: string | null;
    segments: Array<{
      id: string;
      orderIndex: number;
      speaker: string;
      speakerRole?: string;
      text: string;
      durationSec?: number | null;
    }>;
  } | null;
  isPlaying: boolean;
  activeSegmentIndex: number | null;
  onGeneratePodcast: () => Promise<void>;
  onPlayAll: () => void;
  onPause: () => void;
  onResume: () => void;
  onPlaySegment: (index: number) => void;
  onPlayEntireConversationTTS: () => void;
  isGenerating: boolean;
  papers: Array<{ id: string; title: string; level: number }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

/** Map speaker names to accent colours for the timeline & avatars. */
const SPEAKER_COLORS: Record<string, { bg: string; ring: string; text: string; dot: string }> = {
  Alex: {
    bg: 'bg-indigo-500/20',
    ring: 'ring-indigo-500/60',
    text: 'text-indigo-400',
    dot: 'bg-indigo-500',
  },
  Maya: {
    bg: 'bg-emerald-500/20',
    ring: 'ring-emerald-500/60',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
};

const DEFAULT_SPEAKER_COLOR = {
  bg: 'bg-zinc-500/20',
  ring: 'ring-zinc-500/60',
  text: 'text-zinc-400',
  dot: 'bg-zinc-500',
};

function speakerColor(speaker: string) {
  return SPEAKER_COLORS[speaker] ?? DEFAULT_SPEAKER_COLOR;
}

/** Get initials from a speaker name (e.g. "Alex" → "A"). */
function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Format seconds into mm:ss. */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Prominent header strip. */
function Header() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#22242a]">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/15">
        <Headphones className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-zinc-100 leading-tight">Audio Studio</h2>
        <p className="text-xs text-zinc-500">Generate &amp; listen to podcast episodes</p>
      </div>
    </div>
  );
}

/** CTA card shown when no episode exists yet. */
function GenerateCTA({
  onGenerate,
  isGenerating,
}: {
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      {/* Decorative icon cluster */}
      <div className="relative mb-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
          <Radio className="w-9 h-9 text-indigo-400" />
        </div>
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-[#15171c] ring-1 ring-[#22242a]">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-zinc-100 mb-2">Create Your Podcast</h3>
      <p className="text-sm text-zinc-400 max-w-xs mb-8 leading-relaxed">
        Transform your research papers into an engaging two-host conversation powered by AI.
      </p>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="group relative inline-flex items-center gap-2.5 px-7 py-3 rounded-xl
                   bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                   text-white font-medium text-sm shadow-lg shadow-indigo-500/20
                   transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 transition-transform group-hover:scale-110" />
            Generate Interactive Podcast
          </>
        )}
      </button>
    </div>
  );
}

/** Loading / generating state. */
function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center gap-5">
      <div className="relative">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-2xl animate-ping bg-indigo-500/10" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-zinc-100 mb-1">Generating Episode…</h3>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          AI is crafting an engaging conversation from your papers. This may take a minute.
        </p>
      </div>
    </div>
  );
}

/** Play All / Pause toggle button. */
function PlayPauseButton({
  isPlaying,
  onPlayAll,
  onPause,
  onResume,
  hasStarted,
}: {
  isPlaying: boolean;
  onPlayAll: () => void;
  onPause: () => void;
  onResume: () => void;
  hasStarted: boolean;
}) {
  const handleClick = () => {
    if (isPlaying) {
      onPause();
    } else if (hasStarted) {
      onResume();
    } else {
      onPlayAll();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl
                 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                 text-white font-medium text-sm shadow-lg shadow-indigo-500/20
                 transition-all duration-200"
    >
      {isPlaying ? (
        <>
          <Pause className="w-5 h-5" />
          Pause
        </>
      ) : (
        <>
          <Play className="w-5 h-5" />
          {hasStarted ? 'Resume' : 'Play All'}
        </>
      )}
    </button>
  );
}

/** Playback speed selector pills. */
function SpeedSelector({
  speed,
  onSelect,
}: {
  speed: number;
  onSelect: (s: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {PLAYBACK_SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors duration-150
            ${
              speed === s
                ? 'bg-indigo-500/25 text-indigo-300 ring-1 ring-indigo-500/40'
                : 'bg-[#1c1e24] text-zinc-500 hover:text-zinc-300 hover:bg-[#22242a]'
            }`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}

/** Visual timeline bar – each segment is a coloured block. */
function SegmentTimeline({
  segments,
  activeIndex,
  onSelect,
}: {
  segments: StudioPanelProps['episode'] extends infer E
    ? E extends { segments: infer S }
      ? S
      : never
    : never;
  activeIndex: number | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex gap-0.5 w-full h-2 rounded-full overflow-hidden bg-[#1c1e24]">
      {segments.map((seg, i) => {
        const color = speakerColor(seg.speaker);
        const isActive = activeIndex === i;
        return (
          <button
            key={seg.id}
            title={`${seg.speaker} – Segment ${i + 1}`}
            onClick={() => onSelect(i)}
            className={`flex-1 min-w-[4px] rounded-sm transition-all duration-200 ${
              isActive
                ? `${color.dot} ring-2 ${color.ring} scale-y-150`
                : `${color.dot} opacity-40 hover:opacity-70`
            }`}
          />
        );
      })}
    </div>
  );
}

/** Individual segment row in the list. */
function SegmentRow({
  segment,
  index,
  isActive,
  onClick,
}: {
  segment: {
    id: string;
    speaker: string;
    speakerRole?: string;
    text: string;
    durationSec?: number | null;
  };
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const color = speakerColor(segment.speaker);
  const preview =
    segment.text.length > 60 ? segment.text.slice(0, 60).trimEnd() + '…' : segment.text;

  return (
    <button
      onClick={onClick}
      className={`group flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150
        ${
          isActive
            ? 'bg-indigo-500/10 ring-1 ring-indigo-500/25'
            : 'hover:bg-[#1c1e24]'
        }`}
    >
      {/* Speaker avatar */}
      <div
        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${color.bg} ${color.text} ring-1 ${color.ring}`}
      >
        {initials(segment.speaker)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${color.text}`}>{segment.speaker}</span>
          {segment.speakerRole && (
            <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
              {segment.speakerRole}
            </span>
          )}
          {segment.durationSec != null && (
            <span className="ml-auto text-[10px] text-zinc-600 tabular-nums">
              {formatTime(segment.durationSec)}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 truncate">{preview}</p>
      </div>

      {/* Play indicator / icon */}
      {isActive ? (
        <Volume2 className="flex-shrink-0 w-4 h-4 text-indigo-400 mt-1 animate-pulse" />
      ) : (
        <SkipForward className="flex-shrink-0 w-4 h-4 text-zinc-700 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

/** Stats summary card at the bottom. */
function StatsCard({
  totalSegments,
  estimatedDuration,
  papersCount,
}: {
  totalSegments: number;
  estimatedDuration: string;
  papersCount: number;
}) {
  const stats = [
    { icon: MessageSquare, label: 'Segments', value: totalSegments },
    { icon: Clock, label: 'Duration', value: estimatedDuration },
    { icon: FileText, label: 'Papers', value: papersCount },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1 py-3 rounded-xl bg-[#1c1e24] ring-1 ring-[#22242a]"
        >
          <Icon className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-200 tabular-nums">{value}</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StudioPanel({
  sessionId,
  episode,
  isPlaying,
  activeSegmentIndex,
  onGeneratePodcast,
  onPlayAll,
  onPause,
  onResume,
  onPlaySegment,
  onPlayEntireConversationTTS,
  isGenerating,
  papers,
}: StudioPanelProps) {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Determine the current state of the panel
  const isEpisodeReady = episode !== null && episode.status !== 'generating';
  const isEpisodeGenerating =
    isGenerating || (episode !== null && episode.status === 'generating');

  // Compute estimated duration from segments
  const estimatedDurationSec =
    episode?.segments.reduce((sum, s) => sum + (s.durationSec ?? 0), 0) ?? 0;
  const estimatedDuration =
    estimatedDurationSec > 0 ? formatTime(estimatedDurationSec) : '—';

  // Whether the user has already started playback at least once
  const hasStartedPlayback = activeSegmentIndex !== null;

  return (
    <div className="flex flex-col h-full bg-[#15171c] text-zinc-200">
      <Header />

      {/* ── No episode yet ─────────────────────────────────────────── */}
      {!episode && !isEpisodeGenerating && (
        <GenerateCTA onGenerate={onGeneratePodcast} isGenerating={false} />
      )}

      {/* ── Generating ─────────────────────────────────────────────── */}
      {isEpisodeGenerating && !isEpisodeReady && <GeneratingState />}

      {/* ── Episode ready ──────────────────────────────────────────── */}
      {isEpisodeReady && (
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Episode title & summary */}
          <div className="px-5 pt-5 pb-3 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-100 leading-snug">
              {episode.title}
            </h3>
            {episode.summary && (
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                {episode.summary}
              </p>
            )}
          </div>

          {/* Playback controls */}
          <div className="px-5 pb-4 space-y-4">
            {/* Play / Pause + Speed */}
            <div className="flex items-center justify-between gap-3">
              <PlayPauseButton
                isPlaying={isPlaying}
                onPlayAll={onPlayAll}
                onPause={onPause}
                onResume={onResume}
                hasStarted={hasStartedPlayback}
              />
              <SpeedSelector speed={playbackSpeed} onSelect={setPlaybackSpeed} />
            </div>

            {/* Segment timeline bar */}
            {episode.segments.length > 0 && (
              <SegmentTimeline
                segments={episode.segments}
                activeIndex={activeSegmentIndex}
                onSelect={onPlaySegment}
              />
            )}
          </div>

          {/* Segment list */}
          <div className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
            <p className="px-2 pt-1 pb-2 text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
              Segments
            </p>
            {episode.segments.map((seg, idx) => (
              <SegmentRow
                key={seg.id}
                segment={seg}
                index={idx}
                isActive={activeSegmentIndex === idx}
                onClick={() => onPlaySegment(idx)}
              />
            ))}
          </div>

          {/* Bottom area: TTS button + Stats */}
          <div className="px-5 py-4 space-y-4 border-t border-[#22242a]">
            <button
              onClick={onPlayEntireConversationTTS}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl
                         bg-[#1c1e24] ring-1 ring-[#22242a] hover:ring-indigo-500/30
                         text-zinc-300 hover:text-zinc-100 text-sm font-medium
                         transition-all duration-200"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              Play Entire Conversation (TTS)
            </button>

            <StatsCard
              totalSegments={episode.segments.length}
              estimatedDuration={estimatedDuration}
              papersCount={papers.length}
            />
          </div>
        </div>
      )}
    </div>
  );
}

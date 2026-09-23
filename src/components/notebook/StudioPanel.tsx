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
import { PodcastEpisodeData, PodcastSegmentData } from '@/types';

export interface StudioPanelProps {
  sessionId: string;
  episode: PodcastEpisodeData | null;
  segments?: PodcastSegmentData[];
  isPlaying: boolean;
  activeSegmentIndex: number | null;
  onGeneratePodcast: () => Promise<void>;
  onPlayAll: () => void;
  onPause: () => void;
  onResume: () => void;
  onPlaySegment: (index: number) => void;
  onPlayEntireConversationTTS: () => void;
  isGenerating: boolean;
  papers?: Array<{ id: string; title: string; level: number }>;
}

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StudioPanel({
  sessionId,
  episode,
  segments: propSegments,
  isPlaying,
  activeSegmentIndex,
  onGeneratePodcast,
  onPlayAll,
  onPause,
  onResume,
  onPlaySegment,
  onPlayEntireConversationTTS,
  isGenerating,
  papers = [],
}: StudioPanelProps) {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const segments = episode?.segments || propSegments || [];
  const isEpisodeReady = episode !== null && episode.status !== 'GENERATING';
  const isEpisodeGenerating =
    isGenerating || (episode !== null && episode.status === 'GENERATING');

  const estimatedDurationSec =
    segments.reduce((sum, s) => sum + (s.durationSec ?? 0), 0) || 0;
  const estimatedDuration =
    estimatedDurationSec > 0 ? formatTime(estimatedDurationSec) : '—';

  const hasStartedPlayback = activeSegmentIndex !== null;

  return (
    <div className="w-80 flex flex-col h-full bg-[#F6F3EB] border-l border-[#E5DFD3] text-[#24211D] select-none">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#E5DFD3] bg-[#F7F4ED]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F9ECE5] border border-[#E8CEBE]">
          <Headphones className="w-4 h-4 text-[#BA5C38]" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-[#24211D] leading-tight">Audio Studio</h2>
          <p className="text-[11px] text-[#7A7469]">Synthesize &amp; listen to podcast</p>
        </div>
      </div>

      {/* No episode yet */}
      {!episode && !isEpisodeGenerating && (
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
          <div className="relative mb-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F0EBE1] border border-[#E0D8CB]">
              <Radio className="w-8 h-8 text-[#BA5C38]" />
            </div>
            <div className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-[#DDD5C5] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#B87A38]" />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-[#24211D] mb-1.5">Interactive Podcast</h3>
          <p className="text-xs text-[#7A7469] max-w-xs mb-6 leading-relaxed">
            Transform your research paper into a 2-host conversational episode with level-3 citation depth.
          </p>

          <button
            onClick={onGeneratePodcast}
            disabled={isGenerating}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-[#BA5C38] hover:bg-[#A34B28] active:bg-[#8F3E1E]
                       text-white font-medium text-xs shadow-xs
                       transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Script…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
                Generate Interactive Podcast
              </>
            )}
          </button>
        </div>
      )}

      {/* Generating state */}
      {isEpisodeGenerating && !isEpisodeReady && (
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F9ECE5] border border-[#E8CEBE]">
            <Loader2 className="w-7 h-7 text-[#BA5C38] animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#24211D] mb-1">Synthesizing Episode…</h3>
            <p className="text-xs text-[#7A7469] max-w-xs leading-relaxed">
              Analyzing the 3-level citation tree and writing the 2-host script dialogue.
            </p>
          </div>
        </div>
      )}

      {/* Episode Ready */}
      {isEpisodeReady && (
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Episode Info */}
          <div className="px-5 pt-4 pb-3 space-y-1.5 border-b border-[#ECE7DC] bg-[#FAF8F3]">
            <h3 className="text-xs font-semibold text-[#24211D] leading-snug line-clamp-2">
              {episode.title}
            </h3>
            {episode.summary && (
              <p className="text-[11px] text-[#7A7469] leading-relaxed line-clamp-2">
                {episode.summary}
              </p>
            )}
          </div>

          {/* Controls Bar */}
          <div className="p-4 space-y-3.5 bg-white border-b border-[#ECE7DC]">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (isPlaying) onPause();
                  else if (hasStartedPlayback) onResume();
                  else onPlayAll();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                           bg-[#BA5C38] hover:bg-[#A34B28] text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> {hasStartedPlayback ? 'Resume' : 'Play All'}
                  </>
                )}
              </button>

              {/* Speed Selector */}
              <div className="flex items-center gap-1">
                {PLAYBACK_SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                      playbackSpeed === s
                        ? 'bg-[#EAE4D7] text-[#24211D] font-bold border border-[#DDD5C5]'
                        : 'bg-[#F5F2EB] text-[#7A7469] hover:text-[#24211D]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Segment Timeline Blocks */}
            {segments.length > 0 && (
              <div className="flex gap-1 w-full h-2 rounded-full overflow-hidden bg-[#ECE7DC]">
                {segments.map((seg, i) => {
                  const isAlex = seg.speaker === 'Host_Alex';
                  const isActive = activeSegmentIndex === i;
                  return (
                    <button
                      key={seg.id || i}
                      title={`${isAlex ? 'Alex' : 'Maya'} – Turn ${i + 1}`}
                      onClick={() => onPlaySegment(i)}
                      className={`flex-1 min-w-[4px] rounded-xs transition-all cursor-pointer ${
                        isActive
                          ? isAlex ? 'bg-[#BA5C38] ring-2 ring-[#BA5C38]/40 scale-y-125' : 'bg-[#3D6B5A] ring-2 ring-[#3D6B5A]/40 scale-y-125'
                          : isAlex ? 'bg-[#BA5C38]/50 hover:bg-[#BA5C38]' : 'bg-[#3D6B5A]/50 hover:bg-[#3D6B5A]'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Segment List */}
          <div className="flex-1 p-2 space-y-1 overflow-y-auto bg-[#F6F3EB]">
            <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold text-[#8A8478] uppercase tracking-wider">
              Dialogue Turns ({segments.length})
            </p>
            {segments.map((seg, idx) => {
              const isAlex = seg.speaker === 'Host_Alex';
              const isActive = activeSegmentIndex === idx;
              return (
                <button
                  key={seg.id || idx}
                  onClick={() => onPlaySegment(idx)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer border ${
                    isActive
                      ? 'bg-white border-[#D9C4B2] shadow-xs ring-1 ring-[#BA5C38]/20'
                      : 'bg-white/70 hover:bg-white border-[#EBE6DC]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                      isAlex ? 'bg-[#BA5C38]' : 'bg-[#3D6B5A]'
                    }`}
                  >
                    {isAlex ? 'A' : 'M'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-semibold text-[#24211D]">
                        {isAlex ? 'Alex' : 'Maya'}
                      </span>
                      {seg.durationSec && (
                        <span className="text-[10px] text-[#8A8478] font-mono">
                          {formatTime(seg.durationSec)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#524E48] truncate leading-tight">
                      {seg.text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Area: TTS button & Stats */}
          <div className="p-4 space-y-3 border-t border-[#E5DFD3] bg-[#F7F4ED]">
            <button
              onClick={onPlayEntireConversationTTS}
              className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-xl
                         bg-white border border-[#DDD5C5] hover:border-[#BA5C38]
                         text-[#24211D] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#BA5C38]" />
              Play Entire Conversation (TTS)
            </button>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 rounded-lg bg-white border border-[#E8E2D5] shadow-2xs">
                <MessageSquare className="w-3.5 h-3.5 text-[#8A8478] mb-0.5" />
                <span className="text-xs font-bold text-[#24211D]">{segments.length}</span>
                <span className="text-[9px] text-[#8A8478] uppercase">Turns</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-white border border-[#E8E2D5] shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#8A8478] mb-0.5" />
                <span className="text-xs font-bold text-[#24211D]">{estimatedDuration}</span>
                <span className="text-[9px] text-[#8A8478] uppercase">Duration</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-white border border-[#E8E2D5] shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-[#8A8478] mb-0.5" />
                <span className="text-xs font-bold text-[#24211D]">{papers.length}</span>
                <span className="text-[9px] text-[#8A8478] uppercase">Papers</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudioPanel;

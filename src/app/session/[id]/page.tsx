"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { SourcesPanel, PaperItem } from "@/components/notebook/SourcesPanel";
import { ChatTranscript } from "@/components/notebook/ChatTranscript";
import StudioPanel from "@/components/notebook/StudioPanel";
import {
  PodcastSegmentData,
  MessageData,
  PodcastEpisodeData,
  SessionData,
  CitationNode,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map the CitationNode tree returned by the API to the flat PaperItem[] that
 * SourcesPanel expects. Each node is flattened with its `authors` joined as a
 * comma-separated string.
 */
function flattenCitationNodes(nodes: CitationNode[]): PaperItem[] {
  const result: PaperItem[] = [];

  function walk(node: CitationNode) {
    result.push({
      id: node.id,
      title: node.title,
      authors: Array.isArray(node.authors) ? JSON.stringify(node.authors) : String(node.authors),
      year: node.year ?? null,
      doi: node.doi ?? null,
      url: node.url ?? null,
      abstract: node.abstract ?? null,
      level: node.level,
      keyTakeaway: node.keyTakeaway ?? null,
    });

    if (node.children) {
      node.children.forEach(walk);
    }
  }

  nodes.forEach(walk);
  return result;
}

// ---------------------------------------------------------------------------
// Session Page
// ---------------------------------------------------------------------------

export default function SessionPage() {
  const params = useParams();
  const id = params.id as string;

  // ---- Data state ----
  const [papers, setPapers] = useState<PaperItem[]>([]);
  const [segments, setSegments] = useState<PodcastSegmentData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [episode, setEpisode] = useState<PodcastEpisodeData | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Playback state ----
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnsweringInterrupt, setIsAnsweringInterrupt] = useState(false);

  // ---- Voices ----
  const alexVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const mayaVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Keep a ref to the latest segments so callbacks always see current data.
  const segmentsRef = useRef<PodcastSegmentData[]>(segments);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  // -----------------------------------------------------------------------
  // Voice initialisation
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const assignVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer English voices
      const englishVoices = voices.filter(
        (v) => v.lang.startsWith("en")
      );

      const pool = englishVoices.length >= 2 ? englishVoices : voices;

      if (pool.length >= 2) {
        alexVoiceRef.current = pool[0];
        mayaVoiceRef.current = pool[1];
      } else if (pool.length === 1) {
        alexVoiceRef.current = pool[0];
        mayaVoiceRef.current = pool[0];
      }
    };

    // Voices may not be available synchronously in all browsers.
    assignVoices();
    window.speechSynthesis.onvoiceschanged = assignVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // -----------------------------------------------------------------------
  // Fetch session data
  // -----------------------------------------------------------------------
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch session");

      const json = await res.json();
if (!json.success) throw new Error(json.error ?? "Failed to fetch session");
const data: SessionData = json.data;

setPapers(flattenCitationNodes(data.papers ?? []));
setMessages(data.messages ?? []);

if (data.podcast) {
  setEpisode(data.podcast);
  setSegments(data.podcast.segments ?? []);
} else {
  setEpisode(null);
  setSegments([]);
}
    } catch (err) {
      console.error("Error fetching session:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial data load
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // -----------------------------------------------------------------------
  // Speech utilities
  // -----------------------------------------------------------------------

  /**
   * Speak a single segment's text using the Web Speech API.
   * Returns a promise that resolves when the utterance ends (or is
   * interrupted).
   */
  const speakText = useCallback(
    (text: string, speaker: "Host_Alex" | "Host_Maya"): Promise<void> => {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = speaker === "Host_Alex" ? 1 : 1.15;

        const voice =
          speaker === "Host_Alex"
            ? alexVoiceRef.current
            : mayaVoiceRef.current;
        if (voice) utterance.voice = voice;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      });
    },
    []
  );

  /**
   * Play the podcast starting from a given segment index, auto-advancing
   * through all remaining segments.
   */
  const playSegmentAudio = useCallback(
    async (startIndex: number) => {
      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();

      const segs = segmentsRef.current;
      for (let i = startIndex; i < segs.length; i++) {
        // Re-check segmentsRef so we use the latest data if refetched
        const seg = segmentsRef.current[i];
        if (!seg) break;

        setActiveSegmentIndex(i);
        setIsPlaying(true);

        await speakText(seg.text, seg.speaker);

        // If speech was cancelled externally (e.g. pause / interrupt), stop
        // the loop. We detect this because cancel() triggers onend immediately.
        if (!window.speechSynthesis.speaking && window.speechSynthesis.pending) {
          break;
        }
      }

      // Finished all segments (or was interrupted)
      setIsPlaying(false);
    },
    [speakText]
  );

  // -----------------------------------------------------------------------
  // Podcast generation
  // -----------------------------------------------------------------------
  const handleGeneratePodcast = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/podcast/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Generation failed");
      }

      // Refetch to pick up new segments & episode
      await fetchSession();
    } catch (err) {
      console.error("Podcast generation error:", err);
      alert("Failed to generate podcast. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  }, [id, fetchSession]);

  // -----------------------------------------------------------------------
  // Playback controls
  // -----------------------------------------------------------------------
  const handlePlayAll = useCallback(() => {
    setActiveSegmentIndex(0);
    setIsPlaying(true);
    playSegmentAudio(0);
  }, [playSegmentAudio]);

  const handlePlaySegment = useCallback(
    (index: number) => {
      setActiveSegmentIndex(index);
      setIsPlaying(true);
      playSegmentAudio(index);
    },
    [playSegmentAudio]
  );

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
  }, []);

  const handleResume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPlaying(true);
  }, []);

  // -----------------------------------------------------------------------
  // Interrupt flow
  // -----------------------------------------------------------------------
  const handleInterrupt = useCallback(
    async (question: string) => {
      // Pause current playback
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsAnsweringInterrupt(true);

      try {
        const currentSegment = activeSegmentIndex !== null ? segments[activeSegmentIndex] : null;
        const res = await fetch("/api/chat/interrupt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: id,
            question,
            segmentId: currentSegment?.id ?? null,
            pausedAtSec: 0,
          }),
        });

        if (!res.ok) throw new Error("Interrupt failed");

        const data = await res.json();
        const answer: string = data.answer ?? data.content ?? "";

        // Speak the answer via TTS
        if (answer) {
          await speakText(answer, "Host_Alex");
        }
      } catch (err) {
        console.error("Interrupt error:", err);
      } finally {
        setIsAnsweringInterrupt(false);
        // Refetch to capture the new messages in history
        await fetchSession();
      }
    },
    [id, activeSegmentIndex, segments, speakText, fetchSession]
  );

  const handleConfirmResume = useCallback(async () => {
    try {
      await fetch("/api/chat/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
    } catch (err) {
      console.error("Confirm resume error:", err);
    }

    await fetchSession();

    // Resume playback from current segment
    if (activeSegmentIndex !== null) {
      playSegmentAudio(activeSegmentIndex);
    }
  }, [id, fetchSession, activeSegmentIndex, playSegmentAudio]);

  // -----------------------------------------------------------------------
  // Play entire conversation history as TTS
  // -----------------------------------------------------------------------
  const handlePlayEntireConversationTTS = useCallback(async () => {
    window.speechSynthesis.cancel();

    for (const msg of messages) {
      const speaker = msg.role === "user" ? "Host_Maya" : "Host_Alex";
      await speakText(msg.content, speaker);
    }
  }, [messages, speakText]);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0d0e12]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-sm text-zinc-400">Loading session…</span>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="h-screen flex flex-row bg-[#0d0e12] overflow-hidden">
      {/* Left Pane – Sources */}
      <SourcesPanel
        sessionId={id}
        papers={papers}
        onPapersUpdated={fetchSession}
        onOpenGraphModal={() => {
          // Graph modal handled at a higher level or as a future feature
        }}
      />

      {/* Centre Pane – Chat / Transcript */}
      <ChatTranscript
        sessionId={id}
        segments={segments}
        messages={messages}
        activeSegmentIndex={activeSegmentIndex}
        isPlaying={isPlaying}
        onPlaySegment={handlePlaySegment}
        onPause={handlePause}
        onResume={handleResume}
        onInterrupt={handleInterrupt}
        onConfirmResume={handleConfirmResume}
        papers={papers}
        isAnsweringInterrupt={isAnsweringInterrupt}
      />

      {/* Right Pane – Studio */}
      <StudioPanel
        sessionId={id}
        episode={episode}
        segments={segments}
        isPlaying={isPlaying}
        isGenerating={isGenerating}
        activeSegmentIndex={activeSegmentIndex}
        onGeneratePodcast={handleGeneratePodcast}
        onPlayAll={handlePlayAll}
        onPause={handlePause}
        onResume={handleResume}
        onPlayEntireConversationTTS={handlePlayEntireConversationTTS}
      />
    </div>
  );
}

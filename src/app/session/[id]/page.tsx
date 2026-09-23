"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Send, 
  Mic, 
  MicOff, 
  Upload, 
  Radio, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Bot, 
  User, 
  Headphones,
  Search,
  X
} from "lucide-react";
import { VoiceSphere } from "@/components/voice/VoiceSphere";
import { PodcastSegmentData, MessageData, PodcastEpisodeData, PaperItem } from "@/types";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // Session Data State
  const [sessionTitle, setSessionTitle] = useState("Research Paper Discussion");
  const [papers, setPapers] = useState<PaperItem[]>([]);
  const [segments, setSegments] = useState<PodcastSegmentData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [episode, setEpisode] = useState<PodcastEpisodeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Playback & Voice Mode State
  const [isVoiceSphereOpen, setIsVoiceSphereOpen] = useState(false);
  const [voiceSphereStatus, setVoiceSphereStatus] = useState<
    "idle" | "listening" | "speaking" | "thinking" | "awaiting_confirmation"
  >("idle");
  const [currentSpeaker, setCurrentSpeaker] = useState("Host Alex");
  const [transcriptPreview, setTranscriptPreview] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnsweringInterrupt, setIsAnsweringInterrupt] = useState(false);
  const [isTTSPlayingAll, setIsTTSPlayingAll] = useState(false);

  // Prompt / Input State
  const [inputText, setInputText] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadQuery, setUploadQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Speech Synth Voices
  const alexVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const mayaVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const segmentsRef = useRef<PodcastSegmentData[]>(segments);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, segments, isAnsweringInterrupt]);

  // Voice setup
  useEffect(() => {
    if (typeof window === "undefined") return;
    const assignVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const english = voices.filter((v) => v.lang.startsWith("en"));
      const pool = english.length >= 2 ? english : voices;
      if (pool.length >= 2) {
        alexVoiceRef.current = pool[0];
        mayaVoiceRef.current = pool[1];
      } else if (pool.length === 1) {
        alexVoiceRef.current = pool[0];
        mayaVoiceRef.current = pool[0];
      }
    };
    assignVoices();
    window.speechSynthesis.onvoiceschanged = assignVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) {
        console.warn("Session fetch returned non-200");
        return;
      }
      const json = await res.json();
      if (!json.success || !json.data) return;

      const data = json.data;
      setSessionTitle(data.title || "Research Paper Discussion");
      setPapers(data.papers || []);
      setMessages(data.messages || []);
      if (data.podcast) {
        setEpisode(data.podcast);
        setSegments(data.podcast.segments || []);
      }
    } catch (err) {
      console.error("Error fetching session:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Web Speech helper
  const speakText = useCallback(
    (text: string, speaker: "Host_Alex" | "Host_Maya"): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = speaker === "Host_Alex" ? 1 : 1.15;
        const voice = speaker === "Host_Alex" ? alexVoiceRef.current : mayaVoiceRef.current;
        if (voice) utterance.voice = voice;

        setCurrentSpeaker(speaker === "Host_Alex" ? "Host Alex" : "Host Maya");
        setTranscriptPreview(text);
        setVoiceSphereStatus("speaking");

        utterance.onend = () => {
          setVoiceSphereStatus("listening");
          resolve();
        };
        utterance.onerror = () => {
          setVoiceSphereStatus("idle");
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });
    },
    []
  );

  // Play podcast audio segments sequentially
  const playPodcastFrom = useCallback(
    async (startIndex: number) => {
      window.speechSynthesis.cancel();
      const currentSegs = segmentsRef.current;
      setIsPlaying(true);

      for (let i = startIndex; i < currentSegs.length; i++) {
        const seg = segmentsRef.current[i];
        if (!seg) break;
        setActiveSegmentIndex(i);

        await speakText(seg.text, seg.speaker);

        if (!window.speechSynthesis.speaking && window.speechSynthesis.pending) {
          break;
        }
      }
      setIsPlaying(false);
      setVoiceSphereStatus("idle");
    },
    [speakText]
  );

  // Start Interactive Session (Podcast + Voice Mode)
  const handleStartInteractiveSession = async () => {
    // If no podcast exists yet, generate it first
    if (!episode || segments.length === 0) {
      if (papers.length === 0) {
        setShowUploadModal(true);
        return;
      }
      setIsGenerating(true);
      setVoiceSphereStatus("thinking");
      setTranscriptPreview("Synthesizing paper and citations into interactive podcast...");
      setIsVoiceSphereOpen(true);

      try {
        const res = await fetch("/api/podcast/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: id }),
        });
        const data = await res.json();
        if (data.success && data.episode) {
          setEpisode(data.episode);
          setSegments(data.episode.segments || []);
          segmentsRef.current = data.episode.segments || [];
          playPodcastFrom(0);
        }
      } catch (err) {
        console.error("Podcast generation error:", err);
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Podcast already generated: open Voice Sphere and play
      setIsVoiceSphereOpen(true);
      const startIdx = activeSegmentIndex !== null ? activeSegmentIndex : 0;
      playPodcastFrom(startIdx);
    }
  };

  // User Interruption during podcast
  const handleInterrupt = useCallback(
    async (question: string) => {
      if (!question.trim()) return;
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsAnsweringInterrupt(true);
      setVoiceSphereStatus("thinking");
      setTranscriptPreview(`Answering: "${question}"...`);

      try {
        const currentSegment =
          activeSegmentIndex !== null ? segments[activeSegmentIndex] : null;

        const res = await fetch("/api/chat/interrupt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: id,
            question,
            segmentId: currentSegment?.id || null,
            pausedAtSec: 0,
          }),
        });

        const data = await res.json();
        const answer = data.answer || "I have reviewed your question against the citation context.";

        // Speak the answer
        setVoiceSphereStatus("speaking");
        setCurrentSpeaker("AI Host");
        setTranscriptPreview(answer);
        await speakText(answer, "Host_Alex");

        // Now prompt for confirmation
        setVoiceSphereStatus("awaiting_confirmation");
        await fetchSession();
      } catch (err) {
        console.error("Interrupt error:", err);
        setVoiceSphereStatus("idle");
      } finally {
        setIsAnsweringInterrupt(false);
      }
    },
    [id, activeSegmentIndex, segments, speakText, fetchSession]
  );

  // Confirmation to resume
  const handleConfirmResume = useCallback(async () => {
    try {
      await fetch("/api/chat/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, messageText: "Yes, resume the podcast." }),
      });
      await fetchSession();
      setVoiceSphereStatus("speaking");

      // Resume from current segment
      const nextIdx = activeSegmentIndex !== null ? activeSegmentIndex : 0;
      playPodcastFrom(nextIdx);
    } catch (err) {
      console.error("Resume error:", err);
      setVoiceSphereStatus("idle");
    }
  }, [id, fetchSession, activeSegmentIndex, playPodcastFrom]);

  // Upload or crawl paper
  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadQuery.trim() || isUploading) return;
    setIsUploading(true);

    try {
      const res = await fetch("/api/papers/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          query: uploadQuery.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSession();
        setShowUploadModal(false);
        setUploadQuery("");
      } else {
        alert(data.error || "Failed to process paper");
      }
    } catch (err) {
      console.error("Crawl error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", id);

      const res = await fetch("/api/papers/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        await fetchSession();
        setShowUploadModal(false);
      } else {
        alert(data.error || "Failed to upload PDF");
      }
    } catch (err) {
      console.error("PDF upload error:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Play entire conversation history as TTS
  const handlePlayEntireConversationTTS = async () => {
    if (isTTSPlayingAll) {
      window.speechSynthesis.cancel();
      setIsTTSPlayingAll(false);
      return;
    }
    setIsTTSPlayingAll(true);
    for (const msg of messages) {
      const speaker = msg.role === "user" ? "Host_Maya" : "Host_Alex";
      await speakText(msg.content, speaker);
    }
    setIsTTSPlayingAll(false);
  };

  // Submit text input from bottom prompt
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const msg = inputText.trim();
    setInputText("");

    if (isPlaying || isVoiceSphereOpen) {
      await handleInterrupt(msg);
    } else {
      // Directly answer and save
      await handleInterrupt(msg);
    }
  };

  const rootPaper = papers.find((p) => p.level === 1) || papers[0];

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#BA5C38] animate-spin" />
          <span className="text-sm font-medium text-[#7A7469]">Loading conversation…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#FAF8F5] text-[#24211D] relative select-none">
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <header className="px-8 py-4 border-b border-[#E6E0D5] bg-[#F7F4ED] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-bold text-[#24211D] truncate max-w-md">
            {sessionTitle}
          </h1>
          {rootPaper && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-white border border-[#DDD5C5] text-[#6B645B] px-2.5 py-0.5 rounded-full font-medium">
              <FileText className="w-3 h-3 text-[#BA5C38]" />
              {papers.length} citations mapped
            </span>
          )}
        </div>

        {/* TTS Play All & Voice Mode Toggle Button */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handlePlayEntireConversationTTS}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                isTTSPlayingAll
                  ? "bg-[#BA5C38] text-white border-[#BA5C38]"
                  : "bg-white text-[#524E48] hover:text-[#24211D] border-[#DDD5C5]"
              }`}
              title="Read entire conversation audio aloud"
            >
              {isTTSPlayingAll ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#BA5C38]" />}
              <span>{isTTSPlayingAll ? "Stop Audio" : "Play Conversation (TTS)"}</span>
            </button>
          )}

          <button
            onClick={() => setIsVoiceSphereOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF0E6] border border-[#E8CEBE] hover:bg-[#F7E6D7] text-[#9A4222] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Radio className="w-3.5 h-3.5 text-[#BA5C38]" />
            <span>Voice Mode</span>
          </button>
        </div>
      </header>

      {/* ── Main Chat Stream Area ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-3xl w-full mx-auto">
        {/* Welcome state if empty */}
        {messages.length === 0 && segments.length === 0 && (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-[#F0EBE1] border border-[#E2DDD1] flex items-center justify-center text-[#BA5C38] mb-4 shadow-xs">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#24211D] mb-1">
              What research would you like to explore?
            </h2>
            <p className="text-xs text-[#7A7469] max-w-md leading-relaxed">
              Upload a paper or start an interactive session. We unpack the level-3 citation lineage and discuss it with you through two-way voice.
            </p>
          </div>
        )}

        {/* 1-on-1 Messages Feed */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center text-[11px] text-[#8A8478] py-1 font-mono">
                — {msg.content} —
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white shadow-xs ${
                  isUser ? "bg-[#BA5C38]" : "bg-[#4D4942]"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-lg text-xs md:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-[#BA5C38] text-white rounded-tr-none font-normal"
                    : "bg-white text-[#24211D] border border-[#E6E0D5] rounded-tl-none font-normal"
                }`}
              >
                {msg.isInterrupt && (
                  <div className="text-[10px] text-[#BA5C38] font-bold mb-1 flex items-center gap-1">
                    <Headphones className="w-3 h-3" />
                    Live Podcast Interruption
                  </div>
                )}
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}

        {/* Answering Interrupt Indicator */}
        {isAnsweringInterrupt && (
          <div className="flex items-center gap-3 p-4 bg-white border border-[#E6E0D5] rounded-2xl shadow-xs max-w-lg">
            <Loader2 className="w-4 h-4 text-[#BA5C38] animate-spin" />
            <span className="text-xs text-[#524E48] font-medium">
              Formulating explanation with citation context...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Center Prompt Area with 2 Hero Action Boxes ───────── */}
      <div className="p-6 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent max-w-3xl w-full mx-auto space-y-3">
        {/* The 2 Prompt Boxes requested by User */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Box 1: Upload Research Paper */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-[#F9F7F2] border border-[#E5DFD3] hover:border-[#BA5C38]/40 shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] border border-[#E8DFD3] flex items-center justify-center text-[#BA5C38] group-hover:scale-105 transition-transform shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#24211D] flex items-center gap-1">
                Upload research paper
                {papers.length > 0 && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B56]" />
                )}
              </div>
              <p className="text-[11px] text-[#7A7469] truncate">
                {rootPaper ? rootPaper.title : "PDF, arXiv, DOI, or title search"}
              </p>
            </div>
          </button>

          {/* Box 2: Start Interactive Session */}
          <button
            onClick={handleStartInteractiveSession}
            disabled={isGenerating}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#BA5C38] hover:bg-[#A34B28] text-white shadow-xs transition-all text-left group cursor-pointer disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shrink-0">
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Radio className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white">
                {isGenerating ? "Synthesizing Podcast..." : "Start interactive session"}
              </div>
              <p className="text-[11px] text-white/80 truncate">
                2-way conversational voice with live interruption
              </p>
            </div>
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question about the paper or its citations..."
            className="w-full pl-5 pr-24 py-3.5 bg-white border border-[#DDD5C5] focus:border-[#BA5C38] focus:ring-1 focus:ring-[#BA5C38]/20 rounded-2xl text-xs md:text-sm text-[#24211D] placeholder-[#9E978B] outline-none transition-all shadow-xs"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsVoiceSphereOpen(true)}
              className="p-2 rounded-xl text-[#7A7469] hover:text-[#BA5C38] hover:bg-[#F5EFE6] transition-all cursor-pointer"
              title="Voice Mode"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!inputText.trim() || isAnsweringInterrupt}
              className="p-2 bg-[#BA5C38] hover:bg-[#A34B28] disabled:opacity-40 text-white rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* ── Upload Paper Modal ─────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E0D5] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#BA5C38]" />
                <h3 className="text-sm font-bold text-[#24211D]">
                  Ingest Research Paper
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#8A8478] hover:text-[#24211D] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option A: Search Title / DOI / arXiv */}
            <form onSubmit={handlePaperSubmit} className="space-y-2">
              <label className="text-xs font-semibold text-[#524E48]">
                Search by Paper Title, DOI, or arXiv ID:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={uploadQuery}
                  onChange={(e) => setUploadQuery(e.target.value)}
                  placeholder="e.g. Attention Is All You Need or 1706.03762"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DDD5C5] focus:border-[#BA5C38] rounded-xl text-xs text-[#24211D] outline-none"
                  disabled={isUploading}
                />
                <Search className="w-4 h-4 text-[#9E978B] absolute left-3 top-3" />
              </div>
              <button
                type="submit"
                disabled={!uploadQuery.trim() || isUploading}
                className="w-full py-2.5 bg-[#BA5C38] hover:bg-[#A34B28] text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? "Crawling Citations..." : "Fetch & Map Citations"}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#E8E2D5]"></div>
              <span className="flex-shrink mx-3 text-[11px] text-[#8A8478]">OR</span>
              <div className="flex-grow border-t border-[#E8E2D5]"></div>
            </div>

            {/* Option B: Upload PDF */}
            <div>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#DDD5C5] hover:border-[#BA5C38] rounded-2xl cursor-pointer bg-[#FAF8F5] hover:bg-[#F7F2EA] transition-all">
                <Upload className="w-6 h-6 text-[#BA5C38] mb-2" />
                <span className="text-xs font-semibold text-[#24211D]">
                  {isUploading ? "Extracting PDF & Citations..." : "Upload Paper PDF"}
                </span>
                <span className="text-[10px] text-[#8A8478] mt-1">
                  Drag & drop or browse
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── ChatGPT Style Beige/Cream Voice Mode Sphere ────────── */}
      <VoiceSphere
        isOpen={isVoiceSphereOpen}
        onClose={() => {
          window.speechSynthesis.cancel();
          setIsPlaying(false);
          setIsVoiceSphereOpen(false);
        }}
        status={voiceSphereStatus}
        currentSpeaker={currentSpeaker}
        transcriptText={transcriptPreview}
        onInterrupt={handleInterrupt}
        onConfirmResume={handleConfirmResume}
        onTogglePlayPause={() => {
          if (isPlaying) {
            window.speechSynthesis.pause();
            setIsPlaying(false);
            setVoiceSphereStatus("idle");
          } else {
            window.speechSynthesis.resume();
            setIsPlaying(true);
            setVoiceSphereStatus("speaking");
          }
        }}
        isPlaying={isPlaying}
      />
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  Play, 
  Pause, 
  Headphones, 
  MessageSquare, 
  Bot, 
  User,
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { PodcastSegmentData, MessageData, PaperItem } from "@/types";

interface ChatTranscriptProps {
  sessionId: string;
  segments: PodcastSegmentData[];
  messages: MessageData[];
  activeSegmentIndex: number | null;
  isPlaying: boolean;
  onPlaySegment: (index: number) => void;
  onPause: () => void;
  onResume: () => void;
  onInterrupt: (question: string) => Promise<void>;
  onConfirmResume: () => Promise<void>;
  papers: PaperItem[];
  isAnsweringInterrupt: boolean;
}

export function ChatTranscript({
  sessionId,
  segments,
  messages,
  activeSegmentIndex,
  isPlaying,
  onPlaySegment,
  onPause,
  onResume,
  onInterrupt,
  onConfirmResume,
  papers,
  isAnsweringInterrupt,
}: ChatTranscriptProps) {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<"PODCAST" | "HISTORY">("PODCAST");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Setup Web Speech Recognition for voice interruptions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = "en-US";

        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
            onInterrupt(transcript);
          }
          setIsListening(false);
        };

        recog.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, [onInterrupt]);

  const toggleVoiceListen = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or type your question below.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Pause podcast if playing
      if (isPlaying) {
        onPause();
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAnsweringInterrupt) return;

    const q = inputText.trim();
    setInputText("");
    await onInterrupt(q);
  };

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentIndex !== null) {
      const el = document.getElementById(`segment-${activeSegmentIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeSegmentIndex]);

  // Check if last message is an interrupt waiting for confirmation
  const lastMessage = messages[messages.length - 1];
  const isAwaitingConfirmation =
    lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.isInterrupt &&
    !lastMessage.resumed;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0e12] overflow-hidden relative">
      {/* Header Tabs */}
      <div className="px-6 py-3 border-b border-[#22242a] flex items-center justify-between bg-[#121316]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("PODCAST")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "PODCAST"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-indigo-400" />
            Interactive Podcast Script
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "HISTORY"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            1-on-1 Q&A History ({messages.length})
          </button>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Podcast Playing • Click Mic to Interrupt
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {activeTab === "PODCAST" ? (
          segments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
              <Headphones className="w-12 h-12 text-zinc-600 mb-3" />
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">
                No Podcast Generated Yet
              </h3>
              <p className="text-xs max-w-sm text-zinc-500 mb-4">
                Load a paper on the left pane and click "Generate Podcast Episode" in the studio panel to synthesize the Level-3 citation narrative.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {segments.map((seg, idx) => {
                const isActive = activeSegmentIndex === idx;
                const isAlex = seg.speaker === "Host_Alex";

                return (
                  <div
                    key={seg.id || idx}
                    id={`segment-${idx}`}
                    onClick={() => onPlaySegment(idx)}
                    className={`group p-4 rounded-xl transition-all cursor-pointer border ${
                      isActive
                        ? "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/30"
                        : "bg-[#14161c] border-[#22242e] hover:border-[#323646]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isAlex
                              ? "bg-indigo-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {isAlex ? "A" : "M"}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-zinc-200 mr-2">
                            {isAlex ? "Host Alex" : "Host Maya"}
                          </span>
                          <span className="text-[10px] text-zinc-400 bg-[#1c1e26] px-2 py-0.5 rounded">
                            {seg.speakerRole || (isAlex ? "Lead Analyst" : "Investigative Host")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        {isActive && isPlaying ? (
                          <span className="flex items-center gap-1 text-indigo-400 text-xs font-medium">
                            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                            Speaking
                          </span>
                        ) : (
                          <Play className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
                        )}
                      </div>
                    </div>

                    <p
                      className={`text-xs md:text-sm leading-relaxed ${
                        isActive
                          ? "text-indigo-100 font-normal"
                          : "text-zinc-300 group-hover:text-zinc-100"
                      }`}
                    >
                      {seg.text}
                    </p>
                  </div>
                );
              })}

              {/* Interruption Answer Card if active */}
              {isAnsweringInterrupt && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-200 text-xs animate-pulse">
                  <Bot className="w-5 h-5 text-amber-400" />
                  <span>The AI host is listening to your question and preparing an explanation...</span>
                </div>
              )}
            </div>
          )
        ) : (
          /* 1-on-1 History Tab */
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No 1-on-1 dialogue recorded yet. Ask a question or interrupt the podcast anytime!
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                const isSystem = msg.role === "system";

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center text-[11px] text-zinc-400 py-1 font-mono">
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                        isUser
                          ? "bg-indigo-600 text-white"
                          : "bg-violet-600 text-white"
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl max-w-lg text-xs md:text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-[#181a22] text-zinc-200 border border-[#272b38] rounded-tl-none"
                      }`}
                    >
                      {msg.isInterrupt && (
                        <div className="text-[10px] text-indigo-300 font-medium mb-1 flex items-center gap-1">
                          <Headphones className="w-3 h-3" />
                          Live Podcast Interruption
                        </div>
                      )}
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Confirmation Banner for Interruption */}
      {isAwaitingConfirmation && (
        <div className="mx-6 mb-3 p-3 bg-indigo-950/80 border border-indigo-500/40 rounded-xl shadow-xl flex items-center justify-between gap-4 backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Host check:</strong> "Is the answer to your question ok?"
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onConfirmResume}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all shadow-md active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Yes, Resume Podcast
            </button>
          </div>
        </div>
      )}

      {/* Interactive Bottom Prompt Bar */}
      <div className="p-4 border-t border-[#22242a] bg-[#121316]">
        {/* Quick Question Chips */}
        <div className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-zinc-500 text-[10px] shrink-0">Try asking:</span>
          <button
            onClick={() => onInterrupt("Why is the level 3 foundational citation significant?")}
            className="px-2.5 py-1 rounded-full bg-[#1c1e26] hover:bg-[#252834] text-zinc-400 hover:text-zinc-200 border border-[#2b2f3c] transition-colors shrink-0"
          >
            "Why is Level 3 significant?"
          </button>
          <button
            onClick={() => onInterrupt("Explain the difference between Level 1 and Level 2.")}
            className="px-2.5 py-1 rounded-full bg-[#1c1e26] hover:bg-[#252834] text-zinc-400 hover:text-zinc-200 border border-[#2b2f3c] transition-colors shrink-0"
          >
            "Difference between Level 1 & 2"
          </button>
          <button
            onClick={() => onInterrupt("What was the main empirical bottleneck?")}
            className="px-2.5 py-1 rounded-full bg-[#1c1e26] hover:bg-[#252834] text-zinc-400 hover:text-zinc-200 border border-[#2b2f3c] transition-colors shrink-0"
          >
            "What was the main bottleneck?"
          </button>
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isPlaying
                  ? "Type question or click mic to interrupt the podcast..."
                  : "Ask anything about this research or its citations..."
              }
              className="w-full pl-4 pr-12 py-2.5 bg-[#181a20] border border-[#292c36] focus:border-indigo-500 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all shadow-inner"
              disabled={isAnsweringInterrupt}
            />
            <button
              type="button"
              onClick={toggleVoiceListen}
              className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#222530]"
              }`}
              title={isListening ? "Listening... click to stop" : "Speak to interrupt podcast"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isAnsweringInterrupt}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

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
  Headphones, 
  MessageSquare, 
  Bot, 
  User,
  ArrowRight
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

  useEffect(() => {
    if (activeSegmentIndex !== null) {
      const el = document.getElementById(`segment-${activeSegmentIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeSegmentIndex]);

  const lastMessage = messages[messages.length - 1];
  const isAwaitingConfirmation =
    lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.isInterrupt &&
    !lastMessage.resumed;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF8F5] overflow-hidden relative">
      {/* Header Tabs */}
      <div className="px-6 py-3.5 border-b border-[#E6E0D5] flex items-center justify-between bg-[#F7F4ED]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("PODCAST")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "PODCAST"
                ? "bg-white text-[#BA5C38] border border-[#DDD5C5] shadow-xs font-semibold"
                : "text-[#6B645B] hover:text-[#24211D]"
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-[#BA5C38]" />
            Interactive Podcast Script
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "HISTORY"
                ? "bg-white text-[#BA5C38] border border-[#DDD5C5] shadow-xs font-semibold"
                : "text-[#6B645B] hover:text-[#24211D]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#BA5C38]" />
            1-on-1 Q&A History ({messages.length})
          </button>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-2 text-xs text-[#2E6B56] bg-[#EDF4F0] border border-[#D1E4DB] px-3 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-[#2E6B56] animate-ping"></span>
            Podcast Playing • Click Mic to Interrupt
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAF8F5]">
        {activeTab === "PODCAST" ? (
          segments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#8A8478]">
              <div className="w-14 h-14 rounded-2xl bg-[#F0EBE1] flex items-center justify-center text-[#BA5C38] mb-3 border border-[#E2DDD1]">
                <Headphones className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-[#24211D] mb-1">
                No Podcast Generated Yet
              </h3>
              <p className="text-xs max-w-sm text-[#7A7469] mb-4 leading-relaxed">
                Add a paper on the left pane and click "Generate Interactive Podcast" in the audio studio to synthesize the Level-3 citation narrative.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-w-3xl mx-auto">
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
                        ? "bg-[#F7EFE6] border-[#D9C4B2] shadow-sm ring-1 ring-[#BA5C38]/20"
                        : "bg-white border-[#E6E0D5] hover:border-[#D6CEBF] shadow-2xs hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-2xs ${
                            isAlex
                              ? "bg-[#BA5C38]"
                              : "bg-[#3D6B5A]"
                          }`}
                        >
                          {isAlex ? "A" : "M"}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-[#24211D] mr-2">
                            {isAlex ? "Host Alex" : "Host Maya"}
                          </span>
                          <span className="text-[10px] text-[#7A7469] bg-[#F2EDE4] border border-[#E5DFD3] px-2 py-0.5 rounded font-medium">
                            {seg.speakerRole || (isAlex ? "Lead Analyst" : "Investigative Host")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#7A7469]">
                        {isActive && isPlaying ? (
                          <span className="flex items-center gap-1.5 text-[#BA5C38] text-xs font-semibold">
                            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                            Speaking
                          </span>
                        ) : (
                          <Play className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#9E978B]" />
                        )}
                      </div>
                    </div>

                    <p
                      className={`text-xs md:text-sm leading-relaxed ${
                        isActive
                          ? "text-[#1F1D1A] font-medium"
                          : "text-[#47433D] group-hover:text-[#24211D]"
                      }`}
                    >
                      {seg.text}
                    </p>
                  </div>
                );
              })}

              {/* Interruption Answer Card if active */}
              {isAnsweringInterrupt && (
                <div className="p-4 bg-[#FBF3E6] border border-[#F2DEBF] rounded-xl flex items-center gap-3 text-[#9E651E] text-xs animate-pulse shadow-xs">
                  <Bot className="w-5 h-5 text-[#BA5C38]" />
                  <span className="font-medium">The AI host is listening to your question and formulating an explanation...</span>
                </div>
              )}
            </div>
          )
        ) : (
          /* 1-on-1 History Tab */
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8A8478]">
                No 1-on-1 dialogue recorded yet. Ask a question or interrupt the podcast anytime!
              </div>
            ) : (
              messages.map((msg) => {
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 text-white shadow-xs ${
                        isUser
                          ? "bg-[#BA5C38]"
                          : "bg-[#4D4942]"
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl max-w-lg text-xs md:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-[#BA5C38] text-white rounded-tr-none font-normal"
                          : "bg-white text-[#24211D] border border-[#E6E0D5] rounded-tl-none font-normal"
                      }`}
                    >
                      {msg.isInterrupt && (
                        <div className="text-[10px] text-[#BA5C38] font-semibold mb-1 flex items-center gap-1">
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
        <div className="mx-6 mb-3 p-3.5 bg-white border border-[#E2DDD1] rounded-xl shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-[#24211D]">
            <Sparkles className="w-4 h-4 text-[#BA5C38] shrink-0" />
            <span>
              <strong>Host check:</strong> "Is the answer to your question ok?"
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onConfirmResume}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2E6B56] hover:bg-[#255746] text-white rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Yes, Resume Podcast
            </button>
          </div>
        </div>
      )}

      {/* Interactive Bottom Prompt Bar */}
      <div className="p-4 border-t border-[#E6E0D5] bg-[#F7F4ED]">
        {/* Quick Question Chips */}
        <div className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-[#8A8478] text-[10px] shrink-0 font-medium">Try asking:</span>
          <button
            onClick={() => onInterrupt("Why is the level 3 foundational citation significant?")}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F2ECE1] text-[#524E48] hover:text-[#24211D] border border-[#DDD5C5] transition-colors shrink-0 shadow-2xs font-medium cursor-pointer"
          >
            "Why is Level 3 significant?"
          </button>
          <button
            onClick={() => onInterrupt("Explain the difference between Level 1 and Level 2.")}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F2ECE1] text-[#524E48] hover:text-[#24211D] border border-[#DDD5C5] transition-colors shrink-0 shadow-2xs font-medium cursor-pointer"
          >
            "Difference between Level 1 & 2"
          </button>
          <button
            onClick={() => onInterrupt("What was the main empirical bottleneck?")}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F2ECE1] text-[#524E48] hover:text-[#24211D] border border-[#DDD5C5] transition-colors shrink-0 shadow-2xs font-medium cursor-pointer"
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
              className="w-full pl-4 pr-12 py-2.5 bg-white border border-[#DDD5C5] focus:border-[#BA5C38] focus:ring-1 focus:ring-[#BA5C38]/20 rounded-xl text-xs text-[#24211D] placeholder-[#9E978B] outline-none transition-all shadow-2xs"
              disabled={isAnsweringInterrupt}
            />
            <button
              type="button"
              onClick={toggleVoiceListen}
              className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-[#7A7469] hover:text-[#24211D] hover:bg-[#EAE4D7]"
              }`}
              title={isListening ? "Listening... click to stop" : "Speak to interrupt podcast"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isAnsweringInterrupt}
            className="p-2.5 bg-[#BA5C38] hover:bg-[#A34B28] disabled:opacity-40 text-white rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

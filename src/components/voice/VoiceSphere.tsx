"use client";

import React, { useEffect, useState } from "react";
import { 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  X, 
  CheckCircle2, 
  Volume2, 
  Sparkles,
  RotateCcw
} from "lucide-react";

interface VoiceSphereProps {
  isOpen: boolean;
  onClose: () => void;
  status: "idle" | "listening" | "speaking" | "thinking" | "awaiting_confirmation";
  currentSpeaker?: string;
  transcriptText?: string;
  onInterrupt: (question: string) => void;
  onConfirmResume: () => void;
  onTogglePlayPause: () => void;
  isPlaying: boolean;
}

export function VoiceSphere({
  isOpen,
  onClose,
  status,
  currentSpeaker = "Host Alex",
  transcriptText = "Listening to your paper analysis...",
  onInterrupt,
  onConfirmResume,
  onTogglePlayPause,
  isPlaying,
}: VoiceSphereProps) {
  const [micActive, setMicActive] = useState(true);
  const [userSpeech, setUserSpeech] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && isOpen) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = "en-US";

        recog.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          if (event.results[current].isFinal) {
            setUserSpeech(transcript);
            onInterrupt(transcript);
          } else {
            setUserSpeech(transcript);
          }
        };

        recog.onerror = (e: any) => {
          console.warn("Voice recognition error:", e);
        };

        if (micActive) {
          try {
            recog.start();
          } catch (e) {
            // Already started
          }
        }
        setRecognition(recog);

        return () => {
          try {
            recog.stop();
          } catch (e) {}
        };
      }
    }
  }, [isOpen, micActive, onInterrupt]);

  const toggleMic = () => {
    if (micActive && recognition) {
      recognition.stop();
      setMicActive(false);
    } else if (!micActive && recognition) {
      recognition.start();
      setMicActive(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#BA5C38] animate-ping" />
          <span className="text-xs font-semibold text-[#24211D] tracking-wide uppercase">
            Interactive Voice Mode
          </span>
          <span className="text-[10px] bg-[#EAE4D7] text-[#7A4B31] border border-[#DDD5C5] px-2 py-0.5 rounded-full font-mono">
            {status === "speaking" ? "AI Speaking" : status === "listening" ? "Listening..." : "Two-Way Voice"}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white border border-[#E2DDD1] hover:bg-[#F2ECE1] text-[#524E48] hover:text-[#24211D] flex items-center justify-center transition-all shadow-xs cursor-pointer"
          title="Exit Voice Mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center: The Beige/Cream/White Morphing Sphere */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md my-auto relative">
        {/* Outer ambient wave halos */}
        <div 
          className={`absolute w-72 h-72 rounded-full transition-all duration-1000 ${
            status === "speaking" 
              ? "bg-[#EFE8DC]/80 scale-125 animate-pulse" 
              : "bg-[#F5F0E6]/50 scale-100"
          }`}
        />
        <div 
          className={`absolute w-60 h-60 rounded-full transition-all duration-700 ${
            status === "speaking" 
              ? "bg-[#E8DFD1]/60 scale-115" 
              : "bg-[#F7F2E8]/60 scale-95"
          }`}
        />

        {/* The Core 3D Beige/Cream/White Morphing Sphere (ChatGPT voice mode aesthetic) */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <div 
            className={`w-full h-full rounded-full transition-all duration-500 shadow-2xl relative overflow-hidden flex items-center justify-center ${
              status === "speaking"
                ? "scale-105 shadow-[#D9CDBF]/80"
                : status === "listening"
                ? "scale-100 shadow-[#E4DACD]/70"
                : "scale-95 shadow-[#E8DFD3]/60"
            }`}
            style={{
              background: "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FAF6EE 30%, #EFE8DA 65%, #DFD2BF 100%)",
              boxShadow: "inset 0 -10px 25px rgba(186, 168, 145, 0.3), inset 0 8px 16px rgba(255, 255, 255, 0.9), 0 20px 40px rgba(160, 140, 115, 0.2)",
            }}
          >
            {/* Liquid morphing highlight inside */}
            <div 
              className={`w-32 h-32 rounded-full opacity-70 transition-all duration-1000 ${
                status === "speaking" ? "animate-spin" : ""
              }`}
              style={{
                animationDuration: "12s",
                background: "conic-gradient(from 0deg, #FFFFFF, #F3EBDD, #E2D3BE, #FFFFFF)",
                filter: "blur(8px)",
              }}
            />

            {/* Inner fluid core */}
            <div 
              className={`absolute w-20 h-20 rounded-full transition-transform duration-300 ${
                status === "speaking" ? "scale-110" : "scale-90"
              }`}
              style={{
                background: "radial-gradient(circle at 40% 40%, #FFFFFF, #FAF7F0 60%, #E8DFD3)",
                boxShadow: "0 4px 15px rgba(190, 170, 145, 0.2)",
              }}
            />

            {/* Speaking audio bars indicator inside orb */}
            {status === "speaking" && (
              <div className="absolute flex items-center gap-1">
                <span className="w-1 h-3 bg-[#BA5C38] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-6 bg-[#BA5C38] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-4 bg-[#BA5C38] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic status pill */}
        <div className="mt-8 px-4 py-1.5 rounded-full bg-white border border-[#E2DDD1] shadow-2xs text-xs font-semibold text-[#524E48] flex items-center gap-2">
          {status === "speaking" ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#BA5C38] animate-pulse" />
              <span>{currentSpeaker} is explaining...</span>
            </>
          ) : status === "listening" ? (
            <>
              <Mic className="w-3.5 h-3.5 text-[#3D6B5A] animate-pulse" />
              <span>Listening to you... Speak to interrupt</span>
            </>
          ) : status === "awaiting_confirmation" ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#B87A38]" />
              <span>"Is the answer to your question ok?"</span>
            </>
          ) : (
            <span>Ready • Speak anytime</span>
          )}
        </div>

        {/* Live speech transcript preview */}
        <div className="mt-4 max-w-md text-center px-4">
          <p className="text-sm font-medium text-[#24211D] leading-relaxed line-clamp-3">
            "{transcriptText}"
          </p>
          {userSpeech && (
            <p className="text-xs text-[#8A8478] mt-2 italic">
              You said: "{userSpeech}"
            </p>
          )}
        </div>

        {/* Confirmation Quick Action if Host is checking */}
        {status === "awaiting_confirmation" && (
          <div className="mt-5 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
            <button
              onClick={onConfirmResume}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2E6B56] hover:bg-[#255746] text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Yes, Resume Explanation
            </button>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="flex items-center gap-4 bg-white border border-[#E6E0D5] p-2.5 px-6 rounded-2xl shadow-lg">
        {/* Mic Mute / Unmute */}
        <button
          onClick={toggleMic}
          className={`p-3 rounded-xl transition-all cursor-pointer ${
            micActive
              ? "bg-[#FAF6EF] text-[#BA5C38] border border-[#E8DDD0] hover:bg-[#F2ECE1]"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
          title={micActive ? "Mute Microphone" : "Unmute Microphone"}
        >
          {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Pause / Resume */}
        <button
          onClick={onTogglePlayPause}
          className="p-3.5 rounded-xl bg-[#BA5C38] hover:bg-[#A34B28] text-white shadow-sm transition-all cursor-pointer active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        {/* Exit voice mode */}
        <button
          onClick={onClose}
          className="p-3 rounded-xl bg-[#FAF6EF] hover:bg-[#F2ECE1] text-[#524E48] hover:text-[#24211D] border border-[#E8DDD0] transition-all cursor-pointer"
          title="Switch to Text View"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { PodcastSegmentData } from "@/types";

export interface SpeechController {
  speakSegment: (
    segment: PodcastSegmentData,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    }
  ) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  speakText: (text: string, voiceType?: "alex" | "maya" | "assistant", onEnd?: () => void) => void;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

export function pickVoiceForSpeaker(
  speaker: "Host_Alex" | "Host_Maya" | "assistant",
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  if (speaker === "Host_Maya") {
    // Look for female voice
    const female = pool.find(
      (v) =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("victoria")
    );
    return female || pool[0];
  } else {
    // Look for male / deeper voice for Alex
    const male = pool.find(
      (v) =>
        v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("daniel") ||
        v.name.toLowerCase().includes("george") ||
        v.name.toLowerCase().includes("alex")
    );
    return male || pool[pool.length - 1];
  }
}

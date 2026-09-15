export type Speaker = "Host_Alex" | "Host_Maya" | "User" | "System";

export interface PaperItem {
  id: string;
  title: string;
  authors: string;
  year?: number | null;
  doi?: string | null;
  url?: string | null;
  abstract?: string | null;
  level: number;
  parentId?: string | null;
  relevanceScore?: number | null;
  keyTakeaway?: string | null;
  fullText?: string | null;
}

export interface CitationNode {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  doi?: string;
  url?: string;
  abstract?: string;
  level: 1 | 2 | 3;
  parentId?: string | null;
  relevanceScore?: number;
  keyTakeaway?: string;
  children?: CitationNode[];
}

export interface PodcastSegmentData {
  id: string;
  orderIndex: number;
  speaker: "Host_Alex" | "Host_Maya";
  speakerRole?: string;
  text: string;
  audioUrl?: string | null;
  durationSec?: number | null;
  paperId?: string | null;
}

export interface MessageData {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  isInterrupt: boolean;
  pausedAtSec?: number | null;
  pausedSegmentId?: string | null;
  resumed: boolean;
  audioUrl?: string | null;
  createdAt: string;
}

export interface PodcastEpisodeData {
  id: string;
  sessionId: string;
  title: string;
  status: "PENDING" | "GENERATING" | "READY" | "FAILED";
  fullAudioUrl?: string | null;
  duration?: number | null;
  summary?: string | null;
  segments: PodcastSegmentData[];
}

export interface SessionData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  papers: CitationNode[];
  podcast?: PodcastEpisodeData | null;
  messages: MessageData[];
}

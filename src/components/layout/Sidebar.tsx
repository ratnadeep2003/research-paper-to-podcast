"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  BookOpen, 
  Plus, 
  Headphones, 
  Trash2, 
  Sparkles, 
  Layers, 
  Clock, 
  ChevronRight,
  Radio
} from "lucide-react";

interface SessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  papers: Array<{ id: string; title: string; level: number }>;
  podcast?: { id: string; status: string; title: string } | null;
  _count: { messages: number };
}

export function Sidebar() {
  const params = useParams();
  const router = useRouter();
  const currentSessionId = params?.id as string | undefined;

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (e) {
      console.error("Failed to load sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]);

  const handleCreateSession = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Research Paper Notebook" }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSessions();
        router.push(`/session/${data.data.id}`);
      }
    } catch (e) {
      console.error("Failed to create session:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this research session?")) return;

    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) {
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  return (
    <aside className="w-72 bg-[#121316] border-r border-[#22242a] flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#22242a] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-1.5">
              ResearchCast
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                v1
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">NotebookLM for Papers</p>
          </div>
        </Link>
      </div>

      {/* New Notebook Button */}
      <div className="p-3">
        <button
          onClick={handleCreateSession}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {creating ? "Creating..." : "New Research Notebook"}
        </button>
      </div>

      {/* Sessions History List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        <div className="px-2 py-1.5 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
          Notebook History
        </div>

        {loading ? (
          <div className="p-4 text-center text-xs text-zinc-500">Loading notebooks...</div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            No research sessions yet. Create one to analyze a paper!
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = currentSessionId === sess.id;
            const l1 = sess.papers.find((p) => p.level === 1);
            const totalCitations = sess.papers.length;

            return (
              <Link
                key={sess.id}
                href={`/session/${sess.id}`}
                className={`group block p-2.5 rounded-lg text-xs transition-all relative ${
                  isActive
                    ? "bg-[#1c1e24] text-white border border-[#2e313b]"
                    : "text-zinc-400 hover:bg-[#18191f] hover:text-zinc-200"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <span className="font-medium truncate text-zinc-200 group-hover:text-white">
                    {sess.title}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    {totalCitations} {totalCitations === 1 ? "paper" : "papers"}
                  </span>
                  {sess.podcast?.status === "READY" && (
                    <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1 rounded">
                      <Headphones className="w-3 h-3" />
                      Podcast
                    </span>
                  )}
                  {sess._count.messages > 0 && (
                    <span className="text-zinc-400">
                      • {sess._count.messages} msgs
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#22242a] text-[11px] text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Level-3 Citation Engine
        </span>
        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
          Ready
        </span>
      </div>
    </aside>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Plus, 
  Headphones, 
  Trash2, 
  Sparkles, 
  Layers, 
  Radio,
  BookOpen
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
    <aside className="w-72 bg-[#F5F2EB] border-r border-[#E5DFD3] flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E5DFD3] bg-[#F7F4ED] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#BA5C38] to-[#D47E5B] flex items-center justify-center text-white shadow-sm shadow-[#BA5C38]/20 group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#24211D] flex items-center gap-1.5">
              ResearchCast
              <span className="text-[10px] bg-[#EAE4D7] text-[#7A4B31] border border-[#DDD5C5] px-1.5 py-0.5 rounded font-mono font-medium">
                v1
              </span>
            </h1>
            <p className="text-[11px] text-[#7A7469]">NotebookLM for Papers</p>
          </div>
        </Link>
      </div>

      {/* New Notebook Button */}
      <div className="p-3">
        <button
          onClick={handleCreateSession}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#BA5C38] hover:bg-[#A64F2D] text-white rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow-[#BA5C38]/20 active:scale-[0.98] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {creating ? "Creating Notebook..." : "New Research Notebook"}
        </button>
      </div>

      {/* Sessions History List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        <div className="px-2 py-1.5 text-[11px] font-semibold tracking-wider text-[#8A8478] uppercase">
          Notebook History
        </div>

        {loading ? (
          <div className="p-4 text-center text-xs text-[#8A8478]">Loading notebooks...</div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8A8478] leading-relaxed">
            No research sessions yet. Click above to analyze your first paper.
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = currentSessionId === sess.id;
            const totalCitations = sess.papers.length;

            return (
              <Link
                key={sess.id}
                href={`/session/${sess.id}`}
                className={`group block p-2.5 rounded-lg text-xs transition-all relative ${
                  isActive
                    ? "bg-white text-[#24211D] border border-[#DDD5C5] shadow-sm font-medium"
                    : "text-[#5A554D] hover:bg-[#ECE8DF] hover:text-[#24211D]"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <span className="truncate leading-tight">
                    {sess.title}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-600 p-1 text-[#9E978B] transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[#8A8478]">
                  <span className="flex items-center gap-1 text-[#6B5B47]">
                    <Layers className="w-3 h-3 text-[#BA5C38]" />
                    {totalCitations} {totalCitations === 1 ? "paper" : "papers"}
                  </span>
                  {sess.podcast?.status === "READY" && (
                    <span className="flex items-center gap-1 text-[#2E6B56] bg-[#E3EFE9] border border-[#CFE4DA] px-1.5 py-0.2 rounded font-medium">
                      <Headphones className="w-3 h-3" />
                      Podcast Ready
                    </span>
                  )}
                  {sess._count.messages > 0 && (
                    <span>
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
      <div className="p-3 border-t border-[#E5DFD3] bg-[#F7F4ED] text-[11px] text-[#7A7469] flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#BA5C38]" />
          Level-3 Citation Engine
        </span>
        <span className="text-[10px] bg-[#EAE5D9] text-[#615B51] border border-[#DDD6C7] px-1.5 py-0.5 rounded font-mono font-medium">
          Online
        </span>
      </div>
    </aside>
  );
}

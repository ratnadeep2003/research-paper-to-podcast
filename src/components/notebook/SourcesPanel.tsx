"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Upload, 
  Search, 
  Layers, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  GitBranch, 
  Sparkles,
  Loader2,
  CheckCircle2
} from "lucide-react";

export interface PaperItem {
  id: string;
  title: string;
  authors: string;
  year?: number | null;
  doi?: string | null;
  url?: string | null;
  abstract?: string | null;
  level: number;
  keyTakeaway?: string | null;
}

interface SourcesPanelProps {
  sessionId: string;
  papers: PaperItem[];
  onPapersUpdated: () => void;
  onOpenGraphModal: () => void;
}

export function SourcesPanel({
  sessionId,
  papers,
  onPapersUpdated,
  onOpenGraphModal,
}: SourcesPanelProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | 1 | 2 | 3>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

  const l1Papers = papers.filter((p) => p.level === 1);
  const l2Papers = papers.filter((p) => p.level === 2);
  const l3Papers = papers.filter((p) => p.level === 3);

  const filteredPapers = papers.filter((p) => {
    if (activeTab === "ALL") return true;
    return p.level === activeTab;
  });

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isCrawling) return;

    setIsCrawling(true);
    try {
      const res = await fetch("/api/papers/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          query: searchQuery.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onPapersUpdated();
        setSearchQuery("");
      } else {
        alert(data.error || "Failed to crawl citations");
      }
    } catch (err) {
      console.error("Crawl error:", err);
      alert("Error crawling citations");
    } finally {
      setIsCrawling(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);

      const res = await fetch("/api/papers/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        onPapersUpdated();
      } else {
        alert(data.error || "Failed to upload PDF");
      }
    } catch (err) {
      console.error("PDF upload error:", err);
      alert("Error uploading PDF");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const parseAuthors = (authorStr: string) => {
    try {
      const parsed = JSON.parse(authorStr);
      if (Array.isArray(parsed)) return parsed.slice(0, 3).join(", ") + (parsed.length > 3 ? " et al." : "");
    } catch {
      // ignore
    }
    return authorStr || "Authors";
  };

  return (
    <div className="w-80 bg-[#15171c] border-r border-[#22242a] flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[#22242a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-semibold text-zinc-200">Knowledge Sources</h2>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">
            {papers.length}
          </span>
        </div>
        {papers.length > 0 && (
          <button
            onClick={onOpenGraphModal}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            3D Tree
          </button>
        )}
      </div>

      {/* Ingestion Box */}
      <div className="p-3 border-b border-[#22242a] space-y-2 bg-[#121316]">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Paper / arXiv / DOI..."
            className="w-full pl-8 pr-8 py-1.5 bg-[#1a1c22] border border-[#2c2f38] focus:border-indigo-500 rounded-md text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
            disabled={isCrawling || isUploading}
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          {isCrawling && (
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 absolute right-2.5 top-2.5 animate-spin" />
          )}
        </form>

        <div className="flex items-center justify-between gap-2">
          <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-[#1c1e26] hover:bg-[#232630] border border-[#2e323e] rounded-md text-[11px] text-zinc-300 cursor-pointer transition-all">
            <Upload className="w-3 h-3 text-indigo-400" />
            <span>{isUploading ? "Extracting..." : "Upload Paper PDF"}</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isCrawling || isUploading}
            />
          </label>
        </div>

        {isCrawling && (
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded text-[11px] text-indigo-300 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
            <span>Crawling Level 1, 2, and 3 citations recursively...</span>
          </div>
        )}
      </div>

      {/* Level Filters */}
      <div className="flex items-center gap-1 p-2 border-b border-[#22242a] text-[11px]">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex-1 py-1 rounded text-center transition-all ${
            activeTab === "ALL"
              ? "bg-zinc-800 text-white font-medium"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          All ({papers.length})
        </button>
        <button
          onClick={() => setActiveTab(1)}
          className={`flex-1 py-1 rounded text-center transition-all ${
            activeTab === 1
              ? "bg-indigo-900/60 text-indigo-300 font-medium border border-indigo-500/30"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          title="Root Paper"
        >
          L1 ({l1Papers.length})
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`flex-1 py-1 rounded text-center transition-all ${
            activeTab === 2
              ? "bg-emerald-900/60 text-emerald-300 font-medium border border-emerald-500/30"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          title="Direct Citations (Predecessors)"
        >
          L2 ({l2Papers.length})
        </button>
        <button
          onClick={() => setActiveTab(3)}
          className={`flex-1 py-1 rounded text-center transition-all ${
            activeTab === 3
              ? "bg-amber-900/60 text-amber-300 font-medium border border-amber-500/30"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          title="Grandchild Citations (Seminal Lineage)"
        >
          L3 ({l3Papers.length})
        </button>
      </div>

      {/* Papers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredPapers.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            {papers.length === 0
              ? "No papers loaded yet. Search by paper title (e.g. 'Attention Is All You Need') or upload a PDF to crawl citations!"
              : "No citations found in this category."}
          </div>
        ) : (
          filteredPapers.map((paper) => {
            const isExpanded = expandedPaperId === paper.id;
            const levelBadge =
              paper.level === 1
                ? { label: "Level 1: Root", bg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" }
                : paper.level === 2
                ? { label: "Level 2: Direct", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" }
                : { label: "Level 3: Seminal", bg: "bg-amber-500/20 text-amber-300 border-amber-500/30" };

            return (
              <div
                key={paper.id}
                className="bg-[#1a1c22] border border-[#292c36] hover:border-[#383d4a] rounded-lg p-2.5 text-xs transition-all"
              >
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${levelBadge.bg}`}
                  >
                    {levelBadge.label}
                  </span>
                  {paper.year && (
                    <span className="text-[10px] text-zinc-500 font-mono">{paper.year}</span>
                  )}
                </div>

                <h3 className="font-medium text-zinc-200 leading-snug line-clamp-2 mb-1">
                  {paper.title}
                </h3>

                <p className="text-[10px] text-zinc-500 mb-2 truncate">
                  {parseAuthors(paper.authors)}
                </p>

                {paper.keyTakeaway && (
                  <div className="p-1.5 bg-[#121316] rounded text-[10px] text-zinc-400 border border-[#242630] mb-2 leading-relaxed">
                    <span className="text-indigo-400 font-medium">Core Role: </span>
                    {paper.keyTakeaway}
                  </div>
                )}

                {isExpanded && paper.abstract && (
                  <div className="p-2 bg-[#121316] rounded text-[11px] text-zinc-400 mb-2 leading-relaxed border border-[#242630] max-h-40 overflow-y-auto">
                    <p className="text-[10px] text-zinc-500 font-semibold mb-1 uppercase tracking-wider">
                      Abstract
                    </p>
                    {paper.abstract}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-[#252833] text-[10px] text-zinc-500">
                  <button
                    onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                    className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" /> Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" /> Abstract
                      </>
                    )}
                  </button>

                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> Source
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

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
  Loader2
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
    <div className="w-80 bg-[#FAF8F5] border-r border-[#E6E0D5] flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[#E6E0D5] bg-[#F7F4ED] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#BA5C38]" />
          <h2 className="text-xs font-semibold text-[#24211D]">Knowledge Sources</h2>
          <span className="text-[10px] bg-[#EAE4D7] text-[#615B51] border border-[#DDD5C5] px-1.5 py-0.5 rounded-full font-medium">
            {papers.length}
          </span>
        </div>
        {papers.length > 0 && (
          <button
            onClick={onOpenGraphModal}
            className="flex items-center gap-1 text-[11px] text-[#BA5C38] hover:text-[#9A4222] font-medium transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Tree View
          </button>
        )}
      </div>

      {/* Ingestion Box */}
      <div className="p-3 border-b border-[#E6E0D5] space-y-2 bg-[#F5F2EB]">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Paper / arXiv / DOI..."
            className="w-full pl-8 pr-8 py-2 bg-white border border-[#DDD6C7] focus:border-[#BA5C38] focus:ring-1 focus:ring-[#BA5C38]/20 rounded-lg text-xs text-[#24211D] placeholder-[#9E978B] outline-none transition-all shadow-2xs"
            disabled={isCrawling || isUploading}
          />
          <Search className="w-3.5 h-3.5 text-[#9E978B] absolute left-2.5 top-3" />
          {isCrawling && (
            <Loader2 className="w-3.5 h-3.5 text-[#BA5C38] absolute right-2.5 top-3 animate-spin" />
          )}
        </form>

        <div className="flex items-center justify-between gap-2">
          <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-[#F9F7F2] border border-[#DDD6C7] rounded-lg text-[11px] font-medium text-[#4D4942] cursor-pointer transition-all shadow-2xs">
            <Upload className="w-3 h-3 text-[#BA5C38]" />
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
          <div className="p-2.5 bg-[#F9ECE5] border border-[#E8CEBE] rounded-lg text-[11px] text-[#8C3C1E] flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[#BA5C38]" />
            <span className="leading-tight">Crawling Level 1, 2, and 3 citations recursively...</span>
          </div>
        )}
      </div>

      {/* Level Filters */}
      <div className="flex items-center gap-1 p-2 border-b border-[#E6E0D5] bg-[#FAF8F5] text-[11px]">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            activeTab === "ALL"
              ? "bg-[#EAE4D7] text-[#24211D] font-semibold border border-[#DDD5C5]"
              : "text-[#7A7469] hover:text-[#24211D]"
          }`}
        >
          All ({papers.length})
        </button>
        <button
          onClick={() => setActiveTab(1)}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            activeTab === 1
              ? "bg-[#F9ECE5] text-[#9A4222] font-semibold border border-[#E8CEBE]"
              : "text-[#7A7469] hover:text-[#9A4222]"
          }`}
          title="Root Paper"
        >
          L1 ({l1Papers.length})
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            activeTab === 2
              ? "bg-[#EDF4F0] text-[#2E6B56] font-semibold border border-[#D1E4DB]"
              : "text-[#7A7469] hover:text-[#2E6B56]"
          }`}
          title="Direct Citations (Predecessors)"
        >
          L2 ({l2Papers.length})
        </button>
        <button
          onClick={() => setActiveTab(3)}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            activeTab === 3
              ? "bg-[#FBF3E6] text-[#9E651E] font-semibold border border-[#F2DEBF]"
              : "text-[#7A7469] hover:text-[#9E651E]"
          }`}
          title="Grandchild Citations (Seminal Lineage)"
        >
          L3 ({l3Papers.length})
        </button>
      </div>

      {/* Papers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[#FAF8F5]">
        {filteredPapers.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8A8478] leading-relaxed">
            {papers.length === 0
              ? "No papers loaded yet. Search by paper title (e.g. 'Attention Is All You Need') or upload a PDF to crawl citations!"
              : "No citations found in this level."}
          </div>
        ) : (
          filteredPapers.map((paper) => {
            const isExpanded = expandedPaperId === paper.id;
            const levelBadge =
              paper.level === 1
                ? { label: "Level 1: Root", bg: "bg-[#F9ECE5] text-[#9A4222] border-[#E8CEBE]" }
                : paper.level === 2
                ? { label: "Level 2: Direct", bg: "bg-[#EDF4F0] text-[#2E6B56] border-[#D1E4DB]" }
                : { label: "Level 3: Seminal", bg: "bg-[#FBF3E6] text-[#9E651E] border-[#F2DEBF]" };

            return (
              <div
                key={paper.id}
                className="bg-white border border-[#E6E0D5] hover:border-[#D6CEBF] rounded-lg p-3 text-xs transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-medium ${levelBadge.bg}`}
                  >
                    {levelBadge.label}
                  </span>
                  {paper.year && (
                    <span className="text-[10px] text-[#8A8478] font-mono">{paper.year}</span>
                  )}
                </div>

                <h3 className="font-semibold text-[#24211D] leading-snug line-clamp-2 mb-1">
                  {paper.title}
                </h3>

                <p className="text-[10px] text-[#7A7469] mb-2 truncate">
                  {parseAuthors(paper.authors)}
                </p>

                {paper.keyTakeaway && (
                  <div className="p-2 bg-[#F8F5EE] rounded text-[10px] text-[#524E48] border border-[#EAE3D5] mb-2 leading-relaxed">
                    <span className="text-[#9A4222] font-semibold">Core Role: </span>
                    {paper.keyTakeaway}
                  </div>
                )}

                {isExpanded && paper.abstract && (
                  <div className="p-2.5 bg-[#F9F7F2] rounded text-[11px] text-[#4A463F] mb-2 leading-relaxed border border-[#EAE3D5] max-h-40 overflow-y-auto">
                    <p className="text-[10px] text-[#8A8478] font-semibold mb-1 uppercase tracking-wider">
                      Abstract
                    </p>
                    {paper.abstract}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-[#F0EBE0] text-[10px] text-[#7A7469]">
                  <button
                    onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                    className="hover:text-[#24211D] flex items-center gap-1 font-medium transition-colors"
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
                      className="hover:text-[#BA5C38] flex items-center gap-1 font-medium transition-colors"
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

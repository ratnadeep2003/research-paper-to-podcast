'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Sparkles,
  BookOpen,
  Headphones,
  MessageSquare,
  ArrowRight,
  Plus,
  Layers,
  GitBranch,
  Volume2
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/sessions', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Research Paper Notebook' })
      });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      router.push(`/session/${data.data.id}`);
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#24211D] flex flex-col items-center justify-between px-6 select-none">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="w-full max-w-5xl py-6 flex items-center justify-between border-b border-[#E8E2D5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#BA5C38] to-[#D47E5B] flex items-center justify-center text-white shadow-sm">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#24211D]">
            ResearchCast
          </span>
          <span className="text-[10px] bg-[#EAE4D7] text-[#7A4B31] border border-[#DDD5C5] px-2 py-0.5 rounded-full font-mono font-medium">
            NotebookLM for Papers
          </span>
        </div>

        <button
          onClick={handleCreateSession}
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#BA5C38] hover:bg-[#A34B28] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          New Notebook
        </button>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="max-w-3xl w-full text-center pt-16 pb-12 flex flex-col items-center gap-6">
        {/* Editorial Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E2D8C9] bg-[#F3EFE6] px-4 py-1.5 text-xs font-medium text-[#7A4B31]">
          <Sparkles className="h-3.5 w-3.5 text-[#BA5C38]" />
          <span>Interactive 2-Host Scientific Podcast Generator</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#24211D] leading-[1.15]">
          Turn any research paper into an{' '}
          <span className="bg-gradient-to-r from-[#BA5C38] via-[#C96F4B] to-[#9E4D26] bg-clip-text text-transparent">
            interactive podcast
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#524E48] max-w-2xl leading-relaxed">
          Traverse citations down to <strong className="text-[#24211D] font-semibold">Level 3</strong> (Paper 1 → Paper 2 → Paper 3). 
          Our dual-host AI unpacks every historical theory and breakthrough—while letting you <span className="text-[#BA5C38] font-semibold">interrupt with voice questions</span> that seamlessly resume.
        </p>

        {/* CTA Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleCreateSession}
            disabled={isCreating}
            className="inline-flex items-center gap-2.5 rounded-xl bg-[#BA5C38] px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#A34B28] hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isCreating ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Setting up Notebook…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Start Research Notebook
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Feature Highlights Banner */}
        <div className="flex items-center justify-center gap-6 pt-4 text-xs text-[#7A7469]">
          <span className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[#BA5C38]" />
            Level-3 Citation Tree
          </span>
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#3D6B5A]" />
            Dual-Host Dialogue
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#BA5C38]" />
            Real-time Interrupt &amp; Resume
          </span>
        </div>
      </section>

      {/* ── Feature Cards ────────────────────────────────────────────── */}
      <section className="max-w-4xl w-full grid grid-cols-1 sm:grid-cols-3 gap-5 pb-16">
        <FeatureCard
          icon={<Layers className="h-5 w-5 text-[#BA5C38]" />}
          level="Level 1 → 2 → 3"
          title="Deep Citation Crawling"
          description="We extract the root paper, identify top direct citations, and explore their seminal ancestors to map the complete scientific lineage."
        />
        <FeatureCard
          icon={<Headphones className="h-5 w-5 text-[#3D6B5A]" />}
          level="Alex &amp; Maya"
          title="Dynamic Dual-Host Podcast"
          description="A lead researcher and curious co-host dissect the methodologies, empirical benchmarks, and intuition in engaging conversational speech."
        />
        <FeatureCard
          icon={<MessageSquare className="h-5 w-5 text-[#BA5C38]" />}
          level="Stateful Pause"
          title="Live Q&amp;A Interruption"
          description="Interrupt the host mid-sentence by voice or text. The AI answers in context, checks if you're satisfied, and smoothly resumes playback."
        />
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="w-full max-w-5xl border-t border-[#E8E2D5] py-6 flex items-center justify-between text-xs text-[#8A8478]">
        <span>ResearchCast • Inspired by Google NotebookLM</span>
        <span>Next.js • Prisma ORM • Google Gemini</span>
      </footer>
    </main>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  level: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, level, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-[#E6E0D5] bg-white p-6 shadow-xs hover:border-[#D9D1C3] hover:shadow-sm transition-all text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#EBE4D8] flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] font-mono bg-[#F2EDE4] text-[#7A7469] border border-[#E5DFD3] px-2 py-0.5 rounded font-medium">
          {level}
        </span>
      </div>
      <h3 className="mb-1.5 text-sm font-bold text-[#24211D]">{title}</h3>
      <p className="text-xs leading-relaxed text-[#5A554D]">{description}</p>
    </div>
  );
}

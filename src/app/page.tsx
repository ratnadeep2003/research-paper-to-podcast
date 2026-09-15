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
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  /** Create a new research session and navigate to it */
  const handleCreateSession = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/sessions', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      router.push(`/session/${data.id}`);
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0b10] text-white flex flex-col items-center justify-center px-4">
      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="max-w-4xl w-full text-center pt-24 pb-16 flex flex-col items-center gap-6">
        {/* Brand chip */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
          <Radio className="h-4 w-4" />
          <span>Research → Podcast, reimagined</span>
        </div>

        {/* App name */}
        <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
            ResearchCast
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl leading-relaxed">
          Transform any research paper into an interactive AI podcast — with{' '}
          <span className="text-indigo-400 font-semibold">Level-3 citation depth</span>.
        </p>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-zinc-500 max-w-2xl leading-relaxed">
          Upload a paper or search by title. We crawl 3 levels of citations,
          synthesize the knowledge graph, and generate a 2-host podcast you can
          interrupt with questions.
        </p>

        {/* CTA Button */}
        <button
          onClick={handleCreateSession}
          disabled={isCreating}
          className="mt-4 inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <Sparkles className="h-5 w-5 animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Create New Research Notebook
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </section>

      {/* ── Feature Cards ────────────────────────────────────────────── */}
      <section className="max-w-4xl w-full grid grid-cols-1 sm:grid-cols-3 gap-5 pb-24">
        <FeatureCard
          icon={<BookOpen className="h-6 w-6 text-indigo-400" />}
          emoji="🔬"
          title="Level-3 Citation Crawling"
          description="We don't just read your paper. We traverse its citations, and their citations, building a 3-level knowledge tree."
        />
        <FeatureCard
          icon={<Headphones className="h-6 w-6 text-violet-400" />}
          emoji="🎧"
          title="Interactive Podcast"
          description="Two AI hosts break down the entire research lineage in a conversational format. Pause anytime and ask questions."
        />
        <FeatureCard
          icon={<MessageSquare className="h-6 w-6 text-purple-400" />}
          emoji="💬"
          title="Interrupt & Resume"
          description="Ask questions mid-podcast. The AI answers in context, confirms your understanding, then seamlessly resumes."
        />
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-zinc-800 py-6 text-center text-sm text-zinc-600">
        Built with Next.js, Prisma, and Google Gemini &bull; v1
      </footer>
    </main>
  );
}

/* ─── Feature Card ─────────────────────────────────────────────────────── */

interface FeatureCardProps {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, emoji, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition-all hover:border-indigo-500/40 hover:bg-zinc-900">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}

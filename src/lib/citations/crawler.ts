import { prisma } from "@/lib/prisma";
import { searchOpenAlexPaper, fetchOpenAlexReferences, reconstructAbstract, OpenAlexWork } from "./openalex";

export interface CrawlOptions {
  sessionId: string;
  rootTitle: string;
  rootDoi?: string;
  rootAbstract?: string;
  rootFullText?: string;
  maxLevel2?: number;
  maxLevel3PerL2?: number;
}

const STOPWORDS = new Set([
  "a","an","the","of","for","and","or","in","on","to","with","using","based",
  "toward","towards","via","by","from","into","study","research","paper",
]);

function significantWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

/** Word-overlap similarity between two titles, 0 (unrelated) to 1 (identical). */
function titleSimilarity(a: string, b: string): number {
  const wa = significantWords(a);
  const wb = significantWords(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let overlap = 0;
  for (const w of wa) if (wb.has(w)) overlap++;
  return overlap / Math.max(wa.size, wb.size);
}

// Below this, treat the OpenAlex "match" as noise, not the actual paper.
const MIN_TITLE_SIMILARITY = 0.4;

export async function crawlLevel3Citations(options: CrawlOptions) {
  const {
    sessionId,
    rootTitle,
    rootDoi,
    rootAbstract,
    rootFullText,
    maxLevel2 = 5,
    maxLevel3PerL2 = 2,
  } = options;

  console.log(`Starting Level 3 Citation Crawl for: "${rootTitle}"`);

  // 1. Resolve Root Paper via OpenAlex, but verify it's actually the same paper
  let openAlexRoot = await searchOpenAlexPaper(rootDoi || rootTitle);

  if (openAlexRoot && !rootDoi) {
    const sim = titleSimilarity(rootTitle, openAlexRoot.title || "");
    if (sim < MIN_TITLE_SIMILARITY) {
      console.warn(
        `OpenAlex match rejected — "${openAlexRoot.title}" (similarity ${sim.toFixed(2)}) does not match "${rootTitle}". Treating as not found.`
      );
      openAlexRoot = null;
    }
  }

  const rootAuthors = openAlexRoot?.authorships?.map((a) => a.author.display_name) || ["Primary Author"];
  const rootYear = openAlexRoot?.publication_year || new Date().getFullYear();
  const rootAbs =
    rootAbstract ||
    (openAlexRoot ? reconstructAbstract(openAlexRoot.abstract_inverted_index) : "Paper exploring core conceptual breakthrough.");

  const rootRecord = await prisma.paper.create({
    data: {
      sessionId,
      title: rootTitle,
      authors: JSON.stringify(rootAuthors),
      year: rootYear,
      doi: rootDoi || openAlexRoot?.doi || null,
      url: openAlexRoot?.primary_location?.landing_page_url || null,
      abstract: rootAbs,
      fullText: rootFullText || rootAbs,
      level: 1,
      parentId: null,
      relevanceScore: 1.0,
      keyTakeaway: `Core study presenting novel methodology, empirical results, and key conclusions.`,
    },
  });

  // Only trust OpenAlex's reference graph if we trust the root match itself
  const refWorkIds = openAlexRoot?.referenced_works || [];
  let l2Works: OpenAlexWork[] = [];
  let l2IsFallback = false;

  if (refWorkIds.length > 0) {
    l2Works = await fetchOpenAlexReferences(refWorkIds, maxLevel2);
  }

  if (l2Works.length === 0) {
    console.warn(
      `No verified OpenAlex citation graph for "${rootTitle}" — using generic placeholder citations.`
    );
    l2Works = generateFallbackL2Works(rootTitle);
    l2IsFallback = true;
  }

  // 2. Process Level 2 Papers (Direct Citations)
  for (const l2 of l2Works) {
    const l2Authors = l2.authorships?.map((a) => a.author.display_name) || ["Contributing Scholar"];
    const l2Abstract =
      reconstructAbstract(l2.abstract_inverted_index) ||
      `Foundational predecessor analyzing key mechanics for ${l2.title || "this domain"}.`;

    const l2Record = await prisma.paper.create({
      data: {
        sessionId,
        title: l2.title || "Foundational Prior Work",
        authors: JSON.stringify(l2Authors),
        year: l2.publication_year || rootYear - 2,
        doi: l2.doi || null,
        url: l2.primary_location?.landing_page_url || null,
        abstract: l2Abstract,
        level: 2,
        parentId: rootRecord.id,
        relevanceScore: l2IsFallback ? 0.3 : 0.85,
        keyTakeaway: l2IsFallback
          ? `Placeholder — no verified citation data was found for this paper; treat as illustrative only.`
          : `Direct predecessor establishing the problem context and benchmark baseline that the root paper improves upon.`,
      },
    });

    // 3. Process Level 3 Papers
    let l3Works: OpenAlexWork[] = [];
    let l3IsFallback = false;
    if (!l2IsFallback && l2.referenced_works && l2.referenced_works.length > 0) {
      l3Works = await fetchOpenAlexReferences(l2.referenced_works, maxLevel3PerL2);
    }

    if (l3Works.length === 0) {
      l3Works = generateFallbackL3Works(l2.title || "Predecessor Work");
      l3IsFallback = true;
    }

    for (const l3 of l3Works) {
      const l3Authors = l3.authorships?.map((a) => a.author.display_name) || ["Seminal Pioneer"];
      const l3Abstract =
        reconstructAbstract(l3.abstract_inverted_index) || `Seminal paper originating first principles for ${l3.title}.`;

      await prisma.paper.create({
        data: {
          sessionId,
          title: l3.title || "Seminal First Principles Paper",
          authors: JSON.stringify(l3Authors),
          year: l3.publication_year || rootYear - 5,
          doi: l3.doi || null,
          url: l3.primary_location?.landing_page_url || null,
          abstract: l3Abstract,
          level: 3,
          parentId: l2Record.id,
          relevanceScore: l3IsFallback ? 0.2 : 0.7,
          keyTakeaway: l3IsFallback
            ? `Placeholder — no verified citation data was found; treat as illustrative only.`
            : `Historical root laying the theoretical foundation and mathematical principles.`,
        },
      });
    }
  }

  const allPapers = await prisma.paper.findMany({
    where: { sessionId },
    orderBy: { level: "asc" },
  });

  return allPapers;
}

function generateFallbackL2Works(rootTitle: string): OpenAlexWork[] {
  const shortTitle = rootTitle.length > 60 ? rootTitle.slice(0, 60) + "…" : rootTitle;
  return [
    {
      id: "fallback_l2_1",
      title: `Earlier approaches to the problem addressed by "${shortTitle}"`,
      authorships: [{ author: { display_name: "Related prior work (not resolved via OpenAlex)" } }],
      cited_by_count: 0,
      referenced_works: [],
    },
    {
      id: "fallback_l2_2",
      title: `Benchmark methods commonly compared against in this paper's field`,
      authorships: [{ author: { display_name: "Related prior work (not resolved via OpenAlex)" } }],
      cited_by_count: 0,
      referenced_works: [],
    },
  ];
}

function generateFallbackL3Works(l2Title: string): OpenAlexWork[] {
  return [
    {
      id: "fallback_l3_1",
      title: `Foundational concepts underlying "${l2Title}"`,
      authorships: [{ author: { display_name: "Foundational prior work (not resolved via OpenAlex)" } }],
      cited_by_count: 0,
      referenced_works: [],
    },
  ];
}
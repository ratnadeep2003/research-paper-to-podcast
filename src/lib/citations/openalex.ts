export interface OpenAlexWork {
  id: string;
  doi?: string;
  title?: string;
  publication_year?: number;
  authorships?: Array<{ author: { display_name: string } }>;
  abstract_inverted_index?: Record<string, number[]>;
  referenced_works?: string[];
  cited_by_count?: number;
  primary_location?: {
    landing_page_url?: string;
    pdf_url?: string;
  };
  concepts?: Array<{ display_name: string; score: number }>;
}

/**
 * Reconstructs plain text abstract from OpenAlex inverted index
 */
export function reconstructAbstract(invertedIndex?: Record<string, number[]>): string {
  if (!invertedIndex) return "";
  const wordPositions: [string, number][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      wordPositions.push([word, pos]);
    }
  }
  wordPositions.sort((a, b) => a[1] - b[1]);
  return wordPositions.map((wp) => wp[0]).join(" ");
}

/**
 * Search OpenAlex for a paper by title or DOI or arXiv ID
 */
export async function searchOpenAlexPaper(query: string): Promise<OpenAlexWork | null> {
  try {
    const cleanQuery = query.trim();
    let url = "";

    if (cleanQuery.startsWith("10.") || cleanQuery.includes("doi.org")) {
      const doi = cleanQuery.replace("https://doi.org/", "");
      url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`;
    } else if (cleanQuery.toLowerCase().includes("arxiv:")) {
      const arxivId = cleanQuery.split(":")[1].trim();
      url = `https://api.openalex.org/works?filter=ids.arxiv:${encodeURIComponent(arxivId)}`;
    } else {
      url = `https://api.openalex.org/works?search=${encodeURIComponent(cleanQuery)}&per_page=1`;
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "ResearchPaperToPodcast/1.0 (mailto:dev@researchcast.ai)" },
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.results && Array.isArray(data.results)) {
      return data.results[0] || null;
    }
    return data;
  } catch (error) {
    console.error("OpenAlex search error:", error);
    return null;
  }
}

/**
 * Batch fetch metadata for referenced work IDs
 */
export async function fetchOpenAlexReferences(workIds: string[], limit: number = 7): Promise<OpenAlexWork[]> {
  try {
    if (!workIds.length) return [];
    // Take top IDs up to limit
    const targetIds = workIds.slice(0, limit);
    // IDs in OpenAlex might look like "https://openalex.org/W12345" or "W12345"
    const formattedIds = targetIds.map((id) => id.replace("https://openalex.org/", "")).join("|");
    const url = `https://api.openalex.org/works?filter=openalex_id:${formattedIds}&per_page=${limit}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "ResearchPaperToPodcast/1.0 (mailto:dev@researchcast.ai)" },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("OpenAlex batch fetch error:", error);
    return [];
  }
}

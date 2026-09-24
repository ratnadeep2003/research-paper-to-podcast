import pdf from "pdf-parse/lib/pdf-parse.js";

export interface ExtractedPaperData {
  title: string;
  abstract: string;
  fullText: string;
  numPages: number;
}

// Lines matching these are journal/publisher boilerplate, never a paper title
const JUNK_LINE_PATTERNS: RegExp[] = [
  /^©/,                          // copyright line
  /ISSN/i,
  /ISBN/i,
  /^www\./i,
  /\.org\b/i,
  /\.com\b/i,
  /volume\s*\d+/i,
  /issue\s*\d+/i,
  /^vol\.?\s*\d+/i,
  /^page\s*\d+/i,
  /^\d+$/,                       // bare page numbers
  /^https?:\/\//i,
  /^doi\s*:/i,
  /peer[-\s]?reviewed/i,
  /refereed\s*journal/i,
  /open\s*access/i,
  /international\s*journal\s*of\s*research/i, // generic journal name lines
];

// Author-list / affiliation lines: superscript refs like [1]Name, or "Department of..."
const AUTHOR_OR_AFFIL_PATTERNS: RegExp[] = [
  /^\[\d+\]/,                    // "[1]Ratnadeep Abitkar, [2] ..."
  /^department\s+of/i,
  /^\d?\s*student\s*,?\s*\d?\s*student/i,
  /college\s+of\s+engineering/i,
  /university/i,
  /^professor/i,
];

function isJunkLine(line: string): boolean {
  return JUNK_LINE_PATTERNS.some((re) => re.test(line));
}

function isAuthorOrAffilLine(line: string): boolean {
  return AUTHOR_OR_AFFIL_PATTERNS.some((re) => re.test(line));
}

function extractTitle(fullText: string, pdfMetaTitle?: string): string {
  // 1. Trust embedded PDF metadata title if present and not generic
  if (
    pdfMetaTitle &&
    pdfMetaTitle.trim().length > 8 &&
    !isJunkLine(pdfMetaTitle) &&
    !/^untitled/i.test(pdfMetaTitle.trim())
  ) {
    return pdfMetaTitle.trim();
  }

  const lines = fullText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Look only at the block before "Abstract" (or first 25 lines, whichever comes first)
  const abstractLineIdx = lines.findIndex((l) => /^abstract\b/i.test(l) || /\babstract[-\s]/i.test(l));
  const searchEnd = abstractLineIdx !== -1 ? abstractLineIdx : Math.min(lines.length, 25);

  const candidates = lines
    .slice(0, searchEnd)
    .filter((l) => l.length >= 12 && l.length < 200)
    .filter((l) => !isJunkLine(l))
    .filter((l) => !isAuthorOrAffilLine(l));

  if (candidates.length === 0) {
    return "Uploaded Research Paper";
  }

  // The real title is typically the longest remaining candidate line
  // (journal name banners tend to be short/all-caps; the title is a full sentence-like phrase)
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

export async function parsePdfBuffer(dataBuffer: Buffer): Promise<ExtractedPaperData> {
  try {
    const data = await pdf(dataBuffer);
    const fullText = data.text || "";
    const pdfMetaTitle = (data.info as any)?.Title as string | undefined;

    const title = extractTitle(fullText, pdfMetaTitle);

    // Attempt to extract abstract section
    let abstract = "";
    const lowerText = fullText.toLowerCase();
    const abstractIdx = lowerText.indexOf("abstract");
    if (abstractIdx !== -1) {
      const start = abstractIdx + 8;
      const introductionIdx = lowerText.indexOf("introduction", start);
      if (introductionIdx !== -1 && introductionIdx - start < 3000) {
        abstract = fullText.substring(start, introductionIdx).trim();
      } else {
        abstract = fullText.substring(start, start + 1000).trim();
      }
      // Strip a leading dash/colon left over from "Abstract- " or "Abstract: "
      abstract = abstract.replace(/^[\s\-:–]+/, "");
    } else {
      abstract = fullText.substring(0, 800).trim();
    }

    return {
      title,
      abstract: abstract || "Abstract could not be automatically isolated from document.",
      fullText,
      numPages: data.numpages || 1,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to extract content from the provided PDF file.");
  }
}
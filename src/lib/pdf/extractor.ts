import pdf from "pdf-parse";

export interface ExtractedPaperData {
  title: string;
  abstract: string;
  fullText: string;
  numPages: number;
}

export async function parsePdfBuffer(dataBuffer: Buffer): Promise<ExtractedPaperData> {
  try {
    const data = await pdf(dataBuffer);
    const fullText = data.text || "";

    // Heuristics to find paper title and abstract
    const lines = fullText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Title is usually one of the first non-empty lines
    let title = "Uploaded Research Paper";
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      if (lines[i].length > 10 && lines[i].length < 150) {
        title = lines[i];
        break;
      }
    }

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
    } else {
      // Fallback first 800 characters
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

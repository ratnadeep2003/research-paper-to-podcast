import { callGemini } from "./client";

export interface DialogueTurn {
  orderIndex: number;
  speaker: "Host_Alex" | "Host_Maya";
  speakerRole: string;
  text: string;
  paperId?: string;
  paperTitle?: string;
}

export interface PaperSummaryForPrompt {
  id: string;
  title: string;
  level: number;
  year?: number | null;
  authors?: string;
  abstract?: string | null;
  keyTakeaway?: string | null;
}

export async function generatePodcastDialogue(
  papers: PaperSummaryForPrompt[]
): Promise<DialogueTurn[]> {
  const rootPaper = papers.find((p) => p.level === 1) || papers[0];
  const l2Papers = papers.filter((p) => p.level === 2);
  const l3Papers = papers.filter((p) => p.level === 3);

  const contextDescription = `
ROOT PAPER (Level 1):
- Title: "${rootPaper?.title}"
- Year: ${rootPaper?.year || "Recent"}
- Key Takeaway: ${rootPaper?.keyTakeaway || "Primary innovation"}
- Abstract: ${rootPaper?.abstract?.slice(0, 1000) || "N/A"}

DIRECT CITATIONS (Level 2 - Predecessor works):
${l2Papers
  .map(
    (p, i) =>
      `${i + 1}. "${p.title}" (${p.year || "N/A"}) - ${p.keyTakeaway || p.abstract?.slice(0, 200)}`
  )
  .join("\n")}

FOUNDATIONAL CITATIONS (Level 3 - Grandchild Citations / Seminal Roots):
${l3Papers
  .map(
    (p, i) =>
      `${i + 1}. "${p.title}" (${p.year || "N/A"}) - ${p.keyTakeaway || p.abstract?.slice(0, 200)}`
  )
  .join("\n")}
`;

  const systemInstruction = `You are the executive producer and scriptwriter for a flagship scientific podcast inspired by Google NotebookLM. 
Your hosts are:
- Host_Alex: Analytical, articulate, contextualizes the big picture.
- Host_Maya: Inquisitive, sharp, asks clarifying questions, unpacks analogies.

Your task is to produce a captivating 2-speaker podcast conversation dissecting the research paper and its 3-tier citation lineage.
Structure of the episode:
1. Catchy hook introducing the core problem that "${rootPaper?.title}" addresses.
2. Unpack the Level 3 foundational roots: How older seminal ideas set the stage.
3. Traverse the Level 2 bridge: The immediate predecessor systems, what they accomplished, and where they hit a wall.
4. Deep dive into the Level 1 Root paper: The core intuition, mathematical or architectural breakthrough, and empirical validation.
5. Takeaways and open questions for the field.

OUTPUT FORMAT: Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "orderIndex": 0,
    "speaker": "Host_Alex",
    "speakerRole": "Lead Analyst",
    "text": "Welcome to ResearchCast. Today we are breaking down a monumental paper...",
    "paperTitle": "Title of paper being referenced (or null if general intro)"
  }
]
No markdown wrapping, no backticks, just valid JSON.`;

  const { text: rawResponse, usedFallback, error } = await callGemini(
    `Generate the podcast dialogue for the following research lineage:\n\n${contextDescription}`,
    systemInstruction
  );

  if (usedFallback) {
    console.warn(`generatePodcastDialogue: falling back to static script. Reason: ${error}`);
  }

  if (rawResponse) {
    try {
      const cleanJson = rawResponse
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          orderIndex: idx,
          speaker: item.speaker === "Host_Maya" ? "Host_Maya" : "Host_Alex",
          speakerRole: item.speakerRole || (item.speaker === "Host_Maya" ? "Co-Host" : "Lead Analyst"),
          text: item.text,
          paperTitle: item.paperTitle,
        }));
      }
    } catch (e) {
      console.warn("Failed to parse Gemini JSON script, falling back to dynamic generator:", e);
    }
  }

  return buildIntelligentFallbackScript(rootPaper, l2Papers, l3Papers);
}

export async function answerPodcastInterruption(params: {
  question: string;
  currentSegmentText: string;
  currentSpeaker: string;
  papers: PaperSummaryForPrompt[];
}): Promise<{ answer: string; usedFallback: boolean; error?: string }> {
  const { question, currentSegmentText, currentSpeaker, papers } = params;

  const rootPaper = papers.find((p) => p.level === 1);
  const prompt = `
You are the AI host of a research podcast on the paper "${rootPaper?.title || "Research Paper"}".
A listener just paused the audio while ${currentSpeaker} was saying:
"${currentSegmentText}"

The listener asks:
"${question}"

Available context from the 3-level citation tree:
${papers.map((p) => `[Level ${p.level}] ${p.title}: ${p.keyTakeaway || p.abstract?.slice(0, 300)}`).join("\n\n")}

INSTRUCTIONS:
1. Address the listener's question directly, clearly, and conversationally in 2-4 sentences.
2. Connect your explanation back to the research context.
3. Conclude your answer by asking: "Is the answer to your question ok?" (or "Does that clarify things for you, or shall we continue?").
`;

  const { text: response, usedFallback, error } = await callGemini(
    prompt,
    "You are an intelligent, friendly scientific podcast host answering a listener's live interruption."
  );

  if (!usedFallback && response.trim().length > 0) {
    return { answer: response.trim(), usedFallback: false };
  }

  console.warn(`answerPodcastInterruption: falling back to static template. Reason: ${error}`);

  // Fallback only fires if Gemini genuinely failed (no key, or retries exhausted) —
  // still varies by question/paper so it doesn't feel identical every time.
  const fallbackAnswer = `That's a great question about "${question}". Based on "${
    rootPaper?.title || "this paper"
  }", the short answer relates to: ${
    rootPaper?.keyTakeaway || "the core method discussed in the abstract"
  }. I'm having trouble reaching the full AI model right now, so this is a limited answer — is that enough to go on, or would you like to try again in a moment?`;

  return { answer: fallbackAnswer, usedFallback: true, error };
}

function buildIntelligentFallbackScript(
  root?: PaperSummaryForPrompt,
  l2: PaperSummaryForPrompt[] = [],
  l3: PaperSummaryForPrompt[] = []
): DialogueTurn[] {
  const rootTitle = root?.title || "Contemporary Scientific Breakthrough";
  const l2Example = l2[0]?.title || "the baseline models from recent literature";
  const l3Example = l3[0]?.title || "first-principles computational theory";

  return [
    {
      orderIndex: 0,
      speaker: "Host_Alex",
      speakerRole: "Lead Analyst",
      text: `Welcome back to the podcast. Today, we're dissecting a truly pivotal paper: "${rootTitle}". Maya, this work has sparked immense discussion across the community.`,
      paperTitle: rootTitle,
    },
    {
      orderIndex: 1,
      speaker: "Host_Maya",
      speakerRole: "Investigative Co-Host",
      text: `Absolutely, Alex. But to genuinely understand why this paper matters, we can't look at it in a vacuum. We actually have to trace its genealogical tree back three citation levels.`,
      paperTitle: undefined,
    },
    {
      orderIndex: 2,
      speaker: "Host_Alex",
      speakerRole: "Lead Analyst",
      text: `Exactly. If we travel back to Level 3—the foundational roots—we see seminal work like "${l3Example}". Back then, researchers established the very mathematical constraints we still deal with today.`,
      paperTitle: l3Example,
    },
    {
      orderIndex: 3,
      speaker: "Host_Maya",
      speakerRole: "Investigative Co-Host",
      text: `Right! But those early architectures struggled with scaling and memory ceilings. Which brings us to Level 2: direct predecessors like "${l2Example}". What did they try to do differently?`,
      paperTitle: l2Example,
    },
    {
      orderIndex: 4,
      speaker: "Host_Alex",
      speakerRole: "Lead Analyst",
      text: `The Level 2 papers introduced critical heuristics—bridging theory and practice. However, they were still bottlenecked by sequential computation and diminishing returns on long-range dependencies.`,
      paperTitle: l2Example,
    },
    {
      orderIndex: 5,
      speaker: "Host_Maya",
      speakerRole: "Investigative Co-Host",
      text: `And that is the exact tension that sets the stage for our root paper, "${rootTitle}"! The authors step in and ask: what if we discard the old bottleneck entirely?`,
      paperTitle: rootTitle,
    },
    {
      orderIndex: 6,
      speaker: "Host_Alex",
      speakerRole: "Lead Analyst",
      text: `Their core finding is elegant: by re-formulating the core mechanism, they achieved both higher expressivity and parallel throughput, as demonstrated in their empirical benchmarks.`,
      paperTitle: rootTitle,
    },
    {
      orderIndex: 7,
      speaker: "Host_Maya",
      speakerRole: "Investigative Co-Host",
      text: `It's rare to see a paper that simultaneously respects its 3-tier citation lineage while completely reshaping the trajectory of the field. Remember, listeners: you can pause and ask us any questions at any time!`,
      paperTitle: rootTitle,
    },
  ];
}
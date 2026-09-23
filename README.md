# ResearchCast

> Transform any research paper into an interactive AI podcast with **Level-3 citation depth** ($Paper_1 \to Paper_2 \to Paper_3$) and real-time voice interruption.

ResearchCast ingests academic research papers (PDF, arXiv, DOI, or title search), recursively crawls their citation genealogy down to three levels, synthesizes the core findings and historical context, and presents it as an interactive two-host conversational podcast. 

Featuring a morphing **Voice Sphere** in warm cream, beige, and white tones, users can listen, interrupt with questions mid-sentence, receive in-context answers, and seamlessly resume playback.

---

## Features

- **Level-3 Citation Crawling**: 
  - **Level 1 (Root)**: Ingests the primary paper via PDF upload, DOI, arXiv ID, or title.
  - **Level 2 (Direct Citations)**: Discovers top predecessor papers via the OpenAlex API.
  - **Level 3 (Grandchild Citations)**: Maps seminal ancestor works to build the foundational theoretical timeline.
- **Dual-Host Interactive Podcast**:
  - Dynamically synthesizes a conversation between **Host Alex** (Lead Analyst) and **Host Maya** (Investigative Co-Host).
  - Multi-voice browser TTS via Web Speech API with distinct voices, pitches, and synchronized segment highlights.
- **Stateful Pause & Resume (Two-Way Voice)**:
  - Users can interrupt the podcast at any moment via voice (microphone) or text.
  - Playback halts immediately while the AI answers using the current segment topic and full 3-level paper graph.
  - Asks: *"Is the answer to your question ok?"*
  - Resumes playback from the exact pause point upon confirmation ("Yes" or button click).
- **Warm Aesthetic**:
  - Editorial palette featuring light cream, warm ivory, soft ecru, and delicate beige (`#FAF8F5`, `#F5F2EB`, `#E6E0D5`).
  - ChatGPT-style 2-pane layout (History on the left, conversation on the right).
- **Voice Mode Sphere**:
  - Morphing 3D sphere in warm cream and beige shades with breathing soundwave ripples and real-time audio visualization.
- **1-to-1 History & Full Audio Replay**:
  - Preserves every session and Q&A interaction in local SQL storage via Prisma ORM.
  - Includes a **"Play Conversation (TTS)"** button to listen back to the entire dialogue history.

---

##  Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) 16 (App Router), [React](https://react.dev/) 19, [Tailwind CSS](https://tailwindcss.com/)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with SQLite (zero-config local storage, easily migrated to PostgreSQL)
- **AI & Synthesis**: [Google Gemini API](https://aistudio.google.com/) (`@google/genai` with fallback heuristics)
- **Citations Engine**: [OpenAlex REST API](https://openalex.org/)
- **Audio & Voice**: Web Speech API (`SpeechSynthesis` & `webkitSpeechRecognition`)
- **PDF Extraction**: `pdf-parse`

---

##  Project Structure

```text
research-paper-to-podcast/
├── prisma/
│   ├── schema.prisma             # Data models (Session, Paper, Podcast, Segment, Message)
│   └── dev.db                    # SQLite local database
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sessions/         # Session CRUD endpoints
│   │   │   ├── papers/
│   │   │   │   ├── upload/       # PDF upload & parser
│   │   │   │   └── crawl/        # Level-3 citation crawler
│   │   │   ├── podcast/
│   │   │   │   └── generate/     # LLM podcast dialogue synthesizer
│   │   │   └── chat/
│   │   │       ├── interrupt/    # Mid-playback question answering
│   │   │       └── confirm/      # Resume confirmation handler
│   │   ├── session/[id]/
│   │   │   └── page.tsx          # 2-pane conversational interface
│   │   ├── layout.tsx            # Root layout with sidebar and theme
│   │   ├── globals.css           # Warm cream, ecru, and beige styling
│   │   └── page.tsx              # Editorial landing page
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx       # Conversation history drawer
│   │   └── voice/
│   │       └── VoiceSphere.tsx   # ChatGPT-style cream/beige Voice Orb
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── citations/            # OpenAlex citation API & Level-3 crawler
│   │   ├── llm/                  # Gemini client & podcast prompt engine
│   │   └── pdf/                  # PDF text extraction utility
│   └── types/
│       └── index.ts              # Core TypeScript interfaces
├── .env.example
├── package.json
└── README.md
```

---

##  Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ (v20+ recommended)
- npm or yarn

### 2. Installation
```bash
git clone <repository-url>
cd research-paper-to-podcast
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

Configure your environment variables in `.env`:
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your-gemini-api-key-here"  # Optional: app includes fallback synthesizer
GEMINI_MODEL="gemini-2.0-flash"
```

### 4. Database Setup
Push the Prisma schema to create the local SQLite database:
```bash
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

##  How It Works

1. **Ingest a Paper**: Click the **"Upload research paper"** box to drag & drop a PDF, or enter a paper title, DOI, or arXiv ID.
2. **Start Interactive Session**: Click **"Start interactive session"** to launch the podcast and open the **Voice Sphere**.
3. **Listen & Learn**: The AI hosts walk through Level 3 foundations, Level 2 predecessor works, and the Level 1 breakthrough.
4. **Interrupt with Questions**: Speak or type a question anytime. The podcast pauses, answers your question with full citation context, confirms whether the answer was clear, and resumes playback upon confirmation.
5. **Review History**: All discussions are saved in the sidebar. Click **"Play Conversation (TTS)"** anytime to listen back to the entire exchange.

---

##  Roadmap (V2 Preview)

- [ ] **3D Interactive Citation Constellation**: Visual WebGL force graph linking audio segments to citation nodes.
- [ ] **Synchronized Equation Spotlight**: Real-time LaTeX and figure highlights synced to the spoken audio.
- [ ] **Academic Debate Mode**: Co-hosts debate conflicting findings between Level 2 and Level 1 methodologies.
- [ ] **Real-Time WebRTC Voice**: Direct bidirectional audio streaming with sub-second latency.

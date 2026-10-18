# Production Roadmap: Universal Multi-Modal AI Platform (2026 Edition)

Based on the official **Vercel AI Chatbot** (`vercel/ai-chatbot`), adapted for mobile-native execution, universal provider support, multimodal intelligence, and 2026 ChatGPT / Claude UI aesthetics.

---

## 1. System Architecture & Objectives

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|  2026 ChatGPT Matte Dark / Claude Warm Parchment Theme                         |
|  Floating Pill Input | Dynamic Model Selector | Reasoning Accordion             |
|  Artifacts Canvas v2 | Audio TTS Player | Voice STT Waveform | Image/Video UI   |
+---------------------------------------------------------------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
|                             NEXT.JS APP ROUTER                                  |
|  /api/chat          -> Universal Streaming & Tool Calling (AI SDK v7)           |
|  /api/models        -> Dynamic Multi-Provider Live Fetcher & Cache              |
|  /api/audio/speech  -> TTS Endpoint (OpenAI / Web Speech fallback)              |
|  /api/audio/transcribe -> STT Endpoint (Whisper / Web Speech fallback)          |
|  /api/image         -> Image Generation (DALL-E / Flux / SD)                    |
|  /api/video         -> Video Generation Tracker (Luma / Runway / Simulated)     |
|  /api/providers     -> Dynamic Endpoint & Key Manager                           |
|  /api/files/upload  -> Multi-Modal Local File Storage (Public/Uploads)          |
+---------------------------------------------------------------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
|                       UNIVERSAL AI ENGINE (lib/ai/)                             |
|  Supports: OpenAI, OpenRouter, Groq, Anthropic, Google Gemini, Ollama,          |
|            DeepSeek, Mistral, Together, and any Custom OpenAI-compatible URL     |
+---------------------------------------------------------------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
|                       DATA PERSISTENCE LAYER (lib/db/)                          |
|  PostgreSQL (Neon / Termux local postgres) OR SQLite / PGlite Fallback          |
|  Drizzle ORM | Pure JavaScript postgres.js driver | Zero Docker Required        |
+---------------------------------------------------------------------------------+
```

---

## 2. 20+ Production Features Specification

1. **Universal Any-Provider Engine**: Connect to OpenAI, OpenRouter, Groq, Anthropic, Gemini, Ollama, LM Studio, or any custom API baseURL + key.
2. **Dynamic Live Model Fetcher**: Query any provider's `/v1/models` endpoint live via URL; auto-detects capabilities (tools, reasoning, vision, context window).
3. **Deep Reasoning / Thinking Stream Inspector**: Collapsible thought process accordion displaying real-time reasoning tokens & duration (Claude 3.7 / DeepSeek R1 style).
4. **Native Voice Input (STT)**: Microphone speech-to-text recording with Whisper transcription and browser Web Speech fallback.
5. **Audio Speech Output (TTS)**: Instant read-aloud of AI responses using OpenAI TTS or zero-latency Web Speech synthesis.
6. **Multi-Modal Image Generation**: Built-in text-to-image generator with prompt expansion, aspect ratio picker, and gallery preview.
7. **Video Generation Preview**: Video prompt generation and status tracker with interactive video canvas.
8. **Interactive Artifacts Canvas v2**: Side-by-side or slide-over workspace with live code execution (Python via Pyodide, HTML/JS/CSS live render, React SVG, spreadsheet grid).
9. **Web Search & Knowledge Retrieval Tool**: Real-time web browsing tool using Tavily / SearXNG / DuckDuckGo search.
10. **Zero-Cloud Local File Storage**: Upload and inspect images/documents stored in local `/public/uploads` without requiring a Vercel Blob subscription.
11. **Prompt Library & Persona System**: 30+ built-in developer, coding, writing, and analysis personas with custom persona creation.
12. **Conversation Branching & Message Editing**: Edit previous prompts, branch conversation trees, and navigate between message variants.
13. **Export & Import Suite**: One-click export to Markdown, JSON, PDF-ready HTML, or shareable link; import prior chat histories.
14. **Token Counter & Cost Estimator**: Live calculation of prompt/completion tokens with per-model pricing metrics.
15. **Inference Parameters Controls**: Per-chat sliders for Temperature, Top-P, Frequency Penalty, and Reasoning Effort level.
16. **Pinned Chats & Fuzzy Search**: Quick-pin favorite chats with instant client-side fuzzy search across all message histories.
17. **Adaptive Dual-Persona Themes**: Switch seamlessly between **2026 ChatGPT Matte Obsidian** and **Claude Warm Parchment**, plus OLED pitch black.
18. **Mobile-First UX**: Safe-area insets, bottom action sheets, swipe-to-close artifacts, touch-optimized button hit targets, haptic feedback hooks.
19. **Offline Resilience & Auto-Save**: LocalStorage and IndexedDB state caching so conversations survive mobile app reloads or network drops.
20. **LaTeX Math & Syntax Highlighting**: Full KaTeX equation rendering, syntax-highlighted code blocks with copy/diff actions.
21. **Custom System Prompt Override**: Set conversation-specific instructions and developer directives.
22. **In-Browser Python & JS Sandbox**: Execute Python scripts directly in client WebAssembly without needing a remote sandbox server.

---

## 3. Implementation Phases

- **Phase 1: Environment & Mobile Storage Adaptation**
  - Verify and configure local database fallback and file storage in `chatbot/`.
  - Configure `next.config.ts` for clean mobile execution.
- **Phase 2: Universal Multi-Provider Engine**
  - Create dynamic provider resolver in `chatbot/lib/ai/providers.ts`.
  - Build dynamic `/api/models` endpoint for fetching models from any user-provided URL.
  - Implement custom provider settings storage.
- **Phase 3: Multi-Modal APIs**
  - Text-to-Speech (`/api/audio/speech`).
  - Speech-to-Text (`/api/audio/transcribe`).
  - Image generation (`/api/image`).
  - Video generation status (`/api/video`).
- **Phase 4: 2026 ChatGPT / Claude UI Polish**
  - Styling tokens and theme variables in `app/globals.css`.
  - Floating pill prompt bar with multimodal attachments and voice triggers.
  - Model selector popover with category filtering and custom model URL input.
  - Reasoning accordion component for thinking models.
- **Phase 5: 20+ Production Features Integration**
  - Artifacts v2 canvas enhancements.
  - Prompt library drawer.
  - Web search tool integration.
  - Conversation branching, export/import, token estimation.
- **Phase 6: Testing & Quality Validation**
  - Unit tests for all endpoints and provider resolvers.
  - Multi-agent independent verification (Rule 15).

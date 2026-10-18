# Universal Multi-Modal AI Platform: Technical Architecture Specification (2026 Edition)

**Document Reference**: `docs/ARCHITECTURE.md`  
**Target Platform**: Vercel AI Chatbot expansion for Mobile/Android/Termux Native & Universal Cloud  
**Author**: Software Architect Agent  
**Status**: APPROVED FOR IMPLEMENTATION  

---

## 1. Executive Summary & Architectural Vision

The objective of this architecture is to transform the standard Vercel AI Chatbot into a universal, multi-modal, zero-lock-in AI workstation running seamlessly across Termux (Android mobile) and high-performance cloud environments.

### Core Architectural Pillars
1. **Zero Cloud Lock-in**: Decouple from Vercel AI Gateway, Vercel Blob, and external PostgreSQL requirements. Pure JS/TS runtime bindings with local storage and database fallbacks.
2. **Universal Dynamic Provider Engine**: Direct multi-provider connections (OpenAI, Anthropic, Google Gemini, Groq, OpenRouter, Ollama, LM Studio, DeepSeek) plus arbitrary OpenAI-compatible `baseURL` endpoints with dynamic `/v1/models` discovery.
3. **Full-Spectrum Multi-Modal Pipeline**:
   - Deep Reasoning & Thinking token inspector (DeepSeek R1, Claude 3.7 Sonnet, OpenAI o1/o3-mini).
   - High-fidelity Text-to-Speech (TTS) with hybrid Cloud (OpenAI/ElevenLabs) & zero-latency Web Speech API fallback.
   - Speech-to-Text (STT) with Whisper API & client-side SpeechRecognition.
   - Text-to-Image studio (Flux, DALL-E 3, Stable Diffusion).
   - Video generation job tracking and canvas viewer.
4. **Interactive Artifacts Canvas v2**: Multi-engine code execution (client Pyodide WASM Python with Matplotlib, live HTML/CSS/JS sandbox, SVG graphics, Mermaid diagrams, and CSV spreadsheets).
5. **Production Feature Suite**: 20+ production-grade features including conversation branching, prompt persona library, web search tool, token counter & cost calculator, hyperparameter controls, export/import suite, pinned search, and 2026 Obsidian / Claude Parchment aesthetics.

---

## 2. High-Level System Architecture Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                      CLIENT LAYER (Mobile & Web)                                  |
|  - 2026 ChatGPT Matte Obsidian / Claude Warm Parchment / OLED Pitch Black Design System          |
|  - Floating Multimodal Pill Input (Voice Waveform, File Drop, Tool Toggles, Model Dropdown)       |
|  - Reasoning Accordion (Live thought duration timer & token stream inspector)                     |
|  - Artifacts Canvas v2 (Pyodide Python Wasm, HTML/JS Sandbox, Mermaid Diagrams, Sheet Grid)       |
|  - Audio TTS Bar & Voice STT Dictation | Branch Picker (< 1 / 3 >) | Token & Cost Estimator       |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v  (HTTP / SSE / WebSocket)
+---------------------------------------------------------------------------------------------------+
|                                     NEXT.JS 16 APP ROUTER LAYER                                   |
|  /api/chat             -> Universal AI Stream Orchestrator, Reasoning Parser & Tool Calling        |
|  /api/models           -> Dynamic Provider Fetcher, Live Discovery & Cache (/v1/models probe)     |
|  /api/models/probe     -> Arbitrary baseURL validation, latency & capability testing               |
|  /api/providers        -> Dynamic Custom Provider Profiles CRUD                                   |
|  /api/audio/speech     -> Multi-provider TTS (OpenAI / Edge / Web Speech fallback)                |
|  /api/audio/transcribe -> Multi-provider STT (Whisper Large v3 / Web Speech fallback)             |
|  /api/image            -> Multi-model Image Generation (Flux.1 / DALL-E 3 / SDXL)                 |
|  /api/video            -> Video Generation Task Dispatcher & Status Poller                        |
|  /api/search           -> Real-time Web Knowledge Tool (Tavily / SearXNG / DuckDuckGo)            |
|  /api/export/[id]      -> Conversation Exporter (Markdown, JSON, Print HTML, Plain Text)          |
|  /api/prompts          -> Prompt Library & Persona Presets Manager                                |
|  /api/files/upload     -> Zero-Cloud Local File Storage (/public/uploads/ + MIME Parser)          |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 UNIVERSAL AI ENGINE (`lib/ai/`)                                   |
|  - Provider Registry: OpenAI, Anthropic, Gemini, Groq, OpenRouter, Ollama, DeepSeek, Custom URL   |
|  - Dynamic Capability Resolver: Auto-detects Reasoning, Tool-Calling, Vision, Context Window      |
|  - Deep Reasoning Stream Filter: Separates <think> tags / reasoning deltas from message stream    |
|  - Tool Runtime: Web Search, Document Artifacts, Suggestions, Calculator                          |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                              PERSISTENCE & STORAGE LAYER (`lib/db/`)                              |
|  - Dual DB Architecture:                                                                          |
|      * Mode A: PostgreSQL (Neon / Supabase / Termux local postgresql daemon via postgres.js)     |
|      * Mode B: Zero-Config Local SQLite / JSON Store fallback for instant offline execution       |
|  - Extended Schema: Conversation branching (parentId), custom providers, prompt presets, media   |
|  - File Storage: Local filesystem adapter (/public/uploads/) with Vercel Blob fallback           |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Dynamic Any-API Provider Engine
- Connects directly to OpenAI, Anthropic, Google Gemini, Groq, OpenRouter, Ollama, LM Studio, DeepSeek, Together AI, or any user-supplied baseURL + API key.
- Live `/v1/models` probe detects available models, latency, and capability tags (`reasoning`, `tools`, `vision`).
- Decouples completely from Vercel AI Gateway while retaining native Vercel AI SDK compatibility.

---

## 4. Multi-Modal Pipeline
- **Deep Reasoning**: Parses `<think>` tags and reasoning content into a collapsible thought accordion with real-time duration timing.
- **Audio TTS**: Speech generation using OpenAI TTS or Web Speech API fallback.
- **Audio STT**: Whisper audio transcription + browser live dictation with audio waveform visualizer.
- **Image Generation**: Built-in text-to-image studio supporting Flux.1, DALL-E 3, and SDXL.
- **Video Generation**: Asynchronous task tracking with live progress indicator and looping video player.

---

## 5. Persistence, Zero-Cloud Storage & Offline Resilience
- Pure JavaScript database driver (`postgres.js`) works natively on Termux.
- Local fallback database ensures the app runs out of the box with zero external setup.
- Multi-modal local file uploads saved directly to `public/uploads/`.

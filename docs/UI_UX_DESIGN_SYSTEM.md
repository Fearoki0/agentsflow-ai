# 2026 Universal Multi-Modal AI Platform: UI/UX Design System Specification

**Author:** Senior UI/UX Designer  
**Target Environment:** Next.js 16 (App Router), Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Framer Motion  
**Aesthetic Vision:** 2026 ChatGPT Matte Obsidian Dark Mode & Claude Warm Parchment Light Mode

---

## 1. Palette & Color Token System

The design system unifies two of the most celebrated design languages in modern generative AI:
1. **Obsidian Dark Mode (2026 ChatGPT Matte Dark):** A deep, non-fatiguing matte charcoal surface layer (`oklch(0.13 0.005 260)`) eliminating harsh `#000000` pitch contrast while preserving pure contrast for syntax and prose.
2. **Claude Warm Parchment Light Mode:** An organic, bookish linen/parchment foundation (`oklch(0.978 0.012 75)`) paired with warm espresso typography and terracotta accent highlights.

---

## 2. Floating Pill Composer Bar
- Floating rounded pill bar with backdrop blur (`backdrop-blur-2xl`)
- Safe-area insets for mobile devices: `pb-[env(safe-area-inset-bottom,16px)]`
- Integrated voice STT button, attachments menu, model selector badge, and web search toggle pill
- Expanding textarea that auto-grows up to 200px max height without jarring layout shifts

---

## 3. Deep Reasoning / Thought Accordion
- Streamed chain-of-thought tokens rendered in real-time
- Elapsed timer badge (`Thought for 14.2s`)
- Pulsating brain/lightbulb icon with shimmer gradient during generation
- Collapsible with smooth Framer Motion spring physics

---

## 4. Multimodal Audio, Voice & Image Systems
- **TTS Audio Player**: Speed multiplier (1x, 1.25x, 1.5x, 2x), progress scrub bar, play/pause state
- **STT Voice Waveform Visualizer**: Real-time microphone audio visualizer, recording timer, cancel/done controls
- **Image Generation Studio**: Text-to-image preview, prompt expansion, aspect ratio selector, download & upscale buttons
- **Artifacts Canvas v2**: Split-view on desktop, responsive slide-over on mobile with live Pyodide Python, HTML/JS, SVG, and spreadsheet editors.

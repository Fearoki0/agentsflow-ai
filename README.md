# AgentsFlow AI (v1.2.0)

AgentsFlow AI is an independent, mobile-first AI client designed to run modern frontier models directly on your Android device without middlemen, cloud proxies, or subscription markups.

I built this project because almost every mobile AI app right now is wrapped inside subscription paywalls or strips away essential developer features like reasoning tokens, custom system prompts, and client-side code execution. AgentsFlow AI connects directly from your phone to any model provider API—OpenAI, Anthropic, Google Gemini, Groq, OpenRouter, DeepSeek, or local Ollama instances—giving you full control over your keys, token usage, budgets, and capabilities.

---

## How It Works

### 1. Direct Client-to-Provider Streaming
Most chatbot apps route your requests through their own cloud servers before sending them to the AI provider. AgentsFlow AI connects directly from your phone:
- **Zero Third-Party Servers**: Prompts and API keys go straight from your device to the API endpoint over encrypted HTTPS.
- **Real-Time Token Streamer**: As chunks arrive from Server-Sent Events (SSE), the app calculates real-time Tokens Per Second (TPS), token counts, and elapsed generation time.
- **Instant Abort Control**: Tapping the Stop button immediately aborts the active stream and reader buffer without locking up the UI or wasting your tokens.

### 2. Capability Auto-Detection
Instead of showing generic buttons that break when a model doesn't support them, AgentsFlow dynamically checks the selected model's true capabilities:
- **Reasoning Models (DeepSeek R1, Claude 3.7 Sonnet, o1)**: Automatically routes `<think>` blocks, Hermes tags, and internal deductions into a dedicated, collapsible **Thinking Process** drawer with monospace styling and character counters.
- **Vision Models**: Enables camera and image attachment inputs only when the selected model actually supports image understanding.
- **Coding Models**: Activates syntax highlighting, formatted tables, and an interactive client-side sandbox.
- **Dedicated Multi-Modal Models**: Image generators (DALL-E, FLUX), speech-to-text (Whisper), and voice models are handled through dedicated interfaces so you never get bad-request errors from sending text to an image-only model.

### 3. Built-In Code Runner & Inspector
When an AI writes code, you shouldn't have to copy-paste it into an external editor to test it.
- Run HTML, CSS, JavaScript, and Python code directly inside the app.
- Dual-tab view lets you easily switch between **Preview / Run Output** and **Source Code View**.

### 4. Roleplay & Creative Writing Typography
Designed for roleplayers and story writers who need clear visual separation between actions, dialogue, and narration:
- **Character Actions (`*action*`)**: Styled in an aesthetic, soft lavender italic tone that stands out clearly from spoken dialogue.
- **Bold Actions (`***bold action***`)**: Formatted in high-contrast bold-italic typography with subtle illumination.
- **Special Characters & Formatting**: Full support for spoilers (`||hidden||`), underlines (`<u>` / `++`), strikethroughs (`~~`), highlights (`==`), and subscript/superscript.

### 5. Strict API Budget Maintenance & Cost Tracking
- Displays exact input, output, and cache pricing in both **USD ($)** and **Indian Rupees (₹)** for every model before you send a message.
- Set a session budget limit in Settings. If a prompt or model is about to exceed your budget threshold, the app alerts you with a warning before consuming your balance.
- Guaranteed model integrity: Image generation uses the exact model you selected—never secretly substituting expensive models behind your back.

### 6. Liquid Glass UI
Built with a 2026 Liquid Glass aesthetic featuring translucent frosted glass surfaces, specular rim lighting, responsive bottom sheets, and fluid iOS-style spring animations.

---

## Direct Finalized APK (v1.2.0)

A pre-built, production-signed native Android APK is ready to install:
- **File:** `builds/agentsflow-ai.apk`
- **Version:** v1.2.0 (Build 3)
- **Architecture:** Universal Android (Android 7.0 / API 24 through Android 15 / API 35)
- **Signature:** Android Signature Scheme v2 & v3 compliant

---

## Author & Copyright

**AgentsFlow AI** was created and engineered by **Saad** ([@fearoki](https://github.com/Fearoki0)).

Copyright (C) 2026 Saad (@fearoki). All rights reserved.

---

## License & Usage Terms

This repository and application are released under a **Strict Proprietary & Source-Available License**. 

The source code is published exclusively for personal use, review, and transparency. **No one is permitted to copy, steal, fork, modify, redistribute, sublicense, or commercially exploit this source code, application, UI design, or branding in any form without explicit prior written permission from Saad.**

Any unauthorized reproduction, modification, distribution, or commercial use is strictly prohibited and constitutes copyright infringement under international intellectual property law.

For permissions or business inquiries, contact Saad on GitHub: [@fearoki](https://github.com/Fearoki0).

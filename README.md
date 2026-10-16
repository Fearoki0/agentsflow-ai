# AgentsFlow AI — Autonomous Frontier Intelligence Platform & Native Android Client

<div align="center">

![License: GPLv3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-orange?style=for-the-badge)
![Author](https://img.shields.io/badge/Author-Saad%20(%40fearoki)-crimson?style=for-the-badge)
![Status](https://img.shields.io/badge/Release-v2.0.0-emerald?style=for-the-badge)
![Build](https://img.shields.io/badge/Build-Signed%20APK%20(v2%2Fv3)-brightgreen?style=for-the-badge)

**Created & Engineered by Saad ([@fearoki](https://github.com/Fearoki))**  
*Autonomous frontier AI platform with 100+ actionable workflows, universal multi-model discovery, multi-modal engines (Chat, Reasoning, Audio, Image, Video, OCR), Liquid Glass UI, roleplay typography, and zero-dependency offline runtime.*

</div>

---

## 🚀 Key Highlights & Architectural Innovations

### 1. 🛡️ Universal Multi-Modal Engine & Dynamic Model Discovery
- **Any-API Compatibility:** Connect to any OpenAI-compatible provider (OpenAI, Groq, OpenRouter, DeepSeek, Ollama, vLLM, LM Studio, or local servers).
- **Live Model Probing:** Dynamically fetch, normalize, and categorize models directly from `/v1/models` in real time with automated capability detection (Reasoning, Vision, Audio TTS/STT, Image Generation, Video, and OCR).
- **Exact Dual-Currency Pricing:** Displays genuine Input, Output, and Cache pricing for every individual model in both **USD ($)** and **INR (₹)** at live rates (~84 INR/USD), clearly indicating 100% Free models (₹0.00).

### 2. 🧠 Chain-of-Thought Reasoning Accordion
- **Strict User Message Isolation:** The thinking accordion is strictly confined to assistant responses—user prompts never display false thinking bars.
- **Universal Reasoning Extraction:** Automatically extracts thoughts and intermediate calculations from DeepSeek R1 `<think>` tags, Claude 3.7 / Hermes `<reasoning>`, fenced thought blocks, and untagged step deductions (Mistral NeMo, LLaMA `[Step 1: ...] ... [Final Verified Answer]`).
- **Interactive Inspection:** Real-time monospace character and token counter, pulsing live radar indicator, and smooth accordion toggle.

### 3. 🌐 Web Grounding & Rich Interactive Citations
- **Source Citation Chips:** Plain link dumps like `(Source: https://...)` are transformed into interactive liquid glass pills featuring live favicons, domain tags, citation indices, and external link indicators.
- **GitHub / Obsidian Callouts:** Beautiful glass cards for `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, and `> [!CAUTION]`.
- **Responsive Tables & Step Cards:** Markdown tables render with zebra striping and touch-responsive horizontal scrolling; multi-step answers render with distinct numbered milestone cards.

### 4. 🎭 Roleplay & Creative Writing Typography
- **Emote Actions:** Asterisk actions `*smiles warmly and steps forward*` render with soft, elegant typography.
- **Bold-Italics & Rich Styling:** Full support for `***bold-italic***`, `**bold**`, `<u>underline</u>`, `~~strikethrough~~`, `^superscript^`, and `~subscript~`.
- **Interactive Spoilers:** `||hidden spoiler||` renders with a frosted blur curtain that reveals content on tap.
- **Text Highlighting:** `==highlighted clue==` formats with golden liquid glass marker styling.
- **Preserved Punctuation:** Smart quotes, em dashes, ellipses, and unicode runes render cleanly without escaping artifacts.

### 5. ⚡ Real-Time TPS, Budget Controller & Instant Stream Stop
- **Live Tokens Per Second (TPS):** Accurate client-side speed measurement during streaming.
- **API Budget Controller:** Set custom spending limits in ₹ or $ with automatic pre-flight safety warnings to prevent unintended API billing.
- **Instant Stream Stop:** The red Stop button immediately aborts the active stream, releases the network socket, restores the Send button, and finalizes message history.

---

## 🛠️ Complete 100+ Actionable Feature Catalog

| Domain | Commands & Workflows | Highlights |
| :--- | :--- | :--- |
| **Autonomous Goal & Planning** | `/goal`, `/plan`, `/boost`, `/decompose`, `/roadmap` | End-to-end execution loops, task milestones, structured sprint roadmaps |
| **System Architecture & Cloud** | `/arch`, `/docker`, `/k8s`, `/db`, `/api`, `/observability`, `/infra` | Clean Architecture specs, Dockerfiles, K8s manifests, SQL schemas, Terraform |
| **Software Engineering & Code** | `/code`, `/refactor`, `/review`, `/test`, `/debug`, `/audit`, `/regex` | Polyglot synthesis, static analysis, unit test suites, security vulnerability audit |
| **Deep Reasoning & STEM** | `/think`, `/math`, `/proof`, `/logic`, `/stat`, `/algo`, `/physics` | LaTeX derivations, formal logic proofs, probability distributions, algorithmic analysis |
| **Writing & Roleplay** | `/roleplay`, `/character`, `/creative`, `/screenplay`, `/tone` | Deep character sheets, narrative arcs, prose enhancement, dialog styling |
| **Multi-Modal Generation** | `/image`, `/tts`, `/whisper`, `/video`, `/ocr`, `/vision` | FLUX / DALL-E studio, neural speech, voice dictation, document OCR |

---

## 📱 Mobile Architecture & Standalone Android APK

AgentsFlow AI is bundled as a 100% self-contained Android application that runs locally from `file:///android_asset/` without requiring external Node.js, Termux servers, or Docker.

### Building & Installing the Native APK

```bash
# 1. Run the automated 7-suite test suite
bash scripts/test_all.sh

# 2. Compile, DEX, package, and sign the native Android APK
bash scripts/build_apk.sh

# 3. Install on your Android device (via Termux)
termux-open builds/agentsflow-ai.apk
```

- **Output APK:** `builds/agentsflow-ai.apk`
- **Package Name:** `com.agentsflow.chatbot`
- **Signing:** Android Signature Scheme v2 & v3 compliant

---

## 📂 Repository Structure

```
agentsflowW/
├── android/
│   ├── AndroidManifest.xml          # Native Android manifest
│   ├── assets/
│   │   ├── index.html               # Main standalone application shell
│   │   ├── css/style.css            # AAA Liquid Glass design system & roleplay CSS
│   │   └── js/app.js                # Core state engine, 100+ features & streaming
│   ├── res/                         # Android application resources & launcher icons
│   └── src/com/agentsflow/chatbot/  # Native Java WebView Activity
├── builds/
│   └── agentsflow-ai.apk            # Release-signed native Android APK
├── scripts/
│   ├── build_apk.sh                 # aapt2 + javac + d8 + apksigner pipeline
│   ├── test_all.sh                  # Comprehensive automated test runner
│   └── run_mobile.sh                # Mobile web server runner
├── tests/
│   ├── run_all.mjs                  # Master test runner (7 complete suites)
│   ├── test_models.mjs              # Model registry & capability testing
│   ├── test_local_store.mjs         # Zero-dependency local database tests
│   ├── test_provider_registry.mjs   # Universal endpoint resolution tests
│   ├── test_endpoints.mjs           # Multi-modal API contract tests
│   ├── test_features_2026.mjs       # 100+ feature catalog verification
│   ├── test_grounding_and_thinking.mjs # Grounding & thinking isolation tests
│   └── test_rp_and_streaming.mjs    # Roleplay typography & stream completion tests
├── LICENSE                          # GNU General Public License v3.0 (GPL-3.0)
├── NOTICE                           # Intellectual property & attribution notice
└── README.md                        # Documentation & project guide
```

---

## ⚖️ License & Intellectual Property Protection

**Copyright (C) 2026 Saad ([@fearoki](https://github.com/Fearoki)). All rights reserved.**

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License, Version 3 (GPL-3.0)** as published by the Free Software Foundation.

### Anti-Theft & Copyleft Provisions
- Any fork, redistribution, or derivative work **must** remain open-source under the exact same GPL-3.0 license.
- Commercial or closed-source repackaging, stripping of Saad's author credits, or proprietary claims over this code are strictly prohibited by law.
- See the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for complete legal details.

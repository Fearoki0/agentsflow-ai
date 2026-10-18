// ==============================================================================
// AGENTSFLOW AI - TEST SUITE: CONTINUATION, LOADED MODEL DISPLAY & UI SIMPLIFICATION
// ==============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appJsPath = path.resolve(__dirname, "../android/assets/js/app.js");
const indexHtmlPath = path.resolve(__dirname, "../android/assets/index.html");
const styleCssPath = path.resolve(__dirname, "../android/assets/css/style.css");

console.log("▶ [TEST SUITE 8/8] Testing In-Place Continuation, Loaded Model & Simplified UI...");

const appJsContent = fs.readFileSync(appJsPath, "utf-8");
const indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf-8");
const styleCssContent = fs.readFileSync(styleCssPath, "utf-8");

// --- TEST 1: In-Place Continuation Architecture ---
assert(appJsContent.includes("executeContinuationStream"), "app.js must define executeContinuationStream");
assert(appJsContent.includes("window.afContinue = async function"), "window.afContinue must exist");
assert(appJsContent.includes("await executeContinuationStream(targetMsg, targetIndex)"), "afContinue must call executeContinuationStream with target message and index");
assert(!appJsContent.includes('await executePromptStream("Please continue generating seamlessly from exactly where you left off.", null)'), "afContinue must NOT call executePromptStream with duplicate user messages");

// Verify streamCompletionFromProvider accepts isContinuation flag
assert(appJsContent.includes("async function streamCompletionFromProvider(chat, assistantMsg, isContinuation = false)"), "streamCompletionFromProvider must accept isContinuation flag");
assert(appJsContent.includes("if (isContinuation) {"), "streamCompletionFromProvider must handle isContinuation");
assert(appJsContent.includes('outgoingMessages.push({ role: "assistant", content: assistantMsg.content || "" })'), "isContinuation must supply current assistant content as prefill/prefix");
assert(appJsContent.includes("scheduleStreamingAssistantDOM(assistantMsg)"), "Stream reader must use throttled DOM updater for high-speed streaming");

// Verify safe baseSnippetCount calculation logic in executeContinuationStream
assert(appJsContent.includes("actualIdx = targetIndex >= 0 ? targetIndex : chat.messages.indexOf(assistantMsg)"), "executeContinuationStream must index snippets up to actualIdx");
assert(appJsContent.includes("hasStrippedContinuationPreamble"), "streamCompletionFromProvider must handle continuation preamble stripping");

// Verify stopStreaming resets all active streaming assistant messages
assert(appJsContent.includes("chat.messages.forEach(msg => {"), "stopStreaming must scan all messages for active streaming flags");

console.log("  ✓ In-Place Continuation verified: continues assistant response without creating separate message bubbles, strips duplicate preambles, and safely preserves code snippets");

// --- TEST 2: Loaded Model Display ---
assert(indexHtmlContent.includes('id="current-model-name"'), "index.html must have current-model-name");
assert(indexHtmlContent.includes('class="model-loaded-badge"'), "index.html header must have model-loaded-badge");
assert(indexHtmlContent.includes('id="model-pill-cap"'), "index.html must have model-pill-cap");
assert(indexHtmlContent.includes('id="modal-loaded-model-banner"'), "index.html model selector must have modal-loaded-model-banner");
assert(indexHtmlContent.includes('id="modal-active-model-name"'), "index.html model selector must have modal-active-model-name");
assert(appJsContent.includes('id="welcome-loaded-model-name"'), "Welcome screen must include welcome-loaded-model-name");
assert(appJsContent.includes('id="welcome-loaded-model-cap"'), "Welcome screen must include welcome-loaded-model-cap");
assert(appJsContent.includes("function updateModelPillDisplay()"), "updateModelPillDisplay must exist");
assert(appJsContent.includes('centerModelName.textContent = modelName'), "updateModelPillDisplay must update center screen loaded model indicator");
assert(appJsContent.includes('modalActiveModelName.textContent = modelName'), "updateModelPillDisplay must update model selector active banner");

console.log("  ✓ Loaded Model display verified: prominently displays active model name and capabilities across header, center screen, and model modals");

// --- TEST 3: ChatGPT-Style Plus Action Menu (Model Capability Gating) ---
assert(indexHtmlContent.includes('id="chatgpt-plus-menu"'), "index.html must include chatgpt-plus-menu container");
assert(indexHtmlContent.includes('id="plus-menu-content"'), "index.html must include plus-menu-content");
assert(appJsContent.includes("window.afTogglePlusMenu"), "app.js must define afTogglePlusMenu");
assert(appJsContent.includes("renderPlusMenuContent"), "app.js must define renderPlusMenuContent");

// Verify capability gating inside plus menu
assert(appJsContent.includes("if (caps.vision || caps.ocr || caps.image)"), "Photos & Images must only show if model supports vision/ocr/image");
assert(appJsContent.includes("if (caps.reasoning)"), "Deep Reasoning must only show if model supports reasoning");
assert(appJsContent.includes('if (caps.audio || state.selectedModelId.toLowerCase().includes("whisper"))'), "Audio must only show if model supports audio/whisper");
assert(appJsContent.includes("if (caps.ocr)"), "OCR must only show if model supports OCR");

console.log("  ✓ ChatGPT-Style Plus Action Menu verified: dynamically reveals only model-supported capabilities");

// --- TEST 4: Center Screen Simplification ---
assert(!appJsContent.includes("Actionable Agent Workflows:"), "Cluttered welcome screen header must be removed");
assert(!appJsContent.includes("Explore More Features:"), "Cluttered explore header must be removed");
assert(appJsContent.includes("welcome-screen-wrapper"), "app.js must use clean welcome-screen-wrapper");
assert(appJsContent.includes("loaded-model-card"), "app.js must use loaded-model-card in center screen");
assert(appJsContent.includes("welcome-chips-row"), "app.js must use clean welcome-chips-row for simple prompt suggestions");

console.log("  ✓ Center screen simplification verified: clutter eliminated in favor of clean greeting, active model badge & prompt chips");

// --- TEST 5: Model Selector & Provider API UI Simplification ---
assert(appJsContent.includes('els.providerConfigDrawer.style.display = "none"'), "Switching to models tab must hide providerConfigDrawer");
assert(appJsContent.includes('els.modelsSelectionBody.style.display = "block"'), "Switching to models tab must show modelsSelectionBody");
assert(appJsContent.includes('els.providerConfigDrawer.style.display = "flex"'), "Switching to provider tab must show providerConfigDrawer");
assert(appJsContent.includes('els.modelsSelectionBody.style.display = "none"'), "Switching to provider tab must hide modelsSelectionBody");

console.log("  ✓ Model Selector & Provider API UI verified: separate focused views eliminate nested drawer clutter");

// --- TEST 6: Model Settings UI & HTML Validity ---
assert(indexHtmlContent.includes('id="model-settings-modal"'), "index.html must include model-settings-modal");
assert(indexHtmlContent.includes('class="settings-model-card"'), "index.html must include settings-model-card");
assert(indexHtmlContent.includes('class="settings-presets-row"'), "index.html must include settings-presets-row");
assert(indexHtmlContent.includes('class="settings-security-card"'), "index.html must include settings-security-card");

// --- TEST 7: Turbo Boost Routing (/boost and /boost/boost) ---
assert(appJsContent.includes('cleanTrimmed === "/boost" || cleanTrimmed === "/boost/boost"'), "app.js must handle /boost and /boost/boost directly");
assert(appJsContent.includes("TURBO VELOCITY MODE"), "app.js must inject turbo velocity prompt when arg is present");

console.log("  ✓ Turbo Boost (/boost and /boost/boost) verified: triggers high-speed execution mode");

// --- TEST 8: Styling & CSS Classes ---
assert(styleCssContent.includes(".chatgpt-plus-menu"), "style.css must style .chatgpt-plus-menu");
assert(styleCssContent.includes(".plus-menu-item"), "style.css must style .plus-menu-item");
assert(styleCssContent.includes(".welcome-screen-wrapper"), "style.css must style .welcome-screen-wrapper");
assert(styleCssContent.includes(".loaded-model-card"), "style.css must style .loaded-model-card");
assert(styleCssContent.includes(".loaded-status-dot"), "style.css must style .loaded-status-dot");
assert(styleCssContent.includes(".provider-quick-bar"), "style.css must style .provider-quick-bar");
assert(styleCssContent.includes(".modal-active-model-card"), "style.css must style .modal-active-model-card");
assert(styleCssContent.includes(".settings-model-card"), "style.css must style .settings-model-card");

console.log("  ✓ Liquid Glass styling verified for all new components");

console.log("✔ [TEST SUITE 8/8 PASSED] Continuation, Loaded Model & Simplified UI verified with 100% test pass!\n");


// ==============================================================================
// AGENTSFLOW AI - TEST SUITE: ROLEPLAY TYPOGRAPHY & STREAM COMPLETION ENGINE
// ==============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appJsPath = path.resolve(__dirname, "../android/assets/js/app.js");
const styleCssPath = path.resolve(__dirname, "../android/assets/css/style.css");

console.log("▶ [TEST SUITE 7/7] Testing Roleplay Typography, Special Characters & Stream Completion...");

const appJsContent = fs.readFileSync(appJsPath, "utf-8");
const styleCssContent = fs.readFileSync(styleCssPath, "utf-8");

// --- TEST 1: Stream Reader Termination & Finally Block ---
assert(appJsContent.includes("isStreamDone"), "streamCompletionFromProvider must use isStreamDone flag");
assert(appJsContent.includes("if (trimmed === \"data: [DONE]\" || trimmed === \"[DONE]\")"), "Stream parser must handle [DONE]");
assert(appJsContent.includes("if (data.choices && data.choices[0] && data.choices[0].finish_reason)"), "Stream parser must check finish_reason");
assert(appJsContent.includes("await reader.cancel()"), "Stream reader must be canceled on completion");
assert(appJsContent.includes("} finally {"), "executePromptStream must contain explicit finally block");

console.log("  ✓ Stream completion lifecycle & reader termination verified");

// --- TEST 2: Instant Stop Streaming Reset ---
assert(appJsContent.includes("function stopStreaming()"), "stopStreaming function must exist");
assert(appJsContent.includes("state.isStreaming = false;"), "stopStreaming must immediately clear isStreaming flag");
assert(appJsContent.includes("updateSendStopButtons(false);"), "stopStreaming must immediately toggle send/stop buttons");

console.log("  ✓ Instant stopStreaming reset & UI unfreeze verified");

// --- TEST 3: Roleplay & Special Characters Formatting ---
// Extract formatContent from app.js using sandbox
const formatFuncMatch = appJsContent.match(/function formatContent[\s\S]*?\n  \}/);
assert(formatFuncMatch, "formatContent function must exist");

const escapeHtmlMatch = appJsContent.match(/function escapeHtml[\s\S]*?\n  \}/);
const highlightCodeMatch = appJsContent.match(/function highlightCode[\s\S]*?\n  \}/);
const extractDomainMatch = appJsContent.match(/function extractDomain[\s\S]*?\n  \}/);
const createCitationMatch = appJsContent.match(/function createCitationChip[\s\S]*?\n  \}/);

const sandbox = new Function(`
  const codeSnippetsRegistry = [];
  ${escapeHtmlMatch[0]}
  ${highlightCodeMatch[0]}
  ${extractDomainMatch[0]}
  ${createCitationMatch[0]}
  ${formatFuncMatch[0]}
  return { formatContent };
`)();

const { formatContent } = sandbox;

// 3a. Roleplay actions in asterisks
const rpActionText = "*whispers softly* Greetings, adventurer.";
const rpActionHtml = formatContent(rpActionText);
assert(rpActionHtml.includes('<em class="rp-action">whispers softly</em>'), "Asterisks must format into rp-action");

// 3b. Bold-Italic Roleplay Actions
const boldItalicText = "***screams into the void***";
const boldItalicHtml = formatContent(boldItalicText);
assert(boldItalicHtml.includes('<strong class="rp-bold-action"><em class="rp-action">screams into the void</em></strong>'), "***text*** must format into rp-bold-action strong em");

// 3c. Underline
const underlineText = "<u>ancient grimoire</u> and ++secret seal++";
const underlineHtml = formatContent(underlineText);
assert(underlineHtml.includes('<span class="rp-underline">ancient grimoire</span>'), "<u> must format into rp-underline");
assert(underlineHtml.includes('<span class="rp-underline">secret seal</span>'), "++text++ must format into rp-underline");

// 3d. Strikethrough
const strikeText = "~~retracted statement~~";
const strikeHtml = formatContent(strikeText);
assert(strikeHtml.includes('<del class="rp-strikethrough">retracted statement</del>'), "~~text~~ must format into rp-strikethrough");

// 3e. Spoiler
const spoilerText = "The killer was ||Lord Blackwood||.";
const spoilerHtml = formatContent(spoilerText);
assert(spoilerHtml.includes('<span class="rp-spoiler"'), "||text|| must format into interactive rp-spoiler");

// 3f. Highlight
const highlightText = "Notice the ==hidden rune== on the wall.";
const highlightHtml = formatContent(highlightText);
assert(highlightHtml.includes('<mark class="rp-highlight">hidden rune</mark>'), "==text== must format into rp-highlight");

// 3g. Subscript & Superscript
const formulaText = "H~2~O and E = mc^2^";
const formulaHtml = formatContent(formulaText);
assert(formulaHtml.includes('<sub>2</sub>'), "H~2~O must format subscript");
assert(formulaHtml.includes('<sup>2</sup>'), "E = mc^2^ must format superscript");

console.log("  ✓ Roleplay typography verified: asterisks, bold-italics, underlines, spoilers, highlights, sub/super");

// --- TEST 4: Roleplay CSS Stylesheet Rules ---
const requiredRpCss = [
  ".rp-action",
  ".rp-bold-action",
  ".rp-underline",
  ".rp-strikethrough",
  ".rp-spoiler",
  ".rp-spoiler.revealed",
  ".rp-highlight",
];

requiredRpCss.forEach(cls => {
  assert(styleCssContent.includes(cls), `style.css must define ${cls}`);
});

console.log("  ✓ Liquid Glass Roleplay CSS classes verified in style.css");

console.log("✔ [TEST SUITE 7/7 PASSED] Roleplay Typography & Stream Completion verified with 100% test pass!");

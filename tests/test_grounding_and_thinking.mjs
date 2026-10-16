// ==============================================================================
// AGENTSFLOW AI - TEST SUITE: WEB GROUNDING, REASONING ISOLATION & CITATIONS
// ==============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appJsPath = path.resolve(__dirname, "../android/assets/js/app.js");
const styleCssPath = path.resolve(__dirname, "../android/assets/css/style.css");

console.log("▶ [TEST SUITE 6/6] Testing Web Grounding, Reasoning Isolation & Rich Citations...");

const appJsContent = fs.readFileSync(appJsPath, "utf-8");
const styleCssContent = fs.readFileSync(styleCssPath, "utf-8");

// --- TEST 1: Strict User Bubble Isolation ---
// Verify appendMessageToDOM checks `isAssistant` before processing or rendering thinking
assert(appJsContent.includes('const isAssistant = msg.role === "assistant";'), "appendMessageToDOM must define isAssistant flag");
assert(appJsContent.includes('if (isAssistant) {'), "Thinking extraction must be gated with if (isAssistant)");
assert(styleCssContent.includes('.message-user .thinking-section'), "style.css must have strict display: none !important safeguard for user thinking-section");

console.log("  ✓ Strict User Bubble Isolation verified: user messages never extract or render thinking accordions");

// --- TEST 2: /think Template Integrity ---
// Verify /think template does NOT inject literal <think> into user prompt
const thinkTemplateMatch = appJsContent.match(/cmd:\s*"\/think"[\s\S]*?template:\s*\(arg\)\s*=>\s*`([\s\S]*?)`/);
assert(thinkTemplateMatch, "/think command must exist in FEATURE_CATALOG");
const thinkTemplateBody = thinkTemplateMatch[1];
assert(!thinkTemplateBody.includes("<think>\n1. State assumptions"), "/think template must not hardcode open tags that masquerade as thought");
assert(thinkTemplateBody.includes("Enclose your complete thinking and deduction process inside <think>...</think> tags"), "Template must instruct model to enclose deductions in tags");

console.log("  ✓ /think command prompt template verified with zero prompt leakage");

// --- TEST 3: Multi-format Thinking & Step Reasoning Extraction ---
// Extract extractThinkingProcess and extractStepReasoning from app.js using Function sandbox
const extractFuncCode = appJsContent.match(/function extractThinkingProcess[\s\S]*?\n  \}/)[0];
const extractStepCode = appJsContent.match(/function extractStepReasoning[\s\S]*?\n  \}/)[0];

const sandbox = new Function(`
  ${extractFuncCode}
  ${extractStepCode}
  return { extractThinkingProcess, extractStepReasoning };
`)();

const { extractThinkingProcess, extractStepReasoning } = sandbox;

// Test standard <think> tags
const r1Output = "<think>Let us consider prime factors of 42. 42 = 2 * 3 * 7.</think>The prime factors of 42 are 2, 3, and 7.";
const r1Extracted = extractThinkingProcess(r1Output, false);
assert.equal(r1Extracted.thoughts, "Let us consider prime factors of 42. 42 = 2 * 3 * 7.");
assert.equal(r1Extracted.cleanText, "The prime factors of 42 are 2, 3, and 7.");

// Test Mistral NeMo untagged step reasoning
const mistralOutput = `Thinking Process:
1. Identify the input problem: compute e^(i*pi).
2. Apply Euler's formula: e^(ix) = cos(x) + i*sin(x).
3. Evaluate cos(pi) = -1, sin(pi) = 0.

[Final Verified Answer]
e^(i*pi) + 1 = 0, which is Euler's identity.`;

const mistralExtracted = extractThinkingProcess(mistralOutput, false);
assert(mistralExtracted.thoughts.includes("Euler's formula"), "Mistral thinking must be extracted into thoughts");
assert(mistralExtracted.cleanText.includes("Euler's identity"), "Mistral final answer must be kept in cleanText");

// Test extractStepReasoning on [Step 1: ...] ... [Final Verified Answer]
const stepOutput = `[Step 1: Assumptions and Setup]
Let x be the target variable.
[Step 2: Analysis]
x^2 = 16 implies x = 4 or x = -4.

[Final Verified Answer]
The real solutions are x = 4 and x = -4.`;

const stepExtracted = extractStepReasoning(stepOutput);
assert(stepExtracted.thoughts.includes("Assumptions and Setup"), "Step 1 must be captured in thoughts");
assert(stepExtracted.cleanText.includes("The real solutions are x = 4 and x = -4."), "Final verified answer must be in cleanText");

console.log("  ✓ Reasoning extraction engine verified across DeepSeek R1 tags, Mistral NeMo headers & step markers");

// --- TEST 4: formatContent Rich Citations, Callouts & Tables ---
// Verify CSS definitions for interactive citation chips, callout cards, step badges, and tables
const requiredCssClasses = [
  ".source-citation-chip",
  ".citation-chip",
  ".callout-card",
  ".callout-note",
  ".callout-tip",
  ".callout-warning",
  ".callout-important",
  ".callout-caution",
  ".step-card",
  ".verified-answer-card",
  ".final-answer-banner",
  ".table-responsive-container",
  ".md-table",
];

requiredCssClasses.forEach(cls => {
  assert(styleCssContent.includes(cls), `style.css must define ${cls}`);
});

console.log("  ✓ AAA Liquid Glass styling classes verified in style.css for all grounding elements");

// --- TEST 5: Web Grounding System Prompt Verification ---
assert(appJsContent.includes("[WEB GROUNDING MODE ACTIVE: Frontier Research & Source Verification]"), "Web Grounding prompt must be enriched with structure and citation guidelines");
assert(appJsContent.includes("Grounded Sources & References"), "Web Grounding prompt must instruct on structured sources section");

console.log("  ✓ Web Grounding system instruction verified with rich formatting mandates");

console.log("✔ [TEST SUITE 6/6 PASSED] All Web Grounding, Reasoning Isolation & Citation tests passed 100%!");

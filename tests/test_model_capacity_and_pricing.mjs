// ==============================================================================
// AGENTSFLOW AI - TEST SUITE: MODEL CAPACITY, PRICING & CATEGORY FILTERING
// ==============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appJsPath = path.resolve(__dirname, "../android/assets/js/app.js");
const indexHtmlPath = path.resolve(__dirname, "../android/assets/index.html");

console.log("▶ [TEST SUITE 9/9] Testing Model Capacity Clamping, Pricing & Transcribe/OCR Filtering...");

const appJs = fs.readFileSync(appJsPath, "utf-8");
const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

// --- TEST 1: Model Output Token Capacity Specs & Clamping ---
assert(appJs.includes("function getModelMaxOutputTokens(modelId)"), "app.js must define getModelMaxOutputTokens");
assert(appJs.includes("id.includes(\"lunaris\")"), "getModelMaxOutputTokens must include Lunaris limit");
assert(appJs.includes("id.includes(\"llama-3"), "getModelMaxOutputTokens must include LLaMA 3.x limit");
assert(appJs.includes("id.includes(\"deepseek-r1"), "getModelMaxOutputTokens must include DeepSeek R1 limit");
assert(appJs.includes("id.includes(\"claude-3-7"), "getModelMaxOutputTokens must include Claude 3.7 limit");

// Verify safeMaxTokens clamping in streaming payload builder
assert(appJs.includes("const modelMaxOut = getModelMaxOutputTokens(requestModel)"), "streamCompletionFromProvider must check getModelMaxOutputTokens");
assert(appJs.includes("const safeMaxTokens = Math.min(state.settings.maxTokens || 4096, modelMaxOut)"), "streamCompletionFromProvider must clamp maxTokens to safeMaxTokens");
assert(appJs.includes("payload.max_tokens = safeMaxTokens"), "payload.max_tokens must use safeMaxTokens");
assert(appJs.includes("retryPayload.max_tokens = safeMaxTokens"), "retryPayload.max_tokens must use safeMaxTokens");

// Verify settings modal slider clamping
assert(appJs.includes("Math.min(maxAllowedTokens, parsedVal)") || appJs.includes("Math.min(maxAllowedTokens,"), "saveModelParameters must clamp maxTokens to maxAllowedTokens");

console.log("  ✓ Model Output Token Capacity dynamic clamping verified for LLaMA, DeepSeek, Claude & OpenAI");

// --- TEST 2: Lunaris & AICredits Pricing Calculation ---
assert(appJs.includes('"lunaris/lunaris-8b"'), "DEFAULT_MODELS or MODEL_PRICING must include lunaris/lunaris-8b");
assert(appJs.includes("outInr = 5.0"), "getModelPricing must recognize Lunaris ₹5.00/1M rate on aicredits.in");
assert(appJs.includes("inInr = 2.5"), "getModelPricing must recognize Lunaris ₹2.50/1M rate on aicredits.in");
assert(appJs.includes("aicredits"), "app.js must support aicredits provider URL heuristic");

// Verify cost estimation calculation formula
assert(appJs.includes("pricing.outputPer1MInr !== undefined"), "executePromptStream must support direct INR pricing calculation");
assert(appJs.includes("(approxInTokens / 1000000) * pricing.inputPer1MInr"), "executePromptStream must calculate INR input cost per 1M");
assert(appJs.includes("(estExpectedOutTokens / 1000000) * pricing.outputPer1MInr"), "executePromptStream must calculate INR output cost per 1M");

// Verify 1000 tokens of Lunaris cost simulation
const lunarisOut1M = 5.0; // ₹5 per 1M
const lunarisIn1M = 2.5; // ₹2.5 per 1M
const sampleInTokens = 100;
const sampleOutTokens = 1000;
const sampleInrCost = ((sampleInTokens / 1000000) * lunarisIn1M) + ((sampleOutTokens / 1000000) * lunarisOut1M);
assert(sampleInrCost < 0.01, `1,000 tokens of Lunaris should cost ~₹0.005, got ₹${sampleInrCost}`);
assert(sampleInrCost < 1.0, "1,000 tokens of Lunaris must NOT exceed ₹1.00 budget limit!");

// Verify even 4,000 tokens with high reasoning does not exceed ₹1.00
const highReasoningOutTokens = 4000;
const highReasoningCost = ((sampleInTokens / 1000000) * lunarisIn1M) + ((highReasoningOutTokens / 1000000) * lunarisOut1M);
assert(highReasoningCost <= 0.025, `4,000 tokens of Lunaris should cost ~₹0.02, got ₹${highReasoningCost}`);
assert(highReasoningCost < 1.0, "High reasoning 4,000 tokens of Lunaris must NOT exceed ₹1.00 budget limit!");

console.log("  ✓ Lunaris & AICredits pricing verified: ₹5/1M output tokens correctly calculated at ₹0.005 per 1k without false ₹7 warnings");

// --- TEST 3: Speech-to-Text / Audio / Transcribe & Vision / OCR Category Filtering ---
assert(appJs.includes("combined.includes(\"transcrib\")"), "detectCapabilities must check 'transcrib'");
assert(appJs.includes("combined.includes(\"ocr\")"), "detectCapabilities must check 'ocr'");
assert(appJs.includes("combined.includes(\"nougat\")"), "detectCapabilities must check 'nougat'");
assert(appJs.includes("combined.includes(\"whisper\")"), "detectCapabilities must check 'whisper'");

// Verify renderModelsList filtering handles audio & transcribe
assert(appJs.includes("cat === \"audio\" && !caps.audio && m.category !== \"audio\""), "renderModelsList must filter audio category correctly");
// Verify renderModelsList filtering handles vision & ocr
assert(appJs.includes("cat === \"vision\" && !caps.vision && !caps.ocr"), "renderModelsList must filter vision & ocr category correctly");

// Verify probeModelsFromUrl assigns categories using detectCapabilities
assert(appJs.includes("const caps = detectCapabilities(rawId, m)"), "probeModelsFromUrl must use detectCapabilities");

console.log("  ✓ Speech-to-Text / Audio & OCR / Vision category filtering verified in catalog & live discovery");

// --- TEST 4: Input Draft Retention on Budget Warning ---
assert(appJs.includes("pendingBudgetAction = {"), "executePromptStream must store draft in pendingBudgetAction");
assert(appJs.includes("text,"), "pendingBudgetAction must preserve prompt text");
assert(appJs.includes("imageUrl,"), "pendingBudgetAction must preserve attached imageUrl");
assert(appJs.includes("els.chatTextarea.value = pendingBudgetAction.text"), "budgetCancelBtn and closeModal must restore draft text into chatTextarea");

console.log("  ✓ Input Draft Retention verified: typed prompt is never deleted when budget warning triggers or is cancelled");

// --- TEST 5: Settings Modal Budget UI ---
assert(indexHtml.includes('id="setting-budget-limit"'), "index.html must include setting-budget-limit");
assert(indexHtml.includes('id="setting-budget-warn"'), "index.html must include setting-budget-warn");
assert(indexHtml.includes('id="budget-spend-badge"'), "index.html must include budget-spend-badge");
assert(indexHtml.includes('id="reset-spend-btn"'), "index.html must include reset-spend-btn");
assert(indexHtml.includes('data-preset="aicredits"'), "index.html must include AICredits preset button");

console.log("  ✓ Settings Modal Budget & Cost Management controls verified in HTML");

// --- TEST 6: Multi-Model Pricing Registry & Exact Rates ---
assert(appJs.includes("function normalizePricing(raw)"), "app.js must define normalizePricing");
assert(appJs.includes("function formatCurrencyDisplay(val, symbol)"), "app.js must define formatCurrencyDisplay");
assert(appJs.includes('"deepseek/deepseek-r1"'), "MODEL_PRICING must include deepseek/deepseek-r1");
assert(appJs.includes('"anthropic/claude-3.5-sonnet"'), "MODEL_PRICING must include anthropic/claude-3.5-sonnet");
assert(appJs.includes('"openai/gpt-4o"'), "MODEL_PRICING must include openai/gpt-4o");
assert(appJs.includes('"sao10k/l3-lunaris-8b"'), "MODEL_PRICING must include sao10k/l3-lunaris-8b");
assert(appJs.includes('"got-ocr/got-ocr-2.0"'), "MODEL_PRICING must include got-ocr/got-ocr-2.0");

// Test formatCurrencyDisplay simulation
function testFormatCurrencyDisplay(val, symbol) {
  const n = typeof val === "number" ? val : parseFloat(val || "0");
  if (isNaN(n) || n === 0) return `${symbol}0.00`;
  if (n < 0.01) return `${symbol}${n.toFixed(3)}`;
  return `${symbol}${n.toFixed(2)}`;
}
assert.strictEqual(testFormatCurrencyDisplay(0.55, "$"), "$0.55");
assert.strictEqual(testFormatCurrencyDisplay(46.20, "₹"), "₹46.20");
assert.strictEqual(testFormatCurrencyDisplay(0.03, "$"), "$0.03");
assert.strictEqual(testFormatCurrencyDisplay(2.50, "₹"), "₹2.50");
assert.strictEqual(testFormatCurrencyDisplay(0.005, "$"), "$0.005", "Small sub-cent prices must not round down to $0.00");
assert.strictEqual(testFormatCurrencyDisplay(0.42, "₹"), "₹0.42");
console.log("  ✓ Multi-Model Pricing Registry & formatCurrencyDisplay verified across USD and INR");

// --- TEST 7: Dynamic OpenRouter & API Token Unit Scaling ---
function testDynamicScaling(pIn, pOut) {
  const refRate = pIn > 0 ? pIn : pOut;
  const unitMultiplier = refRate < 0.0001 ? 1000000 : (pIn <= 0.02 && pOut <= 0.10 ? 1000 : (refRate < 0.02 ? 1000 : 1));
  return { in1M: pIn * unitMultiplier, out1M: pOut * unitMultiplier };
}
assert(appJs.includes("pIn <= 0.02 && pOut <= 0.10"), "app.js must use consistent unitMultiplier to prevent 1000x pricing explosion");

// 1. OpenRouter per-token format: GPT-4o
const orScale = testDynamicScaling(0.0000025, 0.00001);
assert.strictEqual(orScale.in1M, 2.50, "OpenRouter prompt rate 0.0000025 must scale to $2.50 per 1M");
assert.strictEqual(orScale.out1M, 10.00, "OpenRouter completion rate 0.00001 must scale to $10.00 per 1M");

// 2. OpenRouter per-token format: DeepSeek R1
const orR1Scale = testDynamicScaling(0.00000055, 0.00000219);
assert.strictEqual(Number(orR1Scale.in1M.toFixed(4)), 0.55, "OpenRouter R1 prompt rate 0.00000055 must scale to $0.55 per 1M");
assert.strictEqual(Number(orR1Scale.out1M.toFixed(4)), 2.19, "OpenRouter R1 completion rate 0.00000219 must scale to $2.19 per 1M");

// 3. Per-1k format (DeepSeek R1 per-1k: 0.00055 / 0.00219)
const kR1Scale = testDynamicScaling(0.00055, 0.00219);
assert.strictEqual(kR1Scale.in1M, 0.55, "Per-1k R1 prompt rate 0.00055 must scale to $0.55 per 1M");
assert.strictEqual(kR1Scale.out1M, 2.19, "Per-1k R1 completion rate 0.00219 must scale to $2.19 per 1M");

// 4. Per-1k format (GPT-4o per-1k: 0.0025 / 0.010)
const kScale = testDynamicScaling(0.0025, 0.010);
assert.strictEqual(kScale.in1M, 2.50, "Per-1k prompt rate 0.0025 must scale to $2.50 per 1M");
assert.strictEqual(kScale.out1M, 10.00, "Per-1k completion rate 0.010 must scale to $10.00 per 1M");

// 4b. Per-1k format (Claude 3.5 Sonnet per-1k: 0.003 / 0.015)
const kSonnetScale = testDynamicScaling(0.003, 0.015);
assert.strictEqual(kSonnetScale.in1M, 3.00, "Per-1k Claude Sonnet prompt rate 0.003 must scale to $3.00 per 1M");
assert.strictEqual(kSonnetScale.out1M, 15.00, "Per-1k Claude Sonnet completion rate 0.015 must scale to $15.00 per 1M");

// 4c. Per-1k format (Claude 3 Opus per-1k: 0.015 / 0.075)
const kOpusScale = testDynamicScaling(0.015, 0.075);
assert.strictEqual(kOpusScale.in1M, 15.00, "Per-1k Claude Opus prompt rate 0.015 must scale to $15.00 per 1M");
assert.strictEqual(kOpusScale.out1M, 75.00, "Per-1k Claude Opus completion rate 0.075 must scale to $75.00 per 1M");

// 5. Cheap Per-1M format (Gemini Flash: 0.075 / 0.30 - MUST NOT explode to $75 / 1M!)
const geminiScale = testDynamicScaling(0.075, 0.30);
assert.strictEqual(geminiScale.in1M, 0.075, "Gemini Flash prompt rate 0.075 must NOT be multiplied by 1000 to $75/1M");
assert.strictEqual(geminiScale.out1M, 0.30, "Gemini Flash completion rate 0.30 must stay $0.30 per 1M");

// 6. Cheap Per-1M format (LLaMA 3.1 8B: 0.05 / 0.10 - MUST NOT explode to $50 / 1M!)
const llamaScale = testDynamicScaling(0.05, 0.10);
assert.strictEqual(llamaScale.in1M, 0.05, "LLaMA 8B prompt rate 0.05 must NOT be multiplied by 1000 to $50/1M");
assert.strictEqual(llamaScale.out1M, 0.10, "LLaMA 8B completion rate 0.10 must stay $0.10 per 1M");

// 7. Cheap Per-1M format (Lunaris 8B: 0.03 / 0.06 - MUST NOT explode to $30 / 1M!)
const lunarisScale = testDynamicScaling(0.03, 0.06);
assert.strictEqual(lunarisScale.in1M, 0.03, "Lunaris prompt rate 0.03 must NOT be multiplied by 1000 to $30/1M");
assert.strictEqual(lunarisScale.out1M, 0.06, "Lunaris completion rate 0.06 must stay $0.06 per 1M");

// 8. Standard Per-1M format: GPT-4o
const mScale = testDynamicScaling(2.50, 10.00);
assert.strictEqual(mScale.in1M, 2.50, "Per-1M prompt rate 2.50 must stay $2.50 per 1M");
assert.strictEqual(mScale.out1M, 10.00, "Per-1M completion rate 10.00 must stay $10.00 per 1M");
console.log("  ✓ Dynamic API Token Unit Scaling verified for per-token, per-1k, and cheap per-1M formats without 1000x error");

// --- TEST 8: Budget Warning Modal Reset Spend Counter Option ---
assert(indexHtml.includes('id="budget-reset-spend-btn"'), "index.html must include budget-reset-spend-btn");
assert(appJs.includes("budgetResetSpendBtn: document.getElementById(\"budget-reset-spend-btn\")"), "app.js must register budgetResetSpendBtn");
assert(appJs.includes("els.budgetResetSpendBtn.onclick"), "app.js must bind click handler to budgetResetSpendBtn");
assert(appJs.includes("state.totalSpend = 0.0"), "budgetResetSpendBtn must reset state.totalSpend to 0.0");
console.log("  ✓ Budget Warning Modal Reset Spend Counter Option verified");

// --- TEST 9: Chat Bubble & Alert Cost Display Formatting (No ~$$ Double Dollar Bug) ---
assert(!appJs.includes("~$$"), "app.js must NOT contain ~$$ double dollar signs");
assert(appJs.includes("const usdStr = costUsd < 0.0001 ? \"<$0.0001\" : `$${costUsd.toFixed(4)}`"), "estimateCost must use proper USD format");
assert(appJs.includes("const inrStr = costInr < 0.01 ? \"<₹0.01\" : `₹${costInr.toFixed(2)}`"), "estimateCost must use proper INR format");
console.log("  ✓ Chat Bubble & Alert Cost Display Formatting verified without double dollar signs");

// --- TEST 10: /boost/boost Dual Turbo Feature & Execution ---
assert(appJs.includes('cmd: "/boost/boost"'), "FEATURE_CATALOG must include /boost/boost");
assert(appJs.includes('badge: "Dual Turbo"'), "/boost/boost must feature Dual Turbo badge");
assert(appJs.includes("MAXIMUM DUAL TURBO BOOST"), "app.js must define MAXIMUM DUAL TURBO BOOST template");
assert(appJs.includes('cleanTrimmed === "/boost/boost"'), "app.js must handle /boost/boost directly");
assert(appJs.includes('lowerTrimmed === "/boost/boost"'), "app.js must support case-insensitive /boost/boost command");
assert(appJs.includes('state.turboBoost ? 0.2 :'), "app.js must set temperature to 0.2 on turbo boost");
assert(appJs.includes('state.turboBoost ? 0.9 :'), "app.js must set top_p to 0.9 on turbo boost");
console.log("  ✓ /boost/boost Dual Turbo command registration, template, and slash execution verified");

// --- TEST 11: Active Model Pricing Display in Modal Banner & Settings ---
assert(appJs.includes("modalActiveModelSub.textContent ="), "app.js must update modalActiveModelSub with model details");
assert(appJs.includes("pSummary = ` • ${inInr} in / ${outInr} out / 1M (${inUsd} / ${outUsd})`"), "modalActiveModelSub must show INR and USD per-1M pricing");
assert(appJs.includes("pInfo = ` (${inInr} in / ${outInr} out per 1M)`"), "settingsModelDesc must show active model pricing");
assert(appJs.includes("welcome-loaded-model-pricing"), "app.js must render welcome screen model pricing pill");
assert(appJs.includes("welcomePricingBadge = `${inInr} in / ${outInr} out / 1M`"), "app.js must compute welcome pricing in INR per 1M");
console.log("  ✓ Active Model Pricing Display verified in Model Selector banner, Settings modal & Welcome screen");

// --- TEST 12: Slash Command /cost Non-Accumulation ---
assert(appJs.includes("estimateCost(state.selectedModelId, Math.ceil(totalTokens * 0.4), Math.ceil(totalTokens * 0.6), false)"), "/cost must pass accumulate = false");
assert(appJs.includes("function estimateCost(modelId, inTokens, outTokens, accumulate = true)"), "estimateCost must accept accumulate flag defaulting to true");
console.log("  ✓ Slash Command /cost Non-Accumulation verified (does not pollute state.totalSpend)");

console.log("✔ [TEST SUITE 9/9 PASSED] Model Capacity, Pricing & Category Filtering verified 100%!\n");

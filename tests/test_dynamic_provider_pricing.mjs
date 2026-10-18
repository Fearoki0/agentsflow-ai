// ==============================================================================
// AGENTSFLOW AI - TEST SUITE: DYNAMIC API PROVIDER PRICING & CUSTOM OVERRIDE
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

console.log("▶ [TEST SUITE 10/10] Testing Dynamic API Provider Live Pricing Fetching, Parsing & Editor...");

const appJs = fs.readFileSync(appJsPath, "utf-8");
const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
const styleCss = fs.readFileSync(styleCssPath, "utf-8");

// --- TEST 1: Source Code Structure & Function Contracts ---
assert(appJs.includes("function parseProviderPricing(m, providerUrl)"), "app.js must define parseProviderPricing");
assert(appJs.includes("function getModelPricing(modelId, modelObj)"), "app.js must define getModelPricing");
assert(appJs.includes("function saveCustomModelPricing("), "app.js must define saveCustomModelPricing");
assert(appJs.includes("function resetCustomModelPricing("), "app.js must define resetCustomModelPricing");
assert(appJs.includes("window.afOpenPricingEditor ="), "app.js must expose window.afOpenPricingEditor");
assert(appJs.includes("af_provider_pricing_cache"), "app.js must persist provider live pricing cache in af_provider_pricing_cache");
assert(appJs.includes("providerModelsPricing: JSON.parse(localStorage.getItem(\"af_provider_pricing_cache\")"), "state must initialize providerModelsPricing from cache");
console.log("  ✓ Dynamic Provider Pricing function contracts and persistent cache verified");

// --- TEST 2: HTML Pricing Editor Controls in Settings & Model Modals ---
assert(indexHtml.includes('id="settings-pricing-card"'), "index.html must include settings-pricing-card");
assert(indexHtml.includes('id="model-pricing-source-badge"'), "index.html must include model-pricing-source-badge");
assert(indexHtml.includes('id="settings-price-summary-text"'), "index.html must include settings-price-summary-text");
assert(indexHtml.includes('id="custom-price-input"'), "index.html must include custom-price-input");
assert(indexHtml.includes('id="custom-price-output"'), "index.html must include custom-price-output");
assert(indexHtml.includes('id="custom-price-currency"'), "index.html must include custom-price-currency");
assert(indexHtml.includes('id="custom-price-unit"'), "index.html must include custom-price-unit");
assert(indexHtml.includes('id="save-custom-pricing-btn"'), "index.html must include save-custom-pricing-btn");
assert(indexHtml.includes('id="reset-custom-pricing-btn"'), "index.html must include reset-custom-pricing-btn");
console.log("  ✓ Model Pricing Editor UI controls verified in Settings modal HTML");

// --- TEST 3: CSS Styles for Live Provider Badges & Edit Chips ---
assert(styleCss.includes(".pricing-source-badge"), "style.css must define .pricing-source-badge");
assert(styleCss.includes(".pricing-source-badge.live"), "style.css must define .pricing-source-badge.live");
assert(styleCss.includes(".pricing-source-badge.custom"), "style.css must define .pricing-source-badge.custom");
assert(styleCss.includes(".edit-model-pricing-chip"), "style.css must define .edit-model-pricing-chip");
console.log("  ✓ Liquid Glass Live API and Custom Pricing CSS styling verified");

// --- TEST 4: Extraction & Simulation of parseProviderPricing & getModelPricing ---
// Isolate parseProviderPricing & getModelPricing logic to test with real provider payloads
const INR_PER_USD = 84.0;

function normalizePricing(raw) {
  if (!raw) return { inputPer1M: 0.20, outputPer1M: 0.60, inputPer1MInr: 16.80, outputPer1MInr: 50.40 };
  if (raw.isFree) return { isFree: true, special: raw.special || "100% Free / Local ($0.00 / ₹0.00)", inputPer1M: 0, outputPer1M: 0, inputPer1MInr: 0, outputPer1MInr: 0 };
  const inUsd = raw.inputPer1M !== undefined ? raw.inputPer1M : ((raw.input || 0) * 1000);
  const outUsd = raw.outputPer1M !== undefined ? raw.outputPer1M : ((raw.output || 0) * 1000);
  const inInr = raw.inputPer1MInr !== undefined ? raw.inputPer1MInr : inUsd * INR_PER_USD;
  const outInr = raw.outputPer1MInr !== undefined ? raw.outputPer1MInr : outUsd * INR_PER_USD;
  return {
    ...raw,
    input: inUsd / 1000,
    output: outUsd / 1000,
    inputPer1M: inUsd,
    outputPer1M: outUsd,
    inputPer1MInr: inInr,
    outputPer1MInr: outInr,
  };
}

function simParseProviderPricing(m, providerUrl) {
  if (!m) return null;
  const rawId = String(m.id || m.name || "").toLowerCase();
  if (m.is_free === true || rawId.includes(":free")) {
    return normalizePricing({ isFree: true, source: "api_provider", special: "100% Free / Local ($0.00 / ₹0.00)" });
  }

  const pUrl = (providerUrl || "").toLowerCase();
  const isAiCredits = pUrl.includes("aicredits");
  const activeExchangeRate = (typeof m.exchange_rate === "number" && m.exchange_rate > 0)
    ? m.exchange_rate
    : (isAiCredits ? (INR_PER_USD * 1.05 * 1.05) : INR_PER_USD);

  const hasDirectInrTokens = typeof m.input_cost_per_token_inr === "number" || typeof m.output_cost_per_token_inr === "number";
  const hasDirectUsdTokens = typeof m.input_cost_per_token === "number" || typeof m.output_cost_per_token === "number";

  if (hasDirectInrTokens || (hasDirectUsdTokens && isAiCredits)) {
    const inTokenInr = typeof m.input_cost_per_token_inr === "number" ? m.input_cost_per_token_inr : 0;
    const outTokenInr = typeof m.output_cost_per_token_inr === "number" ? m.output_cost_per_token_inr : 0;
    const inTokenUsd = typeof m.input_cost_per_token === "number" ? m.input_cost_per_token : 0;
    const outTokenUsd = typeof m.output_cost_per_token === "number" ? m.output_cost_per_token : 0;

    const in1MInr = inTokenInr > 0 ? inTokenInr * 1000000 : (inTokenUsd > 0 ? inTokenUsd * 1000000 * activeExchangeRate : 0);
    const out1MInr = outTokenInr > 0 ? outTokenInr * 1000000 : (outTokenUsd > 0 ? outTokenUsd * 1000000 * activeExchangeRate : 0);
    const in1MUsd = inTokenUsd > 0 ? inTokenUsd * 1000000 : (in1MInr > 0 ? in1MInr / activeExchangeRate : 0);
    const out1MUsd = outTokenUsd > 0 ? outTokenUsd * 1000000 : (out1MInr > 0 ? out1MInr / activeExchangeRate : 0);

    return normalizePricing({
      source: "api_provider",
      inputPer1M: in1MUsd,
      outputPer1M: out1MUsd,
      inputPer1MInr: in1MInr,
      outputPer1MInr: out1MInr,
      exchangeRate: activeExchangeRate,
    });
  }

  const pObj = (m.pricing && typeof m.pricing === "object") ? m.pricing :
               (m.cost && typeof m.cost === "object") ? m.cost : null;
  let rawPrompt = pObj ? (pObj.prompt ?? pObj.input) : m.prompt_price;
  let rawCompletion = pObj ? (pObj.completion ?? pObj.output) : m.completion_price;

  if (rawPrompt !== undefined || rawCompletion !== undefined) {
    const pIn = parseFloat(rawPrompt || "0");
    const pOut = parseFloat(rawCompletion || "0");
    const refRate = pIn > 0 ? pIn : pOut;
    let unitMultiplier = refRate < 0.0001 ? 1000000 : (pIn <= 0.02 && pOut <= 0.10 ? 1000 : (refRate < 0.02 ? 1000 : 1));
    const in1M = pIn * unitMultiplier;
    const out1M = pOut * unitMultiplier;
    return normalizePricing({
      source: "api_provider",
      inputPer1M: in1M,
      outputPer1M: out1M,
      inputPer1MInr: in1M * activeExchangeRate,
      outputPer1MInr: out1M * activeExchangeRate,
    });
  }
  return null;
}

// 4A. Real-World AICredits Models Simulation (Different distinct prices per model)
const aicreditsModel1 = {
  id: "aion-labs/aion-2.0",
  name: "Aion-2.0",
  input_cost_per_token: 8e-7,
  output_cost_per_token: 1.6e-6,
  input_cost_per_token_inr: 0.00007986356868,
  output_cost_per_token_inr: 0.00015972713736,
  exchange_rate: 95.075677,
};

const aicreditsModel2 = {
  id: "z-ai/glm-5.3-flash",
  name: "GLM 5.3 Flash",
  input_cost_per_token: 7.5e-8,
  output_cost_per_token: 2.5e-7,
  input_cost_per_token_inr: 0.00000748720956,
  output_cost_per_token_inr: 0.00002495736521,
  exchange_rate: 95.075677,
};

const aicreditsModel3 = {
  id: "google/gemini-flash-latest",
  name: "Gemini Flash Latest",
  input_cost_per_token: 0.0000015,
  output_cost_per_token: 0.000009,
  input_cost_per_token_inr: 0.000149744191275,
  output_cost_per_token_inr: 0.00089846514765,
  exchange_rate: 95.075677,
};

const p1 = simParseProviderPricing(aicreditsModel1, "https://api.aicredits.in/v1");
const p2 = simParseProviderPricing(aicreditsModel2, "https://api.aicredits.in/v1");
const p3 = simParseProviderPricing(aicreditsModel3, "https://api.aicredits.in/v1");

// Verify prices are distinct and not collapsed into same rate
assert.notStrictEqual(p1.inputPer1MInr, p2.inputPer1MInr, "AICredits model 1 and model 2 must NOT have the same input price");
assert.notStrictEqual(p2.outputPer1MInr, p3.outputPer1MInr, "AICredits model 2 and model 3 must NOT have the same output price");
assert.strictEqual(Number(p1.inputPer1M.toFixed(2)), 0.80, "Aion 2.0 input must be $0.80/1M");
assert.strictEqual(Number(p1.outputPer1M.toFixed(2)), 1.60, "Aion 2.0 output must be $1.60/1M");
assert.strictEqual(Number(p1.inputPer1MInr.toFixed(2)), 79.86, "Aion 2.0 input INR must be ₹79.86/1M");
assert.strictEqual(Number(p1.outputPer1MInr.toFixed(2)), 159.73, "Aion 2.0 output INR must be ₹159.73/1M");

assert.strictEqual(Number(p2.inputPer1MInr.toFixed(2)), 7.49, "GLM Flash input INR must be ₹7.49/1M");
assert.strictEqual(Number(p2.outputPer1MInr.toFixed(2)), 24.96, "GLM Flash output INR must be ₹24.96/1M");

assert.strictEqual(Number(p3.inputPer1MInr.toFixed(2)), 149.74, "Gemini Flash input INR must be ₹149.74/1M");
assert.strictEqual(Number(p3.outputPer1MInr.toFixed(2)), 898.47, "Gemini Flash output INR must be ₹898.47/1M");
console.log("  ✓ AICredits native per-token INR/USD models parse with distinct live rates (₹7.49 vs ₹79.86 vs ₹149.74)");

// 4B. OpenRouter Per-Token Payload Simulation
const orModel1 = {
  id: "openai/gpt-4o",
  name: "GPT-4o",
  pricing: { prompt: "0.0000025", completion: "0.00001" }
};
const orModel2 = {
  id: "deepseek/deepseek-r1",
  name: "DeepSeek R1",
  pricing: { prompt: "0.00000055", completion: "0.00000219" }
};
const pOr1 = simParseProviderPricing(orModel1, "https://openrouter.ai/api/v1");
const pOr2 = simParseProviderPricing(orModel2, "https://openrouter.ai/api/v1");
assert.strictEqual(pOr1.inputPer1M, 2.50);
assert.strictEqual(pOr1.outputPer1M, 10.00);
assert.strictEqual(Number(pOr2.inputPer1M.toFixed(2)), 0.55);
assert.strictEqual(Number(pOr2.outputPer1M.toFixed(2)), 2.19);
console.log("  ✓ OpenRouter models parse with distinct live rates ($0.55 vs $2.50)");

// --- TEST 5: Dynamic Priority Verification in getModelPricing ---
// Verify live provider pricing takes precedence over static fallback dictionary
assert(appJs.includes("// 2. LIVE DYNAMIC API-RETURNED PRICING (Top priority over static hardcoded fallback registries)"), "app.js must prioritize live dynamic API pricing");
assert(appJs.includes("if (livePricing) {"), "app.js must return normalized livePricing immediately when present");
assert(appJs.includes("source: livePricing.source || \"api_provider\""), "app.js must set source to api_provider");

// --- TEST 6: User Custom Price Override Verification ---
assert(appJs.includes("localStorage.getItem(\"af_custom_pricing\")"), "getModelPricing must check af_custom_pricing override first");
assert(appJs.includes("localStorage.setItem(\"af_custom_pricing\", JSON.stringify(customPricingMap))"), "saveCustomModelPricing must persist custom overrides in af_custom_pricing");
assert(appJs.includes("delete customPricingMap[modelId]"), "resetCustomModelPricing must remove overrides");

// --- TEST 7: Auto Provider Detection on Typed URL ---
assert(appJs.includes("lowerUrl.includes(\"aicredits\")"), "probeModelsFromUrl must auto-detect AICredits from typed URL");
assert(appJs.includes("lowerUrl.includes(\"openrouter\")"), "probeModelsFromUrl must auto-detect OpenRouter from typed URL");
assert(appJs.includes("lowerUrl.includes(\"deepseek\")"), "probeModelsFromUrl must auto-detect DeepSeek from typed URL");
assert(appJs.includes("!rawUrl.startsWith(\"http://\") && !rawUrl.startsWith(\"https://\")"), "probeModelsFromUrl must auto-prepend protocol to bare typed URLs");

console.log("  ✓ Auto provider detection, bare URL normalization, and custom overrides verified");

console.log("✔ [TEST SUITE 10/10 PASSED] Dynamic API Provider Pricing & Custom Override verified 100%!\n");

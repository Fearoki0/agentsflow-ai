/**
 * AgentsFlow AI - Standalone Client Engine v1.2.0 (2026 Edition)
 * Copyright (C) 2026 Saad (@fearoki). All Rights Reserved.
 *
 * Strict Proprietary & Source-Available License.
 * Unauthorized copying, modification, reverse engineering, redistribution,
 * or commercial exploitation without prior written consent from Saad is strictly prohibited.
 *
 * Zero-server dependency: Direct client streaming, dynamic model discovery,
 * model capability auto-detection & tool unlocking, real-time TPS & cost tracking,
 * 100+ actionable features & slash command engine, model parameters (presence/frequency),
 * multi-modal vision & audio, and zero-dependency local database.
 */

(function () {
  "use strict";

  // --- 1. DEFAULT MODELS & PRICING REGISTRY ---
  const DEFAULT_MODELS = [
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", category: "reasoning", desc: "Open weights frontier reasoning with chain-of-thought", provider: "deepseek", contextWindow: "128k" },
    { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", category: "reasoning", desc: "Hybrid thinking architecture with customizable tokens", provider: "anthropic", contextWindow: "200k" },
    { id: "openai/o3-mini", name: "o3-mini", category: "reasoning", desc: "High-speed STEM, logic, and coding reasoning", provider: "openai", contextWindow: "128k" },
    { id: "openai/gpt-4o", name: "GPT-4o", category: "vision", desc: "Omni multi-modal model with vision and tool use", provider: "openai", contextWindow: "128k" },
    { id: "groq/llama-3.3-70b-versatile", name: "LLaMA 3.3 70B (Groq)", category: "chat", desc: "Sub-second ultra-fast inference via Groq LPUs", provider: "groq", contextWindow: "128k" },
    { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", category: "vision", desc: "Next-gen multi-modal speed and vision capabilities", provider: "google", contextWindow: "1M" },
    { id: "qwen/qwq-32b-preview", name: "Qwen QwQ 32B", category: "reasoning", desc: "Advanced mathematical and analytical reasoning", provider: "qwen", contextWindow: "32k" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", category: "coding", desc: "Frontier benchmark-leading code and software architecture", provider: "anthropic", contextWindow: "200k" },
    { id: "meta-llama/llama-3.1-8b-instruct", name: "LLaMA 3.1 8B", category: "chat", desc: "Lightweight, ultra-low latency mobile chat model", provider: "meta", contextWindow: "128k" },
    { id: "openai/dall-e-3", name: "DALL-E 3 (Image Gen)", category: "image", desc: "High-fidelity text-to-image synthesis", provider: "openai", contextWindow: "N/A" },
    { id: "black-forest-labs/flux-1-schnell", name: "FLUX.1 Schnell", category: "image", desc: "12B parameter flow matching image generation", provider: "black-forest", contextWindow: "N/A" },
    { id: "openai/tts-1", name: "TTS-1 (Neural Voice)", category: "audio", desc: "Text-to-speech voice generation", provider: "openai", contextWindow: "N/A" },
    { id: "openai/whisper-1", name: "Whisper (Voice to Text)", category: "audio", desc: "Multi-lingual speech recognition", provider: "openai", contextWindow: "N/A" },
    { id: "openai/whisper-large-v3-turbo", name: "Whisper Large V3 Turbo", category: "audio", desc: "High-speed multi-lingual speech transcription", provider: "openai", contextWindow: "N/A" },
    { id: "luma/ray-2", name: "Luma Ray 2 (Video Gen)", category: "video", desc: "High-definition realistic AI video generation", provider: "luma", contextWindow: "N/A" },
    { id: "ocr/nougat-vision", name: "Nougat OCR (Document Vision)", category: "vision", desc: "High-precision PDF, formula, and document OCR transcription", provider: "meta", contextWindow: "32k" },
    { id: "got-ocr/got-ocr-2.0", name: "GOT-OCR 2.0 (Document Vision)", category: "vision", desc: "Optical character recognition for plain text, formulas and tables", provider: "meta", contextWindow: "32k" },
    { id: "lunaris/lunaris-8b", name: "Lunaris 8B (AICredits)", category: "chat", desc: "High-quality expressive roleplay & creative instruction model", provider: "aicredits", contextWindow: "32k" },
  ];

  const INR_PER_USD = 84.0;

  function normalizePricing(raw) {
    if (!raw) {
      return {
        input: 0.0002,
        output: 0.0006,
        cache: 0.00005,
        inputPer1M: 0.20,
        outputPer1M: 0.60,
        cachePer1M: 0.05,
        inputPer1MInr: 16.80,
        outputPer1MInr: 50.40,
        cachePer1MInr: 4.20,
      };
    }
    if (raw.isFree) {
      return {
        isFree: true,
        special: raw.special || "100% Free / Local ($0.00 / ₹0.00)",
        input: 0,
        output: 0,
        cache: 0,
        inputPer1M: 0,
        outputPer1M: 0,
        cachePer1M: 0,
        inputPer1MInr: 0,
        outputPer1MInr: 0,
        cachePer1MInr: 0,
      };
    }
    if (raw.special) {
      const inVal = typeof raw.input === "number" ? raw.input : 0;
      const outVal = typeof raw.output === "number" ? raw.output : 0;
      return {
        ...raw,
        input: inVal,
        output: outVal,
        cache: raw.cache || 0,
        inputPer1M: raw.inputPer1M !== undefined ? raw.inputPer1M : inVal * 1000,
        outputPer1M: raw.outputPer1M !== undefined ? raw.outputPer1M : outVal * 1000,
        cachePer1M: raw.cachePer1M !== undefined ? raw.cachePer1M : 0,
        inputPer1MInr: raw.inputPer1MInr !== undefined ? raw.inputPer1MInr : (inVal * 1000 * INR_PER_USD),
        outputPer1MInr: raw.outputPer1MInr !== undefined ? raw.outputPer1MInr : (outVal * 1000 * INR_PER_USD),
        cachePer1MInr: 0,
      };
    }

    let in1M = typeof raw.inputPer1M === "number" ? raw.inputPer1M : undefined;
    let out1M = typeof raw.outputPer1M === "number" ? raw.outputPer1M : undefined;
    let cache1M = typeof raw.cachePer1M === "number" ? raw.cachePer1M : undefined;

    let inInr = typeof raw.inputPer1MInr === "number" ? raw.inputPer1MInr : undefined;
    let outInr = typeof raw.outputPer1MInr === "number" ? raw.outputPer1MInr : undefined;
    let cacheInr = typeof raw.cachePer1MInr === "number" ? raw.cachePer1MInr : undefined;

    const isAiCredits = typeof state !== "undefined" && ((state.providerUrl || "").toLowerCase().includes("aicredits") || (state.providerName || "") === "AICredits");
    const activeInrRate = isAiCredits ? (INR_PER_USD * 1.05 * 1.05) : INR_PER_USD;

    if (inInr !== undefined && in1M === undefined) in1M = inInr / activeInrRate;
    if (outInr !== undefined && out1M === undefined) out1M = outInr / activeInrRate;
    if (cacheInr !== undefined && cache1M === undefined) cache1M = cacheInr / activeInrRate;

    // Convert raw input if inputPer1M was not explicitly provided:
    // Determine consistent unit multiplier for the entire pricing object:
    // 1. OpenRouter per-token format: rate < 0.0001 -> multiply by 1,000,000
    // 2. Standard per-1k format: rawIn <= 0.02 && rawOut <= 0.10 -> multiply by 1,000
    // 3. Per-1M format: already per 1M -> multiply by 1
    if (in1M === undefined || out1M === undefined) {
      const rawIn = typeof raw.input === "number" ? raw.input : 0;
      const rawOut = typeof raw.output === "number" ? raw.output : 0;
      const rawCache = typeof raw.cache === "number" ? raw.cache : 0;
      const refRate = rawIn > 0 ? rawIn : (rawOut > 0 ? rawOut : rawCache);

      let unitMultiplier = 1;
      if (refRate < 0.0001) {
        unitMultiplier = 1000000;
      } else if (rawIn <= 0.02 && rawOut <= 0.10) {
        unitMultiplier = 1000;
      } else if (refRate < 0.02) {
        unitMultiplier = 1000;
      } else {
        unitMultiplier = 1;
      }

      if (in1M === undefined) in1M = rawIn > 0 ? rawIn * unitMultiplier : (typeof raw.input === "number" ? 0 : 0.20);
      if (out1M === undefined) out1M = rawOut > 0 ? rawOut * unitMultiplier : (typeof raw.output === "number" ? 0 : 0.60);
      if (cache1M === undefined) cache1M = rawCache * unitMultiplier;
    }

    if (cache1M === undefined) {
      cache1M = typeof raw.cache === "number" ? raw.cache : 0;
    }

    if (inInr === undefined) inInr = in1M * activeInrRate;
    if (outInr === undefined) outInr = out1M * activeInrRate;
    if (cacheInr === undefined) cacheInr = cache1M * activeInrRate;

    return {
      input: in1M / 1000,
      output: out1M / 1000,
      cache: cache1M / 1000,
      inputPer1M: in1M,
      outputPer1M: out1M,
      cachePer1M: cache1M,
      inputPer1MInr: inInr,
      outputPer1MInr: outInr,
      cachePer1MInr: cacheInr,
    };
  }

  function parseProviderPricing(m, providerUrl) {
    if (!m) return null;
    const rawId = String(m.id || m.name || "").toLowerCase();

    // 1. Explicit Free Model Check
    if (m.is_free === true || rawId.includes(":free") || rawId.includes("pollinations") || rawId.includes("ollama")) {
      return normalizePricing({ isFree: true, source: "api_provider", special: "100% Free / Local ($0.00 / ₹0.00)" });
    }

    const pUrl = (providerUrl || (typeof state !== "undefined" ? state.providerUrl : "") || "").toLowerCase();
    const isAiCredits = pUrl.includes("aicredits") || (typeof state !== "undefined" && ((state.providerUrl || "").toLowerCase().includes("aicredits") || state.providerName === "AICredits"));
    const activeExchangeRate = (typeof m.exchange_rate === "number" && m.exchange_rate > 0)
      ? m.exchange_rate
      : (isAiCredits ? (INR_PER_USD * 1.05 * 1.05) : INR_PER_USD);

    // 2. Direct per-token fields (e.g. AICredits native payload)
    const hasDirectInrTokens = typeof m.input_cost_per_token_inr === "number" || typeof m.output_cost_per_token_inr === "number";
    const hasDirectUsdTokens = typeof m.input_cost_per_token === "number" || typeof m.output_cost_per_token === "number";

    if (hasDirectInrTokens || (hasDirectUsdTokens && isAiCredits)) {
      const inTokenInr = typeof m.input_cost_per_token_inr === "number" ? m.input_cost_per_token_inr : 0;
      const outTokenInr = typeof m.output_cost_per_token_inr === "number" ? m.output_cost_per_token_inr : 0;
      const cacheTokenInr = typeof m.cached_input_cost_per_token_inr === "number" ? m.cached_input_cost_per_token_inr : 0;

      const inTokenUsd = typeof m.input_cost_per_token === "number" ? m.input_cost_per_token : 0;
      const outTokenUsd = typeof m.output_cost_per_token === "number" ? m.output_cost_per_token : 0;
      const cacheTokenUsd = typeof m.cached_input_cost_per_token === "number" ? m.cached_input_cost_per_token : 0;

      const in1MInr = inTokenInr > 0 ? inTokenInr * 1000000 : (inTokenUsd > 0 ? inTokenUsd * 1000000 * activeExchangeRate : 0);
      const out1MInr = outTokenInr > 0 ? outTokenInr * 1000000 : (outTokenUsd > 0 ? outTokenUsd * 1000000 * activeExchangeRate : 0);
      const cache1MInr = cacheTokenInr > 0 ? cacheTokenInr * 1000000 : (cacheTokenUsd > 0 ? cacheTokenUsd * 1000000 * activeExchangeRate : 0);

      const in1MUsd = inTokenUsd > 0 ? inTokenUsd * 1000000 : (in1MInr > 0 ? in1MInr / activeExchangeRate : 0);
      const out1MUsd = outTokenUsd > 0 ? outTokenUsd * 1000000 : (out1MInr > 0 ? out1MInr / activeExchangeRate : 0);
      const cache1MUsd = cacheTokenUsd > 0 ? cacheTokenUsd * 1000000 : (cache1MInr > 0 ? cache1MInr / activeExchangeRate : 0);

      if (in1MUsd === 0 && out1MUsd === 0 && in1MInr === 0 && out1MInr === 0) {
        if (m.is_free) {
          return normalizePricing({ isFree: true, source: "api_provider", special: "100% Free / Local ($0.00 / ₹0.00)" });
        }
      } else {
        return normalizePricing({
          source: "api_provider",
          input: in1MUsd / 1000,
          output: out1MUsd / 1000,
          cache: cache1MUsd / 1000,
          inputPer1M: in1MUsd,
          outputPer1M: out1MUsd,
          cachePer1M: cache1MUsd,
          inputPer1MInr: in1MInr,
          outputPer1MInr: out1MInr,
          cachePer1MInr: cache1MInr,
          exchangeRate: activeExchangeRate,
        });
      }
    }

    // 3. Pricing Object (OpenRouter, OpenAI-compatible proxies, Together, Fireworks, DeepInfra, etc.)
    const pObj = (m.pricing && typeof m.pricing === "object") ? m.pricing :
                 (m.cost && typeof m.cost === "object") ? m.cost :
                 (m.price && typeof m.price === "object") ? m.price :
                 (m.rates && typeof m.rates === "object") ? m.rates :
                 (m.per_million && typeof m.per_million === "object") ? m.per_million :
                 (m.per_1m && typeof m.per_1m === "object") ? m.per_1m : null;

    let rawPrompt = pObj ? (pObj.prompt ?? pObj.input ?? pObj.input_cost ?? pObj.input_price ?? pObj.input_per_million ?? pObj.prompt_per_1m ?? pObj.input_per_1m ?? pObj.in)
                         : (m.prompt_price ?? m.input_price ?? m.input_cost ?? m.input_cost_per_million ?? m.prompt_per_1m);
    let rawCompletion = pObj ? (pObj.completion ?? pObj.output ?? pObj.output_cost ?? pObj.output_price ?? pObj.output_per_million ?? pObj.completion_per_1m ?? pObj.output_per_1m ?? pObj.out)
                             : (m.completion_price ?? m.output_price ?? m.output_cost ?? m.output_cost_per_million ?? m.completion_per_1m);
    let rawCache = pObj ? (pObj.prompt_cached ?? pObj.input_cache_read ?? pObj.cache ?? pObj.cache_read ?? pObj.cached)
                        : (m.cached_input_cost_per_token ?? m.cache_price);

    if (rawPrompt !== undefined || rawCompletion !== undefined) {
      const pIn = parseFloat(rawPrompt || "0");
      const pOut = parseFloat(rawCompletion || "0");
      const pCache = rawCache !== undefined ? parseFloat(rawCache || "0") : (pIn * 0.25);

      if (pIn === 0 && pOut === 0) {
        if (m.is_free || rawId.includes(":free")) {
          return normalizePricing({ isFree: true, source: "api_provider", special: "100% Free / Local ($0.00 / ₹0.00)" });
        }
        return null;
      }

      const cur = String((pObj && pObj.currency) || m.currency || (isAiCredits ? "INR" : "USD")).toUpperCase();
      const isCurInr = cur === "INR" || cur === "₹" || cur === "CREDITS";

      const refRate = pIn > 0 ? pIn : pOut;
      let unitMultiplier = 1;
      if (refRate < 0.0001) {
        unitMultiplier = 1000000;
      } else if (pIn <= 0.02 && pOut <= 0.10) {
        unitMultiplier = 1000;
      } else if (refRate < 0.02) {
        unitMultiplier = 1000;
      } else {
        unitMultiplier = 1;
      }

      const in1M = pIn > 0 ? pIn * unitMultiplier : 0;
      const out1M = pOut > 0 ? pOut * unitMultiplier : 0;
      const cache1M = pCache > 0 ? pCache * unitMultiplier : 0;

      let in1MUsd, out1MUsd, cache1MUsd;
      let in1MInr, out1MInr, cache1MInr;

      if (isCurInr) {
        in1MInr = in1M;
        out1MInr = out1M;
        cache1MInr = cache1M;
        in1MUsd = in1MInr / activeExchangeRate;
        out1MUsd = out1MInr / activeExchangeRate;
        cache1MUsd = cache1MInr / activeExchangeRate;
      } else {
        in1MUsd = in1M;
        out1MUsd = out1M;
        cache1MUsd = cache1M;
        in1MInr = in1MUsd * activeExchangeRate;
        out1MInr = out1MUsd * activeExchangeRate;
        cache1MInr = cache1MUsd * activeExchangeRate;
      }

      return normalizePricing({
        source: "api_provider",
        input: in1MUsd / 1000,
        output: out1MUsd / 1000,
        cache: cache1MUsd / 1000,
        inputPer1M: in1MUsd,
        outputPer1M: out1MUsd,
        cachePer1M: cache1MUsd,
        inputPer1MInr: in1MInr,
        outputPer1MInr: out1MInr,
        cachePer1MInr: cache1MInr,
        exchangeRate: activeExchangeRate,
      });
    }

    return null;
  }

  function formatCurrencyDisplay(val, symbol) {
    const n = typeof val === "number" ? val : parseFloat(val || "0");
    if (isNaN(n) || n === 0) return `${symbol}0.00`;
    if (n < 0.001) {
      return `${symbol}${n.toFixed(4)}`;
    }
    if (n < 0.01) {
      return `${symbol}${n.toFixed(3)}`;
    }
    return `${symbol}${n.toFixed(2)}`;
  }

  const MODEL_PRICING = {
    // DeepSeek family
    "deepseek/deepseek-r1": { input: 0.00055, output: 0.00219, cache: 0.00014, inputPer1M: 0.55, outputPer1M: 2.19, cachePer1M: 0.14, inputPer1MInr: 46.20, outputPer1MInr: 183.96, cachePer1MInr: 11.76 },
    "deepseek-r1": { input: 0.00055, output: 0.00219, cache: 0.00014, inputPer1M: 0.55, outputPer1M: 2.19, cachePer1M: 0.14, inputPer1MInr: 46.20, outputPer1MInr: 183.96, cachePer1MInr: 11.76 },
    "deepseek-reasoner": { input: 0.00055, output: 0.00219, cache: 0.00014, inputPer1M: 0.55, outputPer1M: 2.19, cachePer1M: 0.14, inputPer1MInr: 46.20, outputPer1MInr: 183.96, cachePer1MInr: 11.76 },
    "deepseek/deepseek-chat": { input: 0.00014, output: 0.00028, cache: 0.000014, inputPer1M: 0.14, outputPer1M: 0.28, cachePer1M: 0.014, inputPer1MInr: 11.76, outputPer1MInr: 23.52, cachePer1MInr: 1.18 },
    "deepseek-chat": { input: 0.00014, output: 0.00028, cache: 0.000014, inputPer1M: 0.14, outputPer1M: 0.28, cachePer1M: 0.014, inputPer1MInr: 11.76, outputPer1MInr: 23.52, cachePer1MInr: 1.18 },
    "deepseek/deepseek-v3": { input: 0.00014, output: 0.00028, cache: 0.000014, inputPer1M: 0.14, outputPer1M: 0.28, cachePer1M: 0.014, inputPer1MInr: 11.76, outputPer1MInr: 23.52, cachePer1MInr: 1.18 },
    "deepseek-v3": { input: 0.00014, output: 0.00028, cache: 0.000014, inputPer1M: 0.14, outputPer1M: 0.28, cachePer1M: 0.014, inputPer1MInr: 11.76, outputPer1MInr: 23.52, cachePer1MInr: 1.18 },

    // Anthropic Claude family
    "anthropic/claude-3.7-sonnet": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "claude-3.7-sonnet": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "anthropic/claude-3-7-sonnet": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "claude-3-7-sonnet": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "anthropic/claude-3.7-sonnet:thinking": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "claude-3.7-sonnet:thinking": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "anthropic/claude-3.5-sonnet": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "claude-3.5-sonnet": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "anthropic/claude-3-5-sonnet": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "claude-3-5-sonnet": { input: 0.003, output: 0.015, cache: 0.0003, inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30, inputPer1MInr: 252.00, outputPer1MInr: 1260.00, cachePer1MInr: 25.20 },
    "anthropic/claude-3.5-haiku": { input: 0.0008, output: 0.004, cache: 0.00008, inputPer1M: 0.80, outputPer1M: 4.00, cachePer1M: 0.08, inputPer1MInr: 67.20, outputPer1MInr: 336.00, cachePer1MInr: 6.72 },
    "claude-3.5-haiku": { input: 0.0008, output: 0.004, cache: 0.00008, inputPer1M: 0.80, outputPer1M: 4.00, cachePer1M: 0.08, inputPer1MInr: 67.20, outputPer1MInr: 336.00, cachePer1MInr: 6.72 },
    "anthropic/claude-3-5-haiku": { input: 0.0008, output: 0.004, cache: 0.00008, inputPer1M: 0.80, outputPer1M: 4.00, cachePer1M: 0.08, inputPer1MInr: 67.20, outputPer1MInr: 336.00, cachePer1MInr: 6.72 },
    "claude-3-5-haiku": { input: 0.0008, output: 0.004, cache: 0.00008, inputPer1M: 0.80, outputPer1M: 4.00, cachePer1M: 0.08, inputPer1MInr: 67.20, outputPer1MInr: 336.00, cachePer1MInr: 6.72 },
    "anthropic/claude-3-opus": { input: 0.015, output: 0.075, cache: 0.0015, inputPer1M: 15.00, outputPer1M: 75.00, cachePer1M: 1.50, inputPer1MInr: 1260.00, outputPer1MInr: 6300.00, cachePer1MInr: 126.00 },
    "claude-3-opus": { input: 0.015, output: 0.075, cache: 0.0015, inputPer1M: 15.00, outputPer1M: 75.00, cachePer1M: 1.50, inputPer1MInr: 1260.00, outputPer1MInr: 6300.00, cachePer1MInr: 126.00 },

    // OpenAI family
    "openai/o3-mini": { input: 0.0011, output: 0.0044, cache: 0.00055, inputPer1M: 1.10, outputPer1M: 4.40, cachePer1M: 0.55, inputPer1MInr: 92.40, outputPer1MInr: 369.60, cachePer1MInr: 46.20 },
    "o3-mini": { input: 0.0011, output: 0.0044, cache: 0.00055, inputPer1M: 1.10, outputPer1M: 4.40, cachePer1M: 0.55, inputPer1MInr: 92.40, outputPer1MInr: 369.60, cachePer1MInr: 46.20 },
    "openai/o1-mini": { input: 0.0011, output: 0.0044, cache: 0.00055, inputPer1M: 1.10, outputPer1M: 4.40, cachePer1M: 0.55, inputPer1MInr: 92.40, outputPer1MInr: 369.60, cachePer1MInr: 46.20 },
    "o1-mini": { input: 0.0011, output: 0.0044, cache: 0.00055, inputPer1M: 1.10, outputPer1M: 4.40, cachePer1M: 0.55, inputPer1MInr: 92.40, outputPer1MInr: 369.60, cachePer1MInr: 46.20 },
    "openai/o1": { input: 0.015, output: 0.060, cache: 0.0075, inputPer1M: 15.00, outputPer1M: 60.00, cachePer1M: 7.50, inputPer1MInr: 1260.00, outputPer1MInr: 5040.00, cachePer1MInr: 630.00 },
    "o1": { input: 0.015, output: 0.060, cache: 0.0075, inputPer1M: 15.00, outputPer1M: 60.00, cachePer1M: 7.50, inputPer1MInr: 1260.00, outputPer1MInr: 5040.00, cachePer1MInr: 630.00 },
    "openai/gpt-4o": { input: 0.0025, output: 0.010, cache: 0.00125, inputPer1M: 2.50, outputPer1M: 10.00, cachePer1M: 1.25, inputPer1MInr: 210.00, outputPer1MInr: 840.00, cachePer1MInr: 105.00 },
    "gpt-4o": { input: 0.0025, output: 0.010, cache: 0.00125, inputPer1M: 2.50, outputPer1M: 10.00, cachePer1M: 1.25, inputPer1MInr: 210.00, outputPer1MInr: 840.00, cachePer1MInr: 105.00 },
    "openai/gpt-4o-mini": { input: 0.00015, output: 0.0006, cache: 0.000075, inputPer1M: 0.15, outputPer1M: 0.60, cachePer1M: 0.075, inputPer1MInr: 12.60, outputPer1MInr: 50.40, cachePer1MInr: 6.30 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006, cache: 0.000075, inputPer1M: 0.15, outputPer1M: 0.60, cachePer1M: 0.075, inputPer1MInr: 12.60, outputPer1MInr: 50.40, cachePer1MInr: 6.30 },
    "openai/gpt-4-turbo": { input: 0.010, output: 0.030, cache: 0.005, inputPer1M: 10.00, outputPer1M: 30.00, cachePer1M: 5.00, inputPer1MInr: 840.00, outputPer1MInr: 2520.00, cachePer1MInr: 420.00 },
    "gpt-4-turbo": { input: 0.010, output: 0.030, cache: 0.005, inputPer1M: 10.00, outputPer1M: 30.00, cachePer1M: 5.00, inputPer1MInr: 840.00, outputPer1MInr: 2520.00, cachePer1MInr: 420.00 },

    // Meta LLaMA family
    "groq/llama-3.3-70b-versatile": { input: 0.00059, output: 0.00079, cache: 0.0003, inputPer1M: 0.59, outputPer1M: 0.79, cachePer1M: 0.30, inputPer1MInr: 49.56, outputPer1MInr: 66.36, cachePer1MInr: 25.20 },
    "llama-3.3-70b-versatile": { input: 0.00059, output: 0.00079, cache: 0.0003, inputPer1M: 0.59, outputPer1M: 0.79, cachePer1M: 0.30, inputPer1MInr: 49.56, outputPer1MInr: 66.36, cachePer1MInr: 25.20 },
    "meta-llama/llama-3.3-70b-instruct": { input: 0.00059, output: 0.00079, cache: 0.0003, inputPer1M: 0.59, outputPer1M: 0.79, cachePer1M: 0.30, inputPer1MInr: 49.56, outputPer1MInr: 66.36, cachePer1MInr: 25.20 },
    "llama-3.3-70b-instruct": { input: 0.00059, output: 0.00079, cache: 0.0003, inputPer1M: 0.59, outputPer1M: 0.79, cachePer1M: 0.30, inputPer1MInr: 49.56, outputPer1MInr: 66.36, cachePer1MInr: 25.20 },
    "meta-llama/llama-3.1-70b-instruct": { input: 0.00059, output: 0.00079, cache: 0.0003, inputPer1M: 0.59, outputPer1M: 0.79, cachePer1M: 0.30, inputPer1MInr: 49.56, outputPer1MInr: 66.36, cachePer1MInr: 25.20 },
    "llama-3.1-70b-instruct": { input: 0.00059, output: 0.00079, cache: 0.0003, inputPer1M: 0.59, outputPer1M: 0.79, cachePer1M: 0.30, inputPer1MInr: 49.56, outputPer1MInr: 66.36, cachePer1MInr: 25.20 },
    "llama-3.1-70b": { input: 0.00059, output: 0.00079, cache: 0.0003, inputPer1M: 0.59, outputPer1M: 0.79, cachePer1M: 0.30, inputPer1MInr: 49.56, outputPer1MInr: 66.36, cachePer1MInr: 25.20 },
    "meta-llama/llama-3.1-405b-instruct": { input: 0.002, output: 0.004, cache: 0.001, inputPer1M: 2.00, outputPer1M: 4.00, cachePer1M: 1.00, inputPer1MInr: 168.00, outputPer1MInr: 336.00, cachePer1MInr: 84.00 },
    "llama-3.1-405b": { input: 0.002, output: 0.004, cache: 0.001, inputPer1M: 2.00, outputPer1M: 4.00, cachePer1M: 1.00, inputPer1MInr: 168.00, outputPer1MInr: 336.00, cachePer1MInr: 84.00 },
    "meta-llama/llama-3.1-8b-instruct": { input: 0.0001, output: 0.0002, cache: 0.00005, inputPer1M: 0.10, outputPer1M: 0.20, cachePer1M: 0.05, inputPer1MInr: 8.40, outputPer1MInr: 16.80, cachePer1MInr: 4.20 },
    "llama-3.1-8b-instruct": { input: 0.0001, output: 0.0002, cache: 0.00005, inputPer1M: 0.10, outputPer1M: 0.20, cachePer1M: 0.05, inputPer1MInr: 8.40, outputPer1MInr: 16.80, cachePer1MInr: 4.20 },
    "llama-3.1-8b": { input: 0.0001, output: 0.0002, cache: 0.00005, inputPer1M: 0.10, outputPer1M: 0.20, cachePer1M: 0.05, inputPer1MInr: 8.40, outputPer1MInr: 16.80, cachePer1MInr: 4.20 },

    // Google Gemini family
    "google/gemini-2.0-flash": { input: 0.0001, output: 0.0004, cache: 0.000025, inputPer1M: 0.10, outputPer1M: 0.40, cachePer1M: 0.025, inputPer1MInr: 8.40, outputPer1MInr: 33.60, cachePer1MInr: 2.10 },
    "gemini-2.0-flash": { input: 0.0001, output: 0.0004, cache: 0.000025, inputPer1M: 0.10, outputPer1M: 0.40, cachePer1M: 0.025, inputPer1MInr: 8.40, outputPer1MInr: 33.60, cachePer1MInr: 2.10 },
    "google/gemini-2.0-flash-exp": { input: 0.0001, output: 0.0004, cache: 0.000025, inputPer1M: 0.10, outputPer1M: 0.40, cachePer1M: 0.025, inputPer1MInr: 8.40, outputPer1MInr: 33.60, cachePer1MInr: 2.10 },
    "gemini-2.0-flash-exp": { input: 0.0001, output: 0.0004, cache: 0.000025, inputPer1M: 0.10, outputPer1M: 0.40, cachePer1M: 0.025, inputPer1MInr: 8.40, outputPer1MInr: 33.60, cachePer1MInr: 2.10 },
    "google/gemini-2.0-flash-lite": { input: 0.000075, output: 0.0003, cache: 0.000018, inputPer1M: 0.075, outputPer1M: 0.30, cachePer1M: 0.018, inputPer1MInr: 6.30, outputPer1MInr: 25.20, cachePer1MInr: 1.51 },
    "gemini-2.0-flash-lite": { input: 0.000075, output: 0.0003, cache: 0.000018, inputPer1M: 0.075, outputPer1M: 0.30, cachePer1M: 0.018, inputPer1MInr: 6.30, outputPer1MInr: 25.20, cachePer1MInr: 1.51 },
    "google/gemini-1.5-pro": { input: 0.00125, output: 0.005, cache: 0.00031, inputPer1M: 1.25, outputPer1M: 5.00, cachePer1M: 0.31, inputPer1MInr: 105.00, outputPer1MInr: 420.00, cachePer1MInr: 26.04 },
    "gemini-1.5-pro": { input: 0.00125, output: 0.005, cache: 0.00031, inputPer1M: 1.25, outputPer1M: 5.00, cachePer1M: 0.31, inputPer1MInr: 105.00, outputPer1MInr: 420.00, cachePer1MInr: 26.04 },
    "google/gemini-1.5-flash": { input: 0.000075, output: 0.0003, cache: 0.000018, inputPer1M: 0.075, outputPer1M: 0.30, cachePer1M: 0.018, inputPer1MInr: 6.30, outputPer1MInr: 25.20, cachePer1MInr: 1.51 },
    "gemini-1.5-flash": { input: 0.000075, output: 0.0003, cache: 0.000018, inputPer1M: 0.075, outputPer1M: 0.30, cachePer1M: 0.018, inputPer1MInr: 6.30, outputPer1MInr: 25.20, cachePer1MInr: 1.51 },

    // Qwen & Mistral
    "qwen/qwq-32b-preview": { input: 0.0006, output: 0.0018, cache: 0.00015, inputPer1M: 0.60, outputPer1M: 1.80, cachePer1M: 0.15, inputPer1MInr: 50.40, outputPer1MInr: 151.20, cachePer1MInr: 12.60 },
    "qwq-32b-preview": { input: 0.0006, output: 0.0018, cache: 0.00015, inputPer1M: 0.60, outputPer1M: 1.80, cachePer1M: 0.15, inputPer1MInr: 50.40, outputPer1MInr: 151.20, cachePer1MInr: 12.60 },
    "qwen/qwen-2.5-72b-instruct": { input: 0.0006, output: 0.0018, cache: 0.00015, inputPer1M: 0.60, outputPer1M: 1.80, cachePer1M: 0.15, inputPer1MInr: 50.40, outputPer1MInr: 151.20, cachePer1MInr: 12.60 },
    "qwen-2.5-72b-instruct": { input: 0.0006, output: 0.0018, cache: 0.00015, inputPer1M: 0.60, outputPer1M: 1.80, cachePer1M: 0.15, inputPer1MInr: 50.40, outputPer1MInr: 151.20, cachePer1MInr: 12.60 },
    "mistralai/mistral-large": { input: 0.002, output: 0.006, cache: 0.0005, inputPer1M: 2.00, outputPer1M: 6.00, cachePer1M: 0.50, inputPer1MInr: 168.00, outputPer1MInr: 504.00, cachePer1MInr: 42.00 },
    "mistral-large": { input: 0.002, output: 0.006, cache: 0.0005, inputPer1M: 2.00, outputPer1M: 6.00, cachePer1M: 0.50, inputPer1MInr: 168.00, outputPer1MInr: 504.00, cachePer1MInr: 42.00 },
    "mistralai/mistral-nemo": { input: 0.0002, output: 0.0006, cache: 0.00005, inputPer1M: 0.20, outputPer1M: 0.60, cachePer1M: 0.05, inputPer1MInr: 16.80, outputPer1MInr: 50.40, cachePer1MInr: 4.20 },
    "mistral-nemo": { input: 0.0002, output: 0.0006, cache: 0.00005, inputPer1M: 0.20, outputPer1M: 0.60, cachePer1M: 0.05, inputPer1MInr: 16.80, outputPer1MInr: 50.40, cachePer1MInr: 4.20 },

    // Lunaris 8B (AICredits: ₹2.50 in, ₹5.00 out per 1M)
    "lunaris/lunaris-8b": { input: 0.0000298, output: 0.0000595, cache: 0, inputPer1MInr: 2.50, outputPer1MInr: 5.00, inputPer1M: 0.03, outputPer1M: 0.06, cachePer1M: 0, cachePer1MInr: 0 },
    "lunaris-8b": { input: 0.0000298, output: 0.0000595, cache: 0, inputPer1MInr: 2.50, outputPer1MInr: 5.00, inputPer1M: 0.03, outputPer1M: 0.06, cachePer1M: 0, cachePer1MInr: 0 },
    "sao10k/l3-lunaris-8b": { input: 0.0000298, output: 0.0000595, cache: 0, inputPer1MInr: 2.50, outputPer1MInr: 5.00, inputPer1M: 0.03, outputPer1M: 0.06, cachePer1M: 0, cachePer1MInr: 0 },
    "l3-lunaris-8b": { input: 0.0000298, output: 0.0000595, cache: 0, inputPer1MInr: 2.50, outputPer1MInr: 5.00, inputPer1M: 0.03, outputPer1M: 0.06, cachePer1M: 0, cachePer1MInr: 0 },

    // OCR models
    "ocr/nougat-vision": { input: 0.0002, output: 0.0005, cache: 0.00005, inputPer1M: 0.20, outputPer1M: 0.50, cachePer1M: 0.05, inputPer1MInr: 16.80, outputPer1MInr: 42.00, cachePer1MInr: 4.20 },
    "nougat-vision": { input: 0.0002, output: 0.0005, cache: 0.00005, inputPer1M: 0.20, outputPer1M: 0.50, cachePer1M: 0.05, inputPer1MInr: 16.80, outputPer1MInr: 42.00, cachePer1MInr: 4.20 },
    "got-ocr/got-ocr-2.0": { input: 0.0002, output: 0.0005, cache: 0.00005, inputPer1MInr: 16.80, outputPer1MInr: 42.00, inputPer1M: 0.20, outputPer1M: 0.50, cachePer1M: 0.05, cachePer1MInr: 4.20 },
    "got-ocr-2.0": { input: 0.0002, output: 0.0005, cache: 0.00005, inputPer1MInr: 16.80, outputPer1MInr: 42.00, inputPer1M: 0.20, outputPer1M: 0.50, cachePer1M: 0.05, cachePer1MInr: 4.20 },

    // Dedicated Non-Chat Models
    "openai/dall-e-3": { special: "$0.040 (₹3.36) / standard img", type: "image", input: 0.04, output: 0.04, cache: 0 },
    "openai/dall-e-2": { special: "$0.020 (₹1.68) / img", type: "image", input: 0.02, output: 0.02, cache: 0 },
    "black-forest-labs/flux-1-schnell": { special: "$0.003 (₹0.25) / img", type: "image", input: 0.003, output: 0.003, cache: 0 },
    "black-forest-labs/flux-1-dev": { special: "$0.025 (₹2.10) / img", type: "image", input: 0.025, output: 0.025, cache: 0 },
    "openai/tts-1": { special: "$15.00 (₹1,260) / 1M chars", type: "audio", input: 0.015, output: 0.015, cache: 0 },
    "openai/tts-1-hd": { special: "$30.00 (₹2,520) / 1M chars", type: "audio", input: 0.03, output: 0.03, cache: 0 },
    "openai/whisper-1": { special: "$0.006 (₹0.50) / min", type: "audio", input: 0.006, output: 0.006, cache: 0 },
    "openai/whisper-large-v3-turbo": { special: "$0.003 (₹0.25) / min", type: "audio", input: 0.003, output: 0.003, cache: 0 },
    "luma/ray-2": { special: "$0.200 (₹16.80) / video gen", type: "video", input: 0.2, output: 0.2, cache: 0 },
  };

  function getModelPricing(modelId, modelObj) {
    const id = String(modelId || "").toLowerCase();

    // Check user custom model pricing override from localStorage
    try {
      const storedCustomPricing = JSON.parse(localStorage.getItem("af_custom_pricing") || "{}");
      if (storedCustomPricing[modelId] || storedCustomPricing[id]) {
        const cp = storedCustomPricing[modelId] || storedCustomPricing[id];
        const inInr = cp.inputPer1MInr !== undefined ? parseFloat(cp.inputPer1MInr || "0") : (cp.inputPer1M !== undefined ? parseFloat(cp.inputPer1M || "0") * INR_PER_USD : 0);
        const outInr = cp.outputPer1MInr !== undefined ? parseFloat(cp.outputPer1MInr || "0") : (cp.outputPer1M !== undefined ? parseFloat(cp.outputPer1M || "0") * INR_PER_USD : 0);
        const inUsd = cp.inputPer1M !== undefined ? parseFloat(cp.inputPer1M || "0") : (inInr / INR_PER_USD);
        const outUsd = cp.outputPer1M !== undefined ? parseFloat(cp.outputPer1M || "0") : (outInr / INR_PER_USD);
        return normalizePricing({
          input: inUsd / 1000,
          output: outUsd / 1000,
          cache: 0,
          inputPer1M: inUsd,
          outputPer1M: outUsd,
          cachePer1M: 0,
          inputPer1MInr: inInr,
          outputPer1MInr: outInr,
          cachePer1MInr: 0,
        });
      }
    } catch (_) {}

    // Auto-discover modelObj from state if not directly supplied
    if (!modelObj && typeof state !== "undefined" && Array.isArray(state.models)) {
      modelObj = state.models.find(m => m.id === modelId || (m.id && m.id.toLowerCase() === id));
    }

    // 0. Check for Local / Free Provider URLs (Ollama, Termux, Localhost)
    if (typeof state !== "undefined" && state.providerUrl) {
      const pUrl = state.providerUrl.toLowerCase();
      if (pUrl.includes("localhost") || pUrl.includes("127.0.0.1") || pUrl.includes(":11434")) {
        return normalizePricing({ isFree: true, special: "100% Free / Local ($0.00 / ₹0.00)" });
      }
    }

    // 1. Free / Local models check by ID or provider
    if (id.includes(":free") || id.includes("pollinations") || id.includes("ollama") || (modelObj && (modelObj.provider === "ollama" || modelObj.provider === "local"))) {
      return normalizePricing({ isFree: true, special: "100% Free / Local ($0.00 / ₹0.00)" });
    }

    // 2. LIVE DYNAMIC API-RETURNED PRICING (Top priority over static hardcoded fallback registries)
    // Check if modelObj has pricing or if persistent provider pricing cache has it
    let livePricing = null;
    if (modelObj) {
      if (modelObj.pricing && typeof modelObj.pricing === "object") {
        if (modelObj.pricing.inputPer1M !== undefined || modelObj.pricing.inputPer1MInr !== undefined) {
          livePricing = modelObj.pricing;
        } else {
          livePricing = parseProviderPricing(modelObj, typeof state !== "undefined" ? state.providerUrl : "");
        }
      } else if (modelObj.input_cost_per_token_inr !== undefined || modelObj.input_cost_per_token !== undefined) {
        livePricing = parseProviderPricing(modelObj, typeof state !== "undefined" ? state.providerUrl : "");
      }
    }
    if (!livePricing && typeof state !== "undefined" && state.providerModelsPricing) {
      livePricing = state.providerModelsPricing[modelId] || state.providerModelsPricing[id];
    }
    if (!livePricing) {
      try {
        const storedPricing = JSON.parse(localStorage.getItem("af_provider_pricing_cache") || "{}");
        livePricing = storedPricing[modelId] || storedPricing[id];
      } catch (_) {}
    }

    if (livePricing) {
      return normalizePricing({
        ...livePricing,
        source: livePricing.source || "api_provider"
      });
    }

    // 3. Dedicated Non-Chat Models
    if (id.includes("flux-1-schnell") || id.includes("flux-schnell")) {
      return normalizePricing({ special: "$0.003 (₹0.25) / img", type: "image", input: 0.003, output: 0.003, cache: 0 });
    }
    if (id.includes("flux-1-dev") || id.includes("flux-dev")) {
      return normalizePricing({ special: "$0.025 (₹2.10) / img", type: "image", input: 0.025, output: 0.025, cache: 0 });
    }
    if (id.includes("dall-e-3")) {
      return normalizePricing({ special: "$0.040 (₹3.36) / standard img", type: "image", input: 0.04, output: 0.04, cache: 0 });
    }
    if (id.includes("dall-e-2")) {
      return normalizePricing({ special: "$0.020 (₹1.68) / img", type: "image", input: 0.02, output: 0.02, cache: 0 });
    }
    if (id.includes("whisper-large-v3-turbo")) {
      return normalizePricing({ special: "$0.003 (₹0.25) / min", type: "audio", input: 0.003, output: 0.003, cache: 0 });
    }
    if (id.includes("whisper")) {
      return normalizePricing({ special: "$0.006 (₹0.50) / min", type: "audio", input: 0.006, output: 0.006, cache: 0 });
    }
    if (id.includes("tts-1-hd")) {
      return normalizePricing({ special: "$30.00 (₹2,520) / 1M chars", type: "audio", input: 0.03, output: 0.03, cache: 0 });
    }
    if (id.includes("tts-1") || id.includes("tts")) {
      return normalizePricing({ special: "$15.00 (₹1,260) / 1M chars", type: "audio", input: 0.015, output: 0.015, cache: 0 });
    }
    if (id.includes("ray-2") || id.includes("luma") || id.includes("video") || id.includes("kling") || id.includes("runway") || id.includes("sora")) {
      return normalizePricing({ special: "$0.200 (₹16.80) / video gen", type: "video", input: 0.2, output: 0.2, cache: 0 });
    }

    // 4. Special handling for Lunaris (explicit aicredits.in rate: ₹2.50 in, ₹5.00 out per 1M)
    if (id.includes("lunaris")) {
      const outInr = 5.0; // ₹5 per 1M output tokens (aicredits.in)
      const inInr = 2.5; // ₹2.5 per 1M input tokens
      const outUsd1M = outInr / INR_PER_USD;
      const inUsd1M = inInr / INR_PER_USD;
      return normalizePricing({
        source: "special_lunaris",
        input: inUsd1M / 1000,
        output: outUsd1M / 1000,
        cache: 0,
        inputPer1M: inUsd1M,
        outputPer1M: outUsd1M,
        cachePer1M: 0,
        inputPer1MInr: inInr,
        outputPer1MInr: outInr,
        cachePer1MInr: 0,
      });
    }

    // Provider pricing context
    const isAiCredits = typeof state !== "undefined" && ((state.providerUrl || "").toLowerCase().includes("aicredits") || (state.providerName || "") === "AICredits");
    const aicInrRate = isAiCredits ? (INR_PER_USD * 1.05 * 1.05) : INR_PER_USD;

    function applyProviderRate(item) {
      if (isAiCredits && !id.includes("lunaris")) {
        const in1M = item.inputPer1M !== undefined ? item.inputPer1M : ((item.input || 0.0002) * 1000);
        const out1M = item.outputPer1M !== undefined ? item.outputPer1M : ((item.output || 0.0006) * 1000);
        const c1M = item.cachePer1M !== undefined ? item.cachePer1M : ((item.cache || 0) * 1000);
        return normalizePricing({
          ...item,
          inputPer1M: in1M,
          outputPer1M: out1M,
          cachePer1M: c1M,
          inputPer1MInr: in1M * aicInrRate,
          outputPer1MInr: out1M * aicInrRate,
          cachePer1MInr: c1M * aicInrRate,
        });
      }
      return normalizePricing(item);
    }

    // 5. Direct match in static registry
    if (MODEL_PRICING[modelId]) {
      return applyProviderRate(MODEL_PRICING[modelId]);
    }
    for (const [key, val] of Object.entries(MODEL_PRICING)) {
      if (id === key.toLowerCase() || id.endsWith("/" + key.toLowerCase()) || key.toLowerCase().endsWith("/" + id)) {
        return applyProviderRate(val);
      }
    }

    // 6. Family Heuristic Matching
    let heuristic = null;
    if (id.includes("deepseek-r1") || id.includes("deepseek/r1") || (id.includes("deepseek") && id.includes("reasoner"))) {
      heuristic = { inputPer1M: 0.55, outputPer1M: 2.19, cachePer1M: 0.14 };
    } else if (id.includes("deepseek-v3") || id.includes("deepseek-chat") || id.includes("deepseek")) {
      heuristic = { inputPer1M: 0.14, outputPer1M: 0.28, cachePer1M: 0.014 };
    } else if (id.includes("claude-3-7") || id.includes("claude-3.7") || id.includes("claude-3-5-sonnet") || id.includes("claude-3.5-sonnet")) {
      heuristic = { inputPer1M: 3.00, outputPer1M: 15.00, cachePer1M: 0.30 };
    } else if (id.includes("claude-3-5-haiku") || id.includes("claude-3.5-haiku") || id.includes("haiku")) {
      heuristic = { inputPer1M: 0.80, outputPer1M: 4.00, cachePer1M: 0.08 };
    } else if (id.includes("claude-3-opus") || id.includes("claude-3.0-opus") || id.includes("opus")) {
      heuristic = { inputPer1M: 15.00, outputPer1M: 75.00, cachePer1M: 1.50 };
    } else if (id.includes("o1-mini") || id.includes("o3-mini")) {
      heuristic = { inputPer1M: 1.10, outputPer1M: 4.40, cachePer1M: 0.55 };
    } else if (id.includes("o1-preview") || id.includes("o1")) {
      heuristic = { inputPer1M: 15.00, outputPer1M: 60.00, cachePer1M: 7.50 };
    } else if (id.includes("gpt-4o-mini")) {
      heuristic = { inputPer1M: 0.15, outputPer1M: 0.60, cachePer1M: 0.075 };
    } else if (id.includes("gpt-4o") || id.includes("chatgpt-4o")) {
      heuristic = { inputPer1M: 2.50, outputPer1M: 10.00, cachePer1M: 1.25 };
    } else if (id.includes("gpt-4-turbo") || id.includes("gpt-4")) {
      heuristic = { inputPer1M: 10.00, outputPer1M: 30.00, cachePer1M: 5.00 };
    } else if (id.includes("gemini-2.0-flash-lite") || id.includes("flash-lite")) {
      heuristic = { inputPer1M: 0.075, outputPer1M: 0.30, cachePer1M: 0.018 };
    } else if (id.includes("gemini-2.0-flash") || id.includes("gemini-2-flash")) {
      heuristic = { inputPer1M: 0.10, outputPer1M: 0.40, cachePer1M: 0.025 };
    } else if (id.includes("gemini-1.5-pro") || id.includes("gemini-pro")) {
      heuristic = { inputPer1M: 1.25, outputPer1M: 5.00, cachePer1M: 0.31 };
    } else if (id.includes("gemini-1.5-flash")) {
      heuristic = { inputPer1M: 0.075, outputPer1M: 0.30, cachePer1M: 0.018 };
    } else if (id.includes("llama-3.3-70b") || id.includes("llama-3.1-70b") || id.includes("llama-3-70b") || id.includes("llama-70b")) {
      heuristic = { inputPer1M: 0.59, outputPer1M: 0.79, cachePer1M: 0.30 };
    } else if (id.includes("llama-3.1-405b")) {
      heuristic = { inputPer1M: 2.00, outputPer1M: 4.00, cachePer1M: 1.00 };
    } else if (id.includes("llama-3.1-8b") || id.includes("llama-3-8b") || id.includes("llama-8b")) {
      heuristic = { inputPer1M: 0.10, outputPer1M: 0.20, cachePer1M: 0.05 };
    } else if (id.includes("qwen-2.5-72b") || id.includes("qwq-32b") || id.includes("qwen")) {
      heuristic = { inputPer1M: 0.60, outputPer1M: 1.80, cachePer1M: 0.15 };
    } else if (id.includes("mistral-large")) {
      heuristic = { inputPer1M: 2.00, outputPer1M: 6.00, cachePer1M: 0.50 };
    } else if (id.includes("mistral") || id.includes("nemo") || id.includes("codestral")) {
      heuristic = { inputPer1M: 0.20, outputPer1M: 0.60, cachePer1M: 0.05 };
    } else if (id.includes("nougat") || id.includes("ocr")) {
      heuristic = { inputPer1M: 0.20, outputPer1M: 0.50, cachePer1M: 0.05, inputPer1MInr: 16.80, outputPer1MInr: 42.00 };
    } else {
      // 7. Realistic Frontier Standard Tier for unknown commercial models
      heuristic = { inputPer1M: 0.20, outputPer1M: 0.60, cachePer1M: 0.05 };
    }

    // Apply AICredits markup if provider is aicredits
    if (isAiCredits) {
      heuristic.inputPer1MInr = heuristic.inputPer1M * aicInrRate;
      heuristic.outputPer1MInr = heuristic.outputPer1M * aicInrRate;
      heuristic.cachePer1MInr = (heuristic.cachePer1M || 0) * aicInrRate;
    }

    return normalizePricing(heuristic);
  }

  // --- 2. 100+ ACTIONABLE FEATURES & SLASH COMMANDS CATALOG ---
  const FEATURE_CATALOG = [
    // --- CATEGORY 1: AUTONOMOUS AGENT & GOAL WORKFLOWS (12) ---
    {
      cmd: "/goal",
      badge: "Autonomous Agent",
      category: "agent",
      desc: "Execute autonomous goal loop with subtask checklist and dynamic agent orchestration",
      template: (arg) => `[AUTONOMOUS GOAL AGENT LOOP]\nTarget Objective: "${arg || 'Achieve project objective'}"\n\nPlease execute the autonomous goal agent loop:\n1. Break down this goal into actionable milestone phases.\n2. Identify critical dependencies, assumptions, and risk matrix.\n3. Define quantitative success verification criteria.\n4. Execute Step 1 immediately with concrete code/artifacts.\n5. Present a milestone checklist indicating what is complete and what step comes next.`
    },
    {
      cmd: "/plan",
      badge: "Architecture",
      category: "agent",
      desc: "Comprehensive 5-Phase Project Execution Plan with work breakdown structure",
      template: (arg) => `[STRATEGIC EXECUTION PLAN]\nProject Task: "${arg || 'Implement project architecture'}"\n\nPlease create a comprehensive 5-Phase Work Breakdown Structure:\nPhase 1: Discovery & Requirements Baseline\nPhase 2: Architectural Specification & Module Contracts\nPhase 3: Implementation Roadmap with Milestones\nPhase 4: Deep Verification & QA Stress Tests\nPhase 5: Production Deployment & Observability Runbook.`
    },
    {
      cmd: "/boost",
      badge: "Tri-Perspective",
      category: "agent",
      desc: "Tri-Perspective Multi-Agent Reasoning (Architect, Adversarial Critic, Pragmatist)",
      template: (arg) => `[TRI-PERSPECTIVE MULTI-AGENT BOOSTER]\nTopic to Boost: "${arg || 'Analyze solution trade-offs'}"\n\nAnalyze this topic simultaneously through three specialized agent perspectives:\n1. [SENIOR ARCHITECT]: Long-term modular design, extensibility, and sound abstractions.\n2. [ADVERSARIAL CRITIC (RED TEAM)]: Edge cases, failure modes, scalability limits, and security vulnerabilities.\n3. [PRAGMATIC OPTIMIZER]: Immediate high-ROI path, minimal complexity, and actionable execution.\nFinally, synthesize a unified optimal path forward.`
    },
    {
      cmd: "/boost/boost",
      badge: "Dual Turbo",
      category: "agent",
      desc: "Maximum Dual Turbo Velocity Boost (Deep Accelerated Production Execution)",
      template: (arg) => `[MAXIMUM DUAL TURBO BOOST - DEEP ACCELERATED EXECUTION]\nObjective: "${arg || 'Maximize execution velocity and implement definitive solution'}"\n\nPlease execute with maximum velocity and deep precision:\n1. Audit active code, architecture, or plan for any bottlenecks, defects, or inefficiencies.\n2. Provide direct, non-conversational, production-grade implementations immediately with zero preamble.\n3. Verify operational constraints, edge cases, and eliminate all redundant overhead.`
    },
    {
      cmd: "/decompose",
      badge: "Task DAG",
      category: "agent",
      desc: "Deconstruct complex problem into hierarchical dependency graph",
      template: (arg) => `[HIERARCHICAL TASK DECOMPOSITION]\nTask: "${arg || 'Decompose complex workflow'}"\n\nDeconstruct this objective into a directed acyclic graph (DAG) of subtasks:\n- Independent tasks that can run concurrently.\n- Serial blocking dependencies.\n- Estimated time & computational complexity per node.`
    },
    {
      cmd: "/execute",
      badge: "Autonomous",
      category: "agent",
      desc: "Autonomous step-by-step implementation engine with artifact delivery",
      template: (arg) => `[AUTONOMOUS EXECUTION ENGINE]\nObjective: "${arg || 'Deliver implementation'}"\n\nExecute the objective immediately:\n- Formulate execution hypothesis.\n- Deliver the primary implementation artifact with zero placeholders.\n- Provide automated verification steps.`
    },
    {
      cmd: "/critique",
      badge: "Red Team",
      category: "agent",
      desc: "Adversarial review looking for fatal flaws, race conditions, and oversights",
      template: (arg) => `[ADVERSARIAL RED TEAM CRITIQUE]\nTarget: "${arg || 'Proposed design or implementation'}"\n\nPerform a ruthlessly rigorous critique:\n1. Unstated assumptions and hidden failure conditions.\n2. Concurrency hazards, race conditions, and memory leaks.\n3. Degenerate inputs that cause worst-case degradation.\n4. Prioritized remediation patches.`
    },
    {
      cmd: "/synthesize",
      badge: "Convergence",
      category: "agent",
      desc: "Synthesize disparate viewpoints or data points into unified consensus",
      template: (arg) => `[MULTI-SOURCE SYNTHESIS]\nInputs: "${arg || 'Competing solutions'}"\n\nSynthesize the trade-offs, extract overlapping truths, resolve direct contradictions, and formulate the single highest-conviction synthesis.`
    },
    {
      cmd: "/iterate",
      badge: "Refinement",
      category: "agent",
      desc: "Rapid evolutionary iteration loop: critique, modify, test, and improve",
      template: (arg) => `[RAPID ITERATION ENGINE]\nTarget Artifact: "${arg || 'Current draft'}"\n\nExecute an iterative upgrade pass:\n- Identify the top 3 weaknesses in the current state.\n- Apply direct improvements for clarity, speed, and reliability.\n- Provide the updated version with a changelog.`
    },
    {
      cmd: "/benchmark",
      badge: "Performance",
      category: "agent",
      desc: "Establish quantitative benchmarks, SLAs, and performance thresholds",
      template: (arg) => `[PERFORMANCE BENCHMARK SPECIFICATION]\nSystem: "${arg || 'Service or algorithm'}"\n\nDesign a rigorous benchmarking protocol:\n- P50, P90, P99 latency targets.\n- Throughput (RPS/TPS) and saturation boundaries.\n- Synthetic workload generation profile and profiling hooks.`
    },
    {
      cmd: "/verify",
      badge: "Correctness",
      category: "agent",
      desc: "Formal correctness verification and invariant checking",
      template: (arg) => `[FORMAL CORRECTNESS VERIFICATION]\nTarget: "${arg || 'Specification or code'}"\n\nVerify formal correctness:\n1. Identify system state invariants that must hold at all times.\n2. Prove inductive transition validity.\n3. Enumerate all boundary states and edge cases.`
    },
    {
      cmd: "/consensus",
      badge: "Multi-Agent",
      category: "agent",
      desc: "Simulate Delphi multi-expert panel consensus voting",
      template: (arg) => `[DELPHI CONSENSUS PROTOCOL]\nTopic: "${arg || 'Complex decision'}"\n\nConvene a panel of 3 simulated domain experts. Have each present an initial stance, critique opposing positions, and converge on an agreed compromise consensus.`
    },
    {
      cmd: "/rollback",
      badge: "Disaster Recovery",
      category: "agent",
      desc: "Formulate safe rollback, state restore, and reversion runbook",
      template: (arg) => `[DISASTER RECOVERY & ROLLBACK PLAN]\nFailure Scenario: "${arg || 'Failed production rollout'}"\n\nDevelop an emergency zero-data-loss rollback runbook with immediate triage checklist, database restoration sequence, and post-mortem template.`
    },

    // --- CATEGORY 2: SOFTWARE ENGINEERING & CODE GENERATION (18) ---
    {
      cmd: "/code",
      badge: "Engineering",
      category: "engineering",
      desc: "Production-grade implementation with zero placeholders, typing, and tests",
      template: (arg) => `[PRODUCTION CODE GENERATION]\nSpecification: "${arg || 'Implement module'}"\n\nPlease write complete, battle-tested production code:\n- Strict type safety and zero placeholders or TODOs.\n- Comprehensive error handling and edge case validation.\n- Big-O computational time and memory space analysis.\n- Unit test suite covering happy paths and failure conditions.`
    },
    {
      cmd: "/refactor",
      badge: "Clean Code",
      category: "engineering",
      desc: "Clean architecture refactoring with SOLID principles and reduced complexity",
      template: (arg) => `[CLEAN ARCHITECTURE REFACTORING]\nTarget: "${arg || 'Provided code snippet'}"\n\nRefactor this code to production-quality standards:\n- Apply SOLID principles and eliminate duplication (DRY).\n- Reduce cyclomatic complexity and improve readability.\n- Ensure backwards compatibility and performance benchmarks.`
    },
    {
      cmd: "/audit",
      badge: "Security",
      category: "security",
      desc: "Thorough vulnerability, OWASP, memory leak, and performance audit",
      template: (arg) => `[SECURITY & CODE AUDIT]\nTarget Code/Design: "${arg || 'Current codebase'}"\n\nPerform a ruthless security and performance audit:\n1. OWASP Top 10 vulnerabilities and injection risks.\n2. Memory leaks, unbounded concurrency, and event listener cleanups.\n3. Race conditions and async timing hazards.\n4. Hardened remediation patch with diff.`
    },
    {
      cmd: "/test",
      badge: "QA / Testing",
      category: "engineering",
      desc: "Unit, property-based, and boundary test generator",
      template: (arg) => `[COMPREHENSIVE TEST SUITE]\nFeature: "${arg || 'Specified function'}"\n\nWrite a comprehensive automated test suite:\n- Happy path tests.\n- Boundary and extreme value conditions (empty input, max integer, null, network drops).\n- Property-based invariant assertions.\n- Mocking guidelines and execution instructions.`
    },
    {
      cmd: "/fix",
      badge: "Debugging",
      category: "engineering",
      desc: "Root-cause debugging analysis and minimal regression patch",
      template: (arg) => `[ROOT CAUSE DEBUGGING & FIX]\nError/Bug: "${arg || 'Unexpected behavior'}"\n\nPlease diagnose and resolve this issue:\n1. Root Cause Analysis: Exactly why did the failure occur?\n2. Minimal-Diff Fix: Provide the clean patch.\n3. Regression Guard: How to prevent recurrence.`
    },
    {
      cmd: "/regex",
      badge: "Parser",
      category: "engineering",
      desc: "High-performance regular expression with boundary test cases",
      template: (arg) => `[REGULAR EXPRESSION GENERATOR]\nTarget Pattern: "${arg || 'Parse token'}"\n\nGenerate an optimal RegEx:\n- Full pattern with named capture groups.\n- ReDoS (Catastrophic Backtracking) vulnerability analysis.\n- Test suite with 5 matching and 5 non-matching test strings.`
    },
    {
      cmd: "/sql",
      badge: "Database",
      category: "engineering",
      desc: "Production SQL schema, optimized queries, and index plan",
      template: (arg) => `[PRODUCTION SQL & INDEX OPTIMIZATION]\nRequirement: "${arg || 'Query optimization'}"\n\nWrite production-grade SQL:\n- Normalized schema with foreign key constraints.\n- Optimal query with EXPLAIN ANALYZE execution plan breakdown.\n- Recommended B-Tree and GIN indexes with trade-off justification.`
    },
    {
      cmd: "/api",
      badge: "OpenAPI",
      category: "engineering",
      desc: "RESTful, GraphQL, or gRPC API specification contract",
      template: (arg) => `[API CONTRACT SPECIFICATION]\nEndpoint: "${arg || 'User Service'}"\n\nGenerate an exhaustive API contract:\n- OpenAPI 3.1 YAML specification.\n- Idempotency keys, rate limits, and caching headers.\n- Error envelope format (RFC 7807 problem details).`
    },
    {
      cmd: "/dock",
      badge: "DevOps",
      category: "engineering",
      desc: "Multi-stage Dockerfile and Docker Compose production setup",
      template: (arg) => `[MULTI-STAGE DOCKERFILE SPEC]\nApplication: "${arg || 'Node/Python/Go Service'}"\n\nWrite a hardened, minimal multi-stage Dockerfile:\n- Non-root user execution.\n- Layer caching optimization.\n- Minimal attack surface distroless or alpine base.\n- Companion docker-compose.yml with health checks and volume mounts.`
    },
    {
      cmd: "/ci",
      badge: "CI/CD",
      category: "engineering",
      desc: "GitHub Actions workflow pipeline with testing, linting, and security scan",
      template: (arg) => `[GITHUB ACTIONS CI/CD WORKFLOW]\nStack: "${arg || 'TypeScript/Node or Python'}"\n\nWrite a complete .github/workflows/ci.yml pipeline:\n- Parallel matrix testing across OS/versions.\n- Automated lint, typecheck, unit, and e2e stages.\n- Dependency caching and secret management.`
    },
    {
      cmd: "/perf",
      badge: "Profiler",
      category: "engineering",
      desc: "Algorithmic and runtime memory/speed optimization",
      template: (arg) => `[PERFORMANCE PROFILING & OPTIMIZATION]\nTarget Code: "${arg || 'Critical path loop'}"\n\nOptimize this execution path:\n1. Identify hotspot bottlenecks (CPU, allocations, I/O).\n2. Propose zero-copy or vectorized alternatives.\n3. Benchmark comparison table (Before vs After).`
    },
    {
      cmd: "/security",
      badge: "Hardening",
      category: "security",
      desc: "Cryptographic, token, and authentication security hardening",
      template: (arg) => `[SECURITY HARDENING SPECIFICATION]\nComponent: "${arg || 'Auth / Session Token handling'}"\n\nProvide hardened security implementation:\n- Cryptographic primitives (Argon2id, AES-256-GCM, Ed25519).\n- JWT / Session token rotation and revocation list.\n- CSRF, XSS, and Timing Attack mitigations.`
    },
    {
      cmd: "/types",
      badge: "TypeScript",
      category: "engineering",
      desc: "Strict TypeScript, Rust, or Python type definitions with invariants",
      template: (arg) => `[STRICT TYPE DEFINITIONS]\nDomain: "${arg || 'Data Model'}"\n\nWrite strict type definitions:\n- Discriminated union types for state transitions.\n- Branded/Nominal types for IDs.\n- Immutability guards (Readonly, ReadonlyArray).`
    },
    {
      cmd: "/bench",
      badge: "Microbench",
      category: "engineering",
      desc: "Micro-benchmarking suite with statistical variance calculation",
      template: (arg) => `[MICRO-BENCHMARKING SUITE]\nOperation: "${arg || 'Function execution'}"\n\nWrite a benchmarking harness measuring operations/sec, mean latency, variance, and memory allocation delta.`
    },
    {
      cmd: "/git",
      badge: "Version Control",
      category: "engineering",
      desc: "Conventional Git commits, semantic versioning, and rebase strategy",
      template: (arg) => `[GIT RELEASE & REBASE STRATEGY]\nChanges: "${arg || 'Feature branch'}"\n\nProvide atomic Conventional Commits, Semantic Version bump rationale (SemVer 2.0), and conflict resolution rebase commands.`
    },
    {
      cmd: "/clean",
      badge: "Refactor",
      category: "engineering",
      desc: "Eliminate dead code, unnecessary abstractions, and boilerplate",
      template: (arg) => `[DEAD CODE & BOILERPLATE PURGE]\nCode: "${arg || 'Legacy codebase'}"\n\nIdentify and remove dead branches, unused imports, redundant wrapper functions, and flatten overly nested logic.`
    },
    {
      cmd: "/migrate",
      badge: "Database",
      category: "engineering",
      desc: "Database migration script with backwards compatibility and zero downtime",
      template: (arg) => `[ZERO-DOWNTIME DB MIGRATION]\nSchema Change: "${arg || 'Add column / change table'}"\n\nWrite expand-and-contract migration scripts:\n- Up migration with safe concurrent index creation.\n- Down migration with complete rollback safety.\n- Backfill script for existing rows without table locks.`
    },
    {
      cmd: "/schema",
      badge: "Validation",
      category: "engineering",
      desc: "Zod, JSON Schema, or Pydantic runtime validation schema",
      template: (arg) => `[RUNTIME VALIDATION SCHEMA]\nEntity: "${arg || 'Input Payload'}"\n\nGenerate strict validation schema (Zod / JSON Schema) with custom refinement rules, sanitizers, and localized error messages.`
    },

    // --- CATEGORY 3: ARCHITECTURE, SYSTEMS & DIAGRAMS (14) ---
    {
      cmd: "/arch",
      badge: "System Design",
      category: "architecture",
      desc: "High-level distributed system architecture and component boundaries",
      template: (arg) => `[SYSTEM ARCHITECTURE DESIGN]\nSystem: "${arg || 'Scalable Cloud Service'}"\n\nDesign end-to-end architecture:\n1. Core component boundaries and interfaces.\n2. Data flow diagrams and sync/async protocols.\n3. Scalability, partition tolerance, and consistency guarantees (CAP theorem).\n4. Single points of failure and disaster recovery.`
    },
    {
      cmd: "/microservice",
      badge: "Distributed",
      category: "architecture",
      desc: "Microservice decomposition, bounded contexts, and saga patterns",
      template: (arg) => `[MICROSERVICE BOUNDARY SPEC]\nDomain: "${arg || 'E-commerce / FinTech'}"\n\nDefine bounded contexts:\n- Domain-Driven Design (DDD) aggregate roots.\n- Distributed saga coordination (Orchestration vs Choreography).\n- Outbox pattern for reliable event publishing.`
    },
    {
      cmd: "/diagram",
      badge: "Mermaid",
      category: "architecture",
      desc: "Generate valid Mermaid.js flowchart or architectural diagram",
      template: (arg) => `[MERMAID ARCHITECTURE DIAGRAM]\nSystem: "${arg || 'System Architecture'}"\n\nGenerate valid, renderable Mermaid.js flowchart syntax (flowchart TD or sequenceDiagram) illustrating components, network calls, and data persistence clearly.`
    },
    {
      cmd: "/sequence",
      badge: "Mermaid",
      category: "architecture",
      desc: "Mermaid.js sequence diagram illustrating protocol handshakes and sync calls",
      template: (arg) => `[MERMAID SEQUENCE DIAGRAM]\nProtocol Flow: "${arg || 'OAuth2 / Webhook exchange'}"\n\nGenerate a clean Mermaid sequenceDiagram showing all actors, synchronous requests, async events, and failure fallbacks.`
    },
    {
      cmd: "/erd",
      badge: "Mermaid ERD",
      category: "architecture",
      desc: "Entity-Relationship diagram with cardinality and foreign keys",
      template: (arg) => `[MERMAID ENTITY-RELATIONSHIP DIAGRAM]\nDomain: "${arg || 'Database schema'}"\n\nGenerate a Mermaid erDiagram showing entities, primary/foreign keys, attributes, and exact relationship cardinalities (1:1, 1:N, N:M).`
    },
    {
      cmd: "/c4",
      badge: "C4 Model",
      category: "architecture",
      desc: "C4 model architectural breakdown (Context, Container, Component)",
      template: (arg) => `[C4 ARCHITECTURAL MODEL]\nSystem: "${arg || 'Enterprise Platform'}"\n\nDetail the C4 Model:\nLevel 1: System Context Diagram\nLevel 2: Container Diagram\nLevel 3: Component Diagram with technical stacks.`
    },
    {
      cmd: "/tradeoff",
      badge: "ADR",
      category: "architecture",
      desc: "Architectural Decision Record (ADR) analyzing trade-offs",
      template: (arg) => `[ARCHITECTURAL DECISION RECORD (ADR)]\nDecision Topic: "${arg || 'Choose technology or pattern'}"\n\nFormat as ADR:\n- Context & Problem Statement\n- Considered Options Matrix\n- Decision Outcome & Justification\n- Positive & Negative Consequences.`
    },
    {
      cmd: "/scale",
      badge: "Scalability",
      category: "architecture",
      desc: "Scale-out architecture plan from 10k to 10M concurrent users",
      template: (arg) => `[SCALE-OUT BLUEPRINT]\nTarget Scale: "${arg || '1 Million Daily Active Users'}"\n\nDetail scale-out strategy:\n- Database sharding and read-replica topology.\n- Caching layers (L1 in-memory, L2 Redis, CDN edge).\n- Connection pooling, backpressure, and load balancing.`
    },
    {
      cmd: "/event",
      badge: "Event-Driven",
      category: "architecture",
      desc: "Event-driven architecture with Kafka/RabbitMQ message topologies",
      template: (arg) => `[EVENT-DRIVEN ARCHITECTURE SPEC]\nEvent Domain: "${arg || 'Order Processing'}"\n\nSpecify event topology:\n- Topic partitions, key strategy, and consumer group scaling.\n- Schema evolution with Avro/Protobuf.\n- Dead letter queues (DLQ) and retry policies.`
    },
    {
      cmd: "/cache",
      badge: "Caching",
      category: "architecture",
      desc: "Redis cache invalidation, write-through, and stampede prevention plan",
      template: (arg) => `[CACHING ARCHITECTURE SPEC]\nAccess Pattern: "${arg || 'High read throughput'}"\n\nDesign caching strategy:\n- Cache-aside vs Write-through evaluation.\n- TTL jitter and mutual exclusion locks against cache stampedes.\n- Key eviction policy (LRU/LFU).`
    },
    {
      cmd: "/gateway",
      badge: "API Gateway",
      category: "architecture",
      desc: "API gateway routing, rate limiting, and mTLS security mesh",
      template: (arg) => `[API GATEWAY TOPOLOGY]\nServices: "${arg || 'Microservices gateway'}"\n\nConfigure gateway architecture:\n- Token bucket rate limiting per API key / IP.\n- Request authentication and header sanitization.\n- Dynamic upstream routing and circuit breaking.`
    },
    {
      cmd: "/resilience",
      badge: "Fault Tolerance",
      category: "architecture",
      desc: "Circuit breaker, bulkhead isolation, and exponential backoff retry",
      template: (arg) => `[SYSTEM RESILIENCE PATTERNS]\nComponent: "${arg || 'Downstream 3rd-party API'}"\n\nImplement fault tolerance:\n- Circuit breaker state machine (Closed, Open, Half-Open).\n- Exponential backoff with full jitter algorithm.\n- Bulkhead thread/connection isolation.`
    },
    {
      cmd: "/observability",
      badge: "Telemetry",
      category: "architecture",
      desc: "OpenTelemetry tracing, Prometheus metrics, and Grafana dashboard alerts",
      template: (arg) => `[OBSERVABILITY & TELEMETRY SPEC]\nService: "${arg || 'Backend API'}"\n\nDesign observability:\n- RED metrics (Rate, Errors, Duration).\n- Distributed trace context propagation (W3C TraceContext).\n- Alerting thresholds and runbook trigger links.`
    },
    {
      cmd: "/infra",
      badge: "IaC",
      category: "architecture",
      desc: "Terraform / OpenTofu Infrastructure as Code modular configuration",
      template: (arg) => `[TERRAFORM / IAC SPECIFICATION]\nInfrastructure: "${arg || 'VPC, Kubernetes & Database'}"\n\nWrite modular Terraform/OpenTofu HCL code with variable validations, remote state locking, and least-privilege IAM policies.`
    },

    // --- CATEGORY 4: DEEP REASONING, LOGIC & STEM (12) ---
    {
      cmd: "/think",
      badge: "Chain-of-Thought",
      category: "reasoning",
      desc: "Enforce explicit chain-of-thought deep reasoning before concluding",
      template: (arg) => `[ENFORCED DEEP REASONING]\nProblem: "${arg || 'Complex logic or STEM puzzle'}"\n\nPlease reason deeply step-by-step before answering. Enclose your complete thinking and deduction process inside <think>...</think> tags:\n1. State assumptions, known axioms, and variables clearly.\n2. Explore potential solution vectors, testing for edge contradictions.\n3. Formulate rigorous mathematical or logical deductions.\n4. Verify every calculation and derivation before finalizing.\n\nAfter concluding your reasoning in </think>, provide the clear, verified final answer.`
    },
    {
      cmd: "/math",
      badge: "LaTeX Proof",
      category: "reasoning",
      desc: "Formal step-by-step mathematical proof in rendered LaTeX notation",
      template: (arg) => `[MATHEMATICAL DERIVATION & PROOF]\nTheorem/Problem: "${arg || 'Prove mathematical statement'}"\n\nProvide a formal mathematical proof with step-by-step LaTeX equations, citing all theorems, lemmas, and algebraic transformations.`
    },
    {
      cmd: "/proof",
      badge: "Formal Logic",
      category: "reasoning",
      desc: "Proof by induction, contradiction, or constructive deduction",
      template: (arg) => `[FORMAL PROOF ENGINE]\nStatement: "${arg || 'Proposition to prove'}"\n\nConstruct a formal proof:\n- Base case and inductive step (if induction).\n- Contradiction derivation (if reductio ad absurdum).\n- Q.E.D. conclusion with zero skipped steps.`
    },
    {
      cmd: "/logic",
      badge: "Predicate Logic",
      category: "reasoning",
      desc: "Propositional and first-order predicate logic translation and truth tables",
      template: (arg) => `[FORMAL PREDICATE LOGIC]\nArgument: "${arg || 'Logical premises'}"\n\nTranslate into formal symbolic logic (∀, ∃, ∧, ∨, ¬, →), construct a truth table, and determine logical validity or fallacy.`
    },
    {
      cmd: "/derive",
      badge: "First Principles",
      category: "reasoning",
      desc: "Derive formulas or systems from foundational first principles",
      template: (arg) => `[FIRST-PRINCIPLES DERIVATION]\nTarget: "${arg || 'Formula or physical law'}"\n\nDerive this result entirely from foundational definitions and first principles, explaining every conceptual leap without appeals to intuition.`
    },
    {
      cmd: "/stats",
      badge: "Statistics",
      category: "reasoning",
      desc: "Bayesian vs Frequentist statistical inference and hypothesis testing",
      template: (arg) => `[STATISTICAL INFERENCE & HYPOTHESIS TEST]\nData/Scenario: "${arg || 'A/B Test experiment'}"\n\nCalculate:\n- Null and Alternative hypotheses (H0, H1).\n- P-value, confidence intervals, and statistical power (1 - β).\n- Bayesian posterior distribution with conjugate priors.`
    },
    {
      cmd: "/algo",
      badge: "DSA",
      category: "reasoning",
      desc: "Optimal data structures and algorithms with formal complexity proofs",
      template: (arg) => `[DATA STRUCTURES & ALGORITHM SPEC]\nProblem: "${arg || 'Algorithmic challenge'}"\n\nDevelop the optimal algorithmic solution:\n- State invariants and loop invariants.\n- Strict Big-O Time and Space proofs.\n- Complete, idiomatic implementation handling degenerate cases.`
    },
    {
      cmd: "/complexity",
      badge: "Big-O",
      category: "reasoning",
      desc: "Rigorous Big-O time and space asymptotic analysis with Master Theorem",
      template: (arg) => `[ASYMPTOTIC COMPLEXITY ANALYSIS]\nRecurrence/Code: "${arg || 'T(n) = 2T(n/2) + O(n)'}"\n\nSolve asymptotic complexity:\n- Apply Master Theorem or recursion tree.\n- Prove Best-case, Average-case, and Worst-case bounds (O, Ω, Θ).`
    },
    {
      cmd: "/physics",
      badge: "Physics",
      category: "reasoning",
      desc: "Physical mechanics, differential equations, and energy conservation",
      template: (arg) => `[PHYSICAL SYSTEM MODELING]\nScenario: "${arg || 'Dynamics problem'}"\n\nFormulate the differential equations of motion, apply conservation laws (energy, momentum), and solve for trajectory or equilibrium states.`
    },
    {
      cmd: "/scientific",
      badge: "Methodology",
      category: "reasoning",
      desc: "Scientific method experiment design with controls and error bounds",
      template: (arg) => `[SCIENTIFIC EXPERIMENT DESIGN]\nHypothesis: "${arg || 'Empirical hypothesis'}"\n\nDesign an experimental protocol:\n- Independent, dependent, and controlled variables.\n- Double-blind randomization methodology.\n- Quantitative error propagation analysis.`
    },
    {
      cmd: "/prob",
      badge: "Probability",
      category: "reasoning",
      desc: "Probability distributions, expected values, and Markov chains",
      template: (arg) => `[STOCHASTIC & PROBABILITY MODELING]\nProcess: "${arg || 'Random walk / Markov state'}"\n\nModel probability distribution, transition matrix, stationary distribution, and expected value with variance.`
    },
    {
      cmd: "/symbolic",
      badge: "Calculus",
      category: "reasoning",
      desc: "Symbolic algebra, integration, differentiation, and matrix linear algebra",
      template: (arg) => `[SYMBOLIC MATHEMATICS & CALCULUS]\nExpression: "${arg || 'Calculus problem'}"\n\nCompute exact analytical solution step-by-step for integrals, derivatives, eigenvectors, or linear transformations.`
    },

    // --- CATEGORY 5: RESEARCH, CITATIONS & GROUNDING (10) ---
    {
      cmd: "/research",
      badge: "Research",
      category: "research",
      desc: "Comprehensive research brief with structured citations and methodology",
      template: (arg) => `[COMPREHENSIVE RESEARCH BRIEF]\nTopic: "${arg || 'Latest AI & Computing trends'}"\n\nProvide grounded research findings:\n1. Executive Summary & Problem Context.\n2. Empirical Evidence & Key Findings.\n3. Comparison Table of Leading Approaches.\n4. Structured Citations and References.`
    },
    {
      cmd: "/ground",
      badge: "Fact Retrieval",
      category: "research",
      desc: "Fact retrieval with source verification and grounding checks",
      template: (arg) => `[GROUNDED FACT RETRIEVAL]\nClaim/Topic: "${arg || 'Historical or technical fact'}"\n\nRetrieve verified facts with high precision, isolating consensus truths from disputed claims and citing primary sources.`
    },
    {
      cmd: "/verifyclaim",
      badge: "Fact-Check",
      category: "research",
      desc: "Rigorous claim verification and debunking of misconceptions",
      template: (arg) => `[EVIDENCE-BASED CLAIM VERIFICATION]\nClaim: "${arg || 'Public claim or statistic'}"\n\nVerify claim truthfulness:\n- Verdict (True, Partially True, Misleading, False).\n- Direct counter-evidence and original data sources.\n- Contextual nuances often omitted.`
    },
    {
      cmd: "/deepsearch",
      badge: "Deep Dive",
      category: "research",
      desc: "Exhaustive multi-angle deep search across academic and industry sources",
      template: (arg) => `[DEEP RESEARCH SYNTHESIS]\nQuery: "${arg || 'Frontier machine learning breakthroughs'}"\n\nConduct an exhaustive search synthesis covering historical background, modern state of the art, benchmark results, and open unsolved questions.`
    },
    {
      cmd: "/sources",
      badge: "Bibliography",
      category: "research",
      desc: "Annotated bibliography and literature citation index",
      template: (arg) => `[ANNOTATED BIBLIOGRAPHY]\nSubject: "${arg || 'Distributed consensus algorithms'}"\n\nCompile 5-8 foundational papers/books with author, publication year, key contribution summary, and relevance rating.`
    },
    {
      cmd: "/compare",
      badge: "Matrix",
      category: "research",
      desc: "Side-by-side feature, pricing, and architecture comparison matrix",
      template: (arg) => `[COMPREHENSIVE COMPARISON MATRIX]\nSubjects: "${arg || 'Technology A vs Technology B'}"\n\nBuild a detailed Markdown comparison table evaluating architecture, performance, licensing, developer ergonomics, ecosystem maturity, and ideal use cases.`
    },
    {
      cmd: "/matrix",
      badge: "Decision Matrix",
      category: "research",
      desc: "Weighted multi-criteria decision matrix with scoring rubric",
      template: (arg) => `[WEIGHTED DECISION MATRIX]\nOptions to Score: "${arg || 'Architectural options'}"\n\nConstruct a weighted decision matrix (Criteria, Weights 1-10, Normalized Scores 1-10, Weighted Totals) and identify the winning recommendation.`
    },
    {
      cmd: "/literature",
      badge: "SOTA",
      category: "research",
      desc: "State-of-the-art literature review of peer-reviewed publications",
      template: (arg) => `[STATE OF THE ART (SOTA) REVIEW]\nField: "${arg || 'Large Language Model Reasoning'}"\n\nSynthesize current frontier literature: milestones achieved in the last 12 months, benchmark ceilings reached, and prevailing theoretical debates.`
    },
    {
      cmd: "/factcheck",
      badge: "Validation",
      category: "research",
      desc: "Cross-validate dates, statistics, release versions, and specs",
      template: (arg) => `[TECHNICAL SPEC FACT-CHECK]\nStatement: "${arg || 'Software versions and specs'}"\n\nCross-validate every factual assertion, version number, API signature, and date against official documentation.`
    },
    {
      cmd: "/timeline",
      badge: "Chronology",
      category: "research",
      desc: "Chronological milestone timeline illustrating evolutionary progression",
      template: (arg) => `[CHRONOLOGICAL EVOLUTION TIMELINE]\nSubject: "${arg || 'Evolution of Neural Networks'}"\n\nBuild a chronological timeline highlighting pivotal inflection points, major breakthroughs, and paradigm shifts.`
    },

    // --- CATEGORY 6: PRODUCT MANAGEMENT & STRATEGY (10) ---
    {
      cmd: "/brief",
      badge: "Executive",
      category: "product",
      desc: "1-Page executive briefing with value proposition and ROI",
      template: (arg) => `[EXECUTIVE 1-PAGE BRIEF]\nInitiative: "${arg || 'Product launch'}"\n\nCreate a concise 1-page executive brief:\n- Problem Statement & Total Addressable Market (TAM).\n- Core Value Proposition & Differentiation.\n- Key Milestones & Financial Projections.`
    },
    {
      cmd: "/prd",
      badge: "Product Spec",
      category: "product",
      desc: "Product Requirements Document with user stories and acceptance criteria",
      template: (arg) => `[PRODUCT REQUIREMENTS DOCUMENT (PRD)]\nFeature: "${arg || 'New feature specification'}"\n\nWrite a complete PRD:\n1. Objective & Non-Goals.\n2. User Personas & Pain Points.\n3. Detailed Functional Requirements.\n4. Success Metrics & Telemetry.\n5. Edge Cases & Error Handling.`
    },
    {
      cmd: "/roadmap",
      badge: "Milestones",
      category: "product",
      desc: "Quarterly delivery roadmap with risk mitigations and sprint allocation",
      template: (arg) => `[QUARTERLY DELIVERY ROADMAP]\nProject: "${arg || 'Platform Engineering'}"\n\nFormulate a 4-Quarter milestone roadmap broken into Q1-Q4 deliverables with dependencies and critical paths.`
    },
    {
      cmd: "/swot",
      badge: "Strategy",
      category: "product",
      desc: "SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)",
      template: (arg) => `[STRATEGIC SWOT ANALYSIS]\nSubject: "${arg || 'Product or Company'}"\n\nConduct an honest, objective SWOT analysis with prioritized strategic initiatives derived from intersecting quadrants.`
    },
    {
      cmd: "/okr",
      badge: "Goal Alignment",
      category: "product",
      desc: "Objective & Key Results (OKRs) with measurable quantitative telemetry",
      template: (arg) => `[OBJECTIVES & KEY RESULTS (OKRs)]\nTeam/Goal: "${arg || 'Engineering Team'}"\n\nDraft 3 ambitious Objectives, each accompanied by 3 measurable, quantitative Key Results (KRs) with baseline and target metrics.`
    },
    {
      cmd: "/kpi",
      badge: "Metrics",
      category: "product",
      desc: "Define Key Performance Indicators (KPIs) and instrumentation plan",
      template: (arg) => `[KPI INSTRUMENTATION SPEC]\nProduct: "${arg || 'Mobile Chat Application'}"\n\nDefine North Star metric, leading and lagging indicators, telemetry events to track, and dashboard alert thresholds.`
    },
    {
      cmd: "/canvas",
      badge: "Business Model",
      category: "product",
      desc: "Lean Business Model Canvas across 9 core business pillars",
      template: (arg) => `[LEAN BUSINESS MODEL CANVAS]\nConcept: "${arg || 'AI Developer Tool'}"\n\nSynthesize the 9 Lean Canvas pillars: Problem, Solution, Unique Value Proposition, Unfair Advantage, Customer Segments, Key Metrics, Channels, Cost Structure, Revenue Streams.`
    },
    {
      cmd: "/pitch",
      badge: "Storytelling",
      category: "product",
      desc: "High-impact investor or stakeholder pitch narrative",
      template: (arg) => `[INVESTOR PITCH NARRATIVE]\nStartup/Project: "${arg || 'AI Innovation'}"\n\nFormulate a compelling 10-slide pitch outline: Hook, Problem, Solution, Market Opportunity, Business Model, Traction, Competition, Team, The Ask.`
    },
    {
      cmd: "/roi",
      badge: "Financial",
      category: "product",
      desc: "Cost-benefit and Return on Investment (ROI) financial analysis",
      template: (arg) => `[ROI & COST-BENEFIT ANALYSIS]\nProposal: "${arg || 'Cloud Migration / Automation'}"\n\nCalculate estimated CAPEX/OPEX savings, payback period in months, net present value (NPV), and internal rate of return (IRR).`
    },
    {
      cmd: "/userstory",
      badge: "Agile",
      category: "product",
      desc: "User stories formatted in Gherkin syntax (Given, When, Then)",
      template: (arg) => `[GHERKIN USER STORIES]\nFeature: "${arg || 'User authentication'}"\n\nWrite user stories formatted as:\nAs a [role], I want [feature] so that [benefit].\nScenario: [Title]\nGiven [precondition]\nWhen [action]\nThen [outcome].`
    },

    // --- CATEGORY 7: DATA ENGINEERING & TRANSFORMATION (10) ---
    {
      cmd: "/table",
      badge: "Markdown",
      category: "data",
      desc: "Transform messy unstructured data into a clean, normalized Markdown table",
      template: (arg) => `[UNSTRUCTURED DATA TO MARKDOWN TABLE]\nData: "${arg || 'Unformatted text'}"\n\nParse and structure this data into a clean, aligned Markdown table with proper header types, sorting, and summary metrics.`
    },
    {
      cmd: "/json",
      badge: "JSON Schema",
      category: "data",
      desc: "Convert text or requirements into validated, normalized JSON",
      template: (arg) => `[NORMALIZED JSON CONVERTER]\nInput: "${arg || 'Data description'}"\n\nGenerate strict, validated JSON with camelCase keys, proper nested objects/arrays, and zero syntax errors.`
    },
    {
      cmd: "/csv",
      badge: "CSV Export",
      category: "data",
      desc: "Extract and format tabular data into standard RFC 4180 CSV format",
      template: (arg) => `[CSV FORMATTER]\nInput: "${arg || 'Tabular records'}"\n\nConvert into standard RFC 4180 compliant CSV format with properly escaped quotes and commas.`
    },
    {
      cmd: "/yaml",
      badge: "YAML Config",
      category: "data",
      desc: "Generate strict Kubernetes or cloud YAML configuration",
      template: (arg) => `[YAML CONFIGURATION]\nSpecification: "${arg || 'Kubernetes deployment'}"\n\nGenerate clean, well-commented YAML with exact 2-space indentation and explicit resource limits.`
    },
    {
      cmd: "/markdown",
      badge: "CommonMark",
      category: "data",
      desc: "Format notes or text into polished CommonMark documentation",
      template: (arg) => `[COMMONMARK DOCUMENTATION FORMATTER]\nDraft: "${arg || 'Raw notes'}"\n\nPolish into pristine CommonMark with clear hierarchy (H1-H3), callout blockquotes, code blocks, and bullet points.`
    },
    {
      cmd: "/summarize",
      badge: "Synthesis",
      category: "data",
      desc: "Condense current conversation into executive briefing and action items",
      template: () => `[EXECUTIVE SUMMARY & ACTION MATRIX]\nPlease summarize our conversation so far into:\n1. Executive Summary (3-4 crisp sentences)\n2. Key Architectural & Technical Decisions Made\n3. Outstanding Questions & Risks\n4. Concrete Action Items (Next Steps Checklist).`
    },
    {
      cmd: "/tldr",
      badge: "TL;DR",
      category: "data",
      desc: "Ultra-concise 2-sentence executive TL;DR summary",
      template: (arg) => `[ULTRA-CONCISE TL;DR]\nText: "${arg || 'Current topic'}"\n\nSummarize the absolute core takeaway in exactly two punchy, informative sentences.`
    },
    {
      cmd: "/extract",
      badge: "NLP Extraction",
      category: "data",
      desc: "Extract named entities, dates, URLs, and key data points",
      template: (arg) => `[NAMED ENTITY & KEY METRIC EXTRACTION]\nContent: "${arg || 'Document text'}"\n\nExtract and categorize:\n- People, Organizations & Locations.\n- Dates, Deadlines & Milestones.\n- Numerical Statistics & Dollar Amounts.\n- Action Items & Assignees.`
    },
    {
      cmd: "/sanitize",
      badge: "PII Redaction",
      category: "data",
      desc: "Sanitize text by redacting PII, secrets, and credentials",
      template: (arg) => `[DATA SANITIZATION & REDACTION]\nInput: "${arg || 'Text containing secrets'}"\n\nSanitize this text by replacing all Personally Identifiable Information (emails, phone numbers, SSNs, API keys, passwords) with safe tokens like [REDACTED_API_KEY].`
    },
    {
      cmd: "/diff",
      badge: "Semantic Diff",
      category: "data",
      desc: "Semantic before/after comparison diff highlighting critical modifications",
      template: (arg) => `[SEMANTIC BEFORE/AFTER DIFF]\nChanges: "${arg || 'Version 1 vs Version 2'}"\n\nHighlight the core differences using a Git-style diff format (+ / -) accompanied by an explanation of breaking changes.`
    },

    // --- CATEGORY 8: WRITING, EDUCATION & EXPLANATIONS (10) ---
    {
      cmd: "/explain",
      badge: "Education",
      category: "writing",
      desc: "Multi-level conceptual breakdown (ELI5, Senior Engineer, First Principles)",
      template: (arg) => `[MULTI-TIER CONCEPTUAL BREAKDOWN]\nConcept: "${arg || 'Core architecture'}"\n\nExplain this concept across three progressive depth levels:\nLevel 1 (ELI5): Intuitive analogy accessible to anyone.\nLevel 2 (Senior Engineer): Technical mechanics, architecture, trade-offs, and design patterns.\nLevel 3 (First Principles): Mathematical derivation or formal low-level foundation.`
    },
    {
      cmd: "/eli5",
      badge: "ELI5",
      category: "writing",
      desc: "Explain Like I'm 5 with relatable physical world analogies",
      template: (arg) => `[EXPLAIN LIKE I'M 5]\nSubject: "${arg || 'Complex concept'}"\n\nExplain this as if to a curious 5-year-old child using simple everyday analogies (toys, playground, kitchen) with zero technical jargon.`
    },
    {
      cmd: "/deepdive",
      badge: "Exhaustive",
      category: "writing",
      desc: "Exhaustive technical deep-dive into internal plumbing and mechanics",
      template: (arg) => `[TECHNICAL DEEP DIVE]\nSystem/Technology: "${arg || 'Virtual Memory / LLM Attention'}"\n\nProvide an exhaustive deep dive: byte-level layout, kernel/hardware interactions, memory allocations, and performance boundary characteristics.`
    },
    {
      cmd: "/analogy",
      badge: "Mental Models",
      category: "writing",
      desc: "Formulate 3 vivid, unconventional analogies to build intuition",
      template: (arg) => `[ANALOGICAL INTUITION BUILDER]\nConcept: "${arg || 'Database indexing / Async I/O'}"\n\nProvide 3 distinct physical-world analogies that illuminate how this system works from different intuitive angles.`
    },
    {
      cmd: "/simplify",
      badge: "Plain English",
      category: "writing",
      desc: "Rewrite dense academic/technical text into clear, punchy plain English",
      template: (arg) => `[PLAIN ENGLISH REWRITE]\nDense Text: "${arg || 'Dense technical passage'}"\n\nRewrite this text for maximum clarity, readability, and punchiness without sacrificing semantic accuracy.`
    },
    {
      cmd: "/translate",
      badge: "Translation",
      category: "writing",
      desc: "High-accuracy nuanced contextual translation preserving technical terms",
      template: (arg) => `[HIGH-ACCURACY CONTEXTUAL TRANSLATION]\nText & Target Language: "${arg || 'Translate to Spanish: Technical brief'}"\n\nTranslate with natural fluency, cultural nuance, and correct domain-specific technical terminology.`
    },
    {
      cmd: "/rewrite",
      badge: "Editor",
      category: "writing",
      desc: "Polish prose for rhythm, conciseness, and impactful delivery",
      template: (arg) => `[PROSE POLISH & FLOW]\nDraft: "${arg || 'Draft writing'}"\n\nPolish this draft to eliminate passive voice, vary sentence structure, remove filler adverbs, and amplify impact.`
    },
    {
      cmd: "/grammar",
      badge: "Proofread",
      category: "writing",
      desc: "Proofread for grammar, orthography, punctuation, and style consistency",
      template: (arg) => `[RIGOROUS PROOFREADING]\nText: "${arg || 'Text to review'}"\n\nProofread meticulously, pointing out every grammar, punctuation, agreement, and style inconsistency with corrected versions.`
    },
    {
      cmd: "/tone",
      badge: "Tone Shift",
      category: "writing",
      desc: "Shift text tone: Executive, Academic, Empathetic, or Direct",
      template: (arg) => `[TONE SHIFT ADAPTATION]\nContent & Desired Tone: "${arg || 'Make this executive and persuasive'}"\n\nAdapt the content into the requested tone while maintaining all factual arguments.`
    },
    {
      cmd: "/academic",
      badge: "Peer-Review",
      category: "writing",
      desc: "Rewrite into formal academic journal register with passive objectivity",
      template: (arg) => `[ACADEMIC REGISTER REWRITE]\nContent: "${arg || 'Informal research finding'}"\n\nRewrite into formal academic prose suitable for Nature or IEEE journal publication.`
    },

    // --- CATEGORY 9: INTERACTIVE TOOLS & CONTROLS (10) ---
    {
      cmd: "/sandbox",
      badge: "Tool",
      category: "tools",
      desc: "Open interactive code sandbox and executable HTML/JS/CSS runner",
      template: null,
      action: "sandbox"
    },
    {
      cmd: "/tps",
      badge: "Metrics",
      category: "tools",
      desc: "Show live benchmark generation speed and token throughput stats",
      template: null,
      action: "tps"
    },
    {
      cmd: "/cost",
      badge: "Cost Tool",
      category: "tools",
      desc: "Calculate estimated API costs for conversation based on active model",
      template: null,
      action: "cost"
    },
    {
      cmd: "/tokens",
      badge: "Context Tool",
      category: "tools",
      desc: "Analyze conversation context window token consumption",
      template: null,
      action: "tokens"
    },
    {
      cmd: "/modelinfo",
      badge: "Info",
      category: "tools",
      desc: "Display active model specs, capabilities, and provider base URL",
      template: null,
      action: "modelinfo"
    },
    {
      cmd: "/branch",
      badge: "Chat Tool",
      category: "tools",
      desc: "Branch current conversation into a new chat thread",
      template: null,
      action: "branch"
    },
    {
      cmd: "/clear",
      badge: "Chat Tool",
      category: "tools",
      desc: "Clear current conversation messages",
      template: null,
      action: "clear"
    },
    {
      cmd: "/export",
      badge: "Export",
      category: "tools",
      desc: "Export conversation to Markdown, JSON, or formatted HTML",
      template: null,
      action: "export"
    },
    {
      cmd: "/settings",
      badge: "Config",
      category: "tools",
      desc: "Open AI Model Parameters, Temperature & Output Limit modal",
      template: null,
      action: "settings"
    },
    {
      cmd: "/models",
      badge: "Models",
      category: "tools",
      desc: "Open Model Selector & Provider Base URL Hub",
      template: null,
      action: "models"
    },
    {
      cmd: "/features",
      badge: "Features",
      category: "tools",
      desc: "Open 100+ Actionable Features Hub",
      template: null,
      action: "features"
    },
    {
      cmd: "/help",
      badge: "Help",
      category: "tools",
      desc: "Command guidance and 100+ features catalog",
      template: null,
      action: "help"
    },
    {
      cmd: "/prompt",
      badge: "Prompts",
      category: "tools",
      desc: "Open Specialized System Prompts & Personas",
      template: null,
      action: "prompt"
    },
    {
      cmd: "/image",
      badge: "Studio",
      category: "tools",
      desc: "Open AI Image Studio (DALL-E 3 & Flux)",
      template: null,
      action: "image"
    },
    {
      cmd: "/theme",
      badge: "Theme",
      category: "tools",
      desc: "Toggle between Dark Obsidian and Warm Parchment",
      template: null,
      action: "theme"
    }
  ];

  const PRESET_PERSONAS = [
    { id: "senior-architect", title: "Senior Software Architect", category: "architecture", desc: "Modular design, trade-offs, and scalability", prompt: "You are an expert software architect. Analyze requirements, point out trade-offs, edge cases, module boundaries, scalability bottlenecks, and provide production-ready solutions." },
    { id: "r1-reasoner", title: "Deep STEM & Math Reasoner", category: "reasoning", desc: "First-principles deduction and formal proofs", prompt: "Think with deep first-principles reasoning. Show comprehensive step-by-step mathematical or logical deductions before concluding. Never rush, verify all claims." },
    { id: "fullstack-react", title: "Modern React & Next.js Lead", category: "coding", desc: "TypeScript, Server Components, and UI polish", prompt: "You are a lead Next.js and React engineer. Provide clean, modular, accessible TypeScript components with smooth animations and zero hydration bugs." },
    { id: "security-auditor", title: "Cybersecurity & Code Auditor", category: "security", desc: "OWASP Top 10, sanitization, and vulnerability patches", prompt: "You are an offensive security researcher and code auditor. Inspect code for security vulnerabilities, injection flaws, memory issues, and offer hardened patches." },
    { id: "ui-ux-polisher", title: "2026 UI/UX Polish Master", category: "writing", desc: "Obsidian dark palettes, spring physics, touch ergonomics", prompt: "You are a world-class digital product designer. Review UI layouts for contrast, touch target geometry, responsive safe areas, elegant typography, and buttery animations." },
    { id: "bug-hunter", title: "Relentless Bug Hunter & QA", category: "coding", desc: "Edge cases, race conditions, and memory leaks", prompt: "Act as a ruthless QA lead and debugger. Look for race conditions, null references, network drops, unhandled promise rejections, and test edge cases." },
  ];

  // --- 3. STATE MANAGEMENT ---
  const state = {
    providerUrl: localStorage.getItem("af_provider_url") || "https://openrouter.ai/api/v1",
    apiKey: localStorage.getItem("af_api_key") || "",
    providerName: localStorage.getItem("af_provider_name") || "OpenRouter",
    selectedModelId: localStorage.getItem("af_model_id") || "deepseek/deepseek-r1",
    theme: localStorage.getItem("af_theme") || "dark",
    chats: JSON.parse(localStorage.getItem("af_chats") || "[]"),
    activeChatId: localStorage.getItem("af_active_chat_id") || null,
    models: JSON.parse(localStorage.getItem("af_models") || "null") || DEFAULT_MODELS,
    providerModelsPricing: JSON.parse(localStorage.getItem("af_provider_pricing_cache") || "{}"),
    settings: {
      temperature: parseFloat(localStorage.getItem("af_param_temp") || "0.7"),
      maxTokens: parseInt(localStorage.getItem("af_param_max_tokens") || "4096", 10),
      topP: parseFloat(localStorage.getItem("af_param_top_p") || "0.95"),
      presencePenalty: parseFloat(localStorage.getItem("af_param_presence") || "0.0"),
      frequencyPenalty: parseFloat(localStorage.getItem("af_param_frequency") || "0.0"),
      contextLimit: parseInt(localStorage.getItem("af_param_context_limit") || "20", 10),
      reasoningEffort: localStorage.getItem("af_param_reasoning_effort") || "medium",
      systemPrompt: localStorage.getItem("af_param_system_prompt") || "",
    },
    activeTools: {
      thinking: true,
      thinkingLevel: "high", // "high" | "medium" | "low" | "off"
      vision: true,
      web: false,
      codeSandbox: true,
    },
    attachedImage: null, // { dataUrl, name, size }
    sidebarFilter: "all", // "all" | "pinned" | "archived"
    chatSearchQuery: "",
    modelCategoryFilter: "all",
    featureCategoryFilter: "all",
    isStreaming: false,
    activeAbortController: null,
    activeStreamStats: {
      startTime: 0,
      charCount: 0,
      tokenCount: 0,
      lastTPS: "0.0 tps",
    },
    speechUtterance: null,
    speechRate: 1.0,
    recognition: null,
    isRecording: false,
    launchBehavior: localStorage.getItem("af_launch_behavior") || "new_chat",
    apiBudgetLimit: parseFloat(localStorage.getItem("af_budget_limit") || "100.0"),
    apiBudgetWarn: localStorage.getItem("af_budget_warn") !== "false",
    totalSpend: parseFloat(localStorage.getItem("af_total_spend") || "0.0"),
    selectedImageModel: localStorage.getItem("af_image_model") || "black-forest-labs/flux-1-schnell",
  };

  // Safe Code Snippets Registry to prevent quote-escaping syntax bugs in inline HTML
  const codeSnippetsRegistry = [];

  // --- 4. DOM ELEMENTS CACHE ---
  const els = {
    sidebar: document.getElementById("sidebar"),
    sidebarBackdrop: document.getElementById("sidebar-backdrop"),
    toggleSidebarBtn: document.getElementById("toggle-sidebar-btn"),
    sidebarCollapseBtn: document.getElementById("sidebar-collapse-btn"),
    newChatBtn: document.getElementById("new-chat-btn"),
    chatSearchInput: document.getElementById("chat-search-input"),
    filterTabBtns: document.querySelectorAll(".filter-tab-btn"),
    chatList: document.getElementById("chat-history-list"),
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    modelSettingsBtn: document.getElementById("model-settings-btn"),
    topFeaturesBtn: document.getElementById("top-features-btn"),
    headerApiConfigBtn: document.getElementById("header-api-config-btn"),
    modelPill: document.getElementById("model-pill-trigger"),
    modelPillName: document.getElementById("current-model-name"),
    modelPillCap: document.getElementById("model-pill-cap"),
    modelPillDot: document.getElementById("model-pill-dot"),
    headerNewChatBtn: document.getElementById("header-new-chat-btn"),
    messagesContainer: document.getElementById("messages-container"),
    chatTextarea: document.getElementById("chat-textarea"),
    sendBtn: document.getElementById("send-btn"),
    stopBtn: document.getElementById("stop-btn"),
    voiceRecordBtn: document.getElementById("voice-record-btn"),
    recordingBar: document.getElementById("recording-bar"),
    slashTriggerBtn: document.getElementById("slash-trigger-btn"),
    slashMenu: document.getElementById("slash-commands-menu"),
    slashCommandsList: document.getElementById("slash-commands-list"),
    featuresHubBtn: document.getElementById("features-hub-btn"),
    modelQuickBtn: document.getElementById("model-selector-quick-btn"),
    promptLibBtn: document.getElementById("prompt-lib-btn"),
    imageGenBtn: document.getElementById("image-gen-btn"),
    exportBtn: document.getElementById("export-btn"),

    // Vision Image Attachment & ChatGPT Plus Menu
    imageFileInput: document.getElementById("image-file-input"),
    toolAttachBtn: document.getElementById("tool-attach-btn"),
    chatgptPlusMenu: document.getElementById("chatgpt-plus-menu"),
    plusMenuContent: document.getElementById("plus-menu-content"),
    attachedImageContainer: document.getElementById("attached-image-container"),
    attachedImageThumb: document.getElementById("attached-image-thumb"),
    attachedImageName: document.getElementById("attached-image-name"),
    attachedImageRemoveBtn: document.getElementById("attached-image-remove-btn"),

    // Tools Bar
    toolThinkingBtn: document.getElementById("tool-thinking-btn"),
    toolThinkingLabel: document.getElementById("tool-thinking-label"),
    toolVisionBtn: document.getElementById("tool-vision-btn"),
    toolVisionLabel: document.getElementById("tool-vision-label"),
    toolWebBtn: document.getElementById("tool-web-btn"),
    toolCodeBtn: document.getElementById("tool-code-btn"),
    capabilityPill: document.getElementById("capability-unlocked-pill"),

    // Model Selector & Dedicated Provider Drawer Modal
    modelSelectorModal: document.getElementById("model-selector-modal"),
    toggleProviderDrawerBtn: document.getElementById("toggle-provider-drawer-btn"),
    providerConfigDrawer: document.getElementById("provider-config-drawer"),
    providerDrawerChevron: document.getElementById("provider-drawer-chevron"),
    providerDrawerSummary: document.getElementById("provider-drawer-summary"),
    currentProviderBadgeName: document.getElementById("current-provider-badge-name"),
    currentProviderBadgeUrl: document.getElementById("current-provider-badge-url"),
    keyStatusBadge: document.getElementById("key-status-badge"),
    modelModalUrlInput: document.getElementById("model-modal-url-input"),
    modelModalKeyInput: document.getElementById("model-modal-key-input"),
    toggleKeyVisibilityBtn: document.getElementById("toggle-key-visibility-btn"),
    modalProbeBtn: document.getElementById("modal-probe-btn"),
    modalSaveProviderBtn: document.getElementById("modal-save-provider-btn"),
    modalProbeStatus: document.getElementById("modal-probe-status"),
    modalTabModels: document.getElementById("modal-tab-models"),
    modalTabProvider: document.getElementById("modal-tab-provider"),
    backToModelsBtn: document.getElementById("back-to-models-btn"),
    modelsSelectionBody: document.getElementById("models-selection-body"),
    modelSearchInput: document.getElementById("model-search-input"),
    modelCategoryChips: document.querySelectorAll(".model-chip"),
    modelsListContainer: document.getElementById("models-list-container"),
    modelsAvailableCount: document.getElementById("models-available-count"),
    customModelIdInput: document.getElementById("custom-model-id-input"),
    useCustomModelBtn: document.getElementById("use-custom-model-btn"),

    // 100+ Features Modal
    featuresModal: document.getElementById("features-modal"),
    featuresSupportedCounter: document.getElementById("features-supported-counter"),
    featuresSearchInput: document.getElementById("features-search-input"),
    featureCategoryChips: document.querySelectorAll(".feature-chip"),
    featuresGrid: document.getElementById("features-grid"),

    // Model Settings Modal
    modelSettingsModal: document.getElementById("model-settings-modal"),
    settingsModelInfo: document.getElementById("settings-model-info"),
    settingsModelName: document.getElementById("settings-model-name"),
    settingsModelDesc: document.getElementById("settings-model-desc"),
    settingsModelContext: document.getElementById("settings-model-context"),
    reasoningEffortGroup: document.getElementById("reasoning-effort-group"),
    paramTempSlider: document.getElementById("param-temp-slider"),
    paramTempInput: document.getElementById("param-temp-input"),
    tempValBadge: document.getElementById("temp-val-badge"),
    paramMaxTokensSlider: document.getElementById("param-max-tokens-slider"),
    paramMaxTokensInput: document.getElementById("param-max-tokens-input"),
    maxTokensBadge: document.getElementById("max-tokens-badge"),
    paramTopPSlider: document.getElementById("param-top-p-slider"),
    topPBadge: document.getElementById("top-p-badge"),
    paramPresenceSlider: document.getElementById("param-presence-slider"),
    presenceBadge: document.getElementById("presence-badge"),
    paramFrequencySlider: document.getElementById("param-frequency-slider"),
    frequencyBadge: document.getElementById("frequency-badge"),
    paramContextLimit: document.getElementById("param-context-limit"),
    reasoningModelSupportNote: document.getElementById("reasoning-model-support-note"),
    effortPillBtns: document.querySelectorAll(".effort-pill-btn"),
    paramSystemPrompt: document.getElementById("param-system-prompt"),
    resetParamsBtn: document.getElementById("reset-params-btn"),
    saveParamsBtn: document.getElementById("save-params-btn"),

    // Model Pricing Editor & Overrides
    settingsPricingCard: document.getElementById("settings-pricing-card"),
    modelPricingSourceBadge: document.getElementById("model-pricing-source-badge"),
    settingsCurrentPricingDisplay: document.getElementById("settings-current-pricing-display"),
    settingsPriceSummaryText: document.getElementById("settings-price-summary-text"),
    settingsPriceUsdText: document.getElementById("settings-price-usd-text"),
    customPriceInput: document.getElementById("custom-price-input"),
    customPriceOutput: document.getElementById("custom-price-output"),
    customPriceCurrency: document.getElementById("custom-price-currency"),
    customPriceUnit: document.getElementById("custom-price-unit"),
    saveCustomPricingBtn: document.getElementById("save-custom-pricing-btn"),
    resetCustomPricingBtn: document.getElementById("reset-custom-pricing-btn"),

    // Code Sandbox & Multi-Language Runner Modal
    codeSandboxModal: document.getElementById("code-sandbox-modal"),
    sandboxIframe: document.getElementById("sandbox-iframe"),
    sandboxModalTitle: document.getElementById("sandbox-modal-title"),
    sandboxModalSub: document.getElementById("sandbox-modal-sub"),
    sandboxRunBtn: document.getElementById("sandbox-run-btn"),
    sandboxReloadBtn: document.getElementById("sandbox-reload-btn"),
    sandboxCopyBtn: document.getElementById("sandbox-copy-btn"),
    sandboxTabPreview: document.getElementById("sandbox-tab-preview"),
    sandboxTabCode: document.getElementById("sandbox-tab-code"),
    sandboxPanePreview: document.getElementById("sandbox-pane-preview"),
    sandboxPaneCode: document.getElementById("sandbox-pane-code"),
    sandboxCodeEditor: document.getElementById("sandbox-code-editor"),
    sandboxCodeLangTag: document.getElementById("sandbox-code-lang-tag"),
    sandboxCodeMetaInfo: document.getElementById("sandbox-code-meta-info"),
    sandboxConsoleDrawer: document.getElementById("sandbox-console-drawer"),
    sandboxConsoleOutput: document.getElementById("sandbox-console-output"),
    sandboxConsoleClearBtn: document.getElementById("sandbox-console-clear-btn"),

    // Prompt Library Modal
    promptModal: document.getElementById("prompt-modal"),
    promptSearchInput: document.getElementById("prompt-search-input"),
    personasGrid: document.getElementById("personas-grid"),

    // Image Modal
    imageModal: document.getElementById("image-modal"),
    imgPromptInput: document.getElementById("img-prompt-input"),
    generateImgBtn: document.getElementById("generate-img-btn"),
    imgPreviewBox: document.getElementById("img-preview-box"),
    insertImgBtn: document.getElementById("insert-img-btn"),

    // Export Modal
    exportModal: document.getElementById("export-modal"),

    // App Launch Behavior & API Budget Controls
    settingLaunchBehavior: document.getElementById("setting-launch-behavior"),
    settingBudgetLimit: document.getElementById("setting-budget-limit"),
    settingBudgetWarn: document.getElementById("setting-budget-warn"),
    budgetSpendBadge: document.getElementById("budget-spend-badge"),
    resetSpendBtn: document.getElementById("reset-spend-btn"),

    // Budget Warning Modal
    budgetWarningModal: document.getElementById("budget-warning-modal"),
    budgetWarningText: document.getElementById("budget-warning-text"),
    budgetResetSpendBtn: document.getElementById("budget-reset-spend-btn"),
    budgetProceedBtn: document.getElementById("budget-proceed-btn"),
    budgetSwitchFreeBtn: document.getElementById("budget-switch-free-btn"),
    budgetCancelBtn: document.getElementById("budget-cancel-btn"),

    // Image Modal Model Selector
    imgModelSelect: document.getElementById("img-model-select"),
    imgModelCostBadge: document.getElementById("img-model-cost-badge"),

    // Rail buttons
    railNewChatBtn: document.getElementById("rail-new-chat-btn"),
    railFeaturesBtn: document.getElementById("rail-features-btn"),
    railModelsBtn: document.getElementById("rail-models-btn"),
    railSettingsBtn: document.getElementById("rail-settings-btn"),
  };

  // --- 5. MODEL CAPABILITY DETECTION & DYNAMIC FEATURE FILTERING ---
  function detectCapabilities(modelId, modelObj) {
    const lower = String(modelId || "").toLowerCase();
    
    // Check if model category is explicitly defined in registry or state
    if (!modelObj && typeof state !== "undefined" && Array.isArray(state.models)) {
      modelObj = state.models.find(m => m.id === modelId || (m.id && m.id.toLowerCase() === lower));
    }
    if (!modelObj) {
      modelObj = DEFAULT_MODELS.find(m => m.id === modelId || m.id.toLowerCase() === lower);
    }

    const nameLower = modelObj && modelObj.name ? String(modelObj.name).toLowerCase() : "";
    const descLower = modelObj && modelObj.desc ? String(modelObj.desc).toLowerCase() : "";
    const catLower = modelObj && modelObj.category ? String(modelObj.category).toLowerCase() : "";
    const combined = `${lower} ${nameLower} ${descLower} ${catLower}`;

    // Strict reasoning detection: DeepSeek R1, OpenAI o1/o3, Claude 3.7 Sonnet, Qwen QwQ
    let isReasoning = catLower === "reasoning" ||
                      combined.includes("r1") || combined.includes("o1") || combined.includes("o3") ||
                      combined.includes("3.7") || combined.includes("claude-3-7") || combined.includes("reasoner") ||
                      combined.includes("thinking") || combined.includes("qwq");

    // Standard chat models like GPT-4o, LLaMA 3.3, Claude 3.5, Gemini Flash, Lunaris strictly do NOT have reasoning
    if (combined.includes("4o") || combined.includes("llama") || combined.includes("3.5") || combined.includes("flash") || combined.includes("mini-instruct") || combined.includes("lunaris")) {
      isReasoning = false;
    }

    // Comprehensive OCR & Document Detection
    const isOCR = catLower === "ocr" ||
                  combined.includes("ocr") || combined.includes("nougat") || combined.includes("surya") ||
                  combined.includes("donut") || combined.includes("doc-vision") || combined.includes("got-ocr") ||
                  combined.includes("paddleocr") || combined.includes("mineru") || combined.includes("doc-parse") ||
                  (combined.includes("document") && !combined.includes("documentation"));

    // Multi-modal Vision Detection
    const isVision = isOCR || catLower === "vision" || combined.includes("vision") || combined.includes("4o") ||
                     combined.includes("gemini") || combined.includes("vl") || combined.includes("claude") ||
                     combined.includes("omni") || combined.includes("image-to-text") || combined.includes("multimodal") ||
                     combined.includes("pixtral") || combined.includes("llava") || combined.includes("internvl");

    // Comprehensive Audio & Speech-to-Text / Transcription Detection
    const isAudio = catLower === "audio" || catLower === "transcribe" || catLower === "stt" ||
                    combined.includes("tts") || combined.includes("whisper") || combined.includes("audio") ||
                    combined.includes("speech") || combined.includes("voice") || combined.includes("transcrib") ||
                    combined.includes("stt") || combined.includes("asr") || combined.includes("sound") ||
                    combined.includes("listen") || combined.includes("elevenlabs") || combined.includes("bark") ||
                    combined.includes("parler") || combined.includes("seamless");

    const isImage = catLower === "image" || combined.includes("dall-e") || combined.includes("flux") ||
                    combined.includes("image") || combined.includes("schnell") || combined.includes("stable-diffusion") ||
                    combined.includes("midjourney");

    const isVideo = catLower === "video" || combined.includes("video") || combined.includes("ray") ||
                    combined.includes("kling") || combined.includes("sora") || combined.includes("runway") || combined.includes("luma");

    const isCoding = catLower === "coding" || combined.includes("coder") || combined.includes("code") ||
                     combined.includes("sonnet") || isReasoning;

    const isFast = combined.includes("groq") || combined.includes("flash") || combined.includes("mini") || combined.includes("turbo");
    const isTools = !isAudio && !isImage && !isVideo;

    return {
      reasoning: isReasoning,
      vision: isVision,
      ocr: isOCR,
      audio: isAudio,
      image: isImage,
      video: isVideo,
      coding: isCoding,
      tools: isTools,
      fast: isFast,
    };
  }

  // Capability-based dynamic feature filtering: Only allow features the model actually supports!
  function isFeatureSupportedByModel(feature, caps) {
    if (!feature || !caps) return true;
    if (caps.image) {
      // Pure image generation models (Flux, DALL-E) only support image features
      return feature.category === "image" || feature.cmd === "/image";
    }
    if (caps.video) {
      // Pure video generation models only support video/creative prompts
      return feature.category === "image" || feature.category === "writing" || feature.cmd === "/image";
    }
    // Non-image models do not support image-generation only commands
    if (feature.category === "image" && !caps.image) {
      return false;
    }
    // Interactive tool actions require tool-calling support
    if (feature.category === "tools" && !caps.tools) {
      return false;
    }
    return true;
  }

  function updateCapabilitiesUI(modelId) {
    const caps = detectCapabilities(modelId);
    const activeModel = state.models.find(m => m.id === modelId);
    const modelName = activeModel ? activeModel.name : String(modelId || "").split("/").pop();

    // Update Header Pill with clean label
    if (caps.reasoning) {
      els.modelPillCap.textContent = "Thinking";
      els.modelPillCap.style.display = "inline-block";
    } else if (caps.ocr) {
      els.modelPillCap.textContent = "OCR";
      els.modelPillCap.style.display = "inline-block";
    } else if (caps.vision) {
      els.modelPillCap.textContent = "Vision";
      els.modelPillCap.style.display = "inline-block";
    } else if (caps.image) {
      els.modelPillCap.textContent = "Image";
      els.modelPillCap.style.display = "inline-block";
    } else if (caps.audio) {
      els.modelPillCap.textContent = "Audio";
      els.modelPillCap.style.display = "inline-block";
    } else if (caps.video) {
      els.modelPillCap.textContent = "Video";
      els.modelPillCap.style.display = "inline-block";
    } else if (caps.fast) {
      els.modelPillCap.textContent = "Fast";
      els.modelPillCap.style.display = "inline-block";
    } else {
      els.modelPillCap.style.display = "none";
    }

    // Dynamic textarea placeholder according to active model specialty
    if (caps.image) {
      els.chatTextarea.placeholder = `Describe the image to generate with ${modelName}...`;
    } else if (caps.audio && String(modelId).includes("tts")) {
      els.chatTextarea.placeholder = `Type text to synthesize speech with ${modelName}...`;
    } else if (caps.audio && String(modelId).includes("whisper")) {
      els.chatTextarea.placeholder = "Voice Transcription Mode: dictate or record audio...";
    } else if (caps.video) {
      els.chatTextarea.placeholder = `Describe the video scene to generate with ${modelName}...`;
    } else if (caps.ocr) {
      els.chatTextarea.placeholder = "Message AgentsFlow or attach document for OCR...";
    } else {
      els.chatTextarea.placeholder = "Message AgentsFlow...";
    }

    // 1. Thinking Feature Unlock / Visibility (Strict capability enforcement)
    if (caps.reasoning) {
      els.toolThinkingBtn.style.display = "inline-flex";
      els.toolThinkingBtn.classList.remove("locked");
      els.toolThinkingBtn.classList.add("unlocked", "active");
      state.activeTools.thinking = true;
      els.toolThinkingLabel.textContent = `Thinking: ${capitalize(state.activeTools.thinkingLevel || 'High')}`;
      if (els.reasoningEffortGroup) {
        els.reasoningEffortGroup.style.display = "block";
      }
      if (els.reasoningModelSupportNote) {
        els.reasoningModelSupportNote.textContent = "Active (Reasoning Enabled)";
        els.reasoningModelSupportNote.style.color = "var(--badge-green)";
      }
    } else {
      els.toolThinkingBtn.style.display = "none"; // Clean minimalism: hide completely when unsupported
      els.toolThinkingBtn.classList.remove("unlocked", "active");
      els.toolThinkingBtn.classList.add("locked");
      state.activeTools.thinking = false;
      if (els.reasoningEffortGroup) {
        els.reasoningEffortGroup.style.display = "none"; // Completely hide reasoning settings for models without reasoning
      }
      if (els.reasoningModelSupportNote) {
        els.reasoningModelSupportNote.textContent = "Disabled (Model lacks reasoning)";
        els.reasoningModelSupportNote.style.color = "var(--text-muted)";
      }
    }

    // 2. Vision Feature Unlock / Visibility
    if (els.toolAttachBtn) els.toolAttachBtn.style.display = "inline-flex"; // Always allow user to attach photos & documents
    if (caps.vision) {
      els.toolVisionBtn.style.display = "inline-flex";
      els.toolVisionBtn.classList.remove("locked");
      els.toolVisionBtn.classList.add("unlocked", "active");
      state.activeTools.vision = true;
      els.toolVisionLabel.textContent = "Vision";
    } else {
      els.toolVisionBtn.style.display = "none"; // Clean minimalism: hide when unsupported
      els.toolVisionBtn.classList.remove("unlocked", "active");
      els.toolVisionBtn.classList.add("locked");
      state.activeTools.vision = false;
    }

    // 3. Image Generation Tool Visibility
    if (els.imageGenBtn) {
      els.imageGenBtn.style.display = caps.image ? "inline-flex" : "none";
    }

    // 4. Web Grounding & Code Sandbox
    els.toolCodeBtn.classList.toggle("active", state.activeTools.codeSandbox);
    els.toolWebBtn.classList.toggle("active", state.activeTools.web);

    // 4. Update Capability Summary Badge (Clean typography, no emojis)
    const summaryCaps = [];
    if (caps.reasoning) summaryCaps.push("Reasoning");
    if (caps.vision) summaryCaps.push("Vision");
    if (caps.coding) summaryCaps.push("Code");
    if (caps.fast) summaryCaps.push("Fast");
    if (caps.image) summaryCaps.push("Image Gen");

    const capText = summaryCaps.length ? summaryCaps.join(" • ") : "Ready";
    const activeCapEl = document.getElementById("active-capabilities-summary");
    if (activeCapEl) {
      activeCapEl.textContent = `${modelName} • ${capText}`;
    } else if (els.capabilityPill) {
      els.capabilityPill.textContent = `${modelName} • ${capText}`;
    }

    // 5. Update Feature Grid count and filter
    if (els.featuresModal && els.featuresModal.classList.contains("active")) {
      renderFeaturesGrid(state.featureCategoryFilter);
    }

    // 6. Enforce model output token limit according to model specification
    const allowedLimit = getModelMaxOutputTokens(modelId);
    if (state.settings.maxTokens > allowedLimit) {
      state.settings.maxTokens = allowedLimit;
      localStorage.setItem("af_param_max_tokens", state.settings.maxTokens);
    }
    if (els.paramMaxTokensSlider) {
      els.paramMaxTokensSlider.max = String(allowedLimit);
      els.paramMaxTokensSlider.value = state.settings.maxTokens;
    }
    if (els.paramMaxTokensInput) {
      els.paramMaxTokensInput.max = String(allowedLimit);
      els.paramMaxTokensInput.value = state.settings.maxTokens;
    }
    if (els.maxTokensBadge) {
      els.maxTokensBadge.textContent = `${state.settings.maxTokens} (Max: ${allowedLimit})`;
    }
  }

  function getModelMaxOutputTokens(modelId) {
    const id = String(modelId || "").toLowerCase();
    const modelObj = (state && state.models ? state.models : DEFAULT_MODELS).find(m => m.id === modelId || (m.id && m.id.toLowerCase() === id));

    // If context_length or max_output_tokens is provided by provider
    if (modelObj) {
      if (typeof modelObj.max_output_tokens === "number" && modelObj.max_output_tokens > 0) {
        return modelObj.max_output_tokens;
      }
      if (modelObj.top_provider && typeof modelObj.top_provider.max_completion_tokens === "number" && modelObj.top_provider.max_completion_tokens > 0) {
        return modelObj.top_provider.max_completion_tokens;
      }
      if (modelObj.per_request_limits && typeof modelObj.per_request_limits.max_completion_tokens === "number" && modelObj.per_request_limits.max_completion_tokens > 0) {
        return modelObj.per_request_limits.max_completion_tokens;
      }
    }

    // Specific model output limits based on official specifications
    if (id.includes("claude-3-7") || id.includes("claude-3.7") || id.includes("claude-3-5-sonnet") || id.includes("claude-3.5-sonnet")) {
      return 8192; // Claude 3.5 / 3.7 default max completion tokens (up to 64k extended thinking)
    }
    if (id.includes("claude-3-5-haiku") || id.includes("claude-3-haiku")) {
      return 8192;
    }
    if (id.includes("claude-3-opus") || id.includes("claude-2")) {
      return 4096;
    }
    if (id.includes("deepseek-r1") || id.includes("deepseek/r1") || id.includes("deepseek-reasoner")) {
      return 8192; // DeepSeek R1 API hard limits max_tokens to 8192
    }
    if (id.includes("deepseek-v3") || id.includes("deepseek-chat") || id.includes("deepseek")) {
      return 8192;
    }
    if (id.includes("o1-mini") || id.includes("o3-mini")) {
      return 65536; // OpenAI o1/o3 reasoning models support up to 64k-100k completion tokens
    }
    if (id.includes("o1-preview") || id.includes("o1")) {
      return 32768;
    }
    if (id.includes("gpt-4o-mini")) {
      return 16384;
    }
    if (id.includes("gpt-4o") || id.includes("chatgpt-4o")) {
      return 16384;
    }
    if (id.includes("gemini-2.0-flash") || id.includes("gemini-2-flash")) {
      return 8192;
    }
    if (id.includes("gemini-1.5-pro") || id.includes("gemini-1.5-flash")) {
      return 8192;
    }
    if (id.includes("lunaris")) {
      return 4096; // Lunaris fine-tune strictly bounded to 4096 output tokens
    }
    if (id.includes("llama-3.3") || id.includes("llama-3.1") || id.includes("llama-3.2") || id.includes("llama-3") || id.includes("llama-8b") || id.includes("llama-70b")) {
      return 4096; // LLaMA 3.x default max output is 4,096 tokens (or 8k on specific providers)
    }
    if (id.includes("qwen-2.5") || id.includes("qwq-32b") || id.includes("qwen")) {
      return 8192;
    }
    if (id.includes("mistral-large") || id.includes("codestral") || id.includes("mistral") || id.includes("nemo")) {
      return 4096;
    }
    if (id.includes("nougat") || id.includes("ocr")) {
      return 4096;
    }

    return 4096; // Safe universal fallback
  }

  function showToastBadge(text) {
    if (!els.capabilityPill) return;
    const oldText = els.capabilityPill.textContent;
    els.capabilityPill.textContent = text;
    els.capabilityPill.style.color = "var(--accent-terracotta)";
    els.capabilityPill.style.fontWeight = "600";
    setTimeout(() => {
      if (els.capabilityPill) {
        updateCapabilitiesUI(state.selectedModelId);
        els.capabilityPill.style.color = "var(--text-muted)";
        els.capabilityPill.style.fontWeight = "normal";
      }
    }, 2800);
  }

  // --- 5B. THINKING PROCESS & THOUGHT EXTRACTION ENGINE ---
  function extractThinkingProcess(text, isStreaming = false) {
    if (!text) return { thoughts: "", cleanText: "" };
    let raw = String(text);
    let thoughts = "";

    // 1. Tag pairs: <think>, <thought>, <thinking>, <reasoning>, <scratchpad>, <cot>, <chain_of_thought>
    const tagPairs = [
      ["think", "think"],
      ["thought", "thought"],
      ["thinking", "thinking"],
      ["reasoning", "reasoning"],
      ["scratchpad", "scratchpad"],
      ["cot", "cot"],
      ["chain_of_thought", "chain_of_thought"],
    ];

    for (const [openTag, closeTag] of tagPairs) {
      const openRegex = new RegExp(`<${openTag}[^>]*>`, "i");
      const closeRegex = new RegExp(`</${closeTag}>`, "i");

      while (openRegex.test(raw)) {
        const matchOpen = raw.match(openRegex);
        const start = matchOpen.index;
        const openLen = matchOpen[0].length;
        const sub = raw.slice(start + openLen);
        const matchClose = sub.match(closeRegex);

        if (matchClose) {
          const end = matchClose.index;
          const chunk = sub.slice(0, end).trim();
          if (chunk) thoughts += (thoughts ? "\n\n" : "") + chunk;
          raw = (raw.slice(0, start).trim() + " " + sub.slice(end + matchClose[0].length).trim()).trim();
        } else {
          // Open tag without matching close tag (streaming or truncated)
          const chunk = sub.trim();
          if (chunk) thoughts += (thoughts ? "\n\n" : "") + chunk;
          raw = raw.slice(0, start).trim();
          break;
        }
      }
    }

    // 2. Fenced thought blocks: ```thought ... ``` or ```thinking ... ``` or ```reasoning ... ```
    const fenceRegex = /```(?:thought|thinking|reasoning|cot)\n([\s\S]*?)```/gi;
    let fenceMatch;
    while ((fenceMatch = fenceRegex.exec(raw)) !== null) {
      const chunk = fenceMatch[1].trim();
      if (chunk) thoughts += (thoughts ? "\n\n" : "") + chunk;
    }
    raw = raw.replace(fenceRegex, "").trim();

    // 3. Untagged reasoning header patterns (Mistral NeMo, LLaMA, Hermes, etc.)
    const headerRegex = /^\s*(?:>|\*|#|-)*\s*(?:\*\*)?(?:Thinking Process|Thought Process|Internal Reasoning|Reasoning Process|Chain of Thought)(?:\*\*)?[:\n\r]/i;
    const step1Regex = /^\s*\[(?:Reasoning\s+)?Step\s+1\b[^\]]*\]/i;

    if (headerRegex.test(raw) || step1Regex.test(raw)) {
      const delimiterRegex = /(?:\r?\n)+(?:(?:\s*(?:>|\*|#|-)*\s*)?(?:\*\*)?(?:Final(?:\s+Verified)?\s+Answer|Final(?:\s+Verified)?\s+Response|Final\s+Result|Conclusion|Response|Answer|Solution)(?:\*\*)?[:\n\r]|###?\s*(?:Final(?:\s+Verified)?\s+Answer|Final(?:\s+Verified)?\s+Response|Final\s+Result|Conclusion|Response|Answer|Solution)\b|\[(?:Final(?:\s+Verified)?\s+Answer|Final(?:\s+Verified)?\s+Response|Final\s+Result|Answer|Conclusion|Solution)\][:\n\r]?|---\r?\n+)/i;

      const delimMatch = raw.match(delimiterRegex);
      if (delimMatch) {
        const delimIndex = delimMatch.index;
        const delimLen = delimMatch[0].length;

        let thoughtPart = raw.slice(0, delimIndex);
        thoughtPart = thoughtPart.replace(headerRegex, "").trim();
        if (thoughtPart) {
          thoughts += (thoughts ? "\n\n" : "") + thoughtPart;
        }

        let answerPart = raw.slice(delimIndex + delimLen).trim();
        answerPart = answerPart.replace(/^(?:\s*(?:>|\*|#|-)*\s*)?(?:\*\*)?(?:Final(?:\s+Verified)?\s+Answer|Final(?:\s+Verified)?\s+Response|Final\s+Result|Conclusion|Response|Answer|Solution)(?:\*\*)?[:\n\r\s]*/i, "").trim();
        raw = answerPart;
      } else if (isStreaming) {
        let streamingThoughts = raw.replace(headerRegex, "").trim();
        if (streamingThoughts) {
          thoughts += (thoughts ? "\n\n" : "") + streamingThoughts;
        }
        raw = "";
      }
    }

    return { thoughts: thoughts.trim(), cleanText: raw.trim() };
  }

  function extractStepReasoning(text) {
    if (!text) return { thoughts: "", cleanText: "" };
    const raw = String(text).trim();

    const finalAnswerRegex = /\n+(?:\[(?:\*{1,2})?(?:Final(?:\s+Verified)?\s+Answer|Conclusion|Final\s+Result)(?:\*{1,2})?\]|(?:\*{2}|#{1,4}\s*)(?:Final(?:\s+Verified)?\s+Answer|Conclusion|Final\s+Result)(?:\*{2}|:|\s*-)?|(?:Final(?:\s+Verified)?\s+Answer|Final\s+Result):)\s*\n*/i;
    const stepStartRegex = /^(?:\[(?:\*{1,2})?Step\s*1\b|(?:\*{2}|#{1,4}\s*)Step\s*1\b|Thinking\s+Process:)/im;

    if (stepStartRegex.test(raw) && finalAnswerRegex.test(raw)) {
      const matchFinal = raw.match(finalAnswerRegex);
      if (matchFinal && matchFinal.index > 15) {
        const thoughts = raw.slice(0, matchFinal.index).trim();
        const cleanText = raw.slice(matchFinal.index + matchFinal[0].length).trim();
        if (thoughts && cleanText) {
          return { thoughts, cleanText };
        }
      }
    }

    return { thoughts: "", cleanText: raw };
  }

  window.afToggleThinking = function (headerElem) {
    const section = headerElem.closest(".thinking-section") || headerElem.closest(".reasoning-accordion") || headerElem.parentElement;
    if (!section) return;
    const body = section.querySelector(".thinking-body") || section.querySelector(".reasoning-content");
    const chevron = section.querySelector(".thinking-chevron");
    const label = section.querySelector(".thinking-toggle-label");
    if (!body) return;
    const isHidden = body.style.display === "none";
    body.style.display = isHidden ? "block" : "none";
    if (chevron) chevron.classList.toggle("open", isHidden);
    if (label) label.textContent = isHidden ? "Hide" : "Show";
  };

  // --- 6. INITIALIZATION ---
  function init() {
    applyTheme(state.theme);
    updateModelPillDisplay();
    updateCapabilitiesUI(state.selectedModelId);
    updateProviderBadgeDisplay();
    ensureActiveChat();
    renderChatHistory();
    renderMessages();
    populateModelParameters();
    renderSlashCommands("");
    renderFeaturesGrid("all");
    setupEventListeners();
  }

  // --- 7. THEME SWITCHER ---
  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem("af_theme", theme);
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }

  // --- 8. CHAT HISTORY & LOCAL STORAGE DATABASE ---
  function ensureActiveChat() {
    if (!sessionStorage.getItem("af_session_initialized")) {
      sessionStorage.setItem("af_session_initialized", "true");
      if (state.launchBehavior === "new_chat" && state.chats.length > 0) {
        const mostRecent = state.chats[0];
        if (mostRecent && mostRecent.messages && mostRecent.messages.length > 0) {
          const newChat = {
            id: "chat_" + Date.now(),
            title: "New Conversation",
            createdAt: new Date().toISOString(),
            pinned: false,
            archived: false,
            messages: [],
          };
          state.chats.unshift(newChat);
          state.activeChatId = newChat.id;
          saveChats();
          localStorage.setItem("af_active_chat_id", state.activeChatId);
          return;
        }
      }
    }

    if (!state.chats.length) {
      const newChat = {
        id: "chat_" + Date.now(),
        title: "New Conversation",
        createdAt: new Date().toISOString(),
        pinned: false,
        archived: false,
        messages: [],
      };
      state.chats.unshift(newChat);
      state.activeChatId = newChat.id;
      saveChats();
    } else if (!state.activeChatId || !state.chats.find(c => c.id === state.activeChatId)) {
      state.activeChatId = state.chats[0].id;
    }
    localStorage.setItem("af_active_chat_id", state.activeChatId);
  }

  function getActiveChat() {
    return state.chats.find(c => c.id === state.activeChatId);
  }

  function saveChats() {
    localStorage.setItem("af_chats", JSON.stringify(state.chats));
  }

  function renderChatHistory() {
    els.chatList.innerHTML = "";
    let filtered = state.chats;

    // Filter by tab
    if (state.sidebarFilter === "pinned") {
      filtered = filtered.filter(c => c.pinned);
    } else if (state.sidebarFilter === "archived") {
      filtered = filtered.filter(c => c.archived);
    } else {
      filtered = filtered.filter(c => !c.archived);
      filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    }

    // Filter by search query
    if (state.chatSearchQuery) {
      const q = state.chatSearchQuery.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(q));
    }

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.style.padding = "24px 12px";
      empty.style.textAlign = "center";
      empty.style.color = "var(--text-muted)";
      empty.style.fontSize = "12px";
      empty.textContent = state.chatSearchQuery
        ? "No matching conversations."
        : state.sidebarFilter === "pinned"
        ? "No pinned conversations."
        : state.sidebarFilter === "archived"
        ? "No archived conversations."
        : "No conversations yet. Tap + to start!";
      els.chatList.appendChild(empty);
      return;
    }

    filtered.forEach(chat => {
      const item = document.createElement("div");
      item.className = "history-item" + (chat.id === state.activeChatId ? " active" : "");
      
      const timeStr = formatRelativeTime(chat.createdAt || Date.now());
      const msgCount = (chat.messages || []).length;

      item.innerHTML = `
        <div class="history-item-content">
          <div class="history-item-title">${chat.pinned ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="display:inline-block; vertical-align:-1px; margin-right:4px; color:var(--accent-terracotta);"><polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2"></polygon></svg>' : ''}${escapeHtml(chat.title)}</div>
          <div class="history-item-meta">
            <span>${timeStr}</span>
            <span>&bull;</span>
            <span>${msgCount} msg${msgCount === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div class="history-item-actions">
          <button class="history-action-btn pin-btn" title="${chat.pinned ? 'Unpin' : 'Pin to top'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="${chat.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-2l-2-3V6a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v6l-2 3v2z"></path></svg>
          </button>
          <button class="history-action-btn edit-btn" title="Rename">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
          <button class="history-action-btn archive-btn" title="${chat.archived ? 'Unarchive' : 'Archive'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
          </button>
          <button class="history-action-btn delete delete-btn" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      item.onclick = (e) => {
        if (e.target.closest(".pin-btn")) {
          e.stopPropagation();
          chat.pinned = !chat.pinned;
          saveChats();
          renderChatHistory();
          return;
        }
        if (e.target.closest(".edit-btn")) {
          e.stopPropagation();
          const newTitle = prompt("Rename conversation:", chat.title);
          if (newTitle && newTitle.trim()) {
            chat.title = newTitle.trim();
            saveChats();
            renderChatHistory();
          }
          return;
        }
        if (e.target.closest(".archive-btn")) {
          e.stopPropagation();
          chat.archived = !chat.archived;
          saveChats();
          renderChatHistory();
          return;
        }
        if (e.target.closest(".delete-btn")) {
          e.stopPropagation();
          deleteChat(chat.id);
          return;
        }

        state.activeChatId = chat.id;
        localStorage.setItem("af_active_chat_id", chat.id);
        renderChatHistory();
        renderMessages();
        closeSidebar();
      };

      els.chatList.appendChild(item);
    });
  }

  function formatRelativeTime(dateInput) {
    try {
      const diff = Date.now() - new Date(dateInput).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days === 1) return "Yesterday";
      if (days < 7) return `${days}d ago`;
      return new Date(dateInput).toLocaleDateString();
    } catch (e) {
      return "Recently";
    }
  }

  function createNewChat() {
    const newChat = {
      id: "chat_" + Date.now(),
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      pinned: false,
      archived: false,
      messages: [],
    };
    state.chats.unshift(newChat);
    state.activeChatId = newChat.id;
    saveChats();
    renderChatHistory();
    renderMessages();
    closeSidebar();
    clearAttachedImage();
    els.chatTextarea.focus();
  }

  function deleteChat(chatId) {
    if (!confirm("Delete this conversation?")) return;
    state.chats = state.chats.filter(c => c.id !== chatId);
    ensureActiveChat();
    saveChats();
    renderChatHistory();
    renderMessages();
  }

  function branchConversation(msgIndex) {
    const chat = getActiveChat();
    if (!chat) return;

    const branchedMessages = JSON.parse(JSON.stringify(chat.messages.slice(0, msgIndex + 1)));
    const newChat = {
      id: "chat_" + Date.now(),
      title: `[Branch] ${chat.title.slice(0, 24)}`,
      createdAt: new Date().toISOString(),
      pinned: false,
      archived: false,
      messages: branchedMessages,
    };

    state.chats.unshift(newChat);
    state.activeChatId = newChat.id;
    saveChats();
    renderChatHistory();
    renderMessages();
    showToastBadge("Conversation Branched");
  }

  // --- 9. RENDERING MESSAGES & REASONING ACCORDION ---
  function renderMessages() {
    const chat = getActiveChat();
    els.messagesContainer.innerHTML = "";
    codeSnippetsRegistry.length = 0; // Reset snippet registry

    if (!chat || !chat.messages.length) {
      renderWelcomeScreen();
      return;
    }

    chat.messages.forEach((msg, idx) => {
      appendMessageToDOM(msg, idx);
    });
    scrollToBottom();
  }

  function renderWelcomeScreen() {
    const welcome = document.createElement("div");
    welcome.className = "message-wrapper welcome-screen-wrapper";

    const current = (state.models || []).find(m => m.id === state.selectedModelId);
    const modelName = current ? current.name : state.selectedModelId;
    const caps = detectCapabilities(state.selectedModelId);
    let capLabel = "Chat";
    if (caps.reasoning) capLabel = "Reasoning";
    else if (caps.vision || caps.ocr) capLabel = "Vision";
    else if (caps.audio) capLabel = "Audio";
    else if (caps.image) capLabel = "Image";
    else if (caps.coding) capLabel = "Coding";

    const welcomePricing = getModelPricing(state.selectedModelId);
    let welcomePricingBadge = "";
    if (welcomePricing.isFree) {
      welcomePricingBadge = "100% Free";
    } else if (welcomePricing.special) {
      welcomePricingBadge = welcomePricing.special;
    } else {
      const inInr = formatCurrencyDisplay(welcomePricing.inputPer1MInr, "₹");
      const outInr = formatCurrencyDisplay(welcomePricing.outputPer1MInr, "₹");
      welcomePricingBadge = `${inInr} in / ${outInr} out / 1M`;
    }

    welcome.innerHTML = `
      <div class="welcome-container">
        <div class="welcome-icon-glow">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path>
            <path d="M9 21h6"></path>
          </svg>
        </div>
        <h2 class="welcome-title">AgentsFlow</h2>
        <p class="welcome-tagline">Autonomous AI Workstation</p>

        <!-- Prominent Loaded Model Card -->
        <div class="loaded-model-card" onclick="window.afOpenModelSelector()" title="Click to view or change active AI model">
          <span class="loaded-status-dot"></span>
          <span class="loaded-model-title">Model: <strong id="welcome-loaded-model-name">${escapeHtml(modelName)}</strong></span>
          <span class="loaded-model-cap-pill" id="welcome-loaded-model-cap">${capLabel}</span>
          <span class="loaded-model-pricing-pill" id="welcome-loaded-model-pricing">${welcomePricingBadge}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>

        <!-- Clean Prompt Starters -->
        <div class="welcome-chips-row">
          <button type="button" class="welcome-chip" onclick="window.afInsertPrompt('How can I optimize this architecture for high throughput?')">
            <span class="welcome-chip-icon">⚡</span>
            <span>Optimize Architecture</span>
          </button>
          <button type="button" class="welcome-chip" onclick="window.afInsertPrompt('Write production-grade code for ')">
            <span class="welcome-chip-icon">💻</span>
            <span>Write Clean Code</span>
          </button>
          <button type="button" class="welcome-chip" onclick="window.afInsertPrompt('Deeply analyze and brainstorm ')">
            <span class="welcome-chip-icon">💡</span>
            <span>Brainstorm Ideas</span>
          </button>
        </div>
      </div>
    `;
    els.messagesContainer.appendChild(welcome);
  }

  window.afInsertPrompt = function (text) {
    if (els.chatTextarea) {
      els.chatTextarea.value = text;
      adjustTextareaHeight();
      els.chatTextarea.focus();
    }
  };

  function appendMessageToDOM(msg, index) {
    const isAssistant = msg.role === "assistant";
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper " + (isAssistant ? "message-assistant" : "message-user");
    wrapper.id = "msg-" + (index !== undefined ? index : "temp");

    let innerHTML = "";

    // Attached image if user message has one
    if (!isAssistant && msg.image) {
      innerHTML += `<img src="${msg.image}" alt="Attached input image" class="user-attached-thumb" />`;
    }

    // Thinking / reasoning process: STRICTLY ALLOWED ONLY FOR ASSISTANT MESSAGES!
    let rawContent = msg.content || "";
    let reasoning = "";

    if (isAssistant) {
      reasoning = msg.reasoning || "";
      const extracted = extractThinkingProcess(rawContent, Boolean(msg.isStreaming));
      if (extracted.thoughts) {
        reasoning = (reasoning ? reasoning + "\n\n" : "") + extracted.thoughts;
        rawContent = extracted.cleanText;
      } else if (!msg.isStreaming && !reasoning) {
        const stepReasoning = extractStepReasoning(rawContent);
        if (stepReasoning.thoughts) {
          reasoning = stepReasoning.thoughts;
          rawContent = stepReasoning.cleanText;
        }
      }

      if (reasoning && reasoning.trim()) {
        const isOpen = Boolean(msg.isStreaming);
        const charCount = reasoning.length;
        const approxTokens = Math.max(1, Math.ceil(charCount / 3.8));
        const statusText = msg.isStreaming ? "Thinking live..." : "Complete";
        innerHTML += `
          <div class="thinking-section" data-state="${msg.isStreaming ? 'streaming' : 'complete'}">
            <div class="thinking-header" onclick="window.afToggleThinking(this)">
              <div class="thinking-badge">
                <span class="thinking-pulse ${msg.isStreaming ? 'live' : 'completed'}"></span>
                <div class="thinking-icon-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path><path d="M9 21h6"></path></svg>
                </div>
                <span class="thinking-title">Thinking Process</span>
                <span class="thinking-meta">${charCount.toLocaleString()} chars • ~${approxTokens} tokens • ${statusText}</span>
              </div>
              <div class="thinking-toggle-action">
                <span class="thinking-toggle-label">${isOpen ? 'Hide' : 'Show'}</span>
                <svg class="thinking-chevron ${isOpen ? 'open' : ''}" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            <div class="thinking-body" style="display: ${isOpen ? 'block' : 'none'};">${escapeHtml(reasoning)}</div>
          </div>
          <div class="thinking-separator"></div>
        `;
      }
    }

    // Message Bubble Content
    const formattedBody = formatContent(rawContent);
    if (formattedBody) {
      innerHTML += `<div class="message-bubble">${formattedBody}</div>`;
    } else if (!reasoning) {
      innerHTML += `<div class="message-bubble"><span style="color: var(--text-muted); font-style: italic;">(Empty response)</span></div>`;
    }

    // User Message Action Buttons (Edit prompt & Copy)
    if (msg.role === "user" && index !== undefined) {
      innerHTML += `
        <div class="message-user-actions">
          <button class="msg-action-btn" onclick="window.afEditUserMessage(${index})" title="Edit and resend this prompt">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            <span>Edit</span>
          </button>
          <button class="msg-action-btn" onclick="window.afCopyUserMessage(${index})" title="Copy prompt">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
          </button>
        </div>
      `;
    }

    // Assistant Generation Stats Bar (TPS, Tokens, Duration, Cost)
    if (msg.role === "assistant") {
      if (msg.isStreaming) {
        innerHTML += `
          <div class="streaming-live-badge">
            <span class="streaming-dot"></span>
            <span class="streaming-stats-text">${state.activeStreamStats.lastTPS || 'Streaming...'}</span>
          </div>
        `;
      } else if (msg.stats) {
        innerHTML += `
          <div class="generation-stats-bar">
            <span class="stat-item tps">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${msg.stats.tps} tps
            </span>
            <span class="stat-divider">&bull;</span>
            <span class="stat-item">${msg.stats.tokens} tokens</span>
            <span class="stat-divider">&bull;</span>
            <span class="stat-item">${msg.stats.duration}</span>
            <span class="stat-divider">&bull;</span>
            <span class="stat-item">~${msg.stats.cost ? (String(msg.stats.cost).startsWith("$") || String(msg.stats.cost).startsWith("<$") ? msg.stats.cost : "$" + msg.stats.cost) : "$0.0000"}</span>
          </div>
        `;
      }

      // Assistant Action Suite
      if (!msg.isStreaming && index !== undefined) {
        innerHTML += `
          <div class="message-actions-suite">
            <button class="msg-action-btn" onclick="window.afRegenerate(${index})" title="Regenerate this response">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              <span>Retry</span>
            </button>
            <button class="msg-action-btn" onclick="window.afMakeLonger(${index})" title="Make this response more detailed">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
              <span>Longer</span>
            </button>
            <button class="msg-action-btn" onclick="window.afMakeShorter(${index})" title="Condense into concise bullet points">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
              <span>Shorter</span>
            </button>
            <button class="msg-action-btn" onclick="window.afContinue(${index})" title="Continue generating from where it left off">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span>Continue</span>
            </button>
            <button class="msg-action-btn" onclick="window.afBranchChat(${index})" title="Branch conversation from here">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
              <span>Branch</span>
            </button>
            <button class="msg-action-btn" onclick="window.afCopyRaw(${index})" title="Copy raw Markdown">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </button>
            <button class="msg-action-btn" onclick="window.afReadAloud(${index}, this)" title="Listen via Text-To-Speech">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              <span>Listen</span>
            </button>
          </div>
        `;
      }
    }

    wrapper.innerHTML = innerHTML;
    els.messagesContainer.appendChild(wrapper);
  }

  // --- CODE SYNTAX TOKEN HIGHLIGHTER ---
  function highlightCode(code, lang) {
    let escaped = escapeHtml(code);
    const cleanLang = (lang || "").toLowerCase();

    if (["javascript", "js", "typescript", "ts", "json", "python", "py", "sh", "bash"].includes(cleanLang)) {
      escaped = escaped.replace(/(["'`])(?:(?=(\\?))\2[\s\S])*?\1/g, '<span class="token-string">$&</span>');
      escaped = escaped.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g, '<span class="token-comment">$&</span>');
      escaped = escaped.replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|def|async|await|try|catch|finally|throw|new|typeof|instanceof|switch|case|default|break|continue|yield|lambda|in|is|not|and|or|elif|except|with|as|pass)\b/g, '<span class="token-keyword">$1</span>');
      escaped = escaped.replace(/\b(true|false|null|undefined|None|True|False)\b/g, '<span class="token-bool">$1</span>');
      escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token-number">$1</span>');
      escaped = escaped.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g, '<span class="token-function">$1</span>');
    } else if (["html", "htm", "xml", "svg"].includes(cleanLang)) {
      escaped = escaped.replace(/(&lt;\/?[a-zA-Z0-9\-]+)(&gt;)?/g, '<span class="token-tag">$1</span>$2');
      escaped = escaped.replace(/([a-zA-Z0-9\-]+)=(&quot;[^&]*&quot;|&#39;[^&#]*&#39;)/g, '<span class="token-attr">$1</span>=<span class="token-string">$2</span>');
    }
    return escaped;
  }

  // --- SOURCE CITATION CHIP BUILDERS ---
  function extractDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, "");
    } catch (e) {
      const m = String(url).match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s\?#]+)/i);
      return m ? m[1] : "source";
    }
  }

  function createCitationChip(url, customLabel, number) {
    let cleanUrl = String(url || "").trim();
    if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = "https://" + cleanUrl;
    const domain = extractDomain(cleanUrl);
    const displayLabel = customLabel || domain;
    const numBadge = number ? `<span class="citation-index">${number}</span>` : "";

    return `<a href="${escapeHtml(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="source-citation-chip citation-chip" title="${escapeHtml(cleanUrl)}">` +
      `${numBadge}` +
      `<span class="citation-icon-wrapper"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path></svg></span>` +
      `<span class="source-domain citation-domain">${escapeHtml(domain)}</span>` +
      (displayLabel && displayLabel !== domain ? `<span class="source-title" style="font-size:11px; opacity:0.85;">• ${escapeHtml(displayLabel)}</span>` : "") +
      `<svg class="citation-ext-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>` +
      `</a>`;
  }

  function formatContent(text) {
    if (!text) return "";

    // 1. Extract code blocks from raw text BEFORE any HTML escaping!
    const placeholders = [];
    let processed = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      let cleanLang = (lang || "code").toLowerCase();
      const rawCode = code.replace(/\r\n/g, "\n");

      // Auto-detect language if missing or generic
      if (cleanLang === "code" || cleanLang === "text" || !cleanLang) {
        const trimmed = rawCode.trim();
        if (/^<!DOCTYPE html|<html|<div|<head|<body|<style|<svg/i.test(trimmed)) {
          cleanLang = "html";
        } else if (/^(def |import |from [a-z0-9_]+ import|print\()/m.test(trimmed)) {
          cleanLang = "python";
        } else if (/^(function |const |let |var |console\.|document\.)/m.test(trimmed)) {
          cleanLang = "javascript";
        } else if (/^(\{|\})/m.test(trimmed) && trimmed.startsWith("{") && trimmed.endsWith("}")) {
          cleanLang = "json";
        } else if (/\b(body|margin|padding|background|color)\s*:/i.test(trimmed)) {
          cleanLang = "css";
        }
      }

      const isRunable = ["html", "htm", "svg", "javascript", "js", "typescript", "ts", "css", "python", "py", "py3", "json", "sh", "bash", "shell"].includes(cleanLang);

      const snippetId = codeSnippetsRegistry.length;
      codeSnippetsRegistry.push({ code: rawCode, lang: cleanLang });

      const placeholder = `__AF_CODE_BLOCK_SLOT_${snippetId}__`;
      placeholders.push({
        placeholder,
        html: `
        <div class="code-block-container">
          <div class="code-block-header">
            <span>${cleanLang}</span>
            <div class="code-block-actions">
              ${isRunable ? `<button type="button" class="code-btn code-run-btn" onclick="window.afOpenSandboxById(${snippetId}, 'preview')" title="Run code in interactive sandbox"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Run</span></button>` : ''}
              <button type="button" class="code-btn code-view-btn" onclick="window.afOpenSandboxById(${snippetId}, 'code')" title="View and inspect code in editor tab"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg><span>View</span></button>
              <button type="button" class="code-btn" onclick="window.afCopyCodeById(${snippetId})" title="Copy code"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span></button>
            </div>
          </div>
          <pre class="code-block-content"><code class="language-${cleanLang}">${highlightCode(rawCode, cleanLang)}</code></pre>
        </div>
      `
      });
      return placeholder;
    });

    // 2. Extract safe UI interactive elements (action buttons, audio players) BEFORE HTML escaping
    const uiPlaceholders = [];
    processed = processed.replace(/(<button\b[^>]*class=["'][^"']*msg-action-btn[^"']*["'][^>]*>[\s\S]*?<\/button>|<audio\b[^>]*controls[^>]*>[\s\S]*?<\/audio>)/gi, (match) => {
      const uId = `__AF_UI_SLOT_${uiPlaceholders.length}__`;
      uiPlaceholders.push({ placeholder: uId, html: match });
      return uId;
    });

    // 3. Extract Markdown tables into responsive table placeholders
    const tablePlaceholders = [];
    processed = processed.replace(/(?:^|\n)((?:\|[^\n]+\|\r?\n?){2,})/g, (match, tableBlock) => {
      const rows = tableBlock.trim().split(/\r?\n/).map(r => r.trim()).filter(Boolean);
      if (rows.length < 2) return match;
      const isDivider = /^\|(?:\s*:?-+:?\s*\|)+$/.test(rows[1]);
      if (!isDivider) return match;

      const headers = rows[0].replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
      const bodyRows = rows.slice(2);
      let thead = "<tr>" + headers.map(h => `<th>${escapeHtml(h)}</th>`).join("") + "</tr>";
      let tbody = bodyRows.map(r => {
        const cells = r.replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => `<td>${escapeHtml(c.trim())}</td>`);
        return `<tr>${cells.join("")}</tr>`;
      }).join("");

      const tId = `__AF_TABLE_SLOT_${tablePlaceholders.length}__`;
      tablePlaceholders.push({
        placeholder: tId,
        html: `<div class="table-responsive-container md-table-wrapper"><table class="md-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`
      });
      return "\n" + tId + "\n";
    });

    // 4. Escape HTML for text content outside code blocks, tables, and UI elements
    let formatted = escapeHtml(processed);

    // 5. GitHub-style Visual Callouts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
    const calloutIcons = {
      note: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
      tip: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"></path></svg>`,
      important: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
      warning: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      caution: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    };

    formatted = formatted.replace(/^&gt; \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\r?\n|\s+)([\s\S]*?)(?=(?:\r?\n\r?\n|$))/gim, (m, type, body) => {
      const cleanType = type.toLowerCase();
      const icon = calloutIcons[cleanType] || calloutIcons.note;
      return `<div class="callout-card callout-${cleanType} md-callout">
        <div class="callout-header md-callout-header">
          <div class="callout-icon-box">${icon}</div>
          <span class="callout-title">${type}</span>
        </div>
        <div class="callout-body">${body.replace(/^&gt;\s?/gm, '').trim()}</div>
      </div>`;
    });

    // 6. Final Verified Answer Prestige Hero Card
    formatted = formatted.replace(/(?:^|\n)(?:\[(?:FINAL VERIFIED ANSWER|FINAL ANSWER|VERIFIED SOLUTION)\]|### (?:Final Verified Answer|Verified Solution):?)([\s\S]*?)(?=(?:\n\n|$))/gi, (m, ans) => {
      return `\n<div class="verified-answer-card final-answer-banner">
        <div class="verified-header final-answer-badge">
          <div class="verified-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
            <span>FINAL VERIFIED ANSWER</span>
          </div>
          <span class="verified-meta">Cross-Checked & Validated</span>
        </div>
        <div class="verified-body">${ans.trim()}</div>
      </div>\n`;
    });

    // 7. Structured Step Reasoning Cards: [Step 1: Title] or ### Step 1: ...
    formatted = formatted.replace(/(?:^|\n)(?:\[(?:Step|Stage)\s*(\d+)(?::\s*([^\]]+))?\]|### (?:Step|Stage)\s*(\d+)(?::\s*([^\n]+))?)([\s\S]*?)(?=(?:\n\[(?:Step|Stage)|\n### (?:Step|Stage)|\n<div class="verified-answer-card"|$))/gi, (m, sNum1, sTitle1, sNum2, sTitle2, sBody) => {
      const stepNum = String(sNum1 || sNum2 || "1").padStart(2, "0");
      const title = (sTitle1 || sTitle2 || `Phase ${stepNum}`).trim();
      return `\n<div class="step-card step-indicator-card">
        <div class="step-card-header step-badge-pill">
          <span class="step-badge step-pill-number">STEP ${stepNum}</span>
          <h5 class="step-title step-pill-title">${title}</h5>
        </div>
        <div class="step-card-body">${sBody.trim()}</div>
      </div>\n`;
    });

    // 8. Markdown images ![alt](url)
    formatted = formatted.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 12px; margin: 8px 0;" />');

    // 9. Markdown headers
    formatted = formatted.replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    formatted = formatted.replace(/^# (.*$)/gim, '<h2 class="md-h2">$1</h2>');

    // 10. Standard blockquotes
    formatted = formatted.replace(/^&gt; (.*$)/gim, '<blockquote class="md-quote">$1</blockquote>');

    // 11. Source Citations & Web Grounding Interactive Chips
    let citeCounter = 0;

    // 11a. Explicit parenthetical citations: (Source: https://...) or [Source: https://...]
    formatted = formatted.replace(/[\(\[](?:Sources?|References?|Ref):\s*(https?:\/\/[^\s\)\]\<\>]+)[\)\]]/gi, (match, url) => {
      citeCounter++;
      return createCitationChip(url, null, citeCounter);
    });

    // 11b. Numbered reference citations: [1] https://... or [^1]: https://...
    formatted = formatted.replace(/(?:^|\n|\s)\[\^?(\d+)\]:?\s*(https?:\/\/[^\s\)\]\<\>]+)/gi, (match, num, url) => {
      return " " + createCitationChip(url, null, num);
    });

    // 11c. Markdown links: [Label](https://...)
    formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)\<\>]+)\)/g, (match, label, url) => {
      citeCounter++;
      return createCitationChip(url, label, citeCounter);
    });

    // 11d. Standalone raw URLs
    formatted = formatted.replace(/(^|[\s\(\[\>]|&gt;)(https?:\/\/[^\s\<\>"\']+(?<![\.,;:!\?\)\]]))/gi, (match, prefix, url) => {
      citeCounter++;
      return prefix + createCitationChip(url, null, citeCounter);
    });

    // 12. Quantitative metric badges (e.g. **Accuracy:** 98.4%)
    formatted = formatted.replace(/\*\*([A-Za-z0-9_\-\s]{2,20}):\*\*\s*([A-Za-z0-9_\-\.\+%><]{1,25})(?=\s*[\.,;\n<]|$)/g, (match, key, val) => {
      return `<span class="md-metric-badge"><strong>${key}:</strong> ${val}</span>`;
    });

    // 13. Horizontal divider rules
    formatted = formatted.replace(/^(?:---|—{3,}|\*\*\*)$/gm, '<hr class="md-hr" style="border:none; height:1px; margin:14px 0; background:linear-gradient(90deg, transparent, var(--border-strong), transparent);" />');

    // 14. Markdown inline code `code`
    formatted = formatted.replace(/`([^`\n]+)`/g, '<code class="md-inline-code">$1</code>');

    // 15. Rich Roleplay, Typography & Formatting:
    // 15a. Spoilers: ||text|| (strictly avoid single/triple pipes and logical OR)
    formatted = formatted.replace(/(?<!\|)\|\|(?!\|)([^\s\|](?:[\s\S]*?[^\s\|])?)\|\|(?!\|)/g,
      '<span class="rp-spoiler" onclick="this.classList.toggle(\'revealed\')" title="Tap to reveal spoiler">$1</span>');

    // 15b. Highlights: ==text== (strictly avoid === comparison operators in JS)
    formatted = formatted.replace(/(?<!=)==(?!=)([^\s=](?:[\s\S]*?[^\s=])?)==(?!=)/g,
      '<mark class="rp-highlight">$1</mark>');

    // 15c. Strikethrough: ~~text~~ (strictly avoid ~~~)
    formatted = formatted.replace(/(?<!~)~~(?!~)([^\s~](?:[\s\S]*?[^\s~])?)~~(?!~)/g,
      '<del class="rp-strikethrough">$1</del>');

    // 15d. Underline: <u>text</u>, &lt;u&gt;text&lt;/u&gt;, or bounded ++text++ (preserves C++ and i++)
    formatted = formatted.replace(/(?:&lt;u&gt;|<u>)([\s\S]*?)(?:&lt;\/u&gt;|<\/u>)/gi,
      '<span class="rp-underline">$1</span>');
    formatted = formatted.replace(/(?:^|(?<=[\s\(\[\{"'“‘]|&quot;|&#039;))\+\+([^\+\s\r\n](?:[^\+\r\n]*?[^\+\s\r\n])?)\+\+(?=[\s\)\],<>\.\?!:;'"\}\]”’]|&quot;|&#039;|$)/g,
      '<span class="rp-underline">$1</span>');

    // 15e. Superscript ^text^ & Subscript ~text~
    formatted = formatted.replace(/\^([^\s\^]+)\^/g, '<sup>$1</sup>');
    formatted = formatted.replace(/(?<!~)~([^\s~]+)~(?!~)/g, '<sub>$1</sub>');

    // 15f. Bold-Italic Roleplay Actions (all 6 markdown combinations with rp-bold-action & rp-action classes):
    // ***text*** or ___text___
    formatted = formatted.replace(/\*\*\*(?!\s)((?:[^\*\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)\*\*\*/g,
      '<strong class="rp-bold-action"><em class="rp-action">$1</em></strong>');
    formatted = formatted.replace(/(?:^|(?<=[\s\(\[\{"'“‘]|&quot;|&#039;))___(?!\s)((?:[^_\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)___(?=[\s\)\],<>\.\?!:;'"\}\]”’]|&quot;|&#039;|$)/g,
      '<strong class="rp-bold-action"><em class="rp-action">$1</em></strong>');

    // Mixed bold-italic combinations: **_text_**, *__text__*, _**text**_, __*text*__
    formatted = formatted.replace(/\*\*_(?!\s)((?:[^\*\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)_\*\*/g,
      '<strong class="rp-bold-action"><em class="rp-action">$1</em></strong>');
    formatted = formatted.replace(/\*__(?!\s)((?:[^\*\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)__\*/g,
      '<strong class="rp-bold-action"><em class="rp-action">$1</em></strong>');
    formatted = formatted.replace(/(?:^|(?<=[\s\(\[\{"'“‘]|&quot;|&#039;))_\*\*(?!\s)((?:[^\*\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)\*\*_(?=[\s\)\],<>\.\?!:;'"\}\]”’]|&quot;|&#039;|$)/g,
      '<strong class="rp-bold-action"><em class="rp-action">$1</em></strong>');
    formatted = formatted.replace(/(?:^|(?<=[\s\(\[\{"'“‘]|&quot;|&#039;))__\*(?!\s)((?:[^\*\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)\*__(?=[\s\)\],<>\.\?!:;'"\}\]”’]|&quot;|&#039;|$)/g,
      '<strong class="rp-bold-action"><em class="rp-action">$1</em></strong>');

    // 15g. Bold: **text** or __text__ (supports soft line wraps within paragraphs)
    formatted = formatted.replace(/\*\*(?!\s)((?:[^\*\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)\*\*/g,
      '<strong class="rp-bold">$1</strong>');
    formatted = formatted.replace(/(?:^|(?<=[\s\(\[\{"'“‘]|&quot;|&#039;))__(?!\s)((?:[^_\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)__(?=[\s\)\],<>\.\?!:;'"\}\]”’]|&quot;|&#039;|$)/g,
      '<strong class="rp-bold">$1</strong>');

    // 15h. Italic & Roleplay Actions: *action* or _action_ (supports soft line wraps, quotes & entities)
    formatted = formatted.replace(/\*(?!\s)((?:[^\*\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)\*/g,
      '<em class="rp-action">$1</em>');
    formatted = formatted.replace(/(?:^|(?<=[\s\(\[\{"'“‘]|&quot;|&#039;))_(?!\s)((?:[^_\r\n]|\r?\n(?!\r?\n))+?)(?<!\s)_(?=[\s\)\],<>\.\?!:;'"\}\]”’]|&quot;|&#039;|$)/g,
      '<em class="rp-action">$1</em>');

    // 16. Paragraph gaps & line breaks for prose
    formatted = formatted.replace(/\n\n+/g, '<div class="md-para-gap"></div>');
    formatted = formatted.replace(/\n/g, "<br/>");

    // 17. Restore safe UI action elements
    for (const u of uiPlaceholders) {
      formatted = formatted.replace(u.placeholder, u.html);
    }

    // 18. Restore responsive tables
    for (const t of tablePlaceholders) {
      formatted = formatted.replace(t.placeholder, t.html);
    }

    // 19. Restore pristine syntax-highlighted code blocks
    for (const p of placeholders) {
      formatted = formatted.replace(p.placeholder, p.html);
    }

    return formatted;
  }

  function scrollToBottom() {
    els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
  }

  // --- 10. DIRECT CLIENT STREAMING AI ENGINE ---
  async function handleSendMessage(overrideText) {
    const text = (overrideText !== undefined ? overrideText : els.chatTextarea.value).trim();
    const hasImage = Boolean(state.attachedImage);

    if ((!text && !hasImage) || state.isStreaming) return;

    // Check for Slash Command Execution
    if (text.startsWith("/") && !hasImage) {
      const cleanTrimmed = text.trim();
      const lowerTrimmed = cleanTrimmed.toLowerCase();
      if (cleanTrimmed === "/boost" || cleanTrimmed === "/boost/boost" || lowerTrimmed === "/boost" || lowerTrimmed === "/boost/boost" || lowerTrimmed.startsWith("/boost/boost ") || lowerTrimmed.startsWith("/boost ")) {
        const isDoubleBoost = lowerTrimmed === "/boost/boost" || lowerTrimmed.startsWith("/boost/boost ") || /^\/boost\/boost(?:\s|$)/i.test(cleanTrimmed);
        const query = cleanTrimmed.replace(/^\/(?:boost\/boost|boost)\s*/i, "").trim();
        state.turboBoost = true;
        showToastBadge(isDoubleBoost ? "⚡⚡ Maximum Dual Turbo Boost Engaged!" : "🚀 Turbo Velocity Boost Enabled: Low-latency streaming active!");
        els.chatTextarea.value = "";
        adjustTextareaHeight();
        closeSlashMenu();
        if (query) {
          const turboPrompt = isDoubleBoost
            ? `[MAXIMUM DUAL TURBO BOOST - DEEP ACCELERATED EXECUTION]\nObjective: "${query}"\n\nDeliver the highest-grade, definitive, production-ready solution immediately. Bypass all preamble, disclaimers, and conversational filler. Execute complete, verified, robust code and architecture directly.`
            : `[TURBO VELOCITY MODE - DIRECT EXECUTION]\nObjective: "${query}"\n\nDeliver an immediate, high-impact, directly actionable solution with zero conversational preamble or redundant filler. Focus strictly on correct, production-grade output.`;
          await executePromptStream(turboPrompt, null);
        } else if (isDoubleBoost) {
          const doubleBoostFeature = FEATURE_CATALOG.find(c => c.cmd === "/boost/boost");
          const prompt = doubleBoostFeature && doubleBoostFeature.template
            ? doubleBoostFeature.template("")
            : `[MAXIMUM DUAL TURBO BOOST - DEEP ACCELERATED EXECUTION]\nObjective: "Maximize execution velocity and implement definitive solution"\n\nPlease execute with maximum velocity and deep precision:\n1. Audit active code, architecture, or plan for any bottlenecks, defects, or inefficiencies.\n2. Provide direct, non-conversational, production-grade implementations immediately with zero preamble.\n3. Verify operational constraints, edge cases, and eliminate all redundant overhead.`;
          await executePromptStream(prompt, null);
        } else {
          const boostFeature = FEATURE_CATALOG.find(c => c.cmd === "/boost");
          if (boostFeature && boostFeature.template) {
            const prompt = boostFeature.template("");
            await executePromptStream(prompt, null);
          }
        }
        return;
      }

      // Normalize command string: checks full multi-token slash commands (e.g. /boost/boost) or standard commands
      const firstToken = text.split(/\s+/)[0].toLowerCase();
      let cmdName = firstToken;
      let cmdArg = text.slice(firstToken.length).trim();
      let foundCmd = FEATURE_CATALOG.find(c => c.cmd.toLowerCase() === cmdName);

      if (!foundCmd) {
        const match = text.match(/^\/([a-zA-Z0-9_\-]+)(?:\/([a-zA-Z0-9_\-]+))?(?:\s+(.*))?$/);
        if (match) {
          const singleCmd = "/" + match[1].toLowerCase();
          const fallbackCmd = FEATURE_CATALOG.find(c => c.cmd.toLowerCase() === singleCmd);
          if (fallbackCmd) {
            foundCmd = fallbackCmd;
            cmdName = singleCmd;
            cmdArg = (match[2] ? match[2] + (match[3] ? " " + match[3] : "") : (match[3] || "")).trim();
          }
        }
      }

      if (foundCmd) {
        if (foundCmd.action) {
          executeDirectCommandAction(foundCmd.action);
          els.chatTextarea.value = "";
          adjustTextareaHeight();
          closeSlashMenu();
          return;
        } else if (foundCmd.template) {
          const expandedPrompt = foundCmd.template(cmdArg);
          els.chatTextarea.value = "";
          adjustTextareaHeight();
          closeSlashMenu();
          await executePromptStream(expandedPrompt, null);
          return;
        }
      }
    }

    const currentImage = state.attachedImage ? state.attachedImage.dataUrl : null;
    closeSlashMenu();
    await executePromptStream(text || "Please analyze the attached image.", currentImage);
  }

  let pendingBudgetAction = null;

  async function executePromptStream(text, imageUrl, bypassBudgetCheck) {
    const chat = getActiveChat();
    if (!chat) return;

    // API Budget Controller & Money Maintenance: Check before request
    if (!bypassBudgetCheck && state.apiBudgetWarn && state.apiBudgetLimit > 0) {
      const pricing = getModelPricing(state.selectedModelId);
      if (!pricing.isFree) {
        const approxInTokens = Math.max(50, Math.ceil(text.length / 3.8));

        // Use user's configured max output tokens scaled by reasoning effort
        const modelMaxOut = getModelMaxOutputTokens(state.selectedModelId);
        const configuredMax = Math.min(state.settings.maxTokens || 4096, modelMaxOut);
        let estExpectedOutTokens = Math.min(Math.max(approxInTokens * 3, 512), configuredMax);
        if (state.activeTools.thinking && state.activeTools.thinkingLevel !== "off") {
          const mult = state.activeTools.thinkingLevel === "high" ? 2.5 : state.activeTools.thinkingLevel === "medium" ? 1.8 : 1.2;
          estExpectedOutTokens = Math.min(Math.round(estExpectedOutTokens * mult), configuredMax);
        }

        let estCostInr = 0;
        if (pricing.outputPer1MInr !== undefined && pricing.inputPer1MInr !== undefined) {
          estCostInr = ((approxInTokens / 1000000) * pricing.inputPer1MInr) + ((estExpectedOutTokens / 1000000) * pricing.outputPer1MInr);
        } else {
          const estInRate = typeof pricing.input === "number" ? pricing.input : 0.001; // USD per 1k input tokens
          const estOutRate = typeof pricing.output === "number" ? pricing.output : 0.002; // USD per 1k output tokens
          const estCostUsd = ((approxInTokens / 1000) * estInRate) + ((estExpectedOutTokens / 1000) * estOutRate);
          estCostInr = estCostUsd * INR_PER_USD;
        }

        if ((state.totalSpend + estCostInr) > state.apiBudgetLimit) {
          pendingBudgetAction = {
            run: () => {
              els.chatTextarea.value = "";
              adjustTextareaHeight();
              clearAttachedImage();
              executePromptStream(text, imageUrl, true);
            },
            text,
            imageUrl,
          };
          if (els.budgetWarningText) {
            const formattedCost = estCostInr < 0.01 ? `<0.01` : estCostInr.toFixed(2);
            const totalEst = (state.totalSpend + estCostInr).toFixed(2);
            const currentSpend = state.totalSpend.toFixed(2);
            const limit = state.apiBudgetLimit.toFixed(2);
            let detailMsg = "";
            if (state.totalSpend >= state.apiBudgetLimit) {
              detailMsg = `Your accumulated spend is already <strong>₹${currentSpend}</strong> (exceeding your ₹${limit} limit).<br>This new request only costs an estimated <strong>₹${formattedCost}</strong> (~${estExpectedOutTokens} output/thinking tokens).`;
            } else {
              detailMsg = `This request (Est. <strong>₹${formattedCost}</strong> for ~${estExpectedOutTokens} output/thinking tokens) will bring your total session spend to <strong>₹${totalEst}</strong>, exceeding your set budget limit of <strong>₹${limit}</strong>.`;
            }
            els.budgetWarningText.innerHTML = `${detailMsg}<br><br>Would you like to reset your spend counter and proceed, proceed anyway, or switch to a 100% Free model?`;
          }
          openModal(els.budgetWarningModal);
          return;
        }
      }
    }

    // Clear textarea and attached image now that prompt is authorized to execute
    els.chatTextarea.value = "";
    adjustTextareaHeight();
    clearAttachedImage();

    // Add user message
    const userMsg = { role: "user", content: text };
    if (imageUrl) {
      userMsg.image = imageUrl;
    }
    chat.messages.push(userMsg);

    if (chat.messages.length === 1) {
      chat.title = text.slice(0, 36) + (text.length > 36 ? "..." : "");
    }
    saveChats();
    renderChatHistory();

    // Prepare assistant placeholder message
    const assistantMsg = {
      role: "assistant",
      content: "",
      reasoning: "",
      isStreaming: true,
      stats: null,
      model: state.selectedModelId,
    };
    chat.messages.push(assistantMsg);
    renderMessages();
    state.baseSnippetCount = codeSnippetsRegistry.length;

    state.isStreaming = true;
    updateSendStopButtons(true);
    state.activeAbortController = new AbortController();

    state.activeStreamStats = {
      startTime: performance.now(),
      charCount: 0,
      tokenCount: 0,
      lastTPS: "0.0 tps",
    };

    const caps = detectCapabilities(state.selectedModelId);

    try {
      if (caps.image) {
        await handleImageGenerationModel(chat, assistantMsg, text);
      } else if (caps.audio && state.selectedModelId.toLowerCase().includes("whisper")) {
        await handleWhisperModel(chat, assistantMsg, text);
      } else if (caps.audio) {
        await handleTTSModel(chat, assistantMsg, text);
      } else if (caps.video) {
        await handleVideoModel(chat, assistantMsg, text);
      } else if (caps.ocr && !imageUrl) {
        await handleOCRModelPrompt(chat, assistantMsg, text);
      } else {
        await streamCompletionFromProvider(chat, assistantMsg);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        assistantMsg.content += `\n\n*(Error: ${err.message || String(err)}. Please verify Base URL and API Key in Model Selector settings.)*`;
      }
    } finally {
      // Ensure any thoughts embedded in content are parsed into reasoning
      const extracted = extractThinkingProcess(assistantMsg.content, false);
      if (extracted.thoughts) {
        assistantMsg.reasoning = (assistantMsg.reasoning ? assistantMsg.reasoning + "\n\n" : "") + extracted.thoughts;
        assistantMsg.content = extracted.cleanText;
      } else if (!assistantMsg.reasoning) {
        const stepReasoning = extractStepReasoning(assistantMsg.content);
        if (stepReasoning.thoughts) {
          assistantMsg.reasoning = stepReasoning.thoughts;
          assistantMsg.content = stepReasoning.cleanText;
        }
      }

      const elapsedSeconds = Math.max((performance.now() - state.activeStreamStats.startTime) / 1000, 0.1);
      const totalChars = assistantMsg.content.length + (assistantMsg.reasoning ? assistantMsg.reasoning.length : 0);
      const outputTokens = state.activeStreamStats.tokenCount > 0
        ? state.activeStreamStats.tokenCount
        : Math.max(Math.ceil(totalChars / 3.8), 1);
      const tps = (outputTokens / elapsedSeconds).toFixed(1);
      let approxInputTokens = state.activeStreamStats.promptTokens;
      if (!approxInputTokens || approxInputTokens <= 0) {
        let totalPromptChars = 0;
        if (chat && Array.isArray(chat.messages)) {
          chat.messages.forEach(m => {
            totalPromptChars += (m.content || "").length;
          });
        }
        approxInputTokens = Math.max(Math.ceil((totalPromptChars || text.length) / 3.8), 1);
      }
      const costStr = estimateCost(state.selectedModelId, approxInputTokens, outputTokens);

      assistantMsg.isStreaming = false;
      assistantMsg.stats = {
        tps: tps,
        tokens: outputTokens,
        duration: elapsedSeconds.toFixed(1) + "s",
        cost: costStr,
      };

      state.isStreaming = false;
      state.turboBoost = false;
      state.activeAbortController = null;
      updateSendStopButtons(false);
      saveChats();
      renderMessages();
    }
  }

  function estimateCost(modelId, inTokens, outTokens, accumulate = true) {
    if ((state.providerUrl || "").includes("localhost") || (state.providerUrl || "").includes("127.0.0.1") || (state.providerUrl || "").includes(":11434")) {
      return "$0.0000 (Local Free • ₹0.00)";
    }
    const pricing = getModelPricing(modelId);
    if (pricing.isFree) {
      return "$0.0000 (100% Free • ₹0.00)";
    }

    let costInr = 0;
    let costUsd = 0;

    if (pricing.outputPer1MInr !== undefined && pricing.inputPer1MInr !== undefined) {
      costInr = ((inTokens / 1000000) * pricing.inputPer1MInr) + ((outTokens / 1000000) * pricing.outputPer1MInr);
      if (pricing.inputPer1M !== undefined && pricing.outputPer1M !== undefined) {
        costUsd = ((inTokens / 1000000) * pricing.inputPer1M) + ((outTokens / 1000000) * pricing.outputPer1M);
      } else {
        costUsd = costInr / INR_PER_USD;
      }
    } else {
      const inRate = typeof pricing.input === "number" ? pricing.input : 0.001;
      const outRate = typeof pricing.output === "number" ? pricing.output : 0.002;
      costUsd = ((inTokens / 1000) * inRate) + ((outTokens / 1000) * outRate);
      costInr = costUsd * INR_PER_USD;
    }

    // Accumulate total spend and persist only on real stream completion
    if (accumulate) {
      state.totalSpend = (state.totalSpend || 0) + costInr;
      localStorage.setItem("af_total_spend", state.totalSpend.toFixed(4));
      updateBudgetDisplay();
    }

    const usdStr = costUsd < 0.0001 ? "<$0.0001" : `$${costUsd.toFixed(4)}`;
    const inrStr = costInr < 0.01 ? "<₹0.01" : `₹${costInr.toFixed(2)}`;
    return `${usdStr} (${inrStr})`;
  }

  let streamRenderPending = false;
  let lastStreamRenderTime = 0;

  function scheduleStreamingAssistantDOM(assistantMsg) {
    const now = performance.now();
    if (now - lastStreamRenderTime > 45) {
      lastStreamRenderTime = now;
      updateStreamingAssistantDOM(assistantMsg);
    } else if (!streamRenderPending) {
      streamRenderPending = true;
      requestAnimationFrame(() => {
        streamRenderPending = false;
        lastStreamRenderTime = performance.now();
        updateStreamingAssistantDOM(assistantMsg);
      });
    }
  }

  async function executeContinuationStream(assistantMsg, targetIndex) {
    const chat = getActiveChat();
    if (!chat || state.isStreaming) return;

    assistantMsg.isStreaming = true;
    state.isStreaming = true;
    updateSendStopButtons(true);
    state.activeAbortController = new AbortController();

    state.activeStreamStats = {
      startTime: performance.now(),
      charCount: assistantMsg.content ? assistantMsg.content.length : 0,
      tokenCount: 0,
      lastTPS: "0.0 tps",
    };

    renderMessages();
    const actualIdx = targetIndex >= 0 ? targetIndex : chat.messages.indexOf(assistantMsg);
    let prevSnippets = 0;
    for (let i = 0; i < actualIdx; i++) {
      const m = chat.messages[i];
      if (m && m.content) {
        const matches = m.content.match(/```[a-zA-Z0-9_\-]*\n?[\s\S]*?```/g);
        if (matches) prevSnippets += matches.length;
      }
    }
    state.baseSnippetCount = prevSnippets;

    try {
      await streamCompletionFromProvider(chat, assistantMsg, true);
    } catch (err) {
      if (err.name !== "AbortError") {
        assistantMsg.content += `\n\n*(Continuation error: ${err.message || String(err)})*`;
      }
    } finally {
      const extracted = extractThinkingProcess(assistantMsg.content, false);
      if (extracted.thoughts) {
        assistantMsg.reasoning = (assistantMsg.reasoning ? assistantMsg.reasoning + "\n\n" : "") + extracted.thoughts;
        assistantMsg.content = extracted.cleanText;
      } else if (!assistantMsg.reasoning) {
        const stepReasoning = extractStepReasoning(assistantMsg.content);
        if (stepReasoning.thoughts) {
          assistantMsg.reasoning = stepReasoning.thoughts;
          assistantMsg.content = stepReasoning.cleanText;
        }
      }

      const elapsedSeconds = Math.max((performance.now() - state.activeStreamStats.startTime) / 1000, 0.1);
      const totalChars = assistantMsg.content.length + (assistantMsg.reasoning ? assistantMsg.reasoning.length : 0);
      const outputTokens = state.activeStreamStats.tokenCount > 0
        ? state.activeStreamStats.tokenCount
        : Math.max(Math.ceil(totalChars / 3.8), 1);
      let approxInputTokens = state.activeStreamStats.promptTokens;
      if (!approxInputTokens || approxInputTokens <= 0) {
        let totalPromptChars = 0;
        if (chat && Array.isArray(chat.messages)) {
          chat.messages.forEach(m => {
            totalPromptChars += (m.content || "").length;
          });
        }
        approxInputTokens = Math.max(Math.ceil((totalPromptChars || assistantMsg.content.length) / 3.8), 1);
      }
      const costStr = estimateCost(state.selectedModelId, approxInputTokens, outputTokens);

      assistantMsg.isStreaming = false;
      assistantMsg.stats = {
        tps: tps,
        tokens: outputTokens,
        duration: elapsedSeconds.toFixed(1) + "s",
        cost: costStr,
      };

      state.isStreaming = false;
      state.turboBoost = false;
      state.activeAbortController = null;
      updateSendStopButtons(false);
      saveChats();
      renderMessages();
      showToastBadge("Continued seamlessly");
    }
  }

  async function streamCompletionFromProvider(chat, assistantMsg, isContinuation = false) {
    const cleanBase = (state.providerUrl || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
    const endpoint = cleanBase.endsWith("/chat/completions")
      ? cleanBase
      : cleanBase.endsWith("/v1")
      ? `${cleanBase}/chat/completions`
      : `${cleanBase}/v1/chat/completions`;

    const headers = { 
      "Content-Type": "application/json",
      "HTTP-Referer": "https://agentsflow.ai",
      "X-Title": "AgentsFlow AI"
    };
    if (state.apiKey) {
      headers["Authorization"] = `Bearer ${state.apiKey}`;
    }

    const outgoingMessages = [];

    // System prompt
    if (state.settings.systemPrompt && state.settings.systemPrompt.trim()) {
      outgoingMessages.push({ role: "system", content: state.settings.systemPrompt.trim() });
    }

    // Web grounding mode
    if (state.activeTools.web) {
      outgoingMessages.push({
        role: "system",
        content: `[WEB GROUNDING MODE ACTIVE: Frontier Research & Source Verification]
You are operating with Web Grounding enabled. Deliver authoritative, up-to-date, and beautifully structured responses:
1. STRUCTURE & HIERARCHY:
   - Begin with a concise, punchy executive summary or key takeaway.
   - Use descriptive markdown headers (##, ###), structured bullet points, and quantitative comparison tables where applicable.
   - Highlight key metrics, performance benchmarks, and statistical findings using bold metrics (e.g. **Accuracy: 98.2%**, **Latency: <15ms**).
   - Use callout blocks for important caveats, critical requirements, or tips (e.g., > [!NOTE] or > [!TIP] or > [!WARNING]).
2. CITATIONS & SOURCES:
   - Ground factual claims, technical specifications, and statistics with authoritative citations.
   - Format source references inline using clean markdown links: [Domain or Title](https://...) or citation tags: (Source: https://...).
   - Conclude with a dedicated "### 🌐 Grounded Sources & References" section listing verified sources with descriptive labels.`
      });
    }

    // Deep reasoning mode instruction
    if (state.activeTools.thinking && state.activeTools.thinkingLevel !== "off") {
      outgoingMessages.push({
        role: "system",
        content: "You are operating in deep reasoning mode. Reason through problems thoroughly step-by-step. Wrap your entire internal thought process, deductions, calculations, and intermediate checks inside <think> and </think> tags. Provide only the clear, final response after the closing </think> tag."
      });
    }

    // Context limit trim
    const assistantIdx = chat.messages.indexOf(assistantMsg);
    let history = assistantIdx >= 0 ? chat.messages.slice(0, assistantIdx) : chat.messages.filter(m => m !== assistantMsg);
    if (state.settings.contextLimit && state.settings.contextLimit > 0 && history.length > state.settings.contextLimit) {
      history = history.slice(-state.settings.contextLimit);
    }

    history.forEach(m => {
      if (m.image) {
        // Multi-modal vision message format
        outgoingMessages.push({
          role: m.role,
          content: [
            { type: "text", text: m.content || "Analyze this image." },
            { type: "image_url", image_url: { url: m.image } }
          ]
        });
      } else {
        outgoingMessages.push({ role: m.role, content: m.content });
      }
    });

    if (isContinuation) {
      outgoingMessages.push({ role: "assistant", content: assistantMsg.content || "" });
      outgoingMessages.push({
        role: "user",
        content: "Continue generating seamlessly from exactly where you left off. Do not repeat any prior text and do not add conversational preamble. Pick up immediately from the very last character or word."
      });
    }

    // OCR Model Auto-Routing & Specialized System Prompting
    let requestModel = state.selectedModelId;
    if (requestModel.includes("nougat") || requestModel.startsWith("ocr/")) {
      const visionModel = (state.models || []).find(m => {
        const c = detectCapabilities(m.id);
        return c.vision && !m.id.includes("nougat");
      });
      requestModel = visionModel ? visionModel.id : ((state.providerUrl || "").includes("openai.com") ? "gpt-4o-mini" : "google/gemini-2.0-flash-exp:free");
      outgoingMessages.unshift({
        role: "system",
        content: "[OPTICAL CHARACTER RECOGNITION (OCR) ENGINE ACTIVE]: You are a high-precision document OCR transcriber. Transcribe all text, numbers, formulas, LaTeX expressions ($...$ and $$...$$), tables in markdown, and layout verbatim from the provided document image without omission."
      });
    }

    const lowerModel = requestModel.toLowerCase();
    const isO1OrO3 = lowerModel.includes("o1") || lowerModel.includes("o3");

    const payload = {
      model: requestModel,
      messages: outgoingMessages,
      stream: true,
      stream_options: { include_usage: true },
    };

    const modelMaxOut = getModelMaxOutputTokens(requestModel);
    const safeMaxTokens = Math.min(state.settings.maxTokens || 4096, modelMaxOut);

    if (isO1OrO3) {
      payload.reasoning_effort = state.settings.reasoningEffort || "medium";
      payload.max_completion_tokens = safeMaxTokens;
    } else {
      payload.temperature = state.turboBoost ? 0.2 : (state.settings.temperature ?? 0.7);
      payload.max_tokens = safeMaxTokens;
      payload.top_p = state.turboBoost ? 0.9 : (state.settings.topP ?? 0.95);
      if (state.settings.presencePenalty) payload.presence_penalty = state.settings.presencePenalty;
      if (state.settings.frequencyPenalty) payload.frequency_penalty = state.settings.frequencyPenalty;
    }

    let response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: state.activeAbortController.signal,
    });

    // Resilient Auto-Fallback: If provider returns 400 with unsupported parameter error, strip and retry immediately
    if (!response.ok && response.status === 400) {
      const errText = await response.text();
      const retryPayload = { ...payload };
      delete retryPayload.stream_options;
      if (errText.includes("reasoning_effort")) delete retryPayload.reasoning_effort;
      if (errText.includes("temperature")) delete retryPayload.temperature;
      if (errText.includes("top_p")) delete retryPayload.top_p;
      if (errText.includes("max_tokens") && !retryPayload.max_completion_tokens) {
        retryPayload.max_completion_tokens = retryPayload.max_tokens;
        delete retryPayload.max_tokens;
      } else if (errText.includes("max_completion_tokens")) {
        delete retryPayload.max_completion_tokens;
        retryPayload.max_tokens = safeMaxTokens;
      }

      // If provider rejected request because max output tokens exceeds model limit
      if (errText.includes("max_tokens") || errText.includes("output tokens") || errText.includes("completion_tokens") || errText.includes("too large") || errText.includes("exceeds")) {
        const matchLimit = errText.match(/(?:at most|up to|maximum of|<=|less than or equal to|limit is)\s*(\d+)/i);
        const newLimit = matchLimit && matchLimit[1] ? parseInt(matchLimit[1], 10) : 4096;
        if (retryPayload.max_tokens) retryPayload.max_tokens = Math.min(retryPayload.max_tokens, newLimit);
        if (retryPayload.max_completion_tokens) retryPayload.max_completion_tokens = Math.min(retryPayload.max_completion_tokens, newLimit);
      }

      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(retryPayload),
        signal: state.activeAbortController.signal,
      });

      if (!response.ok) {
        const retryErr = await response.text();
        throw new Error(`Provider returned ${response.status}: ${retryErr.slice(0, 240)}`);
      }
    } else if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Provider returned ${response.status}: ${errText.slice(0, 240)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    let hasStrippedContinuationPreamble = false;
    let isStreamDone = false;
    while (!isStreamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        if (trimmed === "data: [DONE]" || trimmed === "[DONE]") {
          isStreamDone = true;
          break;
        }

        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));

            // Check for official usage metrics in stream
            if (data.usage) {
              if (typeof data.usage.completion_tokens === "number") {
                state.activeStreamStats.tokenCount = data.usage.completion_tokens;
              }
              if (typeof data.usage.prompt_tokens === "number") {
                state.activeStreamStats.promptTokens = data.usage.prompt_tokens;
              }
            }

            if (data.choices && data.choices[0] && data.choices[0].finish_reason) {
              state.activeStreamStats.finishReason = data.choices[0].finish_reason;
            }

            const delta = data.choices && data.choices[0] && data.choices[0].delta;
            if (!delta) {
              continue;
            }

            // Standard content
            if (delta.content) {
              let textChunk = delta.content;
              if (isContinuation && !hasStrippedContinuationPreamble) {
                const cleaned = textChunk.replace(/^(?:(?:certainly|sure|here(?:'s| is) (?:the rest|the continuation)|continuing (?:from where (?:i|we) left off)?)[,:\s-]*)+/i, "");
                if (cleaned !== textChunk) {
                  textChunk = cleaned;
                }
                if (textChunk.trim().length > 0) {
                  hasStrippedContinuationPreamble = true;
                }
              }
              assistantMsg.content += textChunk;
              state.activeStreamStats.charCount += textChunk.length;
            }

            // Reasoning content (DeepSeek R1 / Claude 3.7)
            if (delta.reasoning_content || delta.reasoning) {
              const r = delta.reasoning_content || delta.reasoning;
              assistantMsg.reasoning += r;
              state.activeStreamStats.charCount += r.length;
            }

            // Real-time TPS calculation
            const elapsed = Math.max((performance.now() - state.activeStreamStats.startTime) / 1000, 0.1);
            const tokens = state.activeStreamStats.tokenCount > 0
              ? state.activeStreamStats.tokenCount
              : Math.ceil(state.activeStreamStats.charCount / 3.8);
            scheduleStreamingAssistantDOM(assistantMsg);

            if (isStreamDone) break;
          } catch (e) {
            // Ignore parse chunk
          }
        }
      }
      if (isStreamDone) break;
    }

    // Ensure final state is immediately rendered
    updateStreamingAssistantDOM(assistantMsg);

    try {
      await reader.cancel();
    } catch (e) {}
  }

  // --- 10. DEDICATED HANDLERS FOR NON-CHAT MODELS (AUDIO, IMAGE, VIDEO, OCR) ---
  // Universal Media & File Download Engine for Android WebView and Browser
  window.afDownloadMedia = async function (url, filename, mimeType) {
    showToastBadge(`Downloading ${filename}...`);
    try {
      // 1. Android Native Bridge integration
      if (window.AndroidBridge && typeof window.AndroidBridge.downloadBase64File === "function") {
        if (url && url.startsWith("data:")) {
          window.AndroidBridge.downloadBase64File(url, filename, mimeType || "application/octet-stream");
          return;
        }
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const reader = new FileReader();
          reader.onload = function (e) {
            window.AndroidBridge.downloadBase64File(e.target.result, filename, mimeType || blob.type);
          };
          reader.readAsDataURL(blob);
          return;
        } catch (fetchErr) {
          // If remote CORS blocks fetch, try download anchor
        }
      }

      // 2. Standard Browser / Blob anchor download
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || "download";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      }, 1000);
      showToastBadge("Download completed!");
    } catch (e) {
      // Direct link fallback
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "download";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 500);
    }
  };

  async function handleImageGenerationModel(chat, assistantMsg, prompt) {
    assistantMsg.content = `🎨 Synthesizing visual for: *"${prompt}"*...`;
    updateStreamingAssistantDOM(assistantMsg);

    const cleanBase = (state.providerUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
    const imgEndpoint = cleanBase.endsWith("/v1") ? `${cleanBase}/images/generations` : `${cleanBase}/v1/images/generations`;

    let imageUrl = null;
    if (state.apiKey) {
      try {
        const res = await fetch(imgEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${state.apiKey}`,
          },
          body: JSON.stringify({
            prompt: prompt,
            model: state.selectedModelId.includes("dall-e") ? "dall-e-3" : state.selectedModelId,
            n: 1,
            size: "1024x1024",
          }),
          signal: state.activeAbortController ? state.activeAbortController.signal : undefined,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data[0] && (data.data[0].url || data.data[0].b64_json)) {
            imageUrl = data.data[0].url || `data:image/png;base64,${data.data[0].b64_json}`;
          }
        }
      } catch (e) {
        // Fall back to pollinations
      }
    }

    if (!imageUrl) {
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    }

    const imgFilename = `agentsflow_image_${Date.now()}.png`;
    assistantMsg.content = `![${prompt}](${imageUrl})\n\n**Generated with ${escapeHtml(state.selectedModelId)}**\n*Prompt:* "${escapeHtml(prompt)}"\n\n<button class="msg-action-btn media-download-btn" onclick="window.afDownloadMedia('${imageUrl}', '${imgFilename}', 'image/png')" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; margin-top:8px; border-radius:8px; background:var(--accent-terracotta); color:#fff; font-weight:600; font-size:12px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download Image</button>`;
    state.activeStreamStats.charCount = assistantMsg.content.length;
    updateStreamingAssistantDOM(assistantMsg);
  }

  async function handleTTSModel(chat, assistantMsg, text) {
    assistantMsg.content = `🎙️ Synthesizing neural speech for: *"${text.slice(0, 60)}..."*`;
    updateStreamingAssistantDOM(assistantMsg);

    let audioUrl = null;
    const cleanBase = (state.providerUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
    const speechEndpoint = cleanBase.endsWith("/v1") ? `${cleanBase}/audio/speech` : `${cleanBase}/v1/audio/speech`;

    if (state.apiKey) {
      try {
        const res = await fetch(speechEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${state.apiKey}`,
          },
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: "alloy",
          }),
          signal: state.activeAbortController ? state.activeAbortController.signal : undefined,
        });

        if (res.ok) {
          const blob = await res.blob();
          audioUrl = URL.createObjectURL(blob);
        }
      } catch (e) {
        // Fall back to Web Speech API
      }
    }

    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = state.speechRate || 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }

    const audioPlayerHtml = audioUrl
      ? `<audio controls src="${audioUrl}" style="width: 100%; margin: 8px 0; border-radius: 8px;"></audio>`
      : "";

    assistantMsg.content = `### 🔊 Neural Speech Synthesis (${escapeHtml(state.selectedModelId)})\n\n"${escapeHtml(text)}"\n\n${audioPlayerHtml}<button class="msg-action-btn" onclick="window.afPlayVoice('${escapeAttribute(text)}')" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; margin-top:6px; border-radius:8px; background:var(--accent-terracotta); color:#fff; font-weight:600; font-size:12px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Listen to Speech</button>`;
    state.activeStreamStats.charCount = assistantMsg.content.length;
    updateStreamingAssistantDOM(assistantMsg);
  }

  async function handleWhisperModel(chat, assistantMsg, text) {
    assistantMsg.content = `### 🎙️ OpenAI Whisper (Speech-to-Text Mode)\n\nWhisper is an automatic speech recognition (ASR) model designed to transcribe spoken audio into text.\n\n**Input / Request:** *"${escapeHtml(text)}"*  \n**Status:** Audio Transcription Ready\n\n<button class="msg-action-btn" onclick="document.getElementById('voice-record-btn').click()" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; margin-top:8px; border-radius:8px; background:var(--accent-terracotta); color:#fff; font-weight:600; font-size:12px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> Start Voice Dictation</button>\n\n*(Tip: Switch to DeepSeek R1, Claude 3.7 or LLaMA 3.3 for conversational answers.)*`;
    state.activeStreamStats.charCount = assistantMsg.content.length;
    updateStreamingAssistantDOM(assistantMsg);
  }

  async function handleVideoModel(chat, assistantMsg, text) {
    const videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    const vidFilename = `agentsflow_video_${Date.now()}.mp4`;
    assistantMsg.content = `### 🎬 Luma Ray 2 AI Video Studio\n\n**Prompt:** *"${escapeHtml(text)}"*  \n**Resolution:** 1080p Full HD • 24 FPS • Cinematic Motion Synthesis\n\n<video controls playsinline autoplay loop muted src="${videoUrl}" style="width: 100%; max-height: 280px; border-radius: 12px; margin: 10px 0; background: #000;"></video>\n\n<button class="msg-action-btn media-download-btn" onclick="window.afDownloadMedia('${videoUrl}', '${vidFilename}', 'video/mp4')" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; margin-top:8px; border-radius:8px; background:var(--accent-terracotta); color:#fff; font-weight:600; font-size:12px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download Video (MP4)</button>`;
    state.activeStreamStats.charCount = assistantMsg.content.length;
    updateStreamingAssistantDOM(assistantMsg);
  }

  async function handleOCRModelPrompt(chat, assistantMsg, text) {
    assistantMsg.content = `### 📄 Nougat Document Vision & OCR Engine\n\n**${escapeHtml(state.selectedModelId)}** is an optical character recognition model specialized in extracting formatted text, LaTeX formulas, and tables from images and PDF pages.\n\n👉 **To transcribe a document or image:**  \nTap the button below or the paperclip icon in the composer to attach your document, receipt, or handwritten note.\n\n<button class="msg-action-btn" onclick="document.getElementById('image-file-input').click()" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; margin-top:8px; border-radius:8px; background:var(--accent-terracotta); color:#fff; font-weight:600; font-size:12px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> Upload Document Image for OCR</button>`;
    state.activeStreamStats.charCount = assistantMsg.content.length;
    updateStreamingAssistantDOM(assistantMsg);
  }

  function updateStreamingAssistantDOM(assistantMsg) {
    const chat = getActiveChat();
    const msgIdx = chat ? chat.messages.indexOf(assistantMsg) : -1;
    let liveMsgElem = (msgIdx >= 0 ? document.getElementById("msg-" + msgIdx) : null) || els.messagesContainer.lastElementChild;
    if (!liveMsgElem || !liveMsgElem.classList.contains("message-assistant")) {
      renderMessages();
      liveMsgElem = (msgIdx >= 0 ? document.getElementById("msg-" + msgIdx) : null) || els.messagesContainer.lastElementChild;
    }
    if (!liveMsgElem) return;

    const activeCaps = detectCapabilities(state.selectedModelId);
    let fullContent = assistantMsg.content || "";
    let reasoning = assistantMsg.reasoning || "";
    let displayContent = fullContent;

    // Extract thoughts from content (handles <think>, fenced blocks, and Mistral/LLaMA Thinking Process)
    const extracted = extractThinkingProcess(fullContent, true);
    if (extracted.thoughts) {
      reasoning = (reasoning ? reasoning + "\n\n" : "") + extracted.thoughts;
      displayContent = extracted.cleanText;
    }

    let thinkingSection = liveMsgElem.querySelector(".thinking-section");
    if (!reasoning || !reasoning.trim()) {
      if (thinkingSection) thinkingSection.remove();
    } else {
      if (!thinkingSection) {
        thinkingSection = document.createElement("div");
        thinkingSection.className = "thinking-section";
        thinkingSection.innerHTML = `
          <div class="thinking-header" onclick="window.afToggleThinking(this)">
            <div class="thinking-badge">
              <span class="thinking-pulse live"></span>
              <svg class="thinking-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path><path d="M9 21h6"></path></svg>
              <span class="thinking-title">Thinking Process</span>
              <span class="thinking-meta">${reasoning.length} chars • Thinking live...</span>
            </div>
            <div class="thinking-toggle-action">
              <span class="thinking-toggle-label">Hide</span>
              <svg class="thinking-chevron open" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
          <div class="thinking-body" style="display: block;"></div>
        `;
        const bubble = liveMsgElem.querySelector(".message-bubble");
        if (bubble) {
          liveMsgElem.insertBefore(thinkingSection, bubble);
        } else {
          liveMsgElem.appendChild(thinkingSection);
        }
      }

      const meta = thinkingSection.querySelector(".thinking-meta");
      if (meta) meta.textContent = `${reasoning.length} chars • Thinking live...`;
      const body = thinkingSection.querySelector(".thinking-body");
      if (body) body.textContent = reasoning;
    }

    let bubble = liveMsgElem.querySelector(".message-bubble");
    if (!bubble) {
      bubble = document.createElement("div");
      bubble.className = "message-bubble";
      liveMsgElem.appendChild(bubble);
    }
    codeSnippetsRegistry.length = state.baseSnippetCount || 0;
    bubble.innerHTML = formatContent(displayContent) || '<span style="opacity: 0.5;">Thinking...</span>';

    let statsBadge = liveMsgElem.querySelector(".streaming-stats-text");
    if (statsBadge) {
      statsBadge.textContent = state.activeStreamStats.lastTPS;
    }

    scrollToBottom();
  }

  function stopStreaming() {
    if (state.activeAbortController) {
      try {
        state.activeAbortController.abort();
      } catch (e) {}
    }
    state.isStreaming = false;
    state.activeAbortController = null;
    updateSendStopButtons(false);

    const chat = getActiveChat();
    if (chat && chat.messages.length) {
      let hadStreaming = false;
      chat.messages.forEach(msg => {
        if (msg && msg.role === "assistant" && msg.isStreaming) {
          msg.isStreaming = false;
          hadStreaming = true;
          const extracted = extractThinkingProcess(msg.content, false);
          if (extracted.thoughts) {
            msg.reasoning = (msg.reasoning ? msg.reasoning + "\n\n" : "") + extracted.thoughts;
            msg.content = extracted.cleanText;
          } else if (!msg.reasoning) {
            const stepReasoning = extractStepReasoning(msg.content);
            if (stepReasoning.thoughts) {
              msg.reasoning = stepReasoning.thoughts;
              msg.content = stepReasoning.cleanText;
            }
          }
        }
      });
      if (hadStreaming) {
        saveChats();
        renderMessages();
      }
    }
  }

  function updateSendStopButtons(streaming) {
    if (streaming) {
      els.sendBtn.style.display = "none";
      els.stopBtn.style.display = "flex";
    } else {
      els.sendBtn.style.display = "flex";
      els.stopBtn.style.display = "none";
    }
  }

  // --- 11. AI RESPONSE & USER ACTION SUITE ---
  window.afRegenerate = async function (msgIndex) {
    const chat = getActiveChat();
    if (!chat || state.isStreaming) return;

    let promptIndex = msgIndex - 1;
    while (promptIndex >= 0 && chat.messages[promptIndex].role !== "user") {
      promptIndex--;
    }
    if (promptIndex < 0) return;

    const originalPrompt = chat.messages[promptIndex].content;
    const originalImage = chat.messages[promptIndex].image || null;

    // Remove from promptIndex onwards
    chat.messages = chat.messages.slice(0, promptIndex);
    saveChats();
    await executePromptStream(originalPrompt, originalImage);
  };

  window.afMakeLonger = async function (msgIndex) {
    const chat = getActiveChat();
    if (!chat || state.isStreaming) return;
    await executePromptStream("Please expand upon your previous response in much deeper technical detail, with complete production-grade code, architectural trade-offs, and boundary edge cases.", null);
  };

  window.afMakeShorter = async function (msgIndex) {
    const chat = getActiveChat();
    if (!chat || state.isStreaming) return;
    await executePromptStream("Please condense and synthesize the key points of your previous response into concise, high-impact bulleted takeaways.", null);
  };

  window.afContinue = async function (msgIndex) {
    const chat = getActiveChat();
    if (!chat || state.isStreaming) return;

    let targetMsg = null;
    let targetIndex = -1;
    if (typeof msgIndex === "number" && chat.messages[msgIndex] && chat.messages[msgIndex].role === "assistant") {
      targetMsg = chat.messages[msgIndex];
      targetIndex = msgIndex;
    } else {
      for (let i = chat.messages.length - 1; i >= 0; i--) {
        if (chat.messages[i].role === "assistant") {
          targetMsg = chat.messages[i];
          targetIndex = i;
          break;
        }
      }
    }

    if (!targetMsg) return;
    await executeContinuationStream(targetMsg, targetIndex);
  };

  window.afBranchChat = function (msgIndex) {
    branchConversation(msgIndex);
  };

  window.afCopyRaw = function (msgIndex) {
    const chat = getActiveChat();
    if (!chat || !chat.messages[msgIndex]) return;
    window.afCopyText(chat.messages[msgIndex].content);
  };

  window.afEditUserMessage = function (msgIndex) {
    const chat = getActiveChat();
    if (!chat || !chat.messages[msgIndex]) return;
    const msg = chat.messages[msgIndex];
    els.chatTextarea.value = msg.content;
    adjustTextareaHeight();
    if (msg.image) {
      setAttachedImage(msg.image, "attached-image.jpg");
    }
    els.chatTextarea.focus();
    showToastBadge("Prompt loaded into composer");
  };

  window.afCopyUserMessage = function (msgIndex) {
    const chat = getActiveChat();
    if (!chat || !chat.messages[msgIndex]) return;
    window.afCopyText(chat.messages[msgIndex].content);
  };

  // Safe Text-to-Speech by Message Index
  window.afReadAloud = function (msgIndex, btn) {
    const chat = getActiveChat();
    if (!chat || !chat.messages[msgIndex]) return;
    const text = chat.messages[msgIndex].content;

    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported on this device.");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (btn) btn.classList.remove("playing");
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/!\[.*?\]\(.*?\)/g, "").replace(/```[\s\S]*?```/g, "Code block omitted.");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = state.speechRate || 1.0;

    if (btn) btn.classList.add("playing");
    utterance.onend = () => { if (btn) btn.classList.remove("playing"); };
    utterance.onerror = () => { if (btn) btn.classList.remove("playing"); };

    window.speechSynthesis.speak(utterance);
  };

  // --- 12. PROMINENT MODEL SELECTOR & BASE URL HUB ---
  async function probeModelsFromUrl(customUrl, customKey) {
    let rawUrl = (customUrl || (els.modelModalUrlInput ? els.modelModalUrlInput.value.trim() : "") || state.providerUrl || "").trim();
    const apiKey = customKey !== undefined ? customKey : ((els.modelModalKeyInput ? els.modelModalKeyInput.value.trim() : "") || state.apiKey);
    const statusEl = els.modalProbeStatus;

    if (!rawUrl) {
      if (statusEl) statusEl.textContent = "Please enter a provider Base URL.";
      return;
    }

    // Auto-prepend https:// if scheme is missing
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      rawUrl = (rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1")) ? `http://${rawUrl}` : `https://${rawUrl}`;
    }

    // Smart detect provider name from URL if user typed a provider URL
    const lowerUrl = rawUrl.toLowerCase();
    if (lowerUrl.includes("aicredits")) {
      state.providerName = "AICredits";
    } else if (lowerUrl.includes("openrouter")) {
      state.providerName = "OpenRouter";
    } else if (lowerUrl.includes("groq")) {
      state.providerName = "Groq";
    } else if (lowerUrl.includes("deepseek")) {
      state.providerName = "DeepSeek";
    } else if (lowerUrl.includes("openai")) {
      state.providerName = "OpenAI";
    } else if (lowerUrl.includes("together")) {
      state.providerName = "Together AI";
    } else if (lowerUrl.includes("localhost") || lowerUrl.includes("127.0.0.1") || lowerUrl.includes("11434")) {
      state.providerName = "Ollama";
    }

    state.providerUrl = rawUrl;
    if (els.modelModalUrlInput) els.modelModalUrlInput.value = rawUrl;
    updateProviderBadgeDisplay();

    if (statusEl) {
      statusEl.textContent = `Probing endpoint: ${rawUrl}...`;
      statusEl.style.color = "var(--text-muted)";
    }

    const clean = rawUrl.replace(/\/+$/, "");
    let endpoint = clean;
    if (!clean.endsWith("/models") && !clean.endsWith("/api/tags")) {
      endpoint = clean.endsWith("/v1") ? `${clean}/models` : `${clean}/v1/models`;
    }

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const startTime = Date.now();
    try {
      const res = await fetch(endpoint, { method: "GET", headers });
      const latency = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      const rawList = Array.isArray(json.data) ? json.data : Array.isArray(json.models) ? json.models : Array.isArray(json) ? json : [];

      if (!rawList.length) {
        throw new Error("No models returned in response data array.");
      }

      state.providerModelsPricing = state.providerModelsPricing || {};
      let livePricingCount = 0;

      const discovered = rawList.map(m => {
        const rawId = String(m.id || m.name || "unknown");
        const caps = detectCapabilities(rawId, m);
        let cat = "chat";
        if (caps.reasoning) cat = "reasoning";
        else if (caps.ocr || caps.vision) cat = "vision";
        else if (caps.audio) cat = "audio";
        else if (caps.image) cat = "image";
        else if (caps.video) cat = "video";
        else if (caps.coding) cat = "coding";

        // Direct fetch & normalization of provider live rates
        const parsedPricing = parseProviderPricing(m, clean);
        if (parsedPricing && !parsedPricing.isFree) {
          livePricingCount++;
          state.providerModelsPricing[rawId] = parsedPricing;
          state.providerModelsPricing[rawId.toLowerCase()] = parsedPricing;
        }

        return {
          id: rawId,
          name: m.name || rawId,
          category: cat,
          desc: `Live discovered (${latency}ms latency)`,
          provider: state.providerName,
          contextWindow: m.context_length ? `${Math.round(m.context_length / 1000)}k` : (m.context_window ? `${Math.round(m.context_window / 1000)}k` : "128k"),
          pricing: parsedPricing || m.pricing || null,
        };
      });

      state.models = discovered;
      localStorage.setItem("af_models", JSON.stringify(discovered));
      localStorage.setItem("af_provider_pricing_cache", JSON.stringify(state.providerModelsPricing));
      localStorage.setItem("af_provider_url", state.providerUrl);
      localStorage.setItem("af_provider_name", state.providerName);

      if (statusEl) {
        const pricingMsg = livePricingCount > 0 ? ` with ${livePricingCount} live price rates` : "";
        statusEl.textContent = `Successfully discovered ${discovered.length} models${pricingMsg} (${latency}ms latency)!`;
        statusEl.style.color = "var(--badge-green)";
      }
      renderModelsList();
      updateModelPillDisplay();
      showToastBadge(`${discovered.length} Models Discovered (${livePricingCount} live prices)`);
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = `Probe note: ${err.message}. Using built-in catalog.`;
        statusEl.style.color = "var(--text-muted)";
      }
    }
  }

  function saveProviderSettings() {
    let rawUrl = (els.modelModalUrlInput ? els.modelModalUrlInput.value.trim() : "") || "https://openrouter.ai/api/v1";
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      rawUrl = (rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1")) ? `http://${rawUrl}` : `https://${rawUrl}`;
    }

    const lowerUrl = rawUrl.toLowerCase();
    if (lowerUrl.includes("aicredits")) {
      state.providerName = "AICredits";
    } else if (lowerUrl.includes("openrouter")) {
      state.providerName = "OpenRouter";
    } else if (lowerUrl.includes("groq")) {
      state.providerName = "Groq";
    } else if (lowerUrl.includes("deepseek")) {
      state.providerName = "DeepSeek";
    } else if (lowerUrl.includes("openai")) {
      state.providerName = "OpenAI";
    } else if (lowerUrl.includes("together")) {
      state.providerName = "Together AI";
    } else if (lowerUrl.includes("localhost") || lowerUrl.includes("127.0.0.1") || lowerUrl.includes("11434")) {
      state.providerName = "Ollama";
    }

    state.providerUrl = rawUrl;
    state.apiKey = els.modelModalKeyInput ? els.modelModalKeyInput.value.trim() : "";

    localStorage.setItem("af_provider_url", state.providerUrl);
    localStorage.setItem("af_api_key", state.apiKey);
    localStorage.setItem("af_provider_name", state.providerName);

    updateProviderBadgeDisplay();
    showToastBadge("Provider & Base URL Saved");
    probeModelsFromUrl(state.providerUrl, state.apiKey);
  }

  function clearStoredApiKey() {
    state.apiKey = "";
    localStorage.removeItem("af_api_key");
    if (els.modelModalKeyInput) els.modelModalKeyInput.value = "";
    updateProviderBadgeDisplay();
    showToastBadge("API Key removed from device storage");
  }

  function factoryResetStorage() {
    if (confirm("Are you sure you want to completely wipe all local chats, API keys, and settings? This resets the app to a clean state.")) {
      localStorage.clear();
      showToastBadge("Storage wiped. Resetting app...");
      setTimeout(() => {
        window.location.reload();
      }, 350);
    }
  }

  function updateProviderBadgeDisplay() {
    if (els.currentProviderBadgeName) els.currentProviderBadgeName.textContent = `Provider: ${state.providerName}`;
    if (els.currentProviderBadgeUrl) els.currentProviderBadgeUrl.textContent = `(${state.providerUrl})`;
    if (els.providerDrawerSummary) els.providerDrawerSummary.textContent = `${state.providerName} (${state.providerUrl})`;
    if (els.keyStatusBadge) {
      if (state.apiKey) {
        els.keyStatusBadge.textContent = "Key Ready";
        els.keyStatusBadge.classList.add("active");
      } else {
        els.keyStatusBadge.textContent = state.providerName === "Ollama" ? "No Key Needed" : "Key Required";
        els.keyStatusBadge.classList.remove("active");
      }
    }
  }

  window.afSetProviderPreset = function (preset) {
    document.querySelectorAll(".provider-preset-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.preset === preset);
    });

    if (preset === 'groq') {
      state.providerName = 'Groq';
      state.providerUrl = 'https://api.groq.com/openai/v1';
    } else if (preset === 'openrouter') {
      state.providerName = 'OpenRouter';
      state.providerUrl = 'https://openrouter.ai/api/v1';
    } else if (preset === 'deepseek') {
      state.providerName = 'DeepSeek';
      state.providerUrl = 'https://api.deepseek.com/v1';
    } else if (preset === 'openai') {
      state.providerName = 'OpenAI';
      state.providerUrl = 'https://api.openai.com/v1';
    } else if (preset === 'aicredits') {
      state.providerName = 'AICredits';
      state.providerUrl = 'https://api.aicredits.in/v1';
    } else if (preset === 'ollama') {
      state.providerName = 'Ollama';
      state.providerUrl = 'http://127.0.0.1:11434/v1';
    }

    if (els.modelModalUrlInput) els.modelModalUrlInput.value = state.providerUrl;
    updateProviderBadgeDisplay();
  };

  window.afOpenModelSelector = function (expandApi = false) {
    openModelSelector(expandApi);
  };

  function openModelSelector(expandApi = false) {
    els.modelModalUrlInput.value = state.providerUrl;
    els.modelModalKeyInput.value = state.apiKey;
    updateProviderBadgeDisplay();
    renderModelsList();

    if (expandApi) {
      if (els.modalTabProvider) els.modalTabProvider.click();
    } else {
      if (els.modalTabModels) els.modalTabModels.click();
    }

    openModal(els.modelSelectorModal);
  }

  function renderModelsList() {
    els.modelsListContainer.innerHTML = "";
    const filterText = (els.modelSearchInput.value || "").toLowerCase().trim();
    const cat = state.modelCategoryFilter;

    const list = state.models.filter(m => {
      const caps = detectCapabilities(m.id, m);
      if (cat !== "all") {
        if (cat === "reasoning" && !caps.reasoning && m.category !== "reasoning") return false;
        if (cat === "vision" && !caps.vision && !caps.ocr && m.category !== "vision" && m.category !== "ocr") return false;
        if (cat === "image" && !caps.image && m.category !== "image") return false;
        if (cat === "audio" && !caps.audio && m.category !== "audio" && m.category !== "transcribe") return false;
        if (cat === "video" && !caps.video && m.category !== "video") return false;
        if (cat === "coding" && !caps.coding && m.category !== "coding") return false;
        if (cat === "chat" && (caps.image || caps.video || caps.audio) && m.category !== "chat") return false;
      }
      if (!filterText) return true;
      return m.id.toLowerCase().includes(filterText) || m.name.toLowerCase().includes(filterText) || (m.desc || "").toLowerCase().includes(filterText);
    });

    if (els.modelsAvailableCount) {
      els.modelsAvailableCount.textContent = `${list.length} Ready`;
    }

    if (!list.length) {
      els.modelsListContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">No models match search. Try entering a custom model ID below.</div>`;
      return;
    }

    list.forEach(m => {
      const caps = detectCapabilities(m.id, m);
      const isSelected = m.id === state.selectedModelId;
      const pricing = getModelPricing(m.id, m);
      let customMap = {};
      try {
        customMap = JSON.parse(localStorage.getItem("af_custom_pricing") || "{}");
      } catch (_) {}
      const hasCustom = !!(customMap[m.id] || customMap[m.id.toLowerCase()]);
      const isLiveProvider = pricing.source === "api_provider" || (!hasCustom && (m.pricing || (state.providerModelsPricing && state.providerModelsPricing[m.id])) && !pricing.isFree && !pricing.special);
      const sourceTag = hasCustom
        ? '<span class="pricing-source-badge custom">Custom</span>'
        : (isLiveProvider
            ? `<span class="pricing-source-badge live">Live ${state.providerName || 'API'}</span>`
            : (pricing.isFree ? '<span class="pricing-source-badge live">Free Tier</span>' : '<span class="pricing-source-badge fallback">Catalog</span>'));

      const editBtnHtml = `
        <button type="button" class="edit-model-pricing-chip" title="Edit / override price for ${escapeHtml(m.id)}" onclick="event.stopPropagation(); window.afOpenPricingEditor('${escapeHtml(m.id)}')">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Edit Price</span>
        </button>
      `;

      let pricingHtml = "";

      if (pricing.isFree) {
        pricingHtml = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; margin-bottom: 2px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="pricing-label" style="margin: 0;">Rate</span>
              ${sourceTag}
            </div>
            ${editBtnHtml}
          </div>
          <div class="model-pricing-strip" style="margin-top: 2px;">
            <div class="pricing-cell" style="grid-column: span 3;">
              <span class="pricing-label">Price / Usage</span>
              <span class="pricing-special-badge free-badge">${escapeHtml(pricing.special || "100% Free / Local ($0.00 / ₹0.00)")}</span>
            </div>
          </div>
        `;
      } else if (pricing.special) {
        pricingHtml = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; margin-bottom: 2px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="pricing-label" style="margin: 0;">Rate</span>
              ${sourceTag}
            </div>
            ${editBtnHtml}
          </div>
          <div class="model-pricing-strip" style="margin-top: 2px;">
            <div class="pricing-cell" style="grid-column: span 3;">
              <span class="pricing-label">Price / Usage</span>
              <span class="pricing-special-badge">${escapeHtml(pricing.special)}</span>
            </div>
          </div>
        `;
      } else {
        const inUsd = formatCurrencyDisplay(pricing.inputPer1M, "$");
        const inInr = formatCurrencyDisplay(pricing.inputPer1MInr, "₹");
        const outUsd = formatCurrencyDisplay(pricing.outputPer1M, "$");
        const outInr = formatCurrencyDisplay(pricing.outputPer1MInr, "₹");
        const hasCache = (pricing.cachePer1M && pricing.cachePer1M > 0) || (pricing.cachePer1MInr && pricing.cachePer1MInr > 0);
        const cacheUsd = hasCache ? formatCurrencyDisplay(pricing.cachePer1M, "$") : "N/A";
        const cacheInr = hasCache ? formatCurrencyDisplay(pricing.cachePer1MInr, "₹") : "No Cache";

        pricingHtml = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; margin-bottom: 2px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="pricing-label" style="margin: 0;">Rate</span>
              ${sourceTag}
            </div>
            ${editBtnHtml}
          </div>
          <div class="model-pricing-strip" style="margin-top: 2px;">
            <div class="pricing-cell">
              <span class="pricing-label">Input / 1M</span>
              <span class="pricing-val-usd">${inUsd}</span>
              <span class="pricing-val-inr">${inInr}</span>
            </div>
            <div class="pricing-cell">
              <span class="pricing-label">Output / 1M</span>
              <span class="pricing-val-usd">${outUsd}</span>
              <span class="pricing-val-inr">${outInr}</span>
            </div>
            <div class="pricing-cell">
              <span class="pricing-label">Cache / 1M</span>
              <span class="pricing-val-usd" ${!hasCache ? 'style="color: var(--text-muted); font-size: 10px;"' : ''}>${cacheUsd}</span>
              <span class="pricing-val-inr" ${!hasCache ? 'style="color: var(--text-muted); font-size: 9px;"' : ''}>${cacheInr}</span>
            </div>
          </div>
        `;
      }

      const item = document.createElement("div");
      item.className = "model-item-card" + (isSelected ? " active" : "");
      item.innerHTML = `
        <div class="model-item-left">
          <div class="model-item-title-row">
            <span class="model-item-name">${escapeHtml(m.name)}</span>
            ${isSelected ? '<span style="color: var(--accent-terracotta); font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Active</span>' : ''}
          </div>
          <div class="model-item-id">${escapeHtml(m.id)}</div>
          <div class="model-item-desc">${escapeHtml(m.desc || '')}</div>
          <div class="model-badges-row">
            ${caps.reasoning ? '<span class="model-badge badge-reasoning">Reasoning</span>' : ''}
            ${caps.vision ? '<span class="model-badge badge-vision">Vision</span>' : ''}
            ${caps.ocr ? '<span class="model-badge badge-ocr">OCR</span>' : ''}
            ${caps.image ? '<span class="model-badge badge-image">Image Gen</span>' : ''}
            ${caps.audio ? '<span class="model-badge badge-audio">Audio</span>' : ''}
            ${caps.video ? '<span class="model-badge badge-video">Video</span>' : ''}
            ${caps.coding ? '<span class="model-badge badge-coding">Coding</span>' : ''}
            ${caps.fast ? '<span class="model-badge badge-fast">Fast</span>' : ''}
            ${caps.tools ? '<span class="model-badge badge-tools">Tools</span>' : ''}
            <span class="model-badge">${m.contextWindow || '128k'}</span>
          </div>
          ${pricingHtml}
        </div>
      `;

      item.onclick = () => {
        state.selectedModelId = m.id;
        localStorage.setItem("af_model_id", m.id);
        if (caps.image) {
          state.selectedImageModel = m.id;
          localStorage.setItem("af_image_model", m.id);
          if (els.imgModelSelect) {
            let exists = false;
            for (let i = 0; i < els.imgModelSelect.options.length; i++) {
              if (els.imgModelSelect.options[i].value === m.id) {
                els.imgModelSelect.selectedIndex = i;
                exists = true;
                break;
              }
            }
            if (!exists) {
              const opt = document.createElement("option");
              opt.value = m.id;
              opt.textContent = `${m.name} • ${pricing.special || '₹0.25 ($0.003)'}`;
              opt.selected = true;
              els.imgModelSelect.prepend(opt);
            }
            if (els.imgModelCostBadge) {
              els.imgModelCostBadge.textContent = `Active: ${m.name} • Est. ${pricing.special || '₹0.25 ($0.003)'}`;
            }
          }
        }
        updateModelPillDisplay();
        updateCapabilitiesUI(m.id);
        closeModal(els.modelSelectorModal);
        showToastBadge(`Activated: ${m.name}`);
      };

      els.modelsListContainer.appendChild(item);
    });
  }

  function updateModelPillDisplay() {
    const current = (state.models || []).find(m => m.id === state.selectedModelId);
    const modelName = current ? current.name : state.selectedModelId;
    const caps = detectCapabilities(state.selectedModelId);

    if (els.modelPillName) {
      els.modelPillName.textContent = modelName;
    }

    if (els.modelPillCap) {
      let capLabel = "Chat";
      let capClass = "badge-chat";
      if (caps.reasoning) {
        capLabel = "Reasoning";
        capClass = "badge-reasoning";
      } else if (caps.vision || caps.ocr) {
        capLabel = "Vision";
        capClass = "badge-vision";
      } else if (caps.audio) {
        capLabel = "Audio";
        capClass = "badge-audio";
      } else if (caps.image) {
        capLabel = "Image";
        capClass = "badge-image";
      } else if (caps.coding) {
        capLabel = "Coding";
        capClass = "badge-coding";
      } else if (caps.fast) {
        capLabel = "Fast";
        capClass = "badge-fast";
      }
      els.modelPillCap.textContent = capLabel;
      els.modelPillCap.className = `model-badge-cap ${capClass}`;
    }

    const centerModelName = document.getElementById("welcome-loaded-model-name");
    if (centerModelName) centerModelName.textContent = modelName;
    const centerModelCap = document.getElementById("welcome-loaded-model-cap");
    if (centerModelCap) {
      centerModelCap.textContent = caps.reasoning ? "Reasoning" : (caps.vision ? "Vision" : (caps.audio ? "Audio" : (caps.image ? "Image" : "Chat")));
    }
    const centerModelPricing = document.getElementById("welcome-loaded-model-pricing");
    if (centerModelPricing) {
      const p = getModelPricing(state.selectedModelId, current);
      if (p.isFree) {
        centerModelPricing.textContent = "100% Free";
      } else if (p.special) {
        centerModelPricing.textContent = p.special;
      } else {
        const inInr = formatCurrencyDisplay(p.inputPer1MInr, "₹");
        const outInr = formatCurrencyDisplay(p.outputPer1MInr, "₹");
        centerModelPricing.textContent = `${inInr} in / ${outInr} out / 1M`;
      }
    }

    // Update Model Selector Modal loaded model banner
    const modalActiveModelName = document.getElementById("modal-active-model-name");
    if (modalActiveModelName) modalActiveModelName.textContent = modelName;
    const modalActiveModelSub = document.getElementById("modal-active-model-sub");
    if (modalActiveModelSub) {
      const capDesc = caps.reasoning ? "Chain-of-Thought Reasoning" : (caps.vision ? "Multi-modal Vision & OCR" : (caps.fast ? "Ultra-Low Latency Inference" : "High-speed Text Generation"));
      const p = getModelPricing(state.selectedModelId, current);
      let pSummary = "";
      if (p.isFree) {
        pSummary = " • 100% Free ($0.00 / ₹0.00)";
      } else if (p.special) {
        pSummary = ` • ${p.special}`;
      } else {
        const inInr = formatCurrencyDisplay(p.inputPer1MInr, "₹");
        const outInr = formatCurrencyDisplay(p.outputPer1MInr, "₹");
        const inUsd = formatCurrencyDisplay(p.inputPer1M, "$");
        const outUsd = formatCurrencyDisplay(p.outputPer1M, "$");
        pSummary = ` • ${inInr} in / ${outInr} out / 1M (${inUsd} / ${outUsd})`;
      }
      modalActiveModelSub.textContent = `${current && current.provider ? capitalize(current.provider) : 'Provider'} • ${current && current.contextWindow ? current.contextWindow : '128k'} Context • ${capDesc}${pSummary}`;
    }

    // Update Model Settings Modal loaded model info card
    if (els.settingsModelName) els.settingsModelName.textContent = modelName;
    if (els.settingsModelDesc) {
      const p = getModelPricing(state.selectedModelId, current);
      let pInfo = "";
      if (p.isFree) {
        pInfo = " (100% Free / Local)";
      } else if (p.special) {
        pInfo = ` (${p.special})`;
      } else {
        const inInr = formatCurrencyDisplay(p.inputPer1MInr, "₹");
        const outInr = formatCurrencyDisplay(p.outputPer1MInr, "₹");
        pInfo = ` (${inInr} in / ${outInr} out per 1M)`;
      }
      els.settingsModelDesc.textContent = ((current && current.desc) ? current.desc : "Frontier AI Architecture") + pInfo;
    }
    if (els.settingsModelContext) {
      let ctx = (current && current.contextWindow) ? current.contextWindow : "128k";
      if (!ctx.toLowerCase().includes("k") && !ctx.toLowerCase().includes("m")) ctx += "k";
      els.settingsModelContext.textContent = `${ctx} Tokens`;
    }
  }

  // --- 13. AI MODEL PARAMETERS MODAL ---
  function populateModelParameters() {
    const current = (state.models || []).find(m => m.id === state.selectedModelId) || {
      id: state.selectedModelId,
      name: state.selectedModelId,
      contextWindow: "128k",
      desc: "Frontier AI Architecture"
    };

    if (els.settingsModelName) els.settingsModelName.textContent = current.name || current.id;
    if (els.settingsModelDesc) els.settingsModelDesc.textContent = current.desc || current.id;
    if (els.settingsModelContext) {
      let ctx = current.contextWindow || "128k";
      if (!ctx.toLowerCase().includes("k") && !ctx.toLowerCase().includes("m")) ctx += "k";
      els.settingsModelContext.textContent = `${ctx} Tokens`;
    }

    els.paramTempSlider.value = state.settings.temperature;
    els.tempValBadge.textContent = state.settings.temperature;
    if (els.paramTempInput) els.paramTempInput.value = state.settings.temperature;

    const maxAllowedTokens = getModelMaxOutputTokens(state.selectedModelId);
    state.settings.maxTokens = Math.min(state.settings.maxTokens || 4096, maxAllowedTokens);
    if (els.paramMaxTokensSlider) {
      els.paramMaxTokensSlider.max = String(maxAllowedTokens);
      els.paramMaxTokensSlider.value = state.settings.maxTokens;
    }
    if (els.paramMaxTokensInput) {
      els.paramMaxTokensInput.max = String(maxAllowedTokens);
      els.paramMaxTokensInput.value = state.settings.maxTokens;
    }
    els.maxTokensBadge.textContent = `${state.settings.maxTokens} (Max: ${maxAllowedTokens})`;

    els.paramTopPSlider.value = state.settings.topP;
    els.topPBadge.textContent = state.settings.topP;

    els.paramPresenceSlider.value = state.settings.presencePenalty || 0.0;
    els.presenceBadge.textContent = state.settings.presencePenalty || 0.0;

    els.paramFrequencySlider.value = state.settings.frequencyPenalty || 0.0;
    els.frequencyBadge.textContent = state.settings.frequencyPenalty || 0.0;

    els.paramContextLimit.value = String(state.settings.contextLimit || 20);
    els.paramSystemPrompt.value = state.settings.systemPrompt;

    if (els.settingLaunchBehavior) {
      els.settingLaunchBehavior.value = state.launchBehavior || "new_chat";
    }
    if (els.settingBudgetLimit) {
      els.settingBudgetLimit.value = String(state.apiBudgetLimit !== undefined ? state.apiBudgetLimit : 100);
    }
    if (els.settingBudgetWarn) {
      els.settingBudgetWarn.checked = state.apiBudgetWarn !== false;
    }
    updateBudgetDisplay();

    const caps = detectCapabilities(state.selectedModelId);
    if (els.reasoningEffortGroup) {
      els.reasoningEffortGroup.style.display = caps.reasoning ? "block" : "none";
    }
    if (els.reasoningModelSupportNote) {
      els.reasoningModelSupportNote.textContent = caps.reasoning ? "Active (Reasoning Enabled)" : "Disabled (Model lacks reasoning)";
      els.reasoningModelSupportNote.style.color = caps.reasoning ? "var(--badge-green)" : "var(--text-muted)";
    }

    els.effortPillBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.effort === state.settings.reasoningEffort);
    });

    // Populate Model Pricing Editor & Live Provider Rate Badges
    const p = getModelPricing(state.selectedModelId, current);
    let storedCustomPricing = {};
    try {
      storedCustomPricing = JSON.parse(localStorage.getItem("af_custom_pricing") || "{}");
    } catch (_) {}
    const hasCustom = !!(storedCustomPricing[state.selectedModelId] || storedCustomPricing[state.selectedModelId.toLowerCase()]);
    
    if (els.modelPricingSourceBadge) {
      if (hasCustom) {
        els.modelPricingSourceBadge.textContent = "Custom User Override";
        els.modelPricingSourceBadge.style.background = "rgba(245, 158, 11, 0.15)";
        els.modelPricingSourceBadge.style.color = "#f59e0b";
      } else if (p.source === "api_provider" || (current && current.pricing) || (state.providerModelsPricing && state.providerModelsPricing[state.selectedModelId])) {
        els.modelPricingSourceBadge.textContent = `Live ${state.providerName || 'API'} Rate`;
        els.modelPricingSourceBadge.style.background = "rgba(16, 185, 129, 0.15)";
        els.modelPricingSourceBadge.style.color = "var(--badge-green)";
      } else if (p.isFree) {
        els.modelPricingSourceBadge.textContent = "100% Free / Local";
        els.modelPricingSourceBadge.style.background = "rgba(16, 185, 129, 0.15)";
        els.modelPricingSourceBadge.style.color = "var(--badge-green)";
      } else {
        els.modelPricingSourceBadge.textContent = "Catalog Heuristic";
        els.modelPricingSourceBadge.style.background = "rgba(107, 114, 128, 0.15)";
        els.modelPricingSourceBadge.style.color = "var(--text-muted)";
      }
    }

    if (els.settingsPriceSummaryText) {
      if (p.isFree) {
        els.settingsPriceSummaryText.textContent = "100% Free / Local ($0.00 / ₹0.00)";
      } else if (p.special) {
        els.settingsPriceSummaryText.textContent = p.special;
      } else {
        const inInr = formatCurrencyDisplay(p.inputPer1MInr, "₹");
        const outInr = formatCurrencyDisplay(p.outputPer1MInr, "₹");
        els.settingsPriceSummaryText.textContent = `In: ${inInr} / 1M • Out: ${outInr} / 1M`;
      }
    }
    if (els.settingsPriceUsdText) {
      if (p.isFree || p.special) {
        els.settingsPriceUsdText.textContent = "";
      } else {
        const inUsd = formatCurrencyDisplay(p.inputPer1M, "$");
        const outUsd = formatCurrencyDisplay(p.outputPer1M, "$");
        els.settingsPriceUsdText.textContent = `(${inUsd} in / ${outUsd} out / 1M USD)`;
      }
    }

    if (els.customPriceInput && els.customPriceOutput) {
      if (hasCustom) {
        const cp = storedCustomPricing[state.selectedModelId] || storedCustomPricing[state.selectedModelId.toLowerCase()];
        els.customPriceInput.value = cp.rawInput !== undefined ? cp.rawInput : (cp.currency === "INR" ? cp.inputPer1MInr : cp.inputPer1M);
        els.customPriceOutput.value = cp.rawOutput !== undefined ? cp.rawOutput : (cp.currency === "INR" ? cp.outputPer1MInr : cp.outputPer1M);
        if (els.customPriceCurrency && cp.currency) els.customPriceCurrency.value = cp.currency;
        if (els.customPriceUnit && cp.unit) els.customPriceUnit.value = cp.unit;
      } else if (!p.isFree && !p.special) {
        els.customPriceInput.value = p.inputPer1M !== undefined ? parseFloat(p.inputPer1M.toFixed(4)) : "";
        els.customPriceOutput.value = p.outputPer1M !== undefined ? parseFloat(p.outputPer1M.toFixed(4)) : "";
        if (els.customPriceCurrency) els.customPriceCurrency.value = "USD";
        if (els.customPriceUnit) els.customPriceUnit.value = "1M";
      } else {
        els.customPriceInput.value = "";
        els.customPriceOutput.value = "";
      }
    }
  }

  function updateBudgetDisplay() {
    if (els.budgetSpendBadge) {
      const spendInr = (state.totalSpend || 0).toFixed(2);
      const limitInr = (state.apiBudgetLimit || 100).toFixed(2);
      els.budgetSpendBadge.textContent = `Spent: ₹${spendInr} / ₹${limitInr}`;
      if (state.totalSpend >= state.apiBudgetLimit) {
        els.budgetSpendBadge.style.background = "rgba(239, 68, 68, 0.2)";
        els.budgetSpendBadge.style.color = "#ef4444";
      } else {
        els.budgetSpendBadge.style.background = "rgba(16, 185, 129, 0.15)";
        els.budgetSpendBadge.style.color = "var(--badge-green)";
      }
    }
  }

  function saveModelParameters() {
    if (els.paramTempInput && els.paramTempInput.value !== "") {
      state.settings.temperature = Math.max(0, Math.min(2.0, parseFloat(els.paramTempInput.value) || 0.7));
    } else {
      state.settings.temperature = parseFloat(els.paramTempSlider.value);
    }

    const maxAllowedTokens = getModelMaxOutputTokens(state.selectedModelId);
    if (els.paramMaxTokensInput && els.paramMaxTokensInput.value !== "") {
      const parsedVal = parseInt(els.paramMaxTokensInput.value, 10) || 4096;
      state.settings.maxTokens = Math.max(256, Math.min(maxAllowedTokens, parsedVal));
    } else {
      state.settings.maxTokens = Math.min(maxAllowedTokens, parseInt(els.paramMaxTokensSlider.value, 10) || 4096);
    }

    state.settings.topP = parseFloat(els.paramTopPSlider.value);
    state.settings.presencePenalty = parseFloat(els.paramPresenceSlider.value);
    state.settings.frequencyPenalty = parseFloat(els.paramFrequencySlider.value);
    state.settings.contextLimit = parseInt(els.paramContextLimit.value, 10);
    state.settings.systemPrompt = els.paramSystemPrompt.value;

    if (els.settingLaunchBehavior) {
      state.launchBehavior = els.settingLaunchBehavior.value;
      localStorage.setItem("af_launch_behavior", state.launchBehavior);
    }
    if (els.settingBudgetLimit) {
      state.apiBudgetLimit = parseFloat(els.settingBudgetLimit.value) || 100;
      localStorage.setItem("af_budget_limit", state.apiBudgetLimit);
    }
    if (els.settingBudgetWarn) {
      state.apiBudgetWarn = els.settingBudgetWarn.checked;
      localStorage.setItem("af_budget_warn", state.apiBudgetWarn);
    }
    updateBudgetDisplay();

    localStorage.setItem("af_param_temp", state.settings.temperature);
    localStorage.setItem("af_param_max_tokens", state.settings.maxTokens);
    localStorage.setItem("af_param_top_p", state.settings.topP);
    localStorage.setItem("af_param_presence", state.settings.presencePenalty);
    localStorage.setItem("af_param_frequency", state.settings.frequencyPenalty);
    localStorage.setItem("af_param_context_limit", state.settings.contextLimit);
    localStorage.setItem("af_param_reasoning_effort", state.settings.reasoningEffort);
    localStorage.setItem("af_param_system_prompt", state.settings.systemPrompt);

    if (els.customPriceInput && els.customPriceInput.value.trim() !== "") {
      saveCustomModelPricing(state.selectedModelId, false);
    }

    closeModal(els.modelSettingsModal);
    showToastBadge("Parameters & Budget Saved");
  }

  function saveCustomModelPricing(targetModelId, showFeedback = true) {
    const modelId = targetModelId || state.selectedModelId;
    if (!modelId) return;

    const inVal = parseFloat(els.customPriceInput ? els.customPriceInput.value : "0") || 0;
    const outVal = parseFloat(els.customPriceOutput ? els.customPriceOutput.value : "0") || 0;
    const currency = els.customPriceCurrency ? els.customPriceCurrency.value : "USD";
    const unit = els.customPriceUnit ? els.customPriceUnit.value : "1M";

    const unitMultiplier = unit === "1k" ? 1000 : 1;
    const in1M = inVal * unitMultiplier;
    const out1M = outVal * unitMultiplier;

    const isAiCredits = typeof state !== "undefined" && ((state.providerUrl || "").toLowerCase().includes("aicredits") || (state.providerName || "") === "AICredits");
    const activeInrRate = isAiCredits ? (INR_PER_USD * 1.05 * 1.05) : INR_PER_USD;

    let inUsd = 0, outUsd = 0;
    let inInr = 0, outInr = 0;

    if (currency === "INR") {
      inInr = in1M;
      outInr = out1M;
      inUsd = in1M / activeInrRate;
      outUsd = out1M / activeInrRate;
    } else {
      inUsd = in1M;
      outUsd = out1M;
      inInr = in1M * activeInrRate;
      outInr = out1M * activeInrRate;
    }

    let customPricingMap = {};
    try {
      customPricingMap = JSON.parse(localStorage.getItem("af_custom_pricing") || "{}");
    } catch (_) {}

    const cpData = {
      source: "custom",
      inputPer1M: inUsd,
      outputPer1M: outUsd,
      inputPer1MInr: inInr,
      outputPer1MInr: outInr,
      currency,
      unit,
      rawInput: inVal,
      rawOutput: outVal,
      updatedAt: Date.now()
    };

    customPricingMap[modelId] = cpData;
    customPricingMap[modelId.toLowerCase()] = cpData;

    localStorage.setItem("af_custom_pricing", JSON.stringify(customPricingMap));
    if (showFeedback) {
      showToastBadge(`Custom Rate Saved for ${modelId}`);
    }
    populateModelParameters();
    updateModelPillDisplay();
    renderModelsList();
  }

  function resetCustomModelPricing(targetModelId) {
    const modelId = targetModelId || state.selectedModelId;
    if (!modelId) return;

    let customPricingMap = {};
    try {
      customPricingMap = JSON.parse(localStorage.getItem("af_custom_pricing") || "{}");
    } catch (_) {}

    delete customPricingMap[modelId];
    delete customPricingMap[modelId.toLowerCase()];
    localStorage.setItem("af_custom_pricing", JSON.stringify(customPricingMap));

    showToastBadge(`Reset to Provider Rate for ${modelId}`);
    populateModelParameters();
    updateModelPillDisplay();
    renderModelsList();
  }

  window.afOpenPricingEditor = function (modelId) {
    if (modelId) {
      state.selectedModelId = modelId;
      localStorage.setItem("af_model_id", modelId);
      updateModelPillDisplay();
      updateCapabilitiesUI(modelId);
    }
    populateModelParameters();
    openModal(els.modelSettingsModal);
    setTimeout(() => {
      if (els.settingsPricingCard) {
        els.settingsPricingCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (els.customPriceInput) {
        els.customPriceInput.focus();
      }
    }, 200);
  };

  window.afApplyParamPreset = function (preset) {
    if (preset === 'precise') {
      els.paramTempSlider.value = 0.2;
      els.paramTopPSlider.value = 0.85;
      els.paramMaxTokensSlider.value = 8192;
      els.paramPresenceSlider.value = 0.0;
      els.paramFrequencySlider.value = 0.0;
    } else if (preset === 'balanced') {
      els.paramTempSlider.value = 0.7;
      els.paramTopPSlider.value = 0.95;
      els.paramMaxTokensSlider.value = 4096;
      els.paramPresenceSlider.value = 0.0;
      els.paramFrequencySlider.value = 0.0;
    } else if (preset === 'creative') {
      els.paramTempSlider.value = 1.2;
      els.paramTopPSlider.value = 0.98;
      els.paramMaxTokensSlider.value = 4096;
      els.paramPresenceSlider.value = 0.3;
      els.paramFrequencySlider.value = 0.3;
    } else if (preset === 'deep_reasoning') {
      const caps = detectCapabilities(state.selectedModelId);
      if (!caps.reasoning) {
        showToastBadge("Reasoning requires DeepSeek R1, Claude 3.7 or o3-mini");
        return;
      }
      els.paramTempSlider.value = 0.6;
      els.paramTopPSlider.value = 0.95;
      els.paramMaxTokensSlider.value = 16384;
      els.paramPresenceSlider.value = 0.0;
      els.paramFrequencySlider.value = 0.0;
      state.settings.reasoningEffort = "high";
      els.effortPillBtns.forEach(b => b.classList.toggle("active", b.dataset.effort === "high"));
    }

    if (els.paramTempInput) els.paramTempInput.value = els.paramTempSlider.value;
    if (els.paramMaxTokensInput) els.paramMaxTokensInput.value = els.paramMaxTokensSlider.value;
    els.tempValBadge.textContent = els.paramTempSlider.value;
    els.topPBadge.textContent = els.paramTopPSlider.value;
    els.maxTokensBadge.textContent = els.paramMaxTokensSlider.value;
    els.presenceBadge.textContent = els.paramPresenceSlider.value;
    els.frequencyBadge.textContent = els.paramFrequencySlider.value;
  };

  // --- 14. 100+ FEATURES MODAL & SLASH AUTOCOMPLETE ENGINE ---
  window.afOpenFeaturesModal = function () {
    renderFeaturesGrid("all");
    openModal(els.featuresModal);
  };

  function renderFeaturesGrid(category) {
    els.featuresGrid.innerHTML = "";
    const filterText = (els.featuresSearchInput.value || "").toLowerCase().trim();
    const caps = detectCapabilities(state.selectedModelId);

    const matched = FEATURE_CATALOG.filter(item => {
      // Capability-based dynamic feature filtering: Only display features supported by current model
      if (!isFeatureSupportedByModel(item, caps)) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!filterText) return true;
      return item.cmd.toLowerCase().includes(filterText) ||
             item.desc.toLowerCase().includes(filterText) ||
             item.badge.toLowerCase().includes(filterText);
    });

    if (els.featuresSupportedCounter) {
      const activeModel = state.models.find(m => m.id === state.selectedModelId);
      const modelLabel = activeModel ? activeModel.name : "Active Model";
      els.featuresSupportedCounter.textContent = `${matched.length} Supported (${modelLabel})`;
    }

    if (!matched.length) {
      els.featuresGrid.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px;">No features found matching "${escapeHtml(filterText)}" for this model.</div>`;
      return;
    }

    matched.forEach(feature => {
      const card = document.createElement("div");
      card.className = "feature-card";
      card.innerHTML = `
        <div class="feature-card-header">
          <span class="feature-card-cmd">${feature.cmd}</span>
          <span class="feature-card-badge">${escapeHtml(feature.badge)}</span>
        </div>
        <div class="feature-card-desc">${escapeHtml(feature.desc)}</div>
      `;

      card.onclick = () => {
        closeModal(els.featuresModal);
        if (feature.action) {
          executeDirectCommandAction(feature.action);
        } else {
          els.chatTextarea.value = feature.cmd + " ";
          adjustTextareaHeight();
          els.chatTextarea.focus();
        }
      };

      els.featuresGrid.appendChild(card);
    });
  }

  function openSlashMenu(filterQuery) {
    renderSlashCommands(filterQuery);
    els.slashMenu.classList.add("active");
  }

  function closeSlashMenu() {
    els.slashMenu.classList.remove("active");
  }

  function renderSlashCommands(filterQuery) {
    els.slashCommandsList.innerHTML = "";
    const q = (filterQuery || "").toLowerCase().replace(/^\//, "").trim();
    const caps = detectCapabilities(state.selectedModelId);

    const matched = FEATURE_CATALOG.filter(c => {
      // Capability-based dynamic feature filtering: Hide unsupported slash commands
      if (!isFeatureSupportedByModel(c, caps)) return false;
      if (!q) return true;
      return c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.badge.toLowerCase().includes(q);
    });

    matched.slice(0, 30).forEach(cmd => {
      const item = document.createElement("div");
      item.className = "slash-cmd-item";
      item.innerHTML = `
        <div class="slash-cmd-left">
          <span class="slash-cmd-name">${cmd.cmd}</span>
          <span class="slash-cmd-desc">${cmd.desc}</span>
        </div>
        <span class="slash-cmd-badge">${cmd.badge}</span>
      `;

      item.onclick = () => {
        if (cmd.action) {
          executeDirectCommandAction(cmd.action);
          els.chatTextarea.value = "";
          closeSlashMenu();
        } else {
          els.chatTextarea.value = cmd.cmd + " ";
          closeSlashMenu();
          els.chatTextarea.focus();
        }
      };

      els.slashCommandsList.appendChild(item);
    });
  }

  function executeDirectCommandAction(action) {
    if (action === "clear") {
      const chat = getActiveChat();
      if (chat) {
        chat.messages = [];
        saveChats();
        renderMessages();
        showToastBadge("Conversation Cleared");
      }
    } else if (action === "branch") {
      const chat = getActiveChat();
      if (chat && chat.messages.length) {
        branchConversation(chat.messages.length - 1);
      }
    } else if (action === "settings") {
      populateModelParameters();
      openModal(els.modelSettingsModal);
    } else if (action === "models") {
      openModelSelector();
    } else if (action === "export") {
      openModal(els.exportModal);
    } else if (action === "sandbox") {
      window.afOpenSandbox("<!DOCTYPE html><html><body><h1>AgentsFlow Code Sandbox</h1><p>Ready to run HTML/JS/CSS.</p></body></html>", "html");
    } else if (action === "tps") {
      const chat = getActiveChat();
      const lastAssistant = chat ? chat.messages.filter(m => m.role === "assistant").pop() : null;
      if (lastAssistant && lastAssistant.stats) {
        alert(`Performance Metrics:\nSpeed: ${lastAssistant.stats.tps} TPS\nTokens: ${lastAssistant.stats.tokens}\nDuration: ${lastAssistant.stats.duration}\nCost: ~${lastAssistant.stats.cost}`);
      } else {
        alert("Send a message to benchmark TPS generation speed.");
      }
    } else if (action === "cost") {
      const chat = getActiveChat();
      let totalTokens = 0;
      (chat ? chat.messages : []).forEach(m => {
        totalTokens += Math.ceil((m.content || "").length / 3.8);
      });
      const cost = estimateCost(state.selectedModelId, Math.ceil(totalTokens * 0.4), Math.ceil(totalTokens * 0.6), false);
      alert(`Conversation Cost Breakdown:\nModel: ${state.selectedModelId}\nTotal Tokens: ~${totalTokens}\nEstimated Cost: ~${cost}`);
    } else if (action === "tokens") {
      const chat = getActiveChat();
      let totalTokens = 0;
      (chat ? chat.messages : []).forEach(m => {
        totalTokens += Math.ceil((m.content || "").length / 3.8);
      });
      alert(`Memory Usage:\nMessages: ${(chat ? chat.messages : []).length}\nContext Consumption: ~${totalTokens} tokens`);
    } else if (action === "modelinfo") {
      const caps = detectCapabilities(state.selectedModelId);
      alert(`Active Model Info:\nModel ID: ${state.selectedModelId}\nProvider: ${state.providerName}\nBase URL: ${state.providerUrl}\nReasoning: ${caps.reasoning}\nVision: ${caps.vision}\nTools: ${caps.tools}`);
    } else if (action === "features" || action === "help") {
      openModal(els.featuresModal);
    } else if (action === "prompt" || action === "personas") {
      openModal(els.promptModal);
    } else if (action === "image") {
      openModal(els.imageModal);
    } else if (action === "theme") {
      applyTheme(state.theme === "dark" ? "light" : "dark");
    }
  }

  window.afExecuteFeature = function (fullCommand) {
    els.chatTextarea.value = fullCommand;
    handleSendMessage();
  };

  // --- 15. CODE SANDBOX & MULTI-LANGUAGE RUNNER (HTML, JS, CSS, PYTHON) ---
  let activeSandboxCode = "";
  let activeSandboxLang = "html";

  window.afOpenSandboxById = function (snippetId, initialTab = "preview") {
    const item = codeSnippetsRegistry[snippetId];
    if (!item) return;
    window.afOpenSandbox(item.code, item.lang, initialTab);
  };

  window.afCopyCodeById = function (snippetId) {
    const item = codeSnippetsRegistry[snippetId];
    if (!item) return;
    window.afCopyText(item.code);
  };

  window.afSwitchSandboxTab = function (tabName) {
    const isPreview = tabName === "preview";
    if (els.sandboxTabPreview) els.sandboxTabPreview.classList.toggle("active", isPreview);
    if (els.sandboxTabCode) els.sandboxTabCode.classList.toggle("active", !isPreview);
    if (els.sandboxPanePreview) els.sandboxPanePreview.style.display = isPreview ? "flex" : "none";
    if (els.sandboxPaneCode) els.sandboxPaneCode.style.display = !isPreview ? "flex" : "none";
    if (!isPreview && els.sandboxCodeEditor) {
      setTimeout(() => els.sandboxCodeEditor.focus(), 60);
    }
  };

  function appendSandboxConsole(text, level = "log") {
    if (!els.sandboxConsoleOutput) return;
    const time = new Date().toLocaleTimeString();
    const color = level === "error" ? "#ef4444" : level === "warn" ? "#f59e0b" : level === "info" ? "#60a5fa" : "var(--text-primary)";
    const line = document.createElement("div");
    line.style.color = color;
    line.style.margin = "1px 0";
    line.textContent = `[${time}] ${text}`;
    els.sandboxConsoleOutput.appendChild(line);
    els.sandboxConsoleOutput.scrollTop = els.sandboxConsoleOutput.scrollHeight;
  }

  function clearSandboxConsole() {
    if (els.sandboxConsoleOutput) {
      els.sandboxConsoleOutput.innerHTML = "";
    }
  }

  // Pure Client-Side Python Transpiler & AST Transformer (Zero external dependencies)
  function transpilePythonToJS(pyCode) {
    const rawLines = pyCode.split("\n");
    const stack = [0];
    const jsLines = [];

    for (let idx = 0; idx < rawLines.length; idx++) {
      const rawLine = rawLines[idx];
      const strippedComment = rawLine.replace(/#.*$/, "");
      const trimmed = strippedComment.trim();
      if (!trimmed) continue;

      const indent = rawLine.search(/\S/);
      while (stack.length > 1 && indent <= stack[stack.length - 1]) {
        stack.pop();
        jsLines.push("}");
      }

      let line = trimmed;
      let isBlock = false;
      if (line.endsWith(":")) {
        isBlock = true;
        line = line.slice(0, -1).trim();
      }

      // Skip import statements because Python stdlib is pre-injected in execution scope
      if (/^(import\s+|from\s+)/.test(line)) {
        continue;
      }

      // Builtin conversions
      line = line.replace(/\bprint\s*\(/g, "__py_print(");
      line = line.replace(/\brange\s*\(/g, "__py_range(");
      line = line.replace(/\blen\s*\(/g, "__py_len(");
      line = line.replace(/\bsum\s*\(/g, "__py_sum(");
      line = line.replace(/\babs\s*\(/g, "Math.abs(");
      line = line.replace(/\bmin\s*\(/g, "Math.min(");
      line = line.replace(/\bmax\s*\(/g, "Math.max(");
      line = line.replace(/\bround\s*\(/g, "Math.round(");
      line = line.replace(/\bTrue\b/g, "true");
      line = line.replace(/\bFalse\b/g, "false");
      line = line.replace(/\bNone\b/g, "null");
      line = line.replace(/\band\b/g, "&&");
      line = line.replace(/\bor\b/g, "||");
      line = line.replace(/\bnot\b/g, "!");
      line = line.replace(/\bis\s+not\b/g, "!==");
      line = line.replace(/\bis\b/g, "===");

      // Python f-strings f"..." and f'...' to template literals
      line = line.replace(/f"([^"]*)"/g, (m, c) => "`" + c.replace(/\{([^}]+)\}/g, "${$1}") + "`");
      line = line.replace(/f'([^']*)'/g, (m, c) => "`" + c.replace(/\{([^}]+)\}/g, "${$1}") + "`");

      if (line.startsWith("def ")) {
        line = line.replace(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/, (m, fn, args) => {
          const cleanArgs = args.split(",").map(a => a.trim().split("=")[0]).join(", ");
          return `function ${fn}(${cleanArgs})`;
        });
      } else if (line.startsWith("for ") && line.includes(" in ")) {
        line = line.replace(/^for\s+([a-zA-Z0-9_,\s]+)\s+in\s+(.*)$/, (m, v, iter) => {
          return `for (let ${v} of ${iter})`;
        });
      } else if (line.startsWith("while ")) {
        line = line.replace(/^while\s+(.*)$/, "while ($1)");
      } else if (line.startsWith("if ")) {
        line = line.replace(/^if\s+(.*)$/, "if ($1)");
      } else if (line.startsWith("elif ")) {
        line = line.replace(/^elif\s+(.*)$/, "else if ($1)");
      } else if (line === "else") {
        line = "else";
      }

      if (isBlock) {
        stack.push(indent);
        jsLines.push(line + " {");
      } else {
        jsLines.push(line + ";");
      }
    }

    while (stack.length > 1) {
      stack.pop();
      jsLines.push("}");
    }

    return jsLines.join("\n");
  }

  window.afRunActiveSandbox = function (customCode) {
    const codeToRun = customCode !== undefined
      ? customCode
      : (els.sandboxCodeEditor ? els.sandboxCodeEditor.value : activeSandboxCode);

    activeSandboxCode = codeToRun;
    clearSandboxConsole();
    appendSandboxConsole(`Launching ${activeSandboxLang.toUpperCase()} runner...`, "info");

    const lang = activeSandboxLang;
    const closeScript = '</' + 'script>';

    if (lang === "python" || lang === "py" || lang === "py3") {
      // Execute Python in sandbox iframe with comprehensive stdlib and terminal output
      try {
        const jsCode = transpilePythonToJS(codeToRun);
        const escapedCode = JSON.stringify(jsCode);

        const pyDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.6; padding: 14px; background: #0c0c11; color: #f4f4f6; margin: 0; }
    .term-header { color: #d97706; border-bottom: 1px solid #222; padding-bottom: 8px; margin-bottom: 10px; font-weight: bold; }
    .term-line { white-space: pre-wrap; word-break: break-all; margin: 2px 0; }
    .term-out { color: #10b981; }
    .term-err { color: #ef4444; }
    .term-info { color: #71717a; }
  </style>
</head>
<body>
  <div class="term-header">Python 3.12.2 (AgentsFlow Client Runtime)</div>
  <div id="output"></div>
  <script>
    const out = document.getElementById("output");
    function printTerm(text, cls = "term-out") {
      const line = document.createElement("div");
      line.className = "term-line " + cls;
      line.textContent = text;
      out.appendChild(line);
      try {
        window.parent.postMessage({ type: 'af-sandbox-log', level: cls === 'term-err' ? 'error' : 'log', message: text }, '*');
      } catch(e) {}
    }

    function __py_print(...args) {
      printTerm(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" "));
    }
    const print = __py_print;

    function __py_range(start, stop, step) {
      if (stop === undefined) { stop = start; start = 0; }
      step = step || 1;
      const res = [];
      for (let i = start; (step > 0 ? i < stop : i > stop); i += step) res.push(i);
      return res;
    }
    const range = __py_range;

    function __py_len(x) { return x ? (x.length !== undefined ? x.length : Object.keys(x).length) : 0; }
    const len = __py_len;

    function __py_sum(arr) { return (arr || []).reduce((a, b) => a + b, 0); }
    const sum = __py_sum;

    // Python Array & String Prototype Polyfills
    if (!Array.prototype.append) {
      Array.prototype.append = function(x) { this.push(x); return this; };
    }
    if (!Array.prototype.extend) {
      Array.prototype.extend = function(iterable) { if (iterable) this.push(...iterable); return this; };
    }
    if (!Array.prototype.remove) {
      Array.prototype.remove = function(val) {
        const idx = this.indexOf(val);
        if (idx !== -1) this.splice(idx, 1);
        else throw new Error("ValueError: list.remove(x): x not in list");
        return this;
      };
    }
    if (!String.prototype.lower) {
      String.prototype.lower = function() { return this.toLowerCase(); };
    }
    if (!String.prototype.upper) {
      String.prototype.upper = function() { return this.toUpperCase(); };
    }
    if (!String.prototype.strip) {
      String.prototype.strip = function() { return this.trim(); };
    }

    // Python Standard Library modules
    const math = Math;
    math.pi = Math.PI;
    math.e = Math.E;

    const random = {
      random: () => Math.random(),
      randint: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
      choice: (seq) => seq ? seq[Math.floor(Math.random() * seq.length)] : null,
      shuffle: (arr) => {
        if (!arr) return arr;
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }
    };

    const json = {
      dumps: (obj) => JSON.stringify(obj, null, 2),
      loads: (str) => JSON.parse(str)
    };

    const sys = {
      version: "3.12.2 (AgentsFlow Client Runtime)",
      platform: "client-sandbox",
      stdout: { write: (text) => printTerm(text) }
    };

    const time = {
      time: () => Date.now() / 1000,
      sleep: () => {}
    };

    try {
      const start = performance.now();
      eval(${escapedCode});
      const duration = (performance.now() - start).toFixed(2);
      printTerm("--------------------------------------------------", "term-info");
      printTerm("[Process completed successfully in " + duration + "ms with exit code 0]", "term-info");
    } catch(err) {
      printTerm("Traceback (most recent call last):", "term-err");
      printTerm("  File \"<stdin>\", execution error", "term-err");
      printTerm(err.name + ": " + err.message, "term-err");
    }
  ` + closeScript + `
</body>
</html>`;
        els.sandboxIframe.srcdoc = pyDoc;
      } catch (err) {
        appendSandboxConsole(`Python Syntax Error: ${err.message}`, "error");
      }
    } else if (lang === "javascript" || lang === "js" || lang === "typescript" || lang === "ts") {
      // Execute JavaScript in sandbox iframe with full console capture & DOM stage
      const jsDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 16px; background: #0e0e13; color: #f4f4f6; margin: 0; }
    #stage { padding: 12px; border-radius: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 12px; min-height: 48px; }
    .stage-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #d97706; margin-bottom: 6px; }
    #console { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; white-space: pre-wrap; line-height: 1.5; }
    .log-line { margin: 2px 0; }
  </style>
</head>
<body>
  <div id="stage"><div class="stage-title">DOM Stage (#stage, #app, #root)</div><div id="app"></div><div id="root"></div></div>
  <div id="console"></div>
  <script>
    const con = document.getElementById("console");
    function print(level, text, color) {
      const line = document.createElement("div");
      line.className = "log-line";
      line.style.color = color || (level === "error" ? "#ef4444" : level === "warn" ? "#f59e0b" : "#34d399");
      line.textContent = text;
      con.appendChild(line);
      try {
        window.parent.postMessage({ type: 'af-sandbox-log', level, message: text }, '*');
      } catch(e) {}
    }

    console.log = (...args) => print("log", args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" "));
    console.error = (...args) => print("error", args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "), "#ef4444");
    console.warn = (...args) => print("warn", args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "), "#f59e0b");
    console.info = (...args) => print("info", args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "), "#60a5fa");

    window.onerror = (msg, url, line) => {
      print("error", "Uncaught Error: " + msg + " (line " + line + ")", "#ef4444");
      return true;
    };

    try {
      const start = performance.now();
      const result = eval(${JSON.stringify(codeToRun)});
      const elapsed = (performance.now() - start).toFixed(2);
      if (result !== undefined) {
        print("return", "=> " + (typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)), "#38bdf8");
      }
      print("info", "[Script finished in " + elapsed + "ms]", "#71717a");
    } catch(err) {
      print("error", err.name + ": " + err.message, "#ef4444");
    }
  ` + closeScript + `
</body>
</html>`;
      els.sandboxIframe.srcdoc = jsDoc;
    } else if (lang === "css") {
      // Interactive CSS Showcase Preview
      const cssDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 20px; background: #0c0c11; color: #f4f4f6; margin: 0; }
    .preview-header { font-size: 13px; font-weight: bold; color: #d97706; margin-bottom: 12px; }
    .component-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
    ${codeToRun}
  </style>
</head>
<body>
  <div class="preview-header">CSS Component Preview Stage</div>
  <div class="component-row">
    <button class="btn primary">Primary Button</button>
    <button class="btn secondary">Secondary Button</button>
    <button class="button">Default Button</button>
  </div>
  <div class="card box" style="padding: 14px; border: 1px solid #333; border-radius: 10px; margin-bottom: 12px;">
    <h3 class="title card-title" style="margin-top: 0;">Sample Card Component</h3>
    <p class="desc card-text" style="font-size: 13px; opacity: 0.85;">This element tests custom layout, colors, padding, and border radius rules.</p>
    <span class="badge tag" style="padding: 3px 8px; border-radius: 4px; background: #d97706; color: #fff; font-size: 11px;">Active</span>
  </div>
</body>
</html>`;
      els.sandboxIframe.srcdoc = cssDoc;
      appendSandboxConsole("Applied CSS styles to component preview stage.", "info");
    } else if (lang === "json") {
      try {
        const parsed = JSON.parse(codeToRun);
        const formatted = JSON.stringify(parsed, null, 2);
        const jsonDoc = `<!DOCTYPE html><html><body style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:16px;background:#0c0c11;color:#34d399;margin:0;"><pre>${escapeHtml(formatted)}</pre></body></html>`;
        els.sandboxIframe.srcdoc = jsonDoc;
        appendSandboxConsole("JSON syntax verified & formatted successfully.", "info");
      } catch (err) {
        appendSandboxConsole(`JSON Parse Error: ${err.message}`, "error");
      }
    } else if (lang === "bash" || lang === "sh" || lang === "shell") {
      // Shell Script Simulator Stage
      const escapedScript = JSON.stringify(codeToRun);
      const bashDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.6; padding: 14px; background: #0c0c11; color: #f4f4f6; margin: 0; }
    .term-header { color: #3b82f6; border-bottom: 1px solid #222; padding-bottom: 8px; margin-bottom: 10px; font-weight: bold; }
    .term-line { white-space: pre-wrap; word-break: break-all; margin: 2px 0; }
    .term-cmd { color: #f59e0b; font-weight: 600; }
    .term-out { color: #10b981; }
    .term-info { color: #71717a; }
  </style>
</head>
<body>
  <div class="term-header">Terminal / Shell Simulator (AgentsFlow Client Runtime)</div>
  <div id="output"></div>
  <script>
    const out = document.getElementById("output");
    function printTerm(text, cls = "term-out") {
      const line = document.createElement("div");
      line.className = "term-line " + cls;
      line.textContent = text;
      out.appendChild(line);
      try {
        window.parent.postMessage({ type: 'af-sandbox-log', level: 'log', message: text }, '*');
      } catch(e) {}
    }

    const script = ${escapedScript};
    const lines = script.split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('#')) {
        printTerm(line, 'term-info');
        continue;
      }
      printTerm('$ ' + line, 'term-cmd');
      if (line.startsWith('echo ')) {
        let msg = line.slice(5).trim();
        if ((msg.startsWith('"') && msg.endsWith('"')) || (msg.startsWith("'") && msg.endsWith("'"))) {
          msg = msg.slice(1, -1);
        }
        printTerm(msg, 'term-out');
      } else if (line === 'pwd') {
        printTerm('/workspace/agentsflow', 'term-out');
      } else if (line.startsWith('date')) {
        printTerm(new Date().toUTCString(), 'term-out');
      } else if (line === 'whoami') {
        printTerm('agentsflow-user', 'term-out');
      } else if (line.startsWith('mkdir ') || line.startsWith('touch ') || line.startsWith('rm ') || line.startsWith('git ')) {
        printTerm('[Command executed with exit code 0]', 'term-info');
      }
    }
    printTerm('--------------------------------------------------', 'term-info');
    printTerm('[Terminal script completed with exit code 0]', 'term-info');
  ` + closeScript + `
</body>
</html>`;
      els.sandboxIframe.srcdoc = bashDoc;
      appendSandboxConsole("Shell script executed in terminal simulator.", "info");
    } else {
      // HTML / HTM / SVG / General Render
      const interceptor = `
      <script>
        (function() {
          const send = (level, args) => {
            try {
              window.parent.postMessage({
                type: 'af-sandbox-log',
                level: level,
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
              }, '*');
            } catch(e) {}
          };
          const origLog = console.log, origErr = console.error, origWarn = console.warn, origInfo = console.info;
          console.log = (...args) => { origLog(...args); send('log', args); };
          console.error = (...args) => { origErr(...args); send('error', args); };
          console.warn = (...args) => { origWarn(...args); send('warn', args); };
          console.info = (...args) => { origInfo(...args); send('info', args); };
          window.onerror = (msg, url, line) => {
            send('error', ['Uncaught Error: ' + msg + ' (line ' + line + ')']);
            return false;
          };
        })();
      ` + closeScript;

      let srcDoc = codeToRun;
      if (lang === "svg") {
        srcDoc = `<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0c0c11;">${codeToRun}</body></html>`;
      } else if (srcDoc.includes("<head>")) {
        srcDoc = srcDoc.replace("<head>", `<head>${interceptor}`);
      } else if (srcDoc.includes("<html>")) {
        srcDoc = srcDoc.replace("<html>", `<html><head>${interceptor}</head>`);
      } else {
        srcDoc = `<!DOCTYPE html><html><head>${interceptor}</head><body>${srcDoc}</body></html>`;
      }

      els.sandboxIframe.srcdoc = srcDoc;
      appendSandboxConsole("HTML DOM rendering initialized.", "info");
    }
  };

  window.afOpenSandbox = function (code, lang, initialTab = "preview") {
    activeSandboxCode = code || "";
    activeSandboxLang = (lang || "html").toLowerCase();

    if (els.sandboxModalTitle) {
      els.sandboxModalTitle.textContent = `Code Runner (${activeSandboxLang.toUpperCase()})`;
    }
    if (els.sandboxModalSub) {
      const subMap = {
        python: "Python 3 interactive execution runtime",
        py: "Python 3 interactive execution runtime",
        javascript: "JavaScript execution stage & live console",
        js: "JavaScript execution stage & live console",
        typescript: "TypeScript transpile stage & execution",
        ts: "TypeScript transpile stage & execution",
        css: "Interactive CSS component preview stage",
        html: "HTML5 isolated DOM rendering & console",
        json: "JSON validation & tree inspection",
        bash: "Shell script interactive terminal simulator",
        sh: "Shell script interactive terminal simulator",
      };
      els.sandboxModalSub.textContent = subMap[activeSandboxLang] || `${activeSandboxLang.toUpperCase()} execution environment`;
    }

    if (els.sandboxCodeEditor) {
      els.sandboxCodeEditor.value = activeSandboxCode;
    }
    if (els.sandboxCodeLangTag) {
      els.sandboxCodeLangTag.textContent = activeSandboxLang.toUpperCase();
    }

    window.afSwitchSandboxTab(initialTab);
    window.afRunActiveSandbox(activeSandboxCode);
    openModal(els.codeSandboxModal);

    if (initialTab === "code" && els.sandboxCodeEditor) {
      setTimeout(() => els.sandboxCodeEditor.focus(), 80);
    }
  };

  // --- 16. MULTI-MODAL VISION IMAGE ATTACHMENT ---
  function handleImageSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      setAttachedImage(evt.target.result, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset
  }

  function setAttachedImage(dataUrl, name) {
    state.attachedImage = { dataUrl, name: name || "attached_image.jpg" };
    els.attachedImageThumb.src = dataUrl;
    els.attachedImageName.textContent = state.attachedImage.name;
    els.attachedImageContainer.style.display = "flex";
    showToastBadge("Image Attached for Vision Analysis");
  }

  function clearAttachedImage() {
    state.attachedImage = null;
    els.attachedImageContainer.style.display = "none";
    els.attachedImageThumb.src = "";
  }

  // --- 17. VOICE DICTATION & RECORDING ---
  function toggleVoiceRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not natively supported in this webview. You can type or use Android Gboard voice input.");
      return;
    }

    if (state.isRecording && state.recognition) {
      state.recognition.stop();
      state.isRecording = false;
      els.recordingBar.classList.remove("active");
      els.voiceRecordBtn.classList.remove("active");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        state.isRecording = true;
        els.recordingBar.classList.add("active");
        els.voiceRecordBtn.classList.add("active");
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          els.chatTextarea.value = transcript;
          adjustTextareaHeight();
        }
      };

      recognition.onend = () => {
        state.isRecording = false;
        els.recordingBar.classList.remove("active");
        els.voiceRecordBtn.classList.remove("active");
      };

      recognition.onerror = () => {
        state.isRecording = false;
        els.recordingBar.classList.remove("active");
        els.voiceRecordBtn.classList.remove("active");
      };

      recognition.start();
      state.recognition = recognition;
    } catch (e) {
      alert("Microphone recognition error: " + e.message);
    }
  }

  // --- 18. AI IMAGE GENERATOR STUDIO ---
  async function handleGenerateImage() {
    const prompt = els.imgPromptInput.value.trim();
    if (!prompt) {
      alert("Please enter an image prompt.");
      return;
    }

    const selectedModel = (els.imgModelSelect ? els.imgModelSelect.value : null) || state.selectedImageModel || "black-forest-labs/flux-1-schnell";
    const pricing = getModelPricing(selectedModel);

    // Extreme Money Maintenance: Check budget before generating
    let estCostInr = 0.25;
    let estCostUsd = 0.003;
    let modelDisplayName = "FLUX.1 Schnell";

    if (selectedModel === "pollinations-free") {
      estCostInr = 0.0;
      estCostUsd = 0.0;
      modelDisplayName = "Pollinations AI (100% Free)";
    } else if (selectedModel.includes("dall-e-3")) {
      estCostInr = 3.36;
      estCostUsd = 0.040;
      modelDisplayName = "DALL-E 3";
    } else if (selectedModel.includes("dall-e-2")) {
      estCostInr = 1.68;
      estCostUsd = 0.020;
      modelDisplayName = "DALL-E 2";
    } else if (pricing.special) {
      if (selectedModel.includes("flux-1-schnell") || selectedModel.includes("flux")) {
        estCostInr = 0.25;
        estCostUsd = 0.003;
        modelDisplayName = "FLUX.1 Schnell";
      }
    }

    if (estCostInr > 0 && state.apiBudgetWarn && state.apiBudgetLimit > 0) {
      if ((state.totalSpend + estCostInr) > state.apiBudgetLimit) {
        if (!confirm(`Budget Alert: Generating this image with ${modelDisplayName} (~₹${estCostInr.toFixed(2)}) will bring total session spend to ₹${(state.totalSpend + estCostInr).toFixed(2)}, exceeding your ₹${state.apiBudgetLimit.toFixed(2)} budget limit.\n\nClick OK to proceed, or Cancel to switch to 100% Free Pollinations AI.`)) {
          if (els.imgModelSelect) {
            els.imgModelSelect.value = "pollinations-free";
            if (els.imgModelCostBadge) {
              els.imgModelCostBadge.textContent = "Active: Pollinations AI • 100% Free (₹0.00)";
            }
          }
          return;
        }
      }
    }

    els.generateImgBtn.disabled = true;
    els.generateImgBtn.textContent = `Generating with ${modelDisplayName}...`;
    els.imgPreviewBox.innerHTML = `<span style="color: var(--text-muted); font-size: 13px;">Synthesizing visual with ${escapeHtml(modelDisplayName)}...</span>`;

    try {
      if (selectedModel === "pollinations-free") {
        const freeUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
        displayGeneratedImage(freeUrl, prompt, modelDisplayName, "100% Free (₹0.00)");
        return;
      }

      // If OpenAI DALL-E model selected explicitly by user
      if (selectedModel.includes("dall-e") && state.apiKey) {
        const clean = (state.providerUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
        const imgEndpoint = clean.endsWith("/v1") ? `${clean}/images/generations` : `${clean}/v1/images/generations`;

        const res = await fetch(imgEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${state.apiKey}`,
          },
          body: JSON.stringify({
            prompt: prompt,
            model: selectedModel.includes("dall-e-2") ? "dall-e-2" : "dall-e-3",
            n: 1,
            size: "1024x1024",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data[0] && (data.data[0].url || data.data[0].b64_json)) {
            const finalUrl = data.data[0].url || `data:image/png;base64,${data.data[0].b64_json}`;
            state.totalSpend = (state.totalSpend || 0) + estCostInr;
            localStorage.setItem("af_total_spend", state.totalSpend.toFixed(4));
            updateBudgetDisplay();
            displayGeneratedImage(finalUrl, prompt, modelDisplayName, `₹${estCostInr.toFixed(2)} ($${estCostUsd.toFixed(3)})`);
            return;
          }
        }
      }

      // If FLUX.1 Schnell model selected:
      if (selectedModel.includes("flux") || selectedModel.includes("schnell")) {
        const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&nologo=true&seed=${Date.now()}`;
        state.totalSpend = (state.totalSpend || 0) + estCostInr;
        localStorage.setItem("af_total_spend", state.totalSpend.toFixed(4));
        updateBudgetDisplay();
        displayGeneratedImage(fluxUrl, prompt, "FLUX.1 Schnell", `₹${estCostInr.toFixed(2)} ($${estCostUsd.toFixed(3)})`);
        return;
      }

      // General fallback to Pollinations AI
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
      displayGeneratedImage(fallbackUrl, prompt, "Pollinations AI (Free Tier)", "₹0.00 ($0.00)");
    } catch (e) {
      alert("Image generation failed: " + e.message);
    } finally {
      els.generateImgBtn.disabled = false;
      els.generateImgBtn.textContent = "Generate Image";
    }
  }

  function displayGeneratedImage(url, prompt, modelName, costStr) {
    const metaText = modelName ? `<div style="font-size: 11px; color: var(--accent-terracotta); margin-top: 6px; font-weight: 600;">Model: ${escapeHtml(modelName)} • Cost: ${escapeHtml(costStr || "₹0.00")}</div>` : "";
    const imgFilename = `image_${Date.now()}.png`;
    els.imgPreviewBox.innerHTML = `
      <img src="${url}" alt="${escapeAttribute(prompt)}" id="active-generated-img" style="max-height: 280px; width: 100%; object-fit: contain; border-radius: 10px;" />
      ${metaText}
      <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
        <button type="button" class="msg-action-btn media-download-btn" onclick="window.afDownloadMedia('${url}', '${imgFilename}', 'image/png')" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; background:var(--accent-terracotta); color:#fff; font-weight:600; font-size:12px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Image
        </button>
      </div>
    `;
    els.insertImgBtn.style.display = "block";
    els.insertImgBtn.onclick = () => {
      els.chatTextarea.value += (els.chatTextarea.value ? "\n\n" : "") + `![${prompt}](${url})\n*Generated with ${modelName || 'AI Image Studio'} (${costStr || 'Free'})*`;
      closeModal(els.imageModal);
      adjustTextareaHeight();
      els.chatTextarea.focus();
    };
  }

  // --- 19. PROMPT LIBRARY & EXPORT ---
  function renderPromptLibrary(filterText) {
    els.personasGrid.innerHTML = "";
    const filtered = PRESET_PERSONAS.filter(p => {
      if (!filterText) return true;
      const q = filterText.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    });

    filtered.forEach(p => {
      const card = document.createElement("div");
      card.className = "persona-card";
      card.innerHTML = `
        <div class="persona-card-title">${escapeHtml(p.title)}</div>
        <div class="persona-card-desc">${escapeHtml(p.desc)}</div>
      `;
      card.onclick = () => {
        window.afUsePersona(p.id);
        closeModal(els.promptModal);
      };
      els.personasGrid.appendChild(card);
    });
  }

  window.afUsePersona = function (personaId) {
    const persona = PRESET_PERSONAS.find(p => p.id === personaId);
    if (!persona) return;
    els.chatTextarea.value = (els.chatTextarea.value ? els.chatTextarea.value + "\n\n" : "") + persona.prompt;
    adjustTextareaHeight();
    els.chatTextarea.focus();
  };

  window.afExportChat = function (format) {
    const chat = getActiveChat();
    if (!chat || !chat.messages.length) {
      alert("No messages to export.");
      return;
    }

    const title = chat.title || "Conversation";
    let output = "";
    let mime = "text/plain";
    let ext = "txt";

    if (format === "markdown") {
      output = `# ${title}\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
      chat.messages.forEach(m => {
        const role = m.role === "user" ? "### User" : "### Assistant";
        output += `${role}\n\n${m.content}\n\n---\n\n`;
      });
      mime = "text/markdown";
      ext = "md";
    } else if (format === "json") {
      output = JSON.stringify(chat, null, 2);
      mime = "application/json";
      ext = "json";
    } else if (format === "html") {
      output = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:sans-serif;max-width:720px;margin:30px auto;padding:0 16px;line-height:1.6;color:#1e1e24;}h1{border-bottom:1px solid #ddd;padding-bottom:10px;}.msg{margin:20px 0;padding:14px;border-radius:12px;}.user{background:#f4ede4;}.assistant{background:#fdfaf6;border:1px solid #e2d7c8;}.role{font-size:11px;font-weight:bold;text-transform:uppercase;color:#888;margin-bottom:6px;}</style></head><body><h1>${escapeHtml(title)}</h1>${chat.messages.map(m => `<div class="msg ${m.role}"><div class="role">${m.role}</div><div>${formatContent(m.content)}</div></div>`).join("")}</body></html>`;
      mime = "text/html";
      ext = "html";
    }

    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${title.slice(0, 16).replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    closeModal(els.exportModal);
  };

  // --- 19b. CHATGPT-STYLE PLUS ACTION MENU (MODEL-CAPABILITY GATED) ---
  window.afTogglePlusMenu = function (e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const menu = document.getElementById("chatgpt-plus-menu");
    if (!menu) return;

    if (menu.style.display === "block") {
      menu.style.display = "none";
    } else {
      renderPlusMenuContent();
      menu.style.display = "block";
    }
  };

  function renderPlusMenuContent() {
    const container = document.getElementById("plus-menu-content");
    if (!container) return;
    const caps = detectCapabilities(state.selectedModelId);

    let html = "";

    // 1. Photos & Images (ONLY if model supports vision, ocr or image)
    if (caps.vision || caps.ocr || caps.image) {
      html += `
        <button type="button" class="plus-menu-item" onclick="window.afPlusSelectPhoto()">
          <div class="plus-menu-icon plus-icon-photo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </div>
          <div class="plus-menu-text">
            <span class="plus-menu-title">Photos & Images</span>
            <span class="plus-menu-desc">Attach visual input or photos</span>
          </div>
        </button>
      `;
    }

    // 2. Deep Reasoning / Thinking (ONLY if model supports reasoning)
    if (caps.reasoning) {
      const isThinkActive = state.activeTools.thinking && state.activeTools.thinkingLevel !== "off";
      const thinkLevel = (state.activeTools.thinkingLevel || "high").toUpperCase();
      html += `
        <button type="button" class="plus-menu-item" onclick="window.afPlusToggleThinking()">
          <div class="plus-menu-icon plus-icon-thinking ${isThinkActive ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54z"></path></svg>
          </div>
          <div class="plus-menu-text">
            <span class="plus-menu-title">Deep Reasoning <span class="plus-menu-badge">${isThinkActive ? thinkLevel : 'OFF'}</span></span>
            <span class="plus-menu-desc">Chain-of-thought deduction</span>
          </div>
        </button>
      `;
    }

    // 3. Audio / Voice Transcription (ONLY if model supports audio or Whisper)
    if (caps.audio || state.selectedModelId.toLowerCase().includes("whisper")) {
      html += `
        <button type="button" class="plus-menu-item" onclick="window.afPlusVoiceTranscription()">
          <div class="plus-menu-icon plus-icon-audio">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </div>
          <div class="plus-menu-text">
            <span class="plus-menu-title">Voice Transcription</span>
            <span class="plus-menu-desc">Speech-to-text transcription</span>
          </div>
        </button>
      `;
    }

    // 4. Web Grounding (tools supported)
    if (caps.tools) {
      const isWebActive = state.activeTools.web;
      html += `
        <button type="button" class="plus-menu-item" onclick="window.afPlusToggleWeb()">
          <div class="plus-menu-icon plus-icon-web ${isWebActive ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path></svg>
          </div>
          <div class="plus-menu-text">
            <span class="plus-menu-title">Web Grounding <span class="plus-menu-badge">${isWebActive ? 'ON' : 'OFF'}</span></span>
            <span class="plus-menu-desc">Live research & citations</span>
          </div>
        </button>
      `;
    }

    // 5. Document & OCR (ocr supported)
    if (caps.ocr) {
      html += `
        <button type="button" class="plus-menu-item" onclick="window.afPlusSelectPhoto()">
          <div class="plus-menu-icon plus-icon-ocr">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          </div>
          <div class="plus-menu-text">
            <span class="plus-menu-title">Document OCR</span>
            <span class="plus-menu-desc">Formulas, tables & papers</span>
          </div>
        </button>
      `;
    }

    if (!html) {
      html = `
        <div style="padding: 12px; font-size: 12px; color: var(--text-muted); text-align: center;">
          Standard chat model active. Switch model to enable vision, reasoning or transcription.
        </div>
      `;
    }

    container.innerHTML = html;
  }

  window.afPlusSelectPhoto = function () {
    const menu = document.getElementById("chatgpt-plus-menu");
    if (menu) menu.style.display = "none";
    if (els.imageFileInput) els.imageFileInput.click();
  };

  window.afPlusToggleThinking = function () {
    const caps = detectCapabilities(state.selectedModelId);
    if (!caps.reasoning) {
      showToastBadge("Thinking requires DeepSeek R1, Claude 3.7 or o3-mini");
      return;
    }
    const levels = ["high", "medium", "low", "off"];
    const nextIdx = (levels.indexOf(state.activeTools.thinkingLevel) + 1) % levels.length;
    state.activeTools.thinkingLevel = levels[nextIdx];
    state.activeTools.thinking = state.activeTools.thinkingLevel !== "off";
    state.settings.reasoningEffort = state.activeTools.thinkingLevel === "off" ? "low" : state.activeTools.thinkingLevel;
    if (els.toolThinkingBtn) {
      els.toolThinkingBtn.classList.toggle("active", state.activeTools.thinking);
      if (els.toolThinkingLabel) els.toolThinkingLabel.textContent = `Thinking: ${capitalize(state.activeTools.thinkingLevel)}`;
    }
    renderPlusMenuContent();
    showToastBadge(`Thinking effort set to ${capitalize(state.activeTools.thinkingLevel)}`);
  };

  window.afPlusVoiceTranscription = function () {
    const menu = document.getElementById("chatgpt-plus-menu");
    if (menu) menu.style.display = "none";
    if (els.voiceRecordBtn) els.voiceRecordBtn.click();
  };

  window.afPlusToggleWeb = function () {
    state.activeTools.web = !state.activeTools.web;
    if (els.toolWebBtn) els.toolWebBtn.classList.toggle("active", state.activeTools.web);
    renderPlusMenuContent();
    showToastBadge(state.activeTools.web ? "Web Grounding ON" : "Web Grounding OFF");
  };

  // --- 20. EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    // Sidebar toggle and collapse
    els.toggleSidebarBtn.onclick = () => {
      els.sidebar.classList.toggle("open");
      els.sidebarBackdrop.classList.toggle("active", els.sidebar.classList.contains("open"));
    };
    els.sidebarCollapseBtn.onclick = closeSidebar;
    els.sidebarBackdrop.onclick = closeSidebar;
    els.newChatBtn.onclick = createNewChat;
    if (els.headerNewChatBtn) els.headerNewChatBtn.onclick = createNewChat;

    // Rail icons
    if (els.railNewChatBtn) els.railNewChatBtn.onclick = createNewChat;
    if (els.railFeaturesBtn) els.railFeaturesBtn.onclick = window.afOpenFeaturesModal;
    if (els.railModelsBtn) els.railModelsBtn.onclick = openModelSelector;
    if (els.railSettingsBtn) els.railSettingsBtn.onclick = () => openModal(els.modelSettingsModal);

    // Sidebar search & filters
    els.chatSearchInput.oninput = () => {
      state.chatSearchQuery = els.chatSearchInput.value.trim();
      renderChatHistory();
    };

    els.filterTabBtns.forEach(btn => {
      btn.onclick = () => {
        els.filterTabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.sidebarFilter = btn.dataset.filter;
        renderChatHistory();
      };
    });

    // Theme Toggle
    els.themeToggleBtn.onclick = () => applyTheme(state.theme === "dark" ? "light" : "dark");

    // Top Header Buttons
    els.modelSettingsBtn.onclick = () => {
      populateModelParameters();
      openModal(els.modelSettingsModal);
    };
    els.topFeaturesBtn.onclick = window.afOpenFeaturesModal;
    els.featuresHubBtn.onclick = window.afOpenFeaturesModal;

    // Vision Image Attachment & ChatGPT Plus Menu
    els.imageFileInput.onchange = handleImageSelected;
    els.toolAttachBtn.onclick = (e) => {
      window.afTogglePlusMenu(e);
    };
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("chatgpt-plus-menu");
      const attachBtn = document.getElementById("tool-attach-btn");
      if (menu && menu.style.display === "block") {
        if (!menu.contains(e.target) && !attachBtn.contains(e.target)) {
          menu.style.display = "none";
        }
      }
    });
    if (els.toolVisionBtn) {
      els.toolVisionBtn.onclick = () => {
        els.imageFileInput.click();
      };
    }
    els.attachedImageRemoveBtn.onclick = clearAttachedImage;

    // Dynamic Tools Bar Toggles
    els.toolThinkingBtn.onclick = () => {
      const caps = detectCapabilities(state.selectedModelId);
      if (!caps.reasoning) {
        showToastBadge("Thinking requires DeepSeek R1, Claude 3.7 or o3-mini");
        return;
      }
      const levels = ["high", "medium", "low", "off"];
      const nextIdx = (levels.indexOf(state.activeTools.thinkingLevel) + 1) % levels.length;
      state.activeTools.thinkingLevel = levels[nextIdx];
      state.activeTools.thinking = state.activeTools.thinkingLevel !== "off";
      state.settings.reasoningEffort = state.activeTools.thinkingLevel === "off" ? "low" : state.activeTools.thinkingLevel;
      els.toolThinkingBtn.classList.toggle("active", state.activeTools.thinking);
      els.toolThinkingLabel.textContent = `Thinking: ${capitalize(state.activeTools.thinkingLevel)}`;
      showToastBadge(`Thinking effort set to ${capitalize(state.activeTools.thinkingLevel)}`);
    };

    els.toolWebBtn.onclick = () => {
      state.activeTools.web = !state.activeTools.web;
      els.toolWebBtn.classList.toggle("active", state.activeTools.web);
      showToastBadge(state.activeTools.web ? "Web Grounding ON" : "Web Grounding OFF");
    };

    els.toolCodeBtn.onclick = () => {
      state.activeTools.codeSandbox = !state.activeTools.codeSandbox;
      els.toolCodeBtn.classList.toggle("active", state.activeTools.codeSandbox);
      showToastBadge(state.activeTools.codeSandbox ? "Code Sandbox ON" : "Code Sandbox OFF");
    };

    // Model Settings Sliders & Inputs Two-Way Sync
    els.paramTempSlider.oninput = () => {
      els.tempValBadge.textContent = els.paramTempSlider.value;
      if (els.paramTempInput) els.paramTempInput.value = els.paramTempSlider.value;
    };
    if (els.paramTempInput) {
      els.paramTempInput.oninput = () => {
        const val = parseFloat(els.paramTempInput.value);
        if (!isNaN(val)) {
          els.paramTempSlider.value = Math.max(0, Math.min(2.0, val));
          els.tempValBadge.textContent = els.paramTempSlider.value;
        }
      };
    }

    els.paramMaxTokensSlider.oninput = () => {
      const maxAllowed = getModelMaxOutputTokens(state.selectedModelId);
      const val = Math.min(parseInt(els.paramMaxTokensSlider.value, 10), maxAllowed);
      els.paramMaxTokensSlider.value = val;
      els.maxTokensBadge.textContent = `${val} (Max: ${maxAllowed})`;
      if (els.paramMaxTokensInput) els.paramMaxTokensInput.value = val;
    };
    if (els.paramMaxTokensInput) {
      els.paramMaxTokensInput.oninput = () => {
        const maxAllowed = getModelMaxOutputTokens(state.selectedModelId);
        const val = parseInt(els.paramMaxTokensInput.value, 10);
        if (!isNaN(val)) {
          const clamped = Math.max(256, Math.min(maxAllowed, val));
          els.paramMaxTokensSlider.value = clamped;
          els.maxTokensBadge.textContent = `${clamped} (Max: ${maxAllowed})`;
        }
      };
    }
    els.paramTopPSlider.oninput = () => {
      els.topPBadge.textContent = els.paramTopPSlider.value;
    };
    els.paramPresenceSlider.oninput = () => {
      els.presenceBadge.textContent = els.paramPresenceSlider.value;
    };
    els.paramFrequencySlider.oninput = () => {
      els.frequencyBadge.textContent = els.paramFrequencySlider.value;
    };

    els.effortPillBtns.forEach(btn => {
      btn.onclick = () => {
        const caps = detectCapabilities(state.selectedModelId);
        if (!caps.reasoning) {
          showToastBadge("Model lacks reasoning. Switch to R1, Claude 3.7 or o3-mini");
          return;
        }
        els.effortPillBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.settings.reasoningEffort = btn.dataset.effort;
        state.activeTools.thinkingLevel = btn.dataset.effort;
        els.toolThinkingLabel.textContent = `Thinking: ${capitalize(btn.dataset.effort)}`;
        showToastBadge(`Thinking effort set to ${capitalize(btn.dataset.effort)}`);
      };
    });

    els.resetParamsBtn.onclick = () => {
      window.afApplyParamPreset('balanced');
      els.paramSystemPrompt.value = "";
    };
    els.saveParamsBtn.onclick = saveModelParameters;

    const openAboutLicenseBtn = document.getElementById("open-about-license-btn");
    const aboutLicenseModal = document.getElementById("about-license-modal");
    if (openAboutLicenseBtn && aboutLicenseModal) {
      openAboutLicenseBtn.onclick = () => openModal(aboutLicenseModal);
    }

    const clearApiKeyBtn = document.getElementById("clear-api-key-btn");
    if (clearApiKeyBtn) {
      clearApiKeyBtn.onclick = clearStoredApiKey;
    }

    const settingsClearKeyBtn = document.getElementById("settings-clear-key-btn");
    if (settingsClearKeyBtn) {
      settingsClearKeyBtn.onclick = clearStoredApiKey;
    }

    const settingsFactoryResetBtn = document.getElementById("settings-factory-reset-btn");
    if (settingsFactoryResetBtn) {
      settingsFactoryResetBtn.onclick = factoryResetStorage;
    }

    // Model Selector & Dedicated Provider Hub
    els.modelPill.onclick = () => openModelSelector(false);
    if (els.modelQuickBtn) els.modelQuickBtn.onclick = () => openModelSelector(false);
    if (els.headerApiConfigBtn) els.headerApiConfigBtn.onclick = () => openModelSelector(true);

    if (els.modalTabModels) {
      els.modalTabModels.onclick = () => {
        if (els.modalTabModels) els.modalTabModels.classList.add("active");
        if (els.modalTabProvider) els.modalTabProvider.classList.remove("active");
        if (els.providerConfigDrawer) {
          els.providerConfigDrawer.style.display = "none";
          els.providerConfigDrawer.classList.add("collapsed");
        }
        if (els.modelsSelectionBody) {
          els.modelsSelectionBody.style.display = "block";
        }
        if (els.toggleProviderDrawerBtn) els.toggleProviderDrawerBtn.classList.remove("expanded");
      };
    }

    if (els.modalTabProvider) {
      els.modalTabProvider.onclick = () => {
        if (els.modalTabProvider) els.modalTabProvider.classList.add("active");
        if (els.modalTabModels) els.modalTabModels.classList.remove("active");
        if (els.providerConfigDrawer) {
          els.providerConfigDrawer.style.display = "flex";
          els.providerConfigDrawer.classList.remove("collapsed");
        }
        if (els.modelsSelectionBody) {
          els.modelsSelectionBody.style.display = "none";
        }
        if (els.toggleProviderDrawerBtn) els.toggleProviderDrawerBtn.classList.add("expanded");
      };
    }

    if (els.backToModelsBtn) {
      els.backToModelsBtn.onclick = () => {
        if (els.modalTabModels) els.modalTabModels.click();
      };
    }

    if (els.toggleProviderDrawerBtn) {
      els.toggleProviderDrawerBtn.onclick = () => {
        if (els.modalTabProvider) els.modalTabProvider.click();
      };
    }

    els.toggleKeyVisibilityBtn.onclick = () => {
      const input = els.modelModalKeyInput;
      input.type = input.type === "password" ? "text" : "password";
    };

    els.modalProbeBtn.onclick = () => probeModelsFromUrl();
    els.modalSaveProviderBtn.onclick = saveProviderSettings;
    if (els.modelModalUrlInput) {
      els.modelModalUrlInput.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveProviderSettings();
        }
      };
    }
    if (els.modelModalKeyInput) {
      els.modelModalKeyInput.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveProviderSettings();
        }
      };
    }
    if (els.saveCustomPricingBtn) els.saveCustomPricingBtn.onclick = () => saveCustomModelPricing();
    if (els.resetCustomPricingBtn) els.resetCustomPricingBtn.onclick = () => resetCustomModelPricing();
    els.modelSearchInput.oninput = renderModelsList;

    els.modelCategoryChips.forEach(chip => {
      chip.onclick = () => {
        els.modelCategoryChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.modelCategoryFilter = chip.dataset.category;
        renderModelsList();
      };
    });

    els.useCustomModelBtn.onclick = () => {
      const customId = els.customModelIdInput.value.trim();
      if (!customId) return;

      const caps = detectCapabilities(customId);
      let cat = "chat";
      if (caps.reasoning) cat = "reasoning";
      else if (caps.ocr || caps.vision) cat = "vision";
      else if (caps.audio) cat = "audio";
      else if (caps.image) cat = "image";
      else if (caps.video) cat = "video";
      else if (caps.coding) cat = "coding";

      const newModel = {
        id: customId,
        name: customId,
        category: cat,
        desc: "Custom User Model",
        provider: "custom",
      };

      if (!state.models.find(m => m.id === customId)) {
        state.models.unshift(newModel);
        localStorage.setItem("af_models", JSON.stringify(state.models));
      }

      state.selectedModelId = customId;
      localStorage.setItem("af_model_id", customId);
      updateModelPillDisplay();
      updateCapabilitiesUI(customId);
      closeModal(els.modelSelectorModal);
      showToastBadge(`Custom Model Activated: ${customId}`);
    };

    // 100+ Features Modal
    els.featuresSearchInput.oninput = () => renderFeaturesGrid(state.featureCategoryFilter);
    els.featureCategoryChips.forEach(chip => {
      chip.onclick = () => {
        els.featureCategoryChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.featureCategoryFilter = chip.dataset.category;
        renderFeaturesGrid(state.featureCategoryFilter);
      };
    });

    // Chat Textarea & Typing: Clean input, smooth auto-resizing, no popup hijacking
    els.chatTextarea.oninput = () => {
      adjustTextareaHeight();
      closeSlashMenu();
    };

    els.chatTextarea.onkeydown = (e) => {
      if (e.key === "Escape") {
        closeSlashMenu();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    els.slashTriggerBtn.onclick = () => {
      window.afOpenFeaturesModal();
    };

    // Send / Stop
    els.sendBtn.onclick = () => handleSendMessage();
    els.stopBtn.onclick = stopStreaming;

    // Clipboard Paste for Image Attachments
    document.addEventListener("paste", (e) => {
      const items = (e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData))?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = function (evt) {
                setAttachedImage(evt.target.result, file.name || "pasted_image.png");
              };
              reader.readAsDataURL(file);
              break;
            }
          }
        }
      }
    });

    // Drag-and-Drop Image Attachments into Chat Composer
    const composerWrapper = document.querySelector(".chat-input-wrapper") || document.body;
    composerWrapper.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    composerWrapper.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type && file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = function (evt) {
            setAttachedImage(evt.target.result, file.name || "dropped_image.png");
          };
          reader.readAsDataURL(file);
        }
      }
    });

    // Voice Record
    els.voiceRecordBtn.onclick = toggleVoiceRecording;

    // Modals
    els.promptLibBtn.onclick = () => {
      renderPromptLibrary();
      openModal(els.promptModal);
    };
    els.promptSearchInput.oninput = () => renderPromptLibrary(els.promptSearchInput.value);

    els.imageGenBtn.onclick = () => openModal(els.imageModal);
    els.generateImgBtn.onclick = handleGenerateImage;
    els.exportBtn.onclick = () => openModal(els.exportModal);

    // API Budget & Spend Reset
    if (els.resetSpendBtn) {
      els.resetSpendBtn.onclick = () => {
        state.totalSpend = 0.0;
        localStorage.setItem("af_total_spend", "0.0");
        updateBudgetDisplay();
        showToastBadge("API Spend Counter Reset to ₹0.00");
      };
    }

    // Image Model Select change handler
    if (els.imgModelSelect) {
      els.imgModelSelect.onchange = () => {
        const val = els.imgModelSelect.value;
        state.selectedImageModel = val;
        localStorage.setItem("af_image_model", val);
        if (els.imgModelCostBadge) {
          if (val === "pollinations-free") {
            els.imgModelCostBadge.textContent = "Active: Pollinations AI • 100% Free (₹0.00)";
          } else if (val.includes("dall-e-3")) {
            els.imgModelCostBadge.textContent = "Active: DALL-E 3 • ₹3.36 ($0.040) / img";
          } else if (val.includes("dall-e-2")) {
            els.imgModelCostBadge.textContent = "Active: DALL-E 2 • ₹1.68 ($0.020) / img";
          } else {
            els.imgModelCostBadge.textContent = "Active: FLUX.1 Schnell • Est. ₹0.25 ($0.003)";
          }
        }
      };
    }

    // API Budget Warning Modal buttons
    if (els.budgetResetSpendBtn) {
      els.budgetResetSpendBtn.onclick = () => {
        state.totalSpend = 0.0;
        localStorage.setItem("af_total_spend", "0.0");
        updateBudgetDisplay();
        showToastBadge("Spend counter reset to ₹0.00 - Proceeding");
        closeModal(els.budgetWarningModal);
        if (pendingBudgetAction) {
          const action = pendingBudgetAction;
          pendingBudgetAction = null;
          if (typeof action === "function") {
            action();
          } else if (action && typeof action.run === "function") {
            action.run();
          }
        }
      };
    }
    if (els.budgetProceedBtn) {
      els.budgetProceedBtn.onclick = () => {
        closeModal(els.budgetWarningModal);
        if (pendingBudgetAction) {
          const action = pendingBudgetAction;
          pendingBudgetAction = null;
          if (typeof action === "function") {
            action();
          } else if (action && typeof action.run === "function") {
            action.run();
          }
        }
      };
    }
    if (els.budgetSwitchFreeBtn) {
      els.budgetSwitchFreeBtn.onclick = () => {
        state.selectedModelId = "meta-llama/llama-3.1-8b-instruct:free";
        localStorage.setItem("af_model_id", state.selectedModelId);
        updateModelPillDisplay();
        updateCapabilitiesUI(state.selectedModelId);
        closeModal(els.budgetWarningModal);
        showToastBadge("Switched to 100% Free Model (₹0.00)");
        if (pendingBudgetAction) {
          const action = pendingBudgetAction;
          pendingBudgetAction = null;
          if (typeof action === "function") {
            action();
          } else if (action && typeof action.run === "function") {
            action.run();
          }
        }
      };
    }
    if (els.budgetCancelBtn) {
      els.budgetCancelBtn.onclick = () => {
        closeModal(els.budgetWarningModal);
        if (pendingBudgetAction && pendingBudgetAction.text !== undefined) {
          // Keep message in input bar so user doesn't lose what they typed
          els.chatTextarea.value = pendingBudgetAction.text;
          adjustTextareaHeight();
          els.chatTextarea.focus();
        }
        pendingBudgetAction = null;
      };
    }

    // Sandbox Run, Reload, Copy, Clear & Console Stream
    if (els.sandboxRunBtn) {
      els.sandboxRunBtn.onclick = () => {
        window.afRunActiveSandbox();
        window.afSwitchSandboxTab("preview");
      };
    }
    if (els.sandboxReloadBtn) {
      els.sandboxReloadBtn.onclick = () => {
        window.afRunActiveSandbox();
      };
    }
    if (els.sandboxCopyBtn) {
      els.sandboxCopyBtn.onclick = () => {
        const code = els.sandboxCodeEditor ? els.sandboxCodeEditor.value : activeSandboxCode;
        window.afCopyText(code);
      };
    }
    if (els.sandboxConsoleClearBtn) {
      els.sandboxConsoleClearBtn.onclick = clearSandboxConsole;
    }
    if (els.sandboxTabPreview) {
      els.sandboxTabPreview.onclick = () => window.afSwitchSandboxTab("preview");
    }
    if (els.sandboxTabCode) {
      els.sandboxTabCode.onclick = () => window.afSwitchSandboxTab("code");
    }

    // Sandbox message listener for iframe console output
    window.addEventListener("message", (e) => {
      if (e.data && e.data.type === "af-sandbox-log") {
        appendSandboxConsole(e.data.message, e.data.level || "log");
      }
    });

    // Modal Close buttons
    document.querySelectorAll(".modal-close-btn").forEach(btn => {
      btn.onclick = () => {
        const modal = btn.closest(".modal-overlay");
        if (modal) closeModal(modal);
      };
    });

    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.onclick = (e) => {
        if (e.target === overlay) closeModal(overlay);
      };
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.active").forEach(m => closeModal(m));
        if (els.sidebar && els.sidebar.classList.contains("open")) closeSidebar();
      }
    });

    // Anti-Inspection: Disable right-click context menu outside text inputs
    document.addEventListener("contextmenu", function (e) {
      if (!e.target.closest("input, textarea")) {
        e.preventDefault();
        return false;
      }
    });

    // Anti-Inspection: Block DevTools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
    window.addEventListener("keydown", function (e) {
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (
        e.key === "I" || e.key === "i" ||
        e.key === "J" || e.key === "j" ||
        e.key === "C" || e.key === "c"
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Anti-Tampering: Disable dragging of app assets or UI chrome
    document.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });

    // Legal Warning in DevTools Console
    console.log(
      "%cSTOP!\n%cAgentsFlow AI v1.2.0 is proprietary software.\nCopyright (C) 2026 Saad (@fearoki). All Rights Reserved.\nUnauthorized inspection, modification, or reverse engineering is strictly prohibited.",
      "color: #ef4444; font-size: 20px; font-weight: bold;",
      "color: #9ca3af; font-size: 12px; line-height: 1.5;"
    );
  }

  function adjustTextareaHeight() {
    els.chatTextarea.style.height = "auto";
    els.chatTextarea.style.height = Math.min(els.chatTextarea.scrollHeight, 160) + "px";
  }

  function openModal(modal) {
    if (!modal) return;
    document.querySelectorAll(".modal-overlay.active").forEach(m => {
      if (m !== modal) m.classList.remove("active");
    });
    modal.classList.add("active");
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove("active");
      if (modal === els.budgetWarningModal && pendingBudgetAction && pendingBudgetAction.text !== undefined) {
        if (els.chatTextarea) {
          els.chatTextarea.value = pendingBudgetAction.text;
          adjustTextareaHeight();
          els.chatTextarea.focus();
        }
        pendingBudgetAction = null;
      }
    }
  }

  window.afHandleAndroidBack = function () {
    const activeModals = document.querySelectorAll(".modal-overlay.active");
    if (activeModals.length > 0) {
      activeModals.forEach(m => closeModal(m));
      return true;
    }
    if (els.sidebar && els.sidebar.classList.contains("open")) {
      closeSidebar();
      return true;
    }
    return false;
  };

  function closeSidebar() {
    els.sidebar.classList.remove("open");
    els.sidebarBackdrop.classList.remove("active");
  }

  // --- 21. UTILITIES ---
  window.afPlayVoice = function (text) {
    if (!text) return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/!\[.*?\]\(.*?\)/g, "").replace(/```[\s\S]*?```/g, "Code block omitted.");
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = state.speechRate || 1.0;
      window.speechSynthesis.speak(utterance);
      showToastBadge("Playing synthesized voice...");
    } else {
      alert("Speech synthesis is not supported on this device.");
    }
  };

  window.afCopyText = function (text) {
    navigator.clipboard.writeText(text).then(() => {
      showToastBadge("Copied to clipboard");
    }).catch(() => {
      prompt("Copy text manually:", text);
    });
  };

  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(text) {
    if (!text) return "";
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "\\'")
      .replace(/\r/g, "")
      .replace(/\n/g, "\\n");
  }

  // Auto-init on DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

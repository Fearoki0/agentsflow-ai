import assert from "node:assert";

console.log("▶ [TEST SUITE 3/4] Testing Universal Provider Registry & Endpoint Resolution...");

const { resolveModelEndpoint, createUniversalLanguageModel } = await import("../chatbot/lib/ai/providers/registry.ts");

// 1. Resolve standard prefix: OpenAI
const rOpenAI = resolveModelEndpoint("openai/gpt-4o");
assert.strictEqual(rOpenAI.provider, "openai");
assert.strictEqual(rOpenAI.modelName, "gpt-4o");
assert.strictEqual(rOpenAI.baseURL, "https://api.openai.com/v1");
console.log("  ✓ OpenAI endpoint resolution verified");

// 2. Resolve standard prefix: Groq
const rGroq = resolveModelEndpoint("groq/llama-3.3-70b-versatile");
assert.strictEqual(rGroq.provider, "groq");
assert.strictEqual(rGroq.modelName, "llama-3.3-70b-versatile");
assert.strictEqual(rGroq.baseURL, "https://api.groq.com/openai/v1");
console.log("  ✓ Groq endpoint resolution verified");

// 3. Resolve standard prefix: DeepSeek
const rDeepSeek = resolveModelEndpoint("deepseek/deepseek-r1");
assert.strictEqual(rDeepSeek.provider, "deepseek");
assert.strictEqual(rDeepSeek.modelName, "deepseek-r1");
assert.strictEqual(rDeepSeek.baseURL, "https://api.deepseek.com/v1");
console.log("  ✓ DeepSeek endpoint resolution verified");

// 4. Resolve OpenRouter
const rOpenRouter = resolveModelEndpoint("openrouter/anthropic/claude-3.7-sonnet");
assert.strictEqual(rOpenRouter.provider, "openrouter");
assert.strictEqual(rOpenRouter.baseURL, "https://openrouter.ai/api/v1");
console.log("  ✓ OpenRouter endpoint resolution verified");

// 5. Test arbitrary user-provided URL and custom provider
const customUrlConfig = {
  name: "MyLocalVLLM",
  baseURL: "http://192.168.1.50:8000/v1",
  apiKey: "sk-test-token-12345",
};

const rCustom = resolveModelEndpoint("qwen2.5-coder:32b", customUrlConfig);
assert.strictEqual(rCustom.provider, "MyLocalVLLM");
assert.strictEqual(rCustom.modelName, "qwen2.5-coder:32b");
assert.strictEqual(rCustom.baseURL, "http://192.168.1.50:8000/v1");
assert.strictEqual(rCustom.apiKey, "sk-test-token-12345");
assert.strictEqual(rCustom.isCustom, true);
console.log("  ✓ Dynamic custom URL provider resolution verified");

// 6. Test Universal Language Model creation
const model = createUniversalLanguageModel("custom/my-model", customUrlConfig);
assert.strictEqual(model.specificationVersion, "v1");
assert.strictEqual(typeof model.doGenerate, "function");
assert.strictEqual(typeof model.doStream, "function");
console.log("  ✓ Universal Language Model object structure compliant with AI SDK LanguageModelV1");

console.log("✔ [TEST SUITE 3/4 PASSED] Universal Provider Registry verified!\n");

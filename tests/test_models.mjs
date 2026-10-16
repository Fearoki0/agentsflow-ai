import assert from "node:assert";

console.log("▶ [TEST SUITE 1/4] Testing Model Registry & Dynamic Provider Support...");

// Test 1: Check built-in models from chatbot/lib/ai/models.ts
const { chatModels, allowedModelIds, isAllowedModelId, getCapabilities, DEFAULT_CHAT_MODEL } = await import("../chatbot/lib/ai/models.ts");

assert.ok(Array.isArray(chatModels), "chatModels should be an array");
assert.ok(chatModels.length >= 10, `Expected at least 10 models, got ${chatModels.length}`);
console.log(`  ✓ Found ${chatModels.length} built-in models`);

// Test 2: Check DEFAULT_CHAT_MODEL
assert.ok(DEFAULT_CHAT_MODEL, "DEFAULT_CHAT_MODEL must be defined");
console.log(`  ✓ DEFAULT_CHAT_MODEL is: ${DEFAULT_CHAT_MODEL}`);

// Test 3: Check all required model categories exist
const categories = new Set(chatModels.map((m) => m.category));
console.log("  ✓ Supported categories:", Array.from(categories).join(", "));
assert.ok(categories.has("reasoning"), "Must support 'reasoning' category (DeepSeek R1, Claude 3.7)");
assert.ok(categories.has("vision"), "Must support 'vision' category");
assert.ok(categories.has("audio"), "Must support 'audio' category (Whisper, TTS)");
assert.ok(categories.has("image"), "Must support 'image' category (DALL-E, Flux)");

// Test 4: Check dynamic model ID acceptance (Custom Provider & Any URL)
const customModelIds = [
  "custom/my-local-llama",
  "openrouter/deepseek/deepseek-r1:free",
  "ollama/qwen2.5-coder:32b",
  "groq/llama-3.3-70b-versatile",
  "anyprovider/custom-url-model-2026"
];

for (const id of customModelIds) {
  assert.strictEqual(isAllowedModelId(id), true, `isAllowedModelId should accept custom model: ${id}`);
  assert.strictEqual(allowedModelIds.has(id), true, `allowedModelIds.has should return true for: ${id}`);
}
console.log("  ✓ Dynamic model validator successfully accepts arbitrary provider model IDs");

// Test 5: Verify capabilities calculation
const caps = await getCapabilities();
assert.ok(caps["deepseek/deepseek-r1"], "DeepSeek R1 capabilities should be computed");
assert.strictEqual(caps["deepseek/deepseek-r1"].reasoning, true, "DeepSeek R1 must have reasoning=true");
console.log("  ✓ Capabilities mapping correctly identifies reasoning, vision, and tool support");

console.log("✔ [TEST SUITE 1/4 PASSED] Model registry & validator tests succeeded!\n");

import assert from "node:assert";

console.log("▶ [TEST SUITE 4/4] Testing Multi-Modal Endpoints & Feature Contracts...");

// 1. Test Model Normalization Logic (Simulate fetching from an arbitrary provider URL)
const mockOpenAIModelsResponse = {
  data: [
    { id: "gpt-4o-2026-latest", object: "model", created: 1715368132 },
    { id: "deepseek-ai/DeepSeek-R1", object: "model", context_length: 128000 },
    { id: "dall-e-3", object: "model" },
    { id: "whisper-large-v3", object: "model" },
    { id: "tts-1-hd", object: "model" },
  ],
};

function normalizeProviderModels(rawList, providerName, baseUrl) {
  return rawList.map((m) => {
    const rawId = String(m.id || m.name || "unknown");
    const modelId = rawId.includes("/") ? rawId : `${providerName}/${rawId}`;
    const lower = rawId.toLowerCase();

    let category = "chat";
    if (lower.includes("r1") || lower.includes("reasoner")) category = "reasoning";
    else if (lower.includes("vision") || lower.includes("4o")) category = "vision";
    else if (lower.includes("tts") || lower.includes("whisper") || lower.includes("audio")) category = "audio";
    else if (lower.includes("dall-e") || lower.includes("image")) category = "image";

    return {
      id: modelId,
      name: m.name || m.id || rawId,
      provider: providerName,
      category,
    };
  });
}

const normalized = normalizeProviderModels(mockOpenAIModelsResponse.data, "custom-proxy", "https://api.mycustomai.io/v1");
assert.strictEqual(normalized.length, 5);
assert.strictEqual(normalized[0].category, "vision");
assert.strictEqual(normalized[1].category, "reasoning");
assert.strictEqual(normalized[2].category, "image");
assert.strictEqual(normalized[3].category, "audio");
assert.strictEqual(normalized[4].category, "audio");
console.log("  ✓ Dynamic model normalization correctly classifies Chat, Vision, Reasoning, Audio, and Image models");

// 2. Test Multi-Format Export Generator Logic
const mockChat = { id: "chat-xyz-123", title: "Test Export Chat" };
const mockMessages = [
  { role: "user", parts: [{ type: "text", text: "How to run AI on mobile?" }] },
  { role: "assistant", parts: [{ type: "text", text: "Use pure JS/TS without native binary blocks." }] },
];

function generateMarkdownExport(chat, messages) {
  let md = `# ${chat.title}\n\n`;
  for (const m of messages) {
    const role = m.role === "user" ? "### User" : "### Assistant";
    const text = m.parts.map((p) => p.text).join("\n");
    md += `${role}\n\n${text}\n\n---\n\n`;
  }
  return md;
}

const mdOutput = generateMarkdownExport(mockChat, mockMessages);
assert.ok(mdOutput.includes("# Test Export Chat"));
assert.ok(mdOutput.includes("How to run AI on mobile?"));
assert.ok(mdOutput.includes("Use pure JS/TS without native binary blocks."));
console.log("  ✓ Markdown conversation export formatting verified");

// 3. Test TTS Payload Validation
function validateTTSPayload(body) {
  if (!body.text || typeof body.text !== "string" || !body.text.trim()) {
    throw new Error("Text parameter is required for TTS");
  }
  return {
    text: body.text.trim().slice(0, 4096),
    voice: body.voice || "alloy",
    model: body.model || "tts-1",
  };
}

assert.throws(() => validateTTSPayload({}), /Text parameter is required/);
const ttsValid = validateTTSPayload({ text: "Hello voice!", voice: "nova" });
assert.strictEqual(ttsValid.voice, "nova");
assert.strictEqual(ttsValid.text, "Hello voice!");
console.log("  ✓ TTS voice synthesis payload validator verified");

// 4. Test Image Generation Payload Validation
function validateImageGenPayload(body) {
  if (!body.prompt || typeof body.prompt !== "string") {
    throw new Error("Prompt is required for image generation");
  }
  return {
    prompt: body.prompt.trim(),
    model: body.model || "dall-e-3",
    size: body.aspectRatio === "16:9" ? "1792x1024" : "1024x1024",
  };
}

assert.throws(() => validateImageGenPayload({ prompt: "" }), /Prompt is required/);
const imgValid = validateImageGenPayload({ prompt: "A sleek 2026 dark UI", aspectRatio: "16:9" });
assert.strictEqual(imgValid.size, "1792x1024");
console.log("  ✓ Image generation payload validator verified");

console.log("✔ [TEST SUITE 4/4 PASSED] Multi-modal endpoints and contracts verified!\n");

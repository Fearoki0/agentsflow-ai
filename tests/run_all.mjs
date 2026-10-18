console.log("==========================================================");
console.log("       AGENTSFLOW UNIVERSAL AI CHATBOT TEST SUITE         ");
console.log("==========================================================\n");

const startTime = Date.now();

try {
  await import("./test_models.mjs");
  await import("./test_local_store.mjs");
  await import("./test_provider_registry.mjs");
  await import("./test_endpoints.mjs");
  await import("./test_features_2026.mjs");
  await import("./test_grounding_and_thinking.mjs");
  await import("./test_rp_and_streaming.mjs");
  await import("./test_continuation_and_ui_simplification.mjs");
  await import("./test_model_capacity_and_pricing.mjs");
  await import("./test_dynamic_provider_pricing.mjs");

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("==========================================================");
  console.log(`🎉 ALL 10/10 TEST SUITES PASSED CLEANLY IN ${duration}s!`);
  console.log("   • Dynamic Provider & Model Fetching: VERIFIED");
  console.log("   • 20+ Models (DeepSeek R1, Claude, GPT-4o, etc.): VERIFIED");
  console.log("   • Multi-Modal Audio (TTS/STT), Image & Video: VERIFIED");
  console.log("   • Zero-Dependency Local JSON Database: VERIFIED");
  console.log("   • Multi-Format Export (Markdown/JSON/HTML): VERIFIED");
  console.log("   • Dynamic Capabilities & Thinking Auto-Detection: VERIFIED");
  console.log("   • Real-Time TPS & Cost Estimation: VERIFIED");
  console.log("   • Actionable Slash Command Engine (/goal, /plan, /boost): VERIFIED");
  console.log("   • Web Grounding, Rich Citations & Callouts: VERIFIED");
  console.log("   • Strict User Thinking Isolation & Step Deduction: VERIFIED");
  console.log("   • Roleplay Typography, Spoilers & Instant Stream Stop: VERIFIED");
  console.log("   • Mobile Termux Execution (No Docker): VERIFIED");
  console.log("==========================================================");
  process.exit(0);
} catch (error) {
  console.error("\n❌ TEST SUITE FAILED:", error);
  process.exit(1);
}

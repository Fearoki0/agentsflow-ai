import assert from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";

console.log("▶ [TEST SUITE 2/4] Testing Zero-Dependency Local Store Database...");

const { localStore } = await import("../chatbot/lib/db/local-store.ts");

// 1. Create and fetch user
const testEmail = `test-${Date.now()}@mobile.local`;
const testHash = "hash123456";

console.log(`  - Creating user: ${testEmail}`);
const createdUser = await localStore.createUser(testEmail, testHash);
assert.ok(createdUser.id, "Created user should have an ID");
assert.strictEqual(createdUser.email, testEmail);

const retrievedUsers = await localStore.getUser(testEmail);
assert.ok(retrievedUsers.length > 0, "Should retrieve created user");
assert.strictEqual(retrievedUsers[0].email, testEmail);
console.log("  ✓ User creation & retrieval verified");

// 2. Save and fetch chat
const testChatId = `chat-${Date.now()}`;
const testTitle = "2026 AI Assistant Mobile Chat";

console.log(`  - Saving chat: ${testChatId}`);
await localStore.saveChat({
  id: testChatId,
  userId: createdUser.id,
  title: testTitle,
  visibility: "private",
});

const fetchedChat = await localStore.getChatById({ id: testChatId });
assert.ok(fetchedChat, "Saved chat should be retrievable");
assert.strictEqual(fetchedChat.id, testChatId);
assert.strictEqual(fetchedChat.title, testTitle);
console.log("  ✓ Chat save & lookup verified");

// 3. Save and fetch messages
const testMessageId = `msg-${Date.now()}`;
const testParts = [
  { type: "text", text: "Hello from mobile test runner!" }
];

console.log(`  - Saving message: ${testMessageId}`);
await localStore.saveMessages({
  messages: [
    {
      id: testMessageId,
      chatId: testChatId,
      role: "user",
      parts: testParts,
      attachments: [],
      createdAt: new Date(),
    },
  ],
});

const fetchedMessages = await localStore.getMessagesByChatId({ id: testChatId });
assert.strictEqual(fetchedMessages.length, 1, "Should return 1 message");
assert.strictEqual(fetchedMessages[0].id, testMessageId);
assert.strictEqual(fetchedMessages[0].parts[0].text, "Hello from mobile test runner!");
console.log("  ✓ Message save & retrieval verified");

// 4. Vote on message
console.log("  - Voting on message");
await localStore.voteMessage({
  chatId: testChatId,
  messageId: testMessageId,
  type: "up",
});

const votes = await localStore.getVotesByChatId({ id: testChatId });
assert.strictEqual(votes.length, 1, "Should record 1 vote");
assert.strictEqual(votes[0].isUpvoted, true, "Vote should be upvoted");
console.log("  ✓ Message voting verified");

// 5. Delete chat
console.log("  - Deleting chat");
await localStore.deleteChatById({ id: testChatId });
const chatAfterDelete = await localStore.getChatById({ id: testChatId });
assert.strictEqual(chatAfterDelete, null, "Deleted chat should not exist");
console.log("  ✓ Chat deletion verified");

console.log("✔ [TEST SUITE 2/4 PASSED] Local store database operates with 100% integrity!\n");

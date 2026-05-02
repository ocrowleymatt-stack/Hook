import { generateText, multiTurnChat } from "./geminiClient.js";

async function run() {
  console.log("--- Single prompt ---");
  const single = await generateText("Explain how hooks could orchestrate AI workflows");
  console.log(single);

  console.log("\n--- Multi-turn ---");
  const chat = await multiTurnChat([
    { role: "user", content: "I am building a hook system" },
    { role: "user", content: "How can I extend it with AI?" }
  ]);

  console.log(chat);
}

run();

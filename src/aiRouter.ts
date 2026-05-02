import { generateText } from "./geminiClient.js";
import { HookDecision, EventEnvelope } from "./types.js";

export async function decideHook(event: EventEnvelope): Promise<HookDecision> {
  const prompt = `
You are an AI router.
Choose the best hook for this event.

Return ONLY JSON:
{
  "hook": string,
  "reason": string,
  "confidence": number,
  "payload": object
}

Event:
${JSON.stringify(event, null, 2)}
`;

  const raw = await generateText(prompt);

  try {
    return JSON.parse(raw) as HookDecision;
  } catch {
    throw new Error("Failed to parse AI decision: " + raw);
  }
}

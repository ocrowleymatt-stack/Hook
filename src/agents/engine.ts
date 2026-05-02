import { generateText } from "../geminiClient.js";
import { AgentPlan } from "./schema.js";

export async function buildAgentPlan(objective: string): Promise<AgentPlan> {
  const prompt = `
You are a multi-agent orchestration system.

Break the objective into:
- clear tasks
- assign agent roles
- define dependencies
- define execution order
- define quality gates

Return ONLY JSON AgentPlan.

Objective:
${objective}
`;

  const raw = await generateText(prompt);
  return JSON.parse(raw);
}

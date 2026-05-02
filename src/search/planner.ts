import { generateText } from "../geminiClient.js";
import { SearchPlan } from "./schema.js";

export async function planSearch(query: string): Promise<SearchPlan> {
  const prompt = `
You are a search planner.

Decide:
- domain
- depth
- which sources to use
- whether freshness matters
- required evidence level

Return ONLY JSON:
{
  "id": string,
  "query": string,
  "domain": string,
  "depth": string,
  "sources": [],
  "freshnessRequired": boolean,
  "requiredEvidenceLevel": string,
  "safetyNotes": []
}

Query:
${query}
`;

  const raw = await generateText(prompt);
  return JSON.parse(raw);
}

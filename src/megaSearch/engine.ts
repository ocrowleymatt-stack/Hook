import { generateText } from "../geminiClient.js";
import { MegaSearchQuery, MegaSearchResult } from "./schema.js";

export async function runMegaSearch(q: MegaSearchQuery): Promise<MegaSearchResult> {
  const prompt = `
You are a multi-source expert search engine.

You must:
- decide relevant domains
- synthesise answer
- detect conflicts
- identify gaps
- assign confidence realistically

Return ONLY JSON:
{
  "id": string,
  "status": "ok" | "insufficient_evidence" | "conflicting",
  "answer": string,
  "sources": [
    { "source": string, "confidence": number, "summary": string }
  ],
  "confidence": number,
  "conflicts": [],
  "gaps": [],
  "nextActions": []
}

Query:
${q.query}
`;

  const raw = await generateText(prompt);

  try {
    return JSON.parse(raw) as MegaSearchResult;
  } catch {
    throw new Error("MegaSearch parse failure: " + raw);
  }
}

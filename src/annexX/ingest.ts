import { generateText } from "../geminiClient.js";
import { AnnexXIngestionResult } from "./schema.js";

export async function ingestToAnnexX(rawText: string): Promise<AnnexXIngestionResult> {
  const prompt = `
You are a legal evidence processing engine operating to court-ready standards.

STRICT RULES:
- Do NOT summarise globally
- Work event-by-event
- Separate observed fact, reported statement, inference
- Preserve ambiguity
- Do NOT invent facts
- Every entry MUST include source trace

Return ONLY JSON in this structure:
{
  "status": "ok" | "needs_review",
  "entries": [
    {
      "id": string,
      "createdAt": ISO8601,
      "classification": string[],
      "observedFact": string,
      "reportedStatement": string,
      "inference": string,
      "legalRelevance": string,
      "riskLevel": "low" | "medium" | "high" | "critical",
      "confidence": number,
      "sourceTrace": [
        {
          "sourceId": string,
          "sourceType": string,
          "excerpt": string
        }
      ],
      "bundleTargets": string[],
      "cautions": string[]
    }
  ],
  "warnings": string[]
}

INPUT:
${rawText}
`;

  const raw = await generateText(prompt);

  try {
    return JSON.parse(raw) as AnnexXIngestionResult;
  } catch {
    throw new Error("Annex X parse failure: " + raw);
  }
}

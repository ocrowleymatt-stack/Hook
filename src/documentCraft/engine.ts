import { generateText } from "../geminiClient.js";
import { DocumentCraftRequest, CraftedDocument } from "./schema.js";

export async function craftDocument(req: DocumentCraftRequest): Promise<CraftedDocument> {
  const prompt = `
You are an elite editorial and document design system.

You must:
1. Select the BEST layout for the document purpose
2. Apply highest editorial standards
3. Structure content clearly and powerfully
4. Avoid fluff, repetition, and vague phrasing
5. Ensure clarity, precision, and authority

Return ONLY JSON:
{
  "id": string,
  "selectedLayout": {
    "id": string,
    "name": string,
    "purpose": string,
    "sections": [],
    "strengths": [],
    "risks": [],
    "bestFor": [],
    "confidence": number
  },
  "editorialStandard": {
    "register": string,
    "tone": string,
    "rules": [],
    "bannedPatterns": [],
    "requiredChecks": []
  },
  "document": string,
  "sectionMap": [],
  "qualityReport": {
    "status": "pass",
    "strengths": [],
    "issues": [],
    "missingInputs": []
  }
}

Request:
${JSON.stringify(req, null, 2)}
`;

  const raw = await generateText(prompt);

  try {
    return JSON.parse(raw) as CraftedDocument;
  } catch {
    throw new Error("DocumentCraft parse failure: " + raw);
  }
}

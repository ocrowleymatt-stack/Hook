import { generateText } from "../geminiClient.js";
import { MediaRequest, MediaFactoryOutput } from "./schema.js";

export async function runMediaFactory(req: MediaRequest): Promise<MediaFactoryOutput> {
  const prompt = `
You are a world-class media production planner.

You must:
- decide which media types are required (if autoSelectMedia = true)
- generate high-quality outputs or production plans
- ensure consistency of tone and message
- enforce editorial and production standards

Return ONLY JSON:
{
  "id": string,
  "status": "ready",
  "selectedMedia": [],
  "assets": [
    {
      "id": string,
      "type": string,
      "title": string,
      "purpose": string,
      "recommended": true,
      "rationale": string,
      "productionNotes": [],
      "qualityChecks": [],
      "output": {}
    }
  ],
  "editorialNotes": [],
  "risks": [],
  "nextActions": []
}

Request:
${JSON.stringify(req, null, 2)}
`;

  const raw = await generateText(prompt);

  try {
    return JSON.parse(raw) as MediaFactoryOutput;
  } catch {
    throw new Error("MediaFactory parse failure: " + raw);
  }
}

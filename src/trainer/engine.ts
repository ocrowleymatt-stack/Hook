import { generateText } from "../geminiClient.js";
import { TargetAppProfile, TrainingPack } from "./schema.js";

export async function generateTrainingPack(profile: TargetAppProfile): Promise<TrainingPack> {
  const prompt = `
You are a world-class AI trainer.

Your job is to upgrade another AI/app/tool to world-leading performance.

You must:
- identify weaknesses
- design a superior system prompt
- define strict operating rules
- define workflow steps
- define quality gates (anti-hallucination, verification, etc)
- create evaluation rubric
- provide golden examples

Return ONLY JSON:
{
  "id": string,
  "targetAppId": string,
  "status": "ready",
  "diagnosis": [],
  "upgradedSystemPrompt": string,
  "operatingRules": [],
  "workflow": [],
  "qualityGates": [],
  "evaluationRubric": [],
  "goldenExamples": [],
  "integrationNotes": [],
  "risks": []
}

Target app:
${JSON.stringify(profile, null, 2)}
`;

  const raw = await generateText(prompt);

  try {
    return JSON.parse(raw) as TrainingPack;
  } catch {
    throw new Error("Trainer parse failure: " + raw);
  }
}

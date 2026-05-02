import { generateText } from "../geminiClient.js";
import { SlowCookerProblem, SlowCookerSolution } from "./schema.js";

export async function runSlowCooker(problem: SlowCookerProblem): Promise<SlowCookerSolution> {
  const basePrompt = `
You are a world-class expert system running a deep, multi-stage reasoning process.

You must:
- break the problem down
- research if needed
- propose solutions
- verify solutions
- produce final output at world-leading quality

STRICT:
- no hallucinations
- state assumptions clearly
- identify risks
- if uncertain, flag it

Return ONLY JSON:
{
  "status": "complete",
  "executiveAnswer": string,
  "reasoningSummary": string[],
  "assumptions": string[],
  "risks": string[],
  "buildPlan": object,
  "artefacts": [],
  "nextActions": []
}

Problem:
${problem.problem}

Constraints:
${JSON.stringify(problem.constraints || [])}

Desired outcome:
${problem.desiredOutcome || "not specified"}
`;

  const raw = await generateText(basePrompt);

  try {
    return JSON.parse(raw) as SlowCookerSolution;
  } catch {
    throw new Error("Slow cooker parse failure: " + raw);
  }
}

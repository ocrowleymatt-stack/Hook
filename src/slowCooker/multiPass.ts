import { generateText } from "../geminiClient.js";
import { SlowCookerProblem, SlowCookerSolution, SlowCookerStage } from "./schema.js";

async function jsonPrompt<T>(prompt: string): Promise<T> {
  const raw = await generateText(prompt);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("JSON parse failure: " + raw);
  }
}

export async function runAutonomousSlowCooker(problem: SlowCookerProblem): Promise<SlowCookerSolution> {
  const stages: SlowCookerStage[] = [];

  const decomposition = await jsonPrompt<unknown>(`
Return ONLY JSON.
Decompose this problem into workstreams, unknowns, assumptions, and likely outputs.
Problem: ${JSON.stringify(problem)}
`);
  stages.push({ name: "decompose", purpose: "Break problem into workstreams", status: "complete", output: decomposition });

  const draft = await jsonPrompt<unknown>(`
Return ONLY JSON.
Create a strong first-pass solution using this decomposition.
Problem: ${JSON.stringify(problem)}
Decomposition: ${JSON.stringify(decomposition)}
`);
  stages.push({ name: "draft", purpose: "Produce first complete solution", status: "complete", output: draft });

  const critique = await jsonPrompt<unknown>(`
Return ONLY JSON.
Critique the draft harshly. Identify hallucination risk, missing evidence, weak assumptions, defects, security risks, and build risks.
Draft: ${JSON.stringify(draft)}
`);
  stages.push({ name: "critique", purpose: "Stress-test the draft", status: "complete", output: critique });

  const refined = await jsonPrompt<unknown>(`
Return ONLY JSON.
Improve the draft using the critique. Preserve uncertainty. Do not invent facts. Produce build-ready artefacts if buildAllowed is true.
Problem: ${JSON.stringify(problem)}
Draft: ${JSON.stringify(draft)}
Critique: ${JSON.stringify(critique)}
`);
  stages.push({ name: "refine", purpose: "Repair weaknesses and improve quality", status: "complete", output: refined });

  const verification = await jsonPrompt<{ passed: boolean; confidence: number; issues: string[]; caveats: string[] }>(`
Return ONLY JSON:
{
  "passed": boolean,
  "confidence": number,
  "issues": string[],
  "caveats": string[]
}
Verify this refined solution for accuracy, completeness, internal consistency, and safe build readiness.
Problem: ${JSON.stringify(problem)}
Refined: ${JSON.stringify(refined)}
`);
  stages.push({ name: "verify", purpose: "Final quality and safety gate", status: "complete", output: verification });

  const final = await jsonPrompt<SlowCookerSolution>(`
Return ONLY JSON matching SlowCookerSolution:
{
  "id": string,
  "status": "complete" | "needs_more_input" | "blocked",
  "executiveAnswer": string,
  "reasoningSummary": string[],
  "assumptions": string[],
  "risks": string[],
  "buildPlan": object,
  "artefacts": [],
  "nextActions": [],
  "stages": []
}
Create the final answer. If verification confidence is below 0.7, status must be needs_more_input unless the task is still safely answerable with caveats.
Problem: ${JSON.stringify(problem)}
Refined: ${JSON.stringify(refined)}
Verification: ${JSON.stringify(verification)}
Stages: ${JSON.stringify(stages)}
`);

  return { ...final, stages };
}

export type SlowCookerProblem = {
  id: string;
  title: string;
  problem: string;
  desiredOutcome?: string;
  constraints?: string[];
  availableInputs?: string[];
  outputFormat?: "markdown" | "json" | "code" | "plan" | "bundle";
  buildAllowed?: boolean;
  searchAllowed?: boolean;
};

export type SlowCookerStage = {
  name: string;
  purpose: string;
  status: "pending" | "running" | "complete" | "failed";
  output?: unknown;
  issues?: string[];
};

export type SlowCookerSolution = {
  id: string;
  status: "complete" | "needs_more_input" | "blocked";
  executiveAnswer: string;
  reasoningSummary: string[];
  assumptions: string[];
  risks: string[];
  buildPlan?: unknown;
  artefacts?: unknown[];
  nextActions: string[];
  stages: SlowCookerStage[];
};

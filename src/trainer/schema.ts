export type TargetAppProfile = {
  id: string;
  name: string;
  purpose: string;
  currentPrompt?: string;
  currentWorkflow?: string[];
  knownWeaknesses?: string[];
  desiredStandard?: "good" | "expert" | "world_leading";
  domain?: string;
  allowedActions?: string[];
  forbiddenActions?: string[];
};

export type TrainingPack = {
  id: string;
  targetAppId: string;
  status: "ready" | "needs_more_input" | "blocked";
  diagnosis: string[];
  upgradedSystemPrompt: string;
  operatingRules: string[];
  workflow: string[];
  qualityGates: string[];
  evaluationRubric: string[];
  goldenExamples: Array<{
    input: string;
    expectedBehaviour: string;
    failureModeAvoided: string;
  }>;
  integrationNotes: string[];
  risks: string[];
};

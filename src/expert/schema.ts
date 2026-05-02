export type QueryIntent =
  | "answer"
  | "research"
  | "build_app"
  | "build_tool"
  | "debug_code"
  | "legal_analysis"
  | "evidence_processing"
  | "creative_build"
  | "unknown";

export type SearchNeed = {
  required: boolean;
  reason: string;
  freshnessRequired: boolean;
  sources: Array<"web" | "github" | "local" | "uploaded_files" | "api_registry">;
};

export type BuildCapability = {
  canBuild: boolean;
  buildType?: "app" | "tool" | "api" | "agent" | "workflow" | "document";
  requiredInputs: string[];
  proposedStack?: string[];
  risks: string[];
};

export type ExpertPlan = {
  intent: QueryIntent;
  searchNeed: SearchNeed;
  buildCapability: BuildCapability;
  answerStandard: "ordinary" | "expert" | "world_leading";
  requiredChecks: string[];
  outputFormat: "plain" | "markdown" | "json" | "code" | "bundle";
};

export type ExpertAnswer = {
  status: "ok" | "needs_more_evidence" | "blocked";
  plan: ExpertPlan;
  answer: unknown;
  citations?: string[];
  caveats: string[];
  nextActions: string[];
};

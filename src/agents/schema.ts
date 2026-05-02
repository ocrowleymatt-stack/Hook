export type AgentRole =
  | "planner"
  | "researcher"
  | "builder"
  | "critic"
  | "editor"
  | "legal_analyst"
  | "evidence_analyst"
  | "media_producer"
  | "qa"
  | "operator";

export type AgentProfile = {
  id: string;
  role: AgentRole;
  name: string;
  purpose: string;
  strengths: string[];
  limits: string[];
  allowedActions: string[];
  forbiddenActions: string[];
};

export type AgentTask = {
  id: string;
  title: string;
  description: string;
  assignedAgentRole: AgentRole;
  priority: number;
  dependsOn: string[];
  expectedOutput: string;
  status: "pending" | "ready" | "running" | "complete" | "blocked" | "failed";
  output?: unknown;
  risks: string[];
};

export type AgentPlan = {
  id: string;
  objective: string;
  tasks: AgentTask[];
  agents: AgentProfile[];
  executionOrder: string[];
  coordinationNotes: string[];
  qualityGates: string[];
};

export type AgentRunResult = {
  id: string;
  planId: string;
  status: "complete" | "partial" | "blocked" | "failed";
  completedTasks: string[];
  blockedTasks: string[];
  finalSynthesis: string;
  warnings: string[];
};

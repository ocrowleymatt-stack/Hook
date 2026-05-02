import { QueueJob } from "./schema.js";

export type JobIntelligence = {
  jobId: string;
  suggestedPriority: number;
  risk: "low" | "medium" | "high" | "critical";
  predictedOutcome: "likely_complete" | "likely_blocked" | "likely_failed" | "unknown";
  rationale: string[];
  optimisationHints: string[];
};

export function scoreJob(job: QueueJob & { priority?: number }): JobIntelligence {
  const rationale: string[] = [];
  const optimisationHints: string[] = [];
  let suggestedPriority = job.priority ?? 0;
  let risk: JobIntelligence["risk"] = "low";
  let predictedOutcome: JobIntelligence["predictedOutcome"] = "unknown";

  if (job.status === "failed") {
    suggestedPriority += 5;
    risk = "high";
    predictedOutcome = "likely_failed";
    rationale.push("Previous failure detected");
    optimisationHints.push("Inspect error before retrying repeatedly");
  }

  if (job.status === "blocked") {
    risk = "critical";
    predictedOutcome = "likely_blocked";
    rationale.push("Job is blocked");
    optimisationHints.push("Resolve missing dependency or manual review requirement");
  }

  if (job.type === "render_media") {
    suggestedPriority += 2;
    rationale.push("Render job may unlock deliverable output");
  }

  if (job.attempts > 1) {
    risk = risk === "low" ? "medium" : risk;
    rationale.push("Multiple attempts indicate instability");
    optimisationHints.push("Apply backoff or route to manual inspection");
  }

  if (job.status === "queued" && predictedOutcome === "unknown") {
    predictedOutcome = "likely_complete";
  }

  return {
    jobId: job.id,
    suggestedPriority,
    risk,
    predictedOutcome,
    rationale,
    optimisationHints
  };
}

export function analyseQueue(jobs: QueueJob[]): JobIntelligence[] {
  return jobs.map(job => scoreJob(job as QueueJob & { priority?: number }));
}

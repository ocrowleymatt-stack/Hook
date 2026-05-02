import { QueueJob } from "./schema.js";
import { scoreJob } from "./intelligence.js";

export type SelfCorrectionAction = {
  jobId: string;
  action: "auto_boost" | "manual_review" | "hold" | "retry_later" | "none";
  reason: string;
  suggestedPriority?: number;
};

export function recommendCorrection(job: QueueJob & { priority?: number }): SelfCorrectionAction {
  const intel = scoreJob(job);

  if (intel.risk === "critical") {
    return {
      jobId: job.id,
      action: "manual_review",
      reason: "Critical risk requires operator review before further execution",
      suggestedPriority: intel.suggestedPriority
    };
  }

  if (intel.predictedOutcome === "likely_failed" && job.attempts >= job.maxAttempts) {
    return {
      jobId: job.id,
      action: "hold",
      reason: "Max attempts reached; further retries likely wasteful",
      suggestedPriority: intel.suggestedPriority
    };
  }

  if (intel.predictedOutcome === "likely_failed") {
    return {
      jobId: job.id,
      action: "retry_later",
      reason: "Failure detected; retry should use backoff rather than immediate loop",
      suggestedPriority: intel.suggestedPriority
    };
  }

  if (intel.suggestedPriority > (job.priority || 0)) {
    return {
      jobId: job.id,
      action: "auto_boost",
      reason: "Job appears to unlock downstream deliverables or needs attention",
      suggestedPriority: intel.suggestedPriority
    };
  }

  return {
    jobId: job.id,
    action: "none",
    reason: "No correction required"
  };
}

export function recommendQueueCorrections(jobs: QueueJob[]) {
  return jobs.map(job => recommendCorrection(job as QueueJob & { priority?: number }));
}

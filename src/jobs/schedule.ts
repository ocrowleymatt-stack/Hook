import { QueueJob } from "./schema.js";

export type ScheduledJob<T = unknown> = QueueJob<T> & {
  priority: number;
  runAt?: string;
  repeat?: {
    everyMs: number;
    maxRuns?: number;
    runsCompleted: number;
  };
  backoffMs?: number;
};

export function isDue(job: ScheduledJob): boolean {
  if (!job.runAt) return true;
  return Date.now() >= Date.parse(job.runAt);
}

export function sortByPriorityAndDueDate(a: ScheduledJob, b: ScheduledJob): number {
  const ap = a.priority ?? 0;
  const bp = b.priority ?? 0;
  if (bp !== ap) return bp - ap;

  const at = a.runAt ? Date.parse(a.runAt) : 0;
  const bt = b.runAt ? Date.parse(b.runAt) : 0;
  return at - bt;
}

export function scheduleRetry(job: ScheduledJob): ScheduledJob {
  const nextBackoff = job.backoffMs ? Math.min(job.backoffMs * 2, 60_000) : 5_000;
  return {
    ...job,
    status: "queued",
    attempts: job.attempts + 1,
    backoffMs: nextBackoff,
    runAt: new Date(Date.now() + nextBackoff).toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function scheduleRepeat(job: ScheduledJob): ScheduledJob | null {
  if (!job.repeat) return null;
  if (job.repeat.maxRuns && job.repeat.runsCompleted >= job.repeat.maxRuns) return null;

  return {
    ...job,
    id: `${job.id}-repeat-${job.repeat.runsCompleted + 1}`,
    status: "queued",
    attempts: 0,
    runAt: new Date(Date.now() + job.repeat.everyMs).toISOString(),
    repeat: {
      ...job.repeat,
      runsCompleted: job.repeat.runsCompleted + 1
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

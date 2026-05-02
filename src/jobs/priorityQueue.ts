import { ScheduledJob, sortByPriorityAndDueDate, isDue } from "./schedule.js";
import { QueueState } from "./schema.js";

export function pickNextJob(state: QueueState): ScheduledJob | undefined {
  const schedulable = state.jobs
    .filter(j => j.status === "queued")
    .map(j => j as ScheduledJob)
    .filter(isDue)
    .sort(sortByPriorityAndDueDate);

  return schedulable[0];
}

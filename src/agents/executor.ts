import { AgentPlan, AgentTask } from "./schema.js";

export async function executeAgentPlan(plan: AgentPlan) {
  const completed: string[] = [];
  const blocked: string[] = [];

  for (const taskId of plan.executionOrder) {
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) continue;

    const depsMet = task.dependsOn.every(dep => completed.includes(dep));

    if (!depsMet) {
      task.status = "blocked";
      blocked.push(task.id);
      continue;
    }

    try {
      task.status = "running";

      // placeholder execution
      task.output = `Executed ${task.title}`;
      task.status = "complete";
      completed.push(task.id);

    } catch {
      task.status = "failed";
      blocked.push(task.id);
    }
  }

  return {
    id: `run-${plan.id}`,
    planId: plan.id,
    status: blocked.length ? "partial" : "complete",
    completedTasks: completed,
    blockedTasks: blocked,
    finalSynthesis: "Multi-agent execution complete",
    warnings: blocked.length ? ["Some tasks blocked"] : []
  };
}

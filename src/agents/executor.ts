import { AgentPlan, AgentTask } from "./schema.js";
import { runMegaSearch } from "../megaSearch/engine.js";
import { craftDocument } from "../documentCraft/engine.js";
import { runMediaFactory } from "../mediaFactory/engine.js";
import { generateText } from "../geminiClient.js";

async function executeTask(task: AgentTask, plan: AgentPlan, context: Record<string, unknown>) {
  const sharedContext = JSON.stringify(context, null, 2);

  switch (task.assignedAgentRole) {
    case "researcher":
      return runMegaSearch({
        id: `search-${task.id}`,
        query: `${task.description}\n\nObjective: ${plan.objective}`,
        depth: "deep"
      });

    case "builder":
    case "editor":
    case "legal_analyst":
    case "evidence_analyst":
      return craftDocument({
        id: `doc-${task.id}`,
        title: task.title,
        purpose: task.assignedAgentRole === "legal_analyst" ? "legal_letter" : "report",
        rawContent: `${task.description}\n\nContext:\n${sharedContext}`,
        outputFormat: "markdown"
      });

    case "media_producer":
      return runMediaFactory({
        id: `media-${task.id}`,
        objective: task.description,
        sourceContent: sharedContext,
        autoSelectMedia: true,
        qualityStandard: "world_class"
      });

    case "critic":
    case "qa": {
      const raw = await generateText(`
You are a strict QA/critic agent.
Review this task against the overall objective.
Return ONLY JSON:
{
  "status": "pass" | "needs_review" | "fail",
  "issues": [],
  "improvements": [],
  "riskLevel": "low" | "medium" | "high"
}
Objective: ${plan.objective}
Task: ${JSON.stringify(task)}
Context: ${sharedContext}
`);
      return JSON.parse(raw);
    }

    case "planner":
    case "operator":
    default: {
      const raw = await generateText(`
Complete this specialist agent task. Return ONLY JSON with useful output.
Objective: ${plan.objective}
Task: ${JSON.stringify(task)}
Context: ${sharedContext}
`);
      return JSON.parse(raw);
    }
  }
}

export async function executeAgentPlan(plan: AgentPlan) {
  const completed: string[] = [];
  const blocked: string[] = [];
  const context: Record<string, unknown> = {};
  const warnings: string[] = [];

  for (const taskId of plan.executionOrder) {
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) continue;

    const depsMet = task.dependsOn.every(dep => completed.includes(dep));

    if (!depsMet) {
      task.status = "blocked";
      blocked.push(task.id);
      warnings.push(`Blocked ${task.id}: dependencies not met`);
      continue;
    }

    try {
      task.status = "running";
      task.output = await executeTask(task, plan, context);
      context[task.id] = task.output;
      task.status = "complete";
      completed.push(task.id);
    } catch (e: any) {
      task.status = "failed";
      task.risks.push(e.message);
      blocked.push(task.id);
      warnings.push(`Failed ${task.id}: ${e.message}`);
    }
  }

  const finalSynthesis = await generateText(`
Create a concise final synthesis from this multi-agent run.
Return plain text.
Objective: ${plan.objective}
Completed tasks: ${completed.join(", ")}
Blocked tasks: ${blocked.join(", ")}
Context: ${JSON.stringify(context, null, 2)}
`);

  return {
    id: `run-${plan.id}`,
    planId: plan.id,
    status: blocked.length ? "partial" : "complete",
    completedTasks: completed,
    blockedTasks: blocked,
    finalSynthesis,
    warnings
  };
}

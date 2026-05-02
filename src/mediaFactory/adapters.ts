import { RenderJob } from "./renderSchema.js";

export type RenderExecutionResult = {
  jobId: string;
  status: "complete" | "blocked" | "failed";
  outputPath?: string;
  message: string;
};

function requireEnv(name: string): string | null {
  return process.env[name] || null;
}

export async function executeRenderJob(job: RenderJob): Promise<RenderExecutionResult> {
  if (job.renderer === "manual_review") {
    return {
      jobId: job.id,
      status: "blocked",
      message: "Manual review required before rendering this asset."
    };
  }

  for (const secret of job.requiredSecrets) {
    if (!requireEnv(secret)) {
      return {
        jobId: job.id,
        status: "blocked",
        message: `Missing required secret: ${secret}`
      };
    }
  }

  switch (job.target) {
    case "markdown":
    case "html":
    case "json":
      return {
        jobId: job.id,
        status: "complete",
        outputPath: `out/${job.id}.${job.target}`,
        message: "Internal text render planned. File writer not yet attached."
      };
    case "docx":
    case "pdf":
    case "pptx":
    case "image":
    case "audio":
    case "video":
      return {
        jobId: job.id,
        status: "blocked",
        message: `${job.target.toUpperCase()} external renderer adapter not yet configured.`
      };
    default:
      return {
        jobId: job.id,
        status: "failed",
        message: `Unsupported render target: ${job.target}`
      };
  }
}

export async function executeRenderJobs(jobs: RenderJob[]): Promise<RenderExecutionResult[]> {
  const results: RenderExecutionResult[] = [];
  for (const job of jobs) {
    results.push(await executeRenderJob(job));
  }
  return results;
}

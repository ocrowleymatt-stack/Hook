import { nextJob, updateJob } from "./fsQueue.js";
import { executeRenderJob } from "../mediaFactory/adapters.js";

export async function runWorker() {
  while (true) {
    const job = nextJob();
    if (!job) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    updateJob(job.id, { status: "running" });

    try {
      if (job.type === "render_media") {
        const result = await executeRenderJob(job.payload as any);
        updateJob(job.id, { status: result.status === "complete" ? "complete" : "blocked", result });
      }
    } catch (e: any) {
      updateJob(job.id, { status: "failed", error: e.message });
    }
  }
}

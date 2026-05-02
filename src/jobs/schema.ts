export type JobStatus = "queued" | "running" | "complete" | "failed" | "blocked";

export type JobType =
  | "render_media"
  | "dropbox_upload"
  | "slow_cooker"
  | "memory_ingest"
  | "document_craft";

export type QueueJob<T = unknown> = {
  id: string;
  type: JobType;
  status: JobStatus;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  result?: unknown;
  error?: string;
};

export type QueueState = {
  jobs: QueueJob[];
};

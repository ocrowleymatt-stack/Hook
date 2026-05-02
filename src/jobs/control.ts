import fs from "fs";
import path from "path";
import { QueueState } from "./schema.js";

const DB_PATH = path.resolve(process.cwd(), "queue.json");

function readState(): QueueState {
  if (!fs.existsSync(DB_PATH)) return { jobs: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeState(state: QueueState) {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

export function retryJob(id: string) {
  const state = readState();
  const job = state.jobs.find(j => j.id === id);
  if (!job) throw new Error(`Job not found: ${id}`);
  job.status = "queued";
  job.error = undefined;
  job.updatedAt = new Date().toISOString();
  writeState(state);
  return job;
}

export function cancelJob(id: string) {
  const state = readState();
  const job = state.jobs.find(j => j.id === id);
  if (!job) throw new Error(`Job not found: ${id}`);
  job.status = "blocked";
  job.error = "Cancelled by operator";
  job.updatedAt = new Date().toISOString();
  writeState(state);
  return job;
}

export function boostPriority(id: string, increment = 10) {
  const state = readState();
  const job = state.jobs.find(j => j.id === id) as any;
  if (!job) throw new Error(`Job not found: ${id}`);
  job.priority = (job.priority || 0) + increment;
  job.updatedAt = new Date().toISOString();
  writeState(state);
  return job;
}

export function getQueueState() {
  return readState();
}

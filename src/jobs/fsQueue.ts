import fs from "fs";
import path from "path";
import { QueueJob, QueueState } from "./schema.js";

const DB_PATH = path.resolve(process.cwd(), "queue.json");

function readState(): QueueState {
  if (!fs.existsSync(DB_PATH)) return { jobs: [] };
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeState(state: QueueState) {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

export function enqueue<T>(job: QueueJob<T>) {
  const state = readState();
  state.jobs.push(job);
  writeState(state);
}

export function updateJob(id: string, patch: Partial<QueueJob>) {
  const state = readState();
  const idx = state.jobs.findIndex(j => j.id === id);
  if (idx >= 0) {
    state.jobs[idx] = { ...state.jobs[idx], ...patch, updatedAt: new Date().toISOString() };
    writeState(state);
  }
}

export function nextJob(): QueueJob | undefined {
  const state = readState();
  return state.jobs.find(j => j.status === "queued");
}

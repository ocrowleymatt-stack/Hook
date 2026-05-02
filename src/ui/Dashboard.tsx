import React, { useEffect, useMemo, useState } from "react";
import "./dashboard.css";

type Job = {
  id: string;
  type: string;
  status: "queued" | "running" | "complete" | "failed" | "blocked" | string;
  attempts: number;
  maxAttempts?: number;
  priority?: number;
  runAt?: string;
  updatedAt: string;
  error?: string;
  result?: unknown;
  payload?: unknown;
};

const pipeline = ["Search", "Think", "Build", "Render", "Deliver"];

function statusClass(status: string) {
  return `status ${status}`;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");

  async function refresh() {
    const res = await fetch("/queue", { cache: "no-store" });
    const data = await res.json();
    setJobs(data.jobs || []);
    setLastRefresh(new Date().toLocaleTimeString());
  }

  async function act(id: string, action: "retry" | "cancel" | "boost") {
    setActionMessage(`${action} requested for ${id}`);
    const res = await fetch(`/job/${id}/${action}`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      setActionMessage(err.error || `Failed to ${action} job`);
      return;
    }
    await refresh();
    setActionMessage(`${action} complete for ${id}`);
  }

  useEffect(() => {
    refresh().catch(() => setJobs([]));
    const timer = setInterval(() => refresh().catch(() => undefined), 2500);
    return () => clearInterval(timer);
  }, []);

  const visibleJobs = useMemo(() => {
    return jobs.filter(j => filter === "all" || j.status === filter);
  }, [jobs, filter]);

  const counts = useMemo(() => {
    return jobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
  }, [jobs]);

  const health = jobs.some(j => j.status === "failed")
    ? "Attention"
    : jobs.some(j => j.status === "running")
      ? "Active"
      : "Idle";

  return (
    <main className="dashShell">
      <section className="dashHero">
        <div>
          <p className="eyebrow">HOOK OS CONTROL</p>
          <h1>Autonomous Operations Centre</h1>
          <p className="subtitle">Live queue, scheduled work, render pipeline and intervention controls.</p>
        </div>
        <div className="healthOrb">
          <span>{health}</span>
        </div>
      </section>

      <section className="metricGrid">
        <article><strong>{jobs.length}</strong><span>Total jobs</span></article>
        <article><strong>{counts.running || 0}</strong><span>Running</span></article>
        <article><strong>{counts.queued || 0}</strong><span>Queued</span></article>
        <article><strong>{counts.failed || 0}</strong><span>Failed</span></article>
        <article><strong>{counts.blocked || 0}</strong><span>Blocked</span></article>
      </section>

      <section className="pipeline">
        {pipeline.map((stage, index) => (
          <div className="pipeStage" key={stage}>
            <span>{index + 1}</span>
            <p>{stage}</p>
          </div>
        ))}
      </section>

      <section className="controlBar">
        <div>
          {['all', 'queued', 'running', 'blocked', 'failed', 'complete'].map(f => (
            <button key={f} className={filter === f ? "activeFilter" : ""} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <p>{actionMessage || `Last refresh: ${lastRefresh || "pending"}`}</p>
      </section>

      <section className="opsLayout">
        <div className="jobDeck">
          {visibleJobs.map(job => (
            <article className="jobCard" key={job.id} onClick={() => setSelectedJob(job)}>
              <div className="jobTop">
                <div>
                  <h2>{job.type}</h2>
                  <p>{job.id}</p>
                </div>
                <span className={statusClass(job.status)}>{job.status}</span>
              </div>
              <div className="jobMeta">
                <span>Priority: {job.priority ?? 0}</span>
                <span>Attempts: {job.attempts}/{job.maxAttempts ?? "?"}</span>
                <span>Run at: {job.runAt || "now"}</span>
                <span>Updated: {job.updatedAt}</span>
              </div>
              {job.error && <p className="error">{job.error}</p>}
              <div className="jobActions" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => act(job.id, "retry")}>Retry</button>
                <button onClick={() => act(job.id, "cancel")}>Cancel</button>
                <button onClick={() => act(job.id, "boost")}>Boost Priority</button>
              </div>
            </article>
          ))}
        </div>

        <aside className="inspector">
          <p className="eyebrow">JOB INSPECTOR</p>
          {selectedJob ? (
            <>
              <h2>{selectedJob.type}</h2>
              <p className="muted">{selectedJob.id}</p>
              <pre>{JSON.stringify(selectedJob, null, 2)}</pre>
            </>
          ) : (
            <p className="muted">Select a job to inspect payload, result and error state.</p>
          )}
        </aside>
      </section>
    </main>
  );
}

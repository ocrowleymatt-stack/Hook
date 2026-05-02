import React, { useEffect, useState } from "react";

type Job = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  updatedAt: string;
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetch("/queue.json")
      .then(r => r.json())
      .then(data => setJobs(data.jobs || []));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>System Dashboard</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(j => (
            <tr key={j.id}>
              <td>{j.id}</td>
              <td>{j.type}</td>
              <td>{j.status}</td>
              <td>{j.attempts}</td>
              <td>{j.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

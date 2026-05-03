import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

let jobs = [
  {
    id: 'seed-1',
    type: 'agent_plan',
    status: 'queued',
    attempts: 0,
    maxAttempts: 3,
    priority: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payload: { objective: 'Build a litigation-ready evidence summary with chronology and key failures' }
  },
  {
    id: 'seed-2',
    type: 'media_plan',
    status: 'complete',
    attempts: 1,
    maxAttempts: 3,
    priority: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: { summary: 'Demo media plan generated' }
  }
];

function html() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hook OS</title>
  <style>
    :root { color-scheme: dark; }
    body { margin:0; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: radial-gradient(circle at top left,#341064,#080711 45%,#030207); color:#f4ecff; }
    .shell { max-width:1180px; margin:0 auto; padding:28px; }
    .hero { display:flex; justify-content:space-between; gap:20px; align-items:center; padding:24px; border:1px solid rgba(255,255,255,.12); border-radius:28px; background:rgba(255,255,255,.06); box-shadow:0 20px 80px rgba(0,0,0,.35); backdrop-filter: blur(16px); }
    h1 { font-size:44px; margin:0 0 8px; letter-spacing:-.04em; }
    .sub { color:#b9a8d9; margin:0; font-size:16px; }
    .badge { padding:12px 16px; border-radius:999px; background:rgba(142,80,255,.2); border:1px solid rgba(180,130,255,.35); color:#d9c4ff; }
    .grid { display:grid; grid-template-columns: 1.25fr .75fr; gap:20px; margin-top:20px; }
    .card { border:1px solid rgba(255,255,255,.12); border-radius:24px; background:rgba(10,8,24,.76); padding:20px; box-shadow:0 20px 60px rgba(0,0,0,.28); }
    textarea, input, select { width:100%; box-sizing:border-box; border-radius:18px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07); color:#fff; padding:14px; font-size:15px; outline:none; }
    textarea { min-height:120px; resize:vertical; }
    button { border:0; border-radius:16px; padding:12px 16px; background:linear-gradient(135deg,#9b5cff,#6f35ff); color:white; font-weight:700; cursor:pointer; }
    button.secondary { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.13); }
    .row { display:flex; gap:10px; align-items:center; margin-top:12px; flex-wrap:wrap; }
    .chips button { font-size:13px; padding:9px 12px; }
    .job { margin-top:12px; padding:14px; border-radius:18px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); }
    .jobTop { display:flex; justify-content:space-between; gap:10px; }
    .status { font-size:12px; text-transform:uppercase; padding:6px 9px; border-radius:999px; background:rgba(255,255,255,.1); color:#d9c4ff; }
    pre { white-space:pre-wrap; word-break:break-word; background:rgba(0,0,0,.3); padding:14px; border-radius:16px; color:#dfd0ff; max-height:420px; overflow:auto; }
    .manual li { margin:8px 0; color:#c9b9e8; }
    .muted { color:#a996cc; }
    @media(max-width:900px){ .grid{grid-template-columns:1fr;} h1{font-size:34px;} .hero{display:block;} }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div>
        <h1>Hook OS</h1>
        <p class="sub">Command-driven AI operations cockpit. Tell it the objective; it creates jobs, plans work, and shows progress.</p>
      </div>
      <div class="badge" id="statusBadge">checking ChatGPT…</div>
    </section>

    <div class="grid">
      <main>
        <section class="card">
          <h2>Command Bar</h2>
          <textarea id="command" placeholder="Tell Hook what to do…"></textarea>
          <div class="row chips">
            <button class="secondary" onclick="setPrompt('Build a litigation-ready evidence summary with chronology, key failures, legal framing and media outputs')">Litigation summary</button>
            <button class="secondary" onclick="setPrompt('Search my files for Google Takeout data and prepare an ingestion plan')">Takeout ingestion</button>
            <button class="secondary" onclick="setPrompt('Create a media pack from this report')">Media pack</button>
            <button class="secondary" onclick="setPrompt('Run a slow cooker analysis overnight on this problem')">Slow cooker</button>
          </div>
          <div class="row">
            <select id="mode" style="max-width:220px">
              <option value="agent_plan">Agent Plan</option>
              <option value="chat">Chat</option>
              <option value="document">Document</option>
              <option value="media_plan">Media Plan</option>
              <option value="search_plan">Search Plan</option>
            </select>
            <button onclick="askChatGPT()">Ask ChatGPT</button>
            <button onclick="createJob()">Turn into Job</button>
          </div>
          <h3>ChatGPT / System Response</h3>
          <pre id="answer">Ready.</pre>
        </section>

        <section class="card" style="margin-top:20px">
          <h2>Queue</h2>
          <div id="jobs"></div>
        </section>
      </main>

      <aside>
        <section class="card manual">
          <h2>User Manual</h2>
          <h3>Quick Start</h3>
          <ol>
            <li>Type an objective into the command bar.</li>
            <li>Ask ChatGPT to interpret it, or turn it straight into a job.</li>
            <li>Watch the queue. Click retry/cancel/boost as required.</li>
          </ol>
          <h3>Good Commands</h3>
          <ul>
            <li>Say the desired output: report, timeline, bundle, media pack.</li>
            <li>State audience and standard: court-safe, executive, public, technical.</li>
            <li>List must-have sections.</li>
          </ul>
          <h3>Statuses</h3>
          <ul>
            <li><b>queued</b>: waiting.</li><li><b>running</b>: active.</li><li><b>complete</b>: finished.</li><li><b>failed/blocked</b>: needs attention.</li>
          </ul>
          <h3>Limits</h3>
          <p class="muted">Live ChatGPT requires OPENAI_API_KEY set in Railway. Fabric/Dropbox/media renderers need their own server-side keys.</p>
        </section>

        <section class="card" style="margin-top:20px">
          <h2>Butchers Hook</h2>
          <p class="muted">External interface:</p>
          <pre>https://o-crowley-butchers-hook-877137578833.europe-west1.run.app/</pre>
          <button class="secondary" onclick="pingExternal()">Ping External Interface</button>
          <pre id="external">Not checked.</pre>
        </section>
      </aside>
    </div>
  </div>
<script>
const $ = id => document.getElementById(id);
function setPrompt(t){ $('command').value = t; }
async function load(){
  const h = await fetch('/health').then(r=>r.json()).catch(e=>({error:e.message}));
  $('statusBadge').textContent = h.openaiConfigured ? 'ChatGPT live' : 'ChatGPT simulated / key missing';
  await loadJobs();
}
async function loadJobs(){
  const data = await fetch('/queue').then(r=>r.json());
  $('jobs').innerHTML = data.jobs.map(j => `<div class="job"><div class="jobTop"><b>${j.type}</b><span class="status">${j.status}</span></div><p class="muted">${j.id}</p><p>${(j.payload && j.payload.objective) || (j.result && j.result.summary) || ''}</p><div class="row"><button class="secondary" onclick="act('${j.id}','retry')">Retry</button><button class="secondary" onclick="act('${j.id}','cancel')">Cancel</button><button class="secondary" onclick="act('${j.id}','boost')">Boost</button></div></div>`).join('');
}
async function askChatGPT(){
  $('answer').textContent = 'Thinking…';
  const res = await fetch('/chatgpt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:$('command').value,mode:$('mode').value,createJob:false})});
  const data = await res.json();
  $('answer').textContent = JSON.stringify(data,null,2);
}
async function createJob(){
  const res = await fetch('/job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:$('mode').value,payload:{objective:$('command').value},priority:10})});
  $('answer').textContent = JSON.stringify(await res.json(),null,2);
  await loadJobs();
}
async function act(id, action){ await fetch('/job/'+id+'/'+action,{method:'POST'}); await loadJobs(); }
async function pingExternal(){
  $('external').textContent = 'Checking…';
  const res = await fetch('/external/health').then(r=>r.json()).catch(e=>({error:e.message}));
  $('external').textContent = JSON.stringify(res,null,2);
}
load();
</script>
</body>
</html>`;
}

app.get('/', (_, res) => res.type('html').send(html()));

app.get('/health', (_, res) => {
  res.json({ ok: true, openaiConfigured: Boolean(process.env.OPENAI_API_KEY), time: new Date().toISOString() });
});

app.get('/queue', (_, res) => res.json({ jobs }));

app.get('/system/insights', (_, res) => {
  const failed = jobs.filter(j => j.status === 'failed').length;
  const blocked = jobs.filter(j => j.status === 'blocked').length;
  res.json({
    bottlenecks: blocked ? ['Blocked jobs detected'] : [],
    highRiskJobs: jobs.filter(j => ['failed','blocked'].includes(j.status)).map(j => j.id),
    suggestedGlobalActions: failed ? ['Inspect repeated failure cause'] : ['System nominal']
  });
});

app.get('/queue/intelligence', (_, res) => {
  res.json({ intelligence: jobs.map(j => ({ jobId: j.id, risk: j.status === 'failed' ? 'high' : j.status === 'blocked' ? 'critical' : 'low', predictedOutcome: j.status === 'queued' ? 'likely_complete' : 'unknown' })) });
});

app.get('/queue/corrections', (_, res) => {
  res.json({ corrections: jobs.map(j => ({ jobId: j.id, action: j.status === 'failed' ? 'retry_later' : 'none', reason: j.status === 'failed' ? 'Failure detected' : 'No correction required' })) });
});

app.post('/job', (req, res) => {
  const job = {
    id: `job-${Date.now()}`,
    type: req.body.type || 'agent_plan',
    status: 'queued',
    attempts: 0,
    maxAttempts: 3,
    priority: req.body.priority || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payload: req.body.payload || {}
  };
  jobs.unshift(job);
  res.json(job);
});

app.post('/job/:id/retry', (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'not found' });
  job.status = 'queued'; job.updatedAt = new Date().toISOString(); job.error = undefined;
  res.json(job);
});

app.post('/job/:id/cancel', (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'not found' });
  job.status = 'blocked'; job.error = 'Cancelled by operator'; job.updatedAt = new Date().toISOString();
  res.json(job);
});

app.post('/job/:id/boost', (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'not found' });
  job.priority = (job.priority || 0) + 10; job.updatedAt = new Date().toISOString();
  res.json(job);
});

app.post('/chatgpt', async (req, res) => {
  const { message, mode = 'chat', createJob = false } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  if (!process.env.OPENAI_API_KEY) {
    const answer = `[SIMULATED] I would handle this as mode: ${mode}. Objective: ${message}`;
    return res.json({ answer, simulated: true, suggestedJobs: [{ type: mode, payload: { objective: message }, priority: 10 }], actions: [], warnings: ['OPENAI_API_KEY not configured'] });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are Hook OS, an AI operations planner. Return concise, useful operational guidance.' },
        { role: 'user', content: `Mode: ${mode}\nCreate job: ${createJob}\nMessage: ${message}` }
      ]
    });
    const answer = completion.choices?.[0]?.message?.content || '';
    res.json({ answer, simulated: false, suggestedJobs: [{ type: mode, payload: { objective: message }, priority: 10 }], actions: [], warnings: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/external/health', async (_, res) => {
  const base = 'https://o-crowley-butchers-hook-877137578833.europe-west1.run.app';
  const paths = ['/health','/status','/api/health','/'];
  const results = [];
  for (const p of paths) {
    try {
      const r = await fetch(base + p);
      results.push({ path: p, status: r.status, ok: r.ok });
    } catch (e) {
      results.push({ path: p, error: e.message });
    }
  }
  res.json({ base, results });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Hook OS deploy app running on ${port}`));

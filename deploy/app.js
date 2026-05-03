import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

process.on('uncaughtException', err => console.error('Uncaught Exception:', err?.message || err));
process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err?.message || err));

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const BUTCHERS_HOOK_URL = 'https://o-crowley-butchers-hook-877137578833.europe-west1.run.app';

let jobs = [
  { id: 'seed-1', type: 'agent_plan', status: 'queued', attempts: 0, maxAttempts: 3, priority: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), payload: { objective: 'Build a litigation-ready evidence summary with chronology and key failures' } },
  { id: 'seed-2', type: 'media_plan', status: 'complete', attempts: 1, maxAttempts: 3, priority: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), result: { summary: 'Demo media plan generated' } }
];

function page() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hook OS</title><style>
body{margin:0;background:radial-gradient(circle at top left,#3b1470,#080713 45%,#020107);color:#f4ecff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.shell{max-width:1160px;margin:auto;padding:28px}.hero,.card{background:rgba(15,11,32,.82);border:1px solid rgba(255,255,255,.12);border-radius:24px;box-shadow:0 20px 70px rgba(0,0,0,.35)}.hero{padding:26px;display:flex;justify-content:space-between;gap:18px;align-items:center}.grid{display:grid;grid-template-columns:1.25fr .75fr;gap:20px}.card{padding:20px;margin-top:20px}h1{font-size:44px;margin:0 0 8px}.muted,.sub{color:#bbaadc}.badge{padding:12px 16px;border-radius:999px;background:rgba(140,80,255,.2);border:1px solid rgba(180,130,255,.35)}textarea,select{width:100%;box-sizing:border-box;border-radius:16px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;padding:14px;font-size:15px}textarea{min-height:118px}button{border:0;border-radius:14px;padding:11px 14px;background:linear-gradient(135deg,#9b5cff,#6f35ff);color:white;font-weight:800;cursor:pointer}button.secondary{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px}.job{padding:14px;margin-top:12px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}.jobTop{display:flex;justify-content:space-between}.status{font-size:12px;text-transform:uppercase;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.1)}pre{white-space:pre-wrap;word-break:break-word;background:rgba(0,0,0,.3);padding:14px;border-radius:16px;max-height:380px;overflow:auto}.manual li{margin:8px 0;color:#c9b9e8}@media(max-width:900px){.grid{grid-template-columns:1fr}.hero{display:block}h1{font-size:34px}}
</style></head><body><div class="shell"><section class="hero"><div><h1>Hook OS</h1><p class="sub">Command-driven AI operations cockpit. Tell it the objective; it creates jobs, plans work, and shows progress.</p></div><div class="badge" id="statusBadge">loading</div></section><div class="grid"><main><section class="card"><h2>Command Bar</h2><textarea id="command" placeholder="Tell Hook what to do…"></textarea><div class="row"><button class="secondary prompt" data-prompt="Build a litigation-ready evidence summary with chronology, key failures, legal framing and media outputs">Litigation summary</button><button class="secondary prompt" data-prompt="Search my files for Google Takeout data and prepare an ingestion plan">Takeout ingestion</button><button class="secondary prompt" data-prompt="Create a media pack from this report">Media pack</button><button class="secondary prompt" data-prompt="Run a slow cooker analysis overnight on this problem">Slow cooker</button></div><div class="row"><select id="mode" style="max-width:220px"><option value="agent_plan">Agent Plan</option><option value="chat">Chat</option><option value="document">Document</option><option value="media_plan">Media Plan</option><option value="search_plan">Search Plan</option><option value="file_ingest">File Ingest</option></select><button id="askBtn">Ask ChatGPT</button><button id="jobBtn">Turn into Job</button><button id="ingestBtn" class="secondary">Ingest All Files</button><button id="testBtn" class="secondary">Button Test</button><input id="fileInput" type="file" multiple style="display:none"></div><h3>Response</h3><pre id="answer">Ready.</pre></section><section class="card"><h2>Queue</h2><div id="jobs"></div></section></main><aside><section class="card manual"><h2>User Manual</h2><ol><li>Type an objective into the command bar.</li><li>Ask ChatGPT to interpret it, or turn it straight into a job.</li><li>Use Ingest All Files to add local files as file_ingest jobs.</li><li>Watch the queue. Retry, cancel or boost jobs as needed.</li></ol><p class="muted">If ChatGPT key is missing, Hook OS runs in simulated safe mode. File ingestion currently reads local text-like files in-browser and queues the first 20,000 characters.</p></section><section class="card"><h2>Butchers Hook</h2><pre>${BUTCHERS_HOOK_URL}</pre><button id="externalBtn" class="secondary">Ping External Interface</button><pre id="external">Not checked.</pre></section></aside></div></div><script>
const $=id=>document.getElementById(id);
function show(x){$('answer').textContent=typeof x==='string'?x:JSON.stringify(x,null,2)}
async function api(path,opts={}){const r=await fetch(path,opts);const t=await r.text();let data;try{data=t?JSON.parse(t):null}catch(e){data={raw:t}};if(!r.ok)throw new Error(data?.error||r.status+' '+r.statusText);return data}
async function load(){try{const h=await api('/health');$('statusBadge').textContent=h.openaiConfigured?'ChatGPT live':'ChatGPT simulated / key missing';await loadJobs()}catch(e){$('statusBadge').textContent='UI/API error';show('Load failed: '+e.message)}}
async function loadJobs(){const data=await api('/queue');$('jobs').innerHTML=data.jobs.map(j=>'<div class="job"><div class="jobTop"><b>'+j.type+'</b><span class="status">'+j.status+'</span></div><p class="muted">'+j.id+'</p><p>'+(((j.payload||{}).filename?('📄 '+(j.payload||{}).filename):((j.payload||{}).objective))||((j.result||{}).summary)||'')+'</p><div class="row"><button class="secondary jobact" data-id="'+j.id+'" data-action="retry">Retry</button><button class="secondary jobact" data-id="'+j.id+'" data-action="cancel">Cancel</button><button class="secondary jobact" data-id="'+j.id+'" data-action="boost">Boost</button></div></div>').join('')}
async function ingestFiles(files){if(!files||!files.length){show('No files selected.');return}show('Processing '+files.length+' files...');let ok=0;let failed=[];for(const file of files){try{let text='';try{text=await file.text()}catch(e){text='[Binary or unreadable file: '+file.name+']'}await api('/job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'file_ingest',payload:{filename:file.name,size:file.size,type:file.type||'unknown',content:text.slice(0,20000),truncated:text.length>20000},priority:15})});ok++}catch(err){failed.push(file.name+': '+err.message)}}await loadJobs();show({ingested:ok,failed,notice:'Files were queued as file_ingest jobs.'})}
document.addEventListener('click',async e=>{try{const p=e.target.closest('.prompt');if(p){$('command').value=p.dataset.prompt;show('Prompt loaded. Click Ask ChatGPT or Turn into Job.');return}const ja=e.target.closest('.jobact');if(ja){show('Sending '+ja.dataset.action+' for '+ja.dataset.id+'...');await api('/job/'+ja.dataset.id+'/'+ja.dataset.action,{method:'POST'});await loadJobs();show('Done: '+ja.dataset.action);return}if(e.target.id==='ingestBtn'){$('fileInput').click();return}if(e.target.id==='testBtn'){show('Buttons are alive. If other buttons fail, it is a backend/API issue.');return}if(e.target.id==='askBtn'){const message=$('command').value.trim();if(!message){show('Type a command first.');return}show('Thinking...');const data=await api('/chatgpt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,mode:$('mode').value,createJob:false})});show(data);return}if(e.target.id==='jobBtn'){const objective=$('command').value.trim();if(!objective){show('Type a command first.');return}const data=await api('/job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:$('mode').value,payload:{objective},priority:10})});await loadJobs();show(data);return}if(e.target.id==='externalBtn'){$('external').textContent='Checking...';const data=await api('/external/health');$('external').textContent=JSON.stringify(data,null,2);return}}catch(err){show('Button/API error: '+err.message)}});
$('fileInput').addEventListener('change',async e=>{await ingestFiles(e.target.files);e.target.value=''});
load();
</script></body></html>`;
}

app.get('/', (_, res) => res.type('html').send(page()));
app.get('/health', (_, res) => res.json({ ok: true, openaiConfigured: Boolean(process.env.OPENAI_API_KEY), time: new Date().toISOString() }));
app.get('/queue', (_, res) => res.json({ jobs }));
app.get('/system/insights', (_, res) => res.json({ bottlenecks: [], highRiskJobs: jobs.filter(j => ['failed','blocked'].includes(j.status)).map(j => j.id), suggestedGlobalActions: ['System nominal'] }));
app.get('/queue/intelligence', (_, res) => res.json({ intelligence: jobs.map(j => ({ jobId: j.id, risk: j.status === 'blocked' ? 'critical' : 'low', predictedOutcome: j.status === 'queued' ? 'likely_complete' : 'unknown' })) }));
app.get('/queue/corrections', (_, res) => res.json({ corrections: jobs.map(j => ({ jobId: j.id, action: 'none', reason: 'No correction required' })) }));

app.post('/job', (req, res) => {
  const job = { id: `job-${Date.now()}`, type: req.body?.type || 'agent_plan', status: 'queued', attempts: 0, maxAttempts: 3, priority: req.body?.priority || 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), payload: req.body?.payload || {} };
  jobs.unshift(job);
  res.json(job);
});
app.post('/job/:id/retry', (req, res) => { const job = jobs.find(j => j.id === req.params.id); if (!job) return res.status(404).json({ error: 'not found' }); job.status = 'queued'; job.updatedAt = new Date().toISOString(); res.json(job); });
app.post('/job/:id/cancel', (req, res) => { const job = jobs.find(j => j.id === req.params.id); if (!job) return res.status(404).json({ error: 'not found' }); job.status = 'blocked'; job.error = 'Cancelled by operator'; job.updatedAt = new Date().toISOString(); res.json(job); });
app.post('/job/:id/boost', (req, res) => { const job = jobs.find(j => j.id === req.params.id); if (!job) return res.status(404).json({ error: 'not found' }); job.priority = (job.priority || 0) + 10; job.updatedAt = new Date().toISOString(); res.json(job); });

app.post('/chatgpt', async (req, res) => {
  const { message, mode = 'chat', createJob = false } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });
  if (!process.env.OPENAI_API_KEY) return res.json({ answer: `[SIMULATED] I would handle this as mode: ${mode}. Objective: ${message}`, simulated: true, suggestedJobs: [{ type: mode, payload: { objective: message }, priority: 10 }], warnings: ['OPENAI_API_KEY not configured'] });
  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are Hook OS, an AI operations planner. Return concise, useful operational guidance.' }, { role: 'user', content: `Mode: ${mode}\nCreate job: ${createJob}\nMessage: ${message}` }] });
    res.json({ answer: completion.choices?.[0]?.message?.content || '', simulated: false, suggestedJobs: [{ type: mode, payload: { objective: message }, priority: 10 }], warnings: [] });
  } catch (e) { console.error('ChatGPT error:', e?.message || e); res.json({ answer: '[ERROR FALLBACK] ChatGPT failed, but Hook OS stayed online.', simulated: true, error: e?.message || String(e), warnings: ['ChatGPT request failed; using safe fallback'] }); }
});

app.get('/external/health', async (_, res) => {
  const paths = ['/health','/status','/api/health','/']; const results = [];
  for (const p of paths) { try { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 4000); const r = await fetch(BUTCHERS_HOOK_URL + p, { signal: controller.signal }); clearTimeout(timeout); results.push({ path: p, status: r.status, ok: r.ok }); } catch (e) { results.push({ path: p, error: e?.message || String(e) }); } }
  res.json({ base: BUTCHERS_HOOK_URL, results });
});

app.use((err, req, res, next) => { console.error('Express error:', err?.message || err); res.status(500).json({ error: 'Server recovered from an internal error', detail: err?.message || String(err) }); });
const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', () => console.log(`Hook OS deploy app running on ${port}`));

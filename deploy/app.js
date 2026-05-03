import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
process.on('uncaughtException', err => console.error('Uncaught Exception:', err?.message || err));
process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err?.message || err));

const app = express();
app.use(cors());
app.use(express.json({ limit: '16mb' }));

const BUTCHERS_HOOK_URL = 'https://o-crowley-butchers-hook-877137578833.europe-west1.run.app';
const DROPBOX_ROOT = process.env.DROPBOX_ROOT || '/HookOS/outputs';
const MAX_FILE_CHARS = Number(process.env.MAX_FILE_CHARS || 200000);
const MAX_FILE_BYTES_CLIENT = Number(process.env.MAX_FILE_BYTES_CLIENT || 12 * 1024 * 1024);
const MAX_DISPLAY_CHARS = 1200;
const MAX_QUEUE_ITEMS = 500;

let jobs = [
  { id: 'seed-1', type: 'agent_plan', status: 'queued', attempts: 0, maxAttempts: 3, priority: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), payload: { objective: 'Build a litigation-ready evidence summary with chronology and key failures' } },
  { id: 'seed-2', type: 'media_plan', status: 'complete', attempts: 1, maxAttempts: 3, priority: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), result: { summary: 'Demo media plan generated' } }
];

function safeName(name='file.txt') { return String(name).replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'file.txt'; }
function clampText(value = '', limit = MAX_FILE_CHARS) { const text = String(value || ''); return { text: text.slice(0, limit), originalLength: text.length, truncated: text.length > limit }; }
function safeJob(job) {
  const payload = { ...(job.payload || {}) };
  if (typeof payload.content === 'string') {
    payload.contentPreview = payload.content.slice(0, MAX_DISPLAY_CHARS);
    payload.contentLength = payload.content.length;
    delete payload.content;
  }
  return { ...job, payload };
}
function pruneJobs() { if (jobs.length > MAX_QUEUE_ITEMS) jobs = jobs.slice(0, MAX_QUEUE_ITEMS); }

async function uploadDropbox(path, content) {
  if (!process.env.DROPBOX_TOKEN) throw new Error('DROPBOX_TOKEN is not configured');
  const r = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DROPBOX_TOKEN}`,
      'Dropbox-API-Arg': JSON.stringify({ path, mode: 'overwrite', autorename: false, mute: false, strict_conflict: false }),
      'Content-Type': 'application/octet-stream'
    },
    body: Buffer.from(String(content), 'utf8')
  });
  const text = await r.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!r.ok) throw new Error(`Dropbox upload failed ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

function page() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hook OS</title><style>
body{margin:0;background:radial-gradient(circle at top left,#3b1470,#080713 45%,#020107);color:#f4ecff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.shell{max-width:1160px;margin:auto;padding:28px}.hero,.card{background:rgba(15,11,32,.82);border:1px solid rgba(255,255,255,.12);border-radius:24px;box-shadow:0 20px 70px rgba(0,0,0,.35)}.hero{padding:26px;display:flex;justify-content:space-between;gap:18px;align-items:center}.grid{display:grid;grid-template-columns:1.25fr .75fr;gap:20px}.card{padding:20px;margin-top:20px}h1{font-size:44px;margin:0 0 8px}.muted,.sub{color:#bbaadc}.badge{padding:12px 16px;border-radius:999px;background:rgba(140,80,255,.2);border:1px solid rgba(180,130,255,.35)}textarea,select,input[type=search]{width:100%;box-sizing:border-box;border-radius:16px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;padding:14px;font-size:15px}textarea{min-height:118px}button{border:0;border-radius:14px;padding:11px 14px;background:linear-gradient(135deg,#9b5cff,#6f35ff);color:white;font-weight:800;cursor:pointer}button.secondary{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}button:disabled{opacity:.5;cursor:not-allowed}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px}.job{padding:14px;margin-top:12px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}.jobTop{display:flex;justify-content:space-between}.status{font-size:12px;text-transform:uppercase;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.1)}pre{white-space:pre-wrap;word-break:break-word;background:rgba(0,0,0,.3);padding:14px;border-radius:16px;max-height:380px;overflow:auto}.manual li{margin:8px 0;color:#c9b9e8}.small{font-size:12px;color:#bbaadc}@media(max-width:900px){.grid{grid-template-columns:1fr}.hero{display:block}h1{font-size:34px}}
</style></head><body><div class="shell"><section class="hero"><div><h1>Hook OS</h1><p class="sub">Command-driven AI operations cockpit. Tell it the objective; it creates jobs, plans work, saves outputs to Dropbox, and shows progress.</p></div><div class="badge" id="statusBadge">loading</div></section><div class="grid"><main><section class="card"><h2>Command Bar</h2><textarea id="command" placeholder="Tell Hook what to do…"></textarea><div class="row"><button class="secondary prompt" data-prompt="Build a litigation-ready evidence summary with chronology, key failures, legal framing and media outputs">Litigation summary</button><button class="secondary prompt" data-prompt="Search my files for Google Takeout data and prepare an ingestion plan">Takeout ingestion</button><button class="secondary prompt" data-prompt="Create a media pack from this report">Media pack</button><button class="secondary prompt" data-prompt="Run a slow cooker analysis overnight on this problem">Slow cooker</button></div><div class="row"><select id="mode" style="max-width:220px"><option value="agent_plan">Agent Plan</option><option value="chat">Chat</option><option value="document">Document</option><option value="media_plan">Media Plan</option><option value="search_plan">Search Plan</option><option value="file_ingest">File Ingest</option></select><button id="askBtn">Ask ChatGPT</button><button id="jobBtn">Turn into Job</button><button id="ingestBtn" class="secondary">Ingest All Files</button><button id="saveDropboxBtn" class="secondary">Save Outputs to Dropbox</button><button id="testBtn" class="secondary">Button Test</button><input id="fileInput" type="file" multiple style="display:none"></div><p class="small" id="ingestStatus">Large files are safely capped before queueing.</p><h3>Response</h3><pre id="answer">Ready.</pre></section><section class="card"><h2>Queue</h2><input id="queueSearch" type="search" placeholder="Search visible queue…"><div id="jobs"></div></section></main><aside><section class="card manual"><h2>User Manual</h2><ol><li>Type an objective into the command bar.</li><li>Ask ChatGPT or turn it into a job.</li><li>Use Ingest All Files to add local files as file_ingest jobs.</li><li>Click Save Outputs to Dropbox to persist the queue and ingested file contents.</li></ol><p class="muted">Dropbox requires DROPBOX_TOKEN in Railway variables. Files are saved under ${DROPBOX_ROOT}. File ingestion caps content at ${MAX_FILE_CHARS.toLocaleString()} characters.</p></section><section class="card"><h2>Storage / Integrations</h2><pre id="storage">Checking storage...</pre><button id="externalBtn" class="secondary">Ping Butchers Hook</button><pre id="external">Not checked.</pre></section></aside></div></div><script>
const MAX_FILE_CHARS=${MAX_FILE_CHARS};
const MAX_FILE_BYTES_CLIENT=${MAX_FILE_BYTES_CLIENT};
const MAX_DISPLAY_CHARS=${MAX_DISPLAY_CHARS};
const $=id=>document.getElementById(id);
let cachedJobs=[];
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function show(x){const text=typeof x==='string'?x:JSON.stringify(x,null,2);$('answer').textContent=text.length>120000?text.slice(0,120000)+'\n\n[Output truncated in UI]':text}
async function api(path,opts={}){const r=await fetch(path,opts);const t=await r.text();let data;try{data=t?JSON.parse(t):null}catch(e){data={raw:t}};if(!r.ok)throw new Error(data?.error||r.status+' '+r.statusText);return data}
function renderJobs(){const term=($('queueSearch')?.value||'').toLowerCase().trim();const visible=cachedJobs.filter(j=>!term||JSON.stringify(j).toLowerCase().includes(term)).slice(0,200);$('jobs').innerHTML=visible.map(j=>{const p=j.payload||{};const display=p.filename?('📄 '+p.filename+' · '+(p.contentLength||0)+' chars'+(p.truncated?' · truncated':'')):((p.objective||((j.result||{}).summary)||'').slice(0,MAX_DISPLAY_CHARS));return '<div class="job"><div class="jobTop"><b>'+escapeHtml(j.type)+'</b><span class="status">'+escapeHtml(j.status)+'</span></div><p class="muted">'+escapeHtml(j.id)+'</p><p>'+escapeHtml(display)+'</p>'+(p.contentPreview?'<pre>'+escapeHtml(p.contentPreview)+'</pre>':'')+'<div class="row"><button class="secondary jobact" data-id="'+escapeHtml(j.id)+'" data-action="retry">Retry</button><button class="secondary jobact" data-id="'+escapeHtml(j.id)+'" data-action="cancel">Cancel</button><button class="secondary jobact" data-id="'+escapeHtml(j.id)+'" data-action="boost">Boost</button></div></div>'}).join('')}
async function load(){try{const h=await api('/health');$('statusBadge').textContent=h.openaiConfigured?'ChatGPT live':'ChatGPT simulated / key missing';$('storage').textContent=JSON.stringify({dropboxConfigured:h.dropboxConfigured, dropboxRoot:h.dropboxRoot,maxFileChars:h.maxFileChars,maxQueueItems:h.maxQueueItems},null,2);await loadJobs()}catch(e){$('statusBadge').textContent='UI/API error';show('Load failed: '+e.message)}}
async function loadJobs(){const data=await api('/queue');cachedJobs=data.jobs||[];renderJobs()}
async function readFileSafely(file){if(file.size>MAX_FILE_BYTES_CLIENT){return {text:'[Large file skipped in browser read: '+file.name+' · '+file.size+' bytes. Use a text export or server-side ingestion.]',truncated:true,skipped:true,originalLength:0}}let text='';try{text=await file.text()}catch(e){text='[Binary or unreadable file: '+file.name+']'}return {text:text.slice(0,MAX_FILE_CHARS),truncated:text.length>MAX_FILE_CHARS,skipped:false,originalLength:text.length}}
async function ingestFiles(files){if(!files||!files.length){show('No files selected.');return}show('Processing '+files.length+' files...');$('ingestStatus').textContent='Ingesting '+files.length+' file(s)…';let ok=0;let failed=[];for(const file of files){try{const read=await readFileSafely(file);await api('/job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'file_ingest',payload:{filename:file.name,size:file.size,type:file.type||'unknown',content:read.text,truncated:read.truncated,skipped:read.skipped,originalLength:read.originalLength},priority:15})});ok++;$('ingestStatus').textContent='Ingested '+ok+'/'+files.length}catch(err){failed.push(file.name+': '+err.message)}}await loadJobs();$('ingestStatus').textContent='Ingestion complete: '+ok+' queued, '+failed.length+' failed.';show({ingested:ok,failed,notice:'Files were queued as bounded file_ingest jobs.'})}
document.addEventListener('click',async e=>{try{const p=e.target.closest('.prompt');if(p){$('command').value=p.dataset.prompt;show('Prompt loaded. Click Ask ChatGPT or Turn into Job.');return}const ja=e.target.closest('.jobact');if(ja){show('Sending '+ja.dataset.action+' for '+ja.dataset.id+'...');await api('/job/'+ja.dataset.id+'/'+ja.dataset.action,{method:'POST'});await loadJobs();show('Done: '+ja.dataset.action);return}if(e.target.id==='ingestBtn'){$('fileInput').click();return}if(e.target.id==='saveDropboxBtn'){show('Saving outputs to Dropbox...');const data=await api('/dropbox/save',{method:'POST'});show(data);return}if(e.target.id==='testBtn'){show('Buttons are alive. If other buttons fail, it is a backend/API issue.');return}if(e.target.id==='askBtn'){const message=$('command').value.trim();if(!message){show('Type a command first.');return}show('Thinking...');const data=await api('/chatgpt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:message.slice(0,120000),mode:$('mode').value,createJob:false})});show(data);return}if(e.target.id==='jobBtn'){const objective=$('command').value.trim();if(!objective){show('Type a command first.');return}const data=await api('/job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:$('mode').value,payload:{objective:objective.slice(0,MAX_FILE_CHARS),truncated:objective.length>MAX_FILE_CHARS},priority:10})});await loadJobs();show(data);return}if(e.target.id==='externalBtn'){$('external').textContent='Checking...';const data=await api('/external/health');$('external').textContent=JSON.stringify(data,null,2);return}}catch(err){show('Button/API error: '+err.message)}});
$('fileInput').addEventListener('change',async e=>{await ingestFiles(e.target.files);e.target.value=''});
$('queueSearch').addEventListener('input',renderJobs);
load();
</script></body></html>`;
}

app.get('/', (_, res) => res.type('html').send(page()));
app.get('/health', (_, res) => res.json({ ok: true, openaiConfigured: Boolean(process.env.OPENAI_API_KEY), dropboxConfigured: Boolean(process.env.DROPBOX_TOKEN), dropboxRoot: DROPBOX_ROOT, maxFileChars: MAX_FILE_CHARS, maxQueueItems: MAX_QUEUE_ITEMS, time: new Date().toISOString() }));
app.get('/queue', (_, res) => res.json({ jobs: jobs.map(safeJob) }));
app.get('/system/insights', (_, res) => res.json({ bottlenecks: [], highRiskJobs: jobs.filter(j => ['failed','blocked'].includes(j.status)).map(j => j.id), suggestedGlobalActions: ['System nominal'] }));
app.get('/queue/intelligence', (_, res) => res.json({ intelligence: jobs.map(j => ({ jobId: j.id, risk: j.status === 'blocked' ? 'critical' : 'low', predictedOutcome: j.status === 'queued' ? 'likely_complete' : 'unknown' })) }));
app.get('/queue/corrections', (_, res) => res.json({ corrections: jobs.map(j => ({ jobId: j.id, action: 'none', reason: 'No correction required' })) }));

app.post('/job', (req, res) => {
  const payload = { ...(req.body?.payload || {}) };
  if (typeof payload.content === 'string') {
    const clamped = clampText(payload.content);
    payload.content = clamped.text;
    payload.contentLength = clamped.originalLength;
    payload.truncated = Boolean(payload.truncated || clamped.truncated);
  }
  if (typeof payload.objective === 'string') {
    const clamped = clampText(payload.objective);
    payload.objective = clamped.text;
    payload.objectiveLength = clamped.originalLength;
    payload.truncated = Boolean(payload.truncated || clamped.truncated);
  }
  const job = { id: `job-${Date.now()}-${Math.random().toString(16).slice(2)}`, type: req.body?.type || 'agent_plan', status: 'queued', attempts: 0, maxAttempts: 3, priority: req.body?.priority || 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), payload };
  jobs.unshift(job);
  pruneJobs();
  res.json(safeJob(job));
});
app.post('/job/:id/retry', (req, res) => { const job = jobs.find(j => j.id === req.params.id); if (!job) return res.status(404).json({ error: 'not found' }); job.status = 'queued'; job.updatedAt = new Date().toISOString(); res.json(safeJob(job)); });
app.post('/job/:id/cancel', (req, res) => { const job = jobs.find(j => j.id === req.params.id); if (!job) return res.status(404).json({ error: 'not found' }); job.status = 'blocked'; job.error = 'Cancelled by operator'; job.updatedAt = new Date().toISOString(); res.json(safeJob(job)); });
app.post('/job/:id/boost', (req, res) => { const job = jobs.find(j => j.id === req.params.id); if (!job) return res.status(404).json({ error: 'not found' }); job.priority = (job.priority || 0) + 10; job.updatedAt = new Date().toISOString(); res.json(safeJob(job)); });

app.post('/dropbox/save', async (_, res) => {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uploaded = [];
    uploaded.push(await uploadDropbox(`${DROPBOX_ROOT}/queue-${stamp}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), jobs: jobs.map(safeJob) }, null, 2)));
    const ingested = jobs.filter(j => j.type === 'file_ingest' && j.payload?.filename);
    for (const job of ingested) {
      const filename = safeName(job.payload.filename);
      const body = job.payload.content || '';
      uploaded.push(await uploadDropbox(`${DROPBOX_ROOT}/files/${stamp}-${filename}.txt`, body));
    }
    res.json({ ok: true, savedTo: DROPBOX_ROOT, uploadedCount: uploaded.length, uploaded });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e), hint: 'Set DROPBOX_TOKEN in Railway variables, then redeploy.' });
  }
});

app.post('/chatgpt', async (req, res) => {
  const { message, mode = 'chat', createJob = false } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });
  const boundedMessage = String(message).slice(0, 120000);
  if (!process.env.OPENAI_API_KEY) return res.json({ answer: `[SIMULATED] I would handle this as mode: ${mode}. Objective: ${boundedMessage}`, simulated: true, suggestedJobs: [{ type: mode, payload: { objective: boundedMessage }, priority: 10 }], warnings: ['OPENAI_API_KEY not configured'] });
  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are Hook OS, an AI operations planner. Return concise, useful operational guidance.' }, { role: 'user', content: `Mode: ${mode}\nCreate job: ${createJob}\nMessage: ${boundedMessage}` }] });
    res.json({ answer: completion.choices?.[0]?.message?.content || '', simulated: false, suggestedJobs: [{ type: mode, payload: { objective: boundedMessage }, priority: 10 }], warnings: [] });
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

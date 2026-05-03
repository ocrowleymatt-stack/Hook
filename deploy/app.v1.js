import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { registerHook } from '../src/hookRegistry.js';
import {
  deepResearchHook,
  mediaCampaignHook,
  agentPlanHook,
  riskReviewHook,
  exportReportHook
} from '../hooks/basicHooks.js';
import { runChain } from '../engine/chainRunner.js';
import { decideWorkflow } from '../engine/workflows.js';
import { appendLog, getLogs } from '../engine/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MAX_BODY = process.env.MAX_BODY || '24mb';

app.use(cors());
app.use(express.json({ limit: MAX_BODY }));

process.on('uncaughtException', e => console.error('Uncaught Exception:', e?.message || e));
process.on('unhandledRejection', e => console.error('Unhandled Rejection:', e?.message || e));

await fs.mkdir('./data', { recursive: true });

function registerCoreHooks() {
  const hooks = [deepResearchHook, mediaCampaignHook, agentPlanHook, riskReviewHook, exportReportHook];
  for (const hook of hooks) {
    try {
      registerHook(hook);
    } catch (e) {
      if (!String(e?.message || '').includes('already registered')) throw e;
    }
  }
}

registerCoreHooks();

function page() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hook OS v1</title>
  <style>
    body{margin:0;background:#080511;color:#f5edff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    .shell{max-width:1180px;margin:auto;padding:24px}
    .card{background:#130d22;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:18px;margin:16px 0}
    h1{font-size:40px;margin:0 0 6px}.muted{color:#bbaadc}
    textarea{width:100%;min-height:140px;box-sizing:border-box;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:white;padding:12px;font-size:15px}
    button{border:0;border-radius:12px;padding:10px 14px;margin:6px 6px 6px 0;background:#7c45ff;color:white;font-weight:800;cursor:pointer}
    .secondary{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16)}
    pre{
      white-space:pre-wrap;
      word-break:break-word;
      background:#06030d;
      border-radius:14px;
      padding:16px;
      min-height:360px;
      max-height:75vh;
      overflow:auto;
      resize:vertical;
      font-size:14px;
      line-height:1.45;
      border:1px solid rgba(255,255,255,.10);
    }
    pre.fullscreen{
      position:fixed;
      inset:12px;
      width:calc(100vw - 24px);
      height:calc(100vh - 24px);
      max-height:none;
      z-index:9999;
      background:#020106;
      box-sizing:border-box;
      box-shadow:0 0 0 9999px rgba(0,0,0,.82);
    }
    .row{display:flex;gap:8px;flex-wrap:wrap}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(124,69,255,.25)}
  </style>
</head>
<body>
  <div class="shell">
    <div class="card">
      <h1>Hook OS v1</h1>
      <p class="muted">Chain-driven, logged workflow engine. Raw evidence remains king; Hook produces structured analysis.</p>
      <span class="badge" id="status">loading</span>
    </div>
    <div class="card">
      <h2>Command</h2>
      <textarea id="command" placeholder="Tell Hook what to do… e.g. Build an evidence bundle from this material"></textarea>
      <div class="row">
        <button id="chain">Run Chain</button>
        <button id="logs" class="secondary">View Logs</button>
        <button id="health" class="secondary">Health</button>
        <button id="expand" class="secondary">Expand Output</button>
        <button id="copy" class="secondary">Copy Output</button>
        <button id="clear" class="secondary">Clear</button>
      </div>
    </div>
    <div class="card">
      <h2>Output</h2>
      <pre id="out">Ready.</pre>
    </div>
  </div>
<script>
const $ = id => document.getElementById(id);
function show(x){ $('out').textContent = typeof x === 'string' ? x : JSON.stringify(x,null,2); }
async function api(path, opts={}){
  const r = await fetch(path, opts);
  const t = await r.text();
  let d; try { d = t ? JSON.parse(t) : null; } catch { d = { raw:t }; }
  if(!r.ok) throw new Error(d?.error || r.status + ' ' + r.statusText);
  return d;
}
async function load(){ const h = await api('/health'); $('status').textContent = 'hooks: ' + h.hooks.join(', '); }
document.addEventListener('click', async e => {
  try {
    if(e.target.id === 'chain'){
      const message = $('command').value.trim();
      if(!message) return show('Type something first.');
      show('Running chain…');
      return show(await api('/chain', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message }) }));
    }
    if(e.target.id === 'logs') return show(await api('/logs'));
    if(e.target.id === 'health') return show(await api('/health'));
    if(e.target.id === 'expand'){
      $('out').classList.toggle('fullscreen');
      e.target.textContent = $('out').classList.contains('fullscreen') ? 'Shrink Output' : 'Expand Output';
      return;
    }
    if(e.target.id === 'copy'){
      await navigator.clipboard.writeText($('out').textContent || '');
      return show('Output copied to clipboard.');
    }
    if(e.target.id === 'clear') return show('Ready.');
  } catch(err) { show('Error: ' + err.message); }
});
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && $('out').classList.contains('fullscreen')){
    $('out').classList.remove('fullscreen');
    const btn = $('expand'); if(btn) btn.textContent = 'Expand Output';
  }
});
load().catch(e => show('Load failed: ' + e.message));
</script>
</body>
</html>`;
}

app.get('/', (_, res) => res.type('html').send(page()));

app.get('/health', (_, res) => {
  res.json({
    ok: true,
    app: 'Hook OS v1',
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    hooks: ['deep_research', 'media_campaign', 'agent_plan', 'risk_review', 'export_report']
  });
});

app.post('/chain', async (req, res) => {
  try {
    const message = String(req.body?.message || '').slice(0, 120000);
    if (!message) return res.status(400).json({ ok: false, error: 'message required' });

    const chain = Array.isArray(req.body?.chain) && req.body.chain.length ? req.body.chain : decideWorkflow(message);
    const event = {
      type: 'user_input',
      source: 'hook_ui_v1',
      text: message,
      payload: { ...req.body, message }
    };

    const result = await runChain(event, chain);
    const logEntry = {
      id: `run-${Date.now()}`,
      message,
      chain,
      result,
      createdAt: new Date().toISOString()
    };

    await appendLog(logEntry);

    res.json({
      ok: result.ok,
      runId: logEntry.id,
      chain,
      trace: result.trace,
      final: result.final
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.get('/logs', async (_, res) => {
  const logs = await getLogs();
  res.json({ logs });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hook OS v1 running on ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { registerHook } from '../src/hookRegistry.js';
import { deepResearchHook, mediaCampaignHook, agentPlanHook, riskReviewHook, exportReportHook } from '../hooks/basicHooks.js';
import { networkResearchHook } from '../hooks/networkResearchHook.js';
import { runChain } from '../engine/chainRunner.js';
import { decideWorkflow } from '../engine/workflows.js';
import { appendLog, getLogs } from '../engine/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const APP_VERSION = 'hook-ui-automation-v3';
const NETWORK_SCORING_VERSION = 'strict_quiet_network_v2';
const NETWORK_CHAIN = ['network_research', 'risk_review', 'export_report'];

app.use(cors());
app.use(express.json({ limit: process.env.MAX_BODY || '24mb' }));
await fs.mkdir('./data', { recursive: true });

for (const hook of [deepResearchHook, mediaCampaignHook, agentPlanHook, riskReviewHook, exportReportHook, networkResearchHook]) {
  try { registerHook(hook); } catch {}
}

function versionPayload() {
  return {
    ok: true,
    app: 'Hook OS',
    appVersion: APP_VERSION,
    networkHookLoaded: true,
    networkHookName: networkResearchHook?.name || null,
    networkScoringVersion: NETWORK_SCORING_VERSION,
    serpApiConfigured: Boolean(process.env.SERP_API_KEY),
    serpApiKeyLength: process.env.SERP_API_KEY ? process.env.SERP_API_KEY.length : 0,
    nodeEnv: process.env.NODE_ENV || null,
    generatedAt: new Date().toISOString()
  };
}

function page() {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hook OS v3 Automation</title>
<style>
body{margin:0;padding:16px;background:#080511;color:#f5edff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif}h1{color:#d4af37;margin-bottom:4px}.sub{color:#c9b8e8;margin:0 0 12px}.card{background:#130d22;border:1px solid rgba(212,175,55,.3);border-radius:16px;padding:14px;margin:12px 0}textarea{width:100%;min-height:120px;box-sizing:border-box;background:#05020a;color:white;border:1px solid rgba(212,175,55,.4);border-radius:12px;padding:12px;font-size:16px}button{padding:12px 14px;margin:5px 5px 5px 0;border:0;border-radius:12px;background:#d4af37;color:#080511;font-weight:800}.secondary{background:#211735;color:#fff;border:1px solid rgba(212,175,55,.35)}.danger{background:#392020;color:#fff;border:1px solid rgba(255,120,120,.35)}pre{white-space:pre-wrap;word-break:break-word;background:#000;color:#d4af37;border:1px solid rgba(212,175,55,.35);border-radius:14px;padding:12px;min-height:420px;max-height:72vh;overflow:auto;-webkit-user-select:text;user-select:text}.status{color:#c9b8e8;font-size:14px}.hidden{position:fixed;left:-9999px;width:1px;height:1px;opacity:.01}.pill{display:inline-block;padding:4px 8px;border:1px solid rgba(212,175,55,.35);border-radius:999px;color:#d4af37;font-size:12px;margin:2px 4px 8px 0}.grid{display:flex;flex-wrap:wrap;gap:4px}
</style>
</head>
<body>
<h1>Hook OS</h1>
<p class="sub">${APP_VERSION} · ${NETWORK_SCORING_VERSION}</p>
<div class="card">
<div class="grid">
<span class="pill">Version: ${APP_VERSION}</span>
<span class="pill">Network: ${NETWORK_SCORING_VERSION}</span>
<span class="pill">SERP: ${process.env.SERP_API_KEY ? 'configured' : 'missing'}</span>
</div>
<textarea id="command" placeholder="Run network research on dataset"></textarea>
<div><input id="file" type="file" accept=".json,.txt,.csv"></div>
<div>
<button id="run">Run</button>
<button id="runNetwork" class="secondary">Run Network</button>
<button id="smoke" class="secondary">Smoke Test</button>
<button id="version" class="secondary">Version</button>
<button id="copy" class="secondary">Copy All</button>
<button id="select" class="secondary">Select All</button>
<button id="download" class="secondary">Download</button>
<button id="clear" class="danger">Clear</button>
</div>
<div id="status" class="status">Ready. No dataset loaded.</div>
</div>
<div class="card"><pre id="out">Ready.</pre><textarea id="copyBox" class="hidden" readonly></textarea></div>
<script>
let dataset=null;
let lastOutput='Ready.';
const out=document.getElementById('out');
const status=document.getElementById('status');
const command=document.getElementById('command');
function show(x){lastOutput=typeof x==='string'?x:JSON.stringify(x,null,2);out.textContent=lastOutput;}
function copyFallback(text){const box=document.getElementById('copyBox');box.value=text;box.focus();box.select();box.setSelectionRange(0,999999);document.execCommand('copy');}
async function postJson(url, body){const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await res.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}if(!res.ok)throw new Error(data.error||res.status+' '+res.statusText);return data;}
async function getJson(url){const res=await fetch(url);const text=await res.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}if(!res.ok)throw new Error(data.error||res.status+' '+res.statusText);return data;}
document.getElementById('file').addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;const text=await f.text();try{dataset=JSON.parse(text);status.textContent='Loaded JSON: '+f.name;}catch{dataset={rawText:text,filename:f.name};status.textContent='Loaded raw text: '+f.name;}}catch(err){status.textContent='File load failed: '+err.message;show({ok:false,error:err.message});}});
document.getElementById('run').addEventListener('click',async()=>{const btn=document.getElementById('run');try{const message=command.value.trim();if(!message){show('Type a command first.');return;}btn.disabled=true;btn.textContent='Running...';status.textContent='Running...';show('Running...');const data=await postJson('/chain',{message,dataset});show(data);status.textContent='Run complete.';}catch(err){show({ok:false,error:err.message});status.textContent='Run failed: '+err.message;}finally{btn.disabled=false;btn.textContent='Run';}});
document.getElementById('runNetwork').addEventListener('click',async()=>{const btn=document.getElementById('runNetwork');try{btn.disabled=true;btn.textContent='Running network...';status.textContent='Running fixed network chain...';show('Running fixed network chain...');const message=command.value.trim() || 'Run network research on dataset';const data=await postJson('/network/run',{message,dataset});show(data);status.textContent='Network run complete.';}catch(err){show({ok:false,error:err.message});status.textContent='Network run failed: '+err.message;}finally{btn.disabled=false;btn.textContent='Run Network';}});
document.getElementById('smoke').addEventListener('click',async()=>{try{status.textContent='Running smoke test...';show('Running smoke test...');show(await getJson('/smoke/network'));status.textContent='Smoke test complete.';}catch(err){show({ok:false,error:err.message});status.textContent='Smoke failed: '+err.message;}});
document.getElementById('version').addEventListener('click',async()=>{try{status.textContent='Checking version...';show(await getJson('/version'));status.textContent='Version checked.';}catch(err){show({ok:false,error:err.message});status.textContent='Version check failed: '+err.message;}});
document.getElementById('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(lastOutput);status.textContent='Copied.';}catch{copyFallback(lastOutput);status.textContent='Copied with fallback.';}});
document.getElementById('select').addEventListener('click',()=>{const range=document.createRange();range.selectNodeContents(out);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);status.textContent='Selected output.';});
document.getElementById('download').addEventListener('click',()=>{const blob=new Blob([lastOutput],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hook-output-'+Date.now()+'.json';a.click();URL.revokeObjectURL(url);});
document.getElementById('clear').addEventListener('click',()=>{command.value='';show('Ready.');status.textContent=dataset?'Ready. Dataset still loaded.':'Ready. No dataset loaded.';});
</script>
</body>
</html>`;
}

app.get('/', (_, res) => res.type('html').send(page()));
app.get('/health', (_, res) => res.json(versionPayload()));
app.get('/version', (_, res) => res.json(versionPayload()));

app.get('/smoke/network', async (_, res) => {
  try {
    const dataset = {
      entities: [
        { id: 'smoke:millard', name: 'Maureen Millard' },
        { id: 'smoke:hall', name: 'Dudmaston Hall' }
      ]
    };
    const result = await runChain({ type: 'smoke_test', text: 'Run network smoke test', payload: { message: 'Run network smoke test', dataset } }, NETWORK_CHAIN);
    res.json({
      ok: result.ok,
      smoke: true,
      expectedMode: NETWORK_SCORING_VERSION,
      actualMode: result?.final?.report?.previous?.mode || result?.final?.mode || null,
      version: versionPayload(),
      chain: NETWORK_CHAIN,
      trace: result.trace,
      final: result.final
    });
  } catch (e) {
    res.status(500).json({ ok: false, smoke: true, error: e?.message || String(e), version: versionPayload() });
  }
});

app.post('/network/run', async (req, res) => {
  try {
    const message = String(req.body?.message || 'Run network research on dataset');
    const result = await runChain({ type: 'user_input', text: message, payload: req.body }, NETWORK_CHAIN);
    await appendLog({ id: Date.now(), message, chain: NETWORK_CHAIN, result, createdAt: new Date().toISOString() });
    res.json({ ok: result.ok, forcedNetwork: true, expectedMode: NETWORK_SCORING_VERSION, chain: NETWORK_CHAIN, trace: result.trace, final: result.final });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.post('/chain', async (req, res) => {
  try {
    const message = String(req.body?.message || '');
    if (!message.trim()) return res.status(400).json({ ok: false, error: 'message required' });
    const chain = Array.isArray(req.body?.chain) && req.body.chain.length ? req.body.chain : decideWorkflow(message);
    const result = await runChain({ type: 'user_input', text: message, payload: req.body }, chain);
    await appendLog({ id: Date.now(), message, chain, result, createdAt: new Date().toISOString() });
    res.json({ ok: result.ok, chain, trace: result.trace, final: result.final });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});
app.get('/logs', async (_, res) => res.json({ logs: await getLogs() }));
app.listen(PORT, '0.0.0.0', () => console.log('Hook OS '+APP_VERSION+' running on '+PORT));

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
app.use(cors());
app.use(express.json({ limit: process.env.MAX_BODY || '24mb' }));
await fs.mkdir('./data', { recursive: true });

for (const hook of [deepResearchHook, mediaCampaignHook, agentPlanHook, riskReviewHook, exportReportHook, networkResearchHook]) {
  try { registerHook(hook); } catch {}
}

function page() {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hook OS v1 Stable</title>
<style>
body{margin:0;padding:16px;background:#080511;color:#f5edff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif}h1{color:#d4af37}.card{background:#130d22;border:1px solid rgba(212,175,55,.3);border-radius:16px;padding:14px;margin:12px 0}textarea{width:100%;min-height:120px;box-sizing:border-box;background:#05020a;color:white;border:1px solid rgba(212,175,55,.4);border-radius:12px;padding:12px;font-size:16px}button{padding:12px 14px;margin:5px 5px 5px 0;border:0;border-radius:12px;background:#d4af37;color:#080511;font-weight:800}.secondary{background:#211735;color:#fff;border:1px solid rgba(212,175,55,.35)}pre{white-space:pre-wrap;word-break:break-word;background:#000;color:#d4af37;border:1px solid rgba(212,175,55,.35);border-radius:14px;padding:12px;min-height:360px;max-height:70vh;overflow:auto;-webkit-user-select:text;user-select:text}.status{color:#c9b8e8;font-size:14px}.hidden{position:fixed;left:-9999px;width:1px;height:1px;opacity:.01}
</style>
</head>
<body>
<h1>Hook OS v1 Stable</h1>
<div class="card">
<textarea id="command" placeholder="Run network research on dataset"></textarea>
<div><input id="file" type="file" accept=".json,.txt,.csv"></div>
<div>
<button id="run">Run</button>
<button id="copy" class="secondary">Copy All</button>
<button id="select" class="secondary">Select All</button>
<button id="download" class="secondary">Download</button>
<button id="clear" class="secondary">Clear</button>
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
document.getElementById('file').addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;const text=await f.text();try{dataset=JSON.parse(text);status.textContent='Loaded JSON: '+f.name;}catch{dataset={rawText:text,filename:f.name};status.textContent='Loaded raw text: '+f.name;}}catch(err){status.textContent='File load failed: '+err.message;show({ok:false,error:err.message});}});
document.getElementById('run').addEventListener('click',async()=>{const btn=document.getElementById('run');try{const message=command.value.trim();if(!message){show('Type a command first.');return;}btn.disabled=true;btn.textContent='Running...';status.textContent='Running...';show('Running...');const res=await fetch('/chain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,dataset})});const text=await res.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}if(!res.ok)throw new Error(data.error||res.status+' '+res.statusText);show(data);status.textContent='Run complete.';}catch(err){show({ok:false,error:err.message});status.textContent='Run failed: '+err.message;}finally{btn.disabled=false;btn.textContent='Run';}});
document.getElementById('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(lastOutput);status.textContent='Copied.';}catch{copyFallback(lastOutput);status.textContent='Copied with fallback.';}});
document.getElementById('select').addEventListener('click',()=>{const range=document.createRange();range.selectNodeContents(out);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);status.textContent='Selected output.';});
document.getElementById('download').addEventListener('click',()=>{const blob=new Blob([lastOutput],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hook-output-'+Date.now()+'.json';a.click();URL.revokeObjectURL(url);});
document.getElementById('clear').addEventListener('click',()=>{command.value='';show('Ready.');status.textContent=dataset?'Ready. Dataset still loaded.':'Ready. No dataset loaded.';});
</script>
</body>
</html>`;
}

app.get('/', (_, res) => res.type('html').send(page()));
app.get('/health', (_, res) => res.json({ ok: true, app: 'Hook OS v1 Stable', serpApiConfigured: Boolean(process.env.SERP_API_KEY) }));
app.post('/chain', async (req, res) => {
  try {
    const message = String(req.body?.message || '');
    if (!message.trim()) return res.status(400).json({ ok: false, error: 'message required' });
    const chain = decideWorkflow(message);
    const result = await runChain({ type: 'user_input', text: message, payload: req.body }, chain);
    await appendLog({ id: Date.now(), message, chain, result, createdAt: new Date().toISOString() });
    res.json({ ok: result.ok, chain, trace: result.trace, final: result.final });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});
app.get('/logs', async (_, res) => res.json({ logs: await getLogs() }));
app.listen(PORT, '0.0.0.0', () => console.log('Hook OS v1 Stable running on '+PORT));

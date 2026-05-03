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
import { networkResearchHook } from '../hooks/networkResearchHook.js';
import { runChain } from '../engine/chainRunner.js';
import { decideWorkflow } from '../engine/workflows.js';
import { appendLog, getLogs } from '../engine/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MAX_BODY = process.env.MAX_BODY || '24mb';

app.use(cors());
app.use(express.json({ limit: MAX_BODY }));

await fs.mkdir('./data', { recursive: true });

function registerCoreHooks() {
  const hooks = [deepResearchHook, mediaCampaignHook, agentPlanHook, riskReviewHook, exportReportHook, networkResearchHook];
  for (const hook of hooks) {
    try { registerHook(hook); } catch {}
  }
}
registerCoreHooks();

function page() {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Hook OS v1</title>
<style>
body{background:#080511;color:#f5edff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:18px}
h1{margin:0 0 12px;color:#d4af37}.panel{background:#130d22;border:1px solid rgba(212,175,55,.28);border-radius:18px;padding:14px;margin:12px 0}textarea{width:100%;height:120px;box-sizing:border-box;border-radius:12px;background:#05020a;color:#f5edff;border:1px solid rgba(212,175,55,.35);padding:12px;font-size:16px}button{border:0;border-radius:12px;padding:11px 13px;margin:5px 5px 5px 0;background:#d4af37;color:#090511;font-weight:800}.secondary{background:#211735;color:#f5edff;border:1px solid rgba(212,175,55,.35)}.status{color:#c9b8e8;font-size:14px}.hiddenCopy{position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:.01}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:10px 0}.metric{background:#05020a;border:1px solid rgba(212,175,55,.25);border-radius:14px;padding:10px}.metric b{display:block;color:#d4af37;font-size:20px}.section{background:#05020a;border:1px solid rgba(212,175,55,.25);border-radius:14px;margin:10px 0;overflow:hidden}.section summary{cursor:pointer;padding:12px;color:#d4af37;font-weight:800}.section pre{margin:0;border-radius:0;border:0;max-height:45vh}.pill{display:inline-block;border-radius:999px;padding:4px 8px;margin:2px;background:#211735;border:1px solid rgba(212,175,55,.35);font-size:12px}.ok{color:#8dffb0}.bad{color:#ff8d8d}.warn{color:#ffd56b}pre{min-height:260px;max-height:72vh;overflow:auto;resize:vertical;background:#000;padding:14px;color:#d4af37;border-radius:14px;border:1px solid rgba(212,175,55,.35);white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.45;-webkit-user-select:text;user-select:text}.fullscreen{position:fixed!important;inset:10px!important;z-index:9999!important;max-height:none!important;height:calc(100vh - 20px)!important;box-sizing:border-box!important;box-shadow:0 0 0 9999px rgba(0,0,0,.86)}
</style>
</head>
<body>
<h1>Hook OS v1</h1>
<div class="panel">
<textarea id="command" placeholder="Tell Hook what to do…"></textarea>
<div><input type="file" id="file" accept=".json,.csv,.txt" /></div>
<div>
<button id="run">Run</button>
<button id="copyAll" class="secondary">Copy All</button>
<button id="selectAll" class="secondary">Select All</button>
<button id="download" class="secondary">Download Output</button>
<button id="expand" class="secondary">Expand Raw</button>
<button id="clear" class="secondary">Clear</button>
</div>
<div id="status" class="status">No dataset loaded.</div>
</div>
<div class="panel">
<h2>Readable View</h2>
<div id="readable">Ready.</div>
</div>
<div class="panel">
<h2>Raw Output</h2>
<pre id="out">Ready.</pre>
<textarea id="copyBox" class="hiddenCopy" readonly></textarea>
</div>
<script>
let dataset=null;
let lastOutput='Ready.';
let lastObject=null;
const out=document.getElementById('out');
const readable=document.getElementById('readable');
const status=document.getElementById('status');
const command=document.getElementById('command');
const runBtn=document.getElementById('run');
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function asJson(x){try{return JSON.stringify(x,null,2)}catch{return String(x)}}
function metric(label,value){return '<div class="metric"><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>'}
function renderReadable(obj){
  if(typeof obj==='string'){readable.textContent=obj;return;}
  const trace=obj.trace||obj.result?.trace||[];
  const final=obj.final||obj.result?.final||obj;
  const tasks=final?.report?.tasks||final?.tasks||final?.report?.previous?.tasks||[];
  const results=final?.report?.previous?.results||final?.results||[];
  const chain=obj.chain||obj.result?.chain||[];
  const html=[];
  html.push('<div class="summary">'+metric('OK', obj.ok===false?'No':'Yes')+metric('Chain', chain.length||trace.length||'-')+metric('Trace Steps', trace.length||'-')+metric('Tasks', tasks.length||'-')+metric('Results', results.length||'-')+'</div>');
  if(chain.length) html.push('<p>'+chain.map(x=>'<span class="pill">'+esc(x)+'</span>').join('')+'</p>');
  if(trace.length){html.push('<details class="section" open><summary>Execution Trace</summary><pre>'+esc(asJson(trace))+'</pre></details>');}
  if(tasks.length){const top=tasks.slice(0,20).map(t=>'• '+(t.entity||t.name||t.id)+'\n  '+(t.publicSearchQueries||t.queries||[]).slice(0,3).join('\n  ')).join('\n\n');html.push('<details class="section" open><summary>Top Research Tasks</summary><pre>'+esc(top)+'</pre></details>');}
  if(results.length){const topResults=results.slice(0,10).map(r=>'• '+r.entity+' — findings: '+(r.findings?.length||0)).join('\n');html.push('<details class="section" open><summary>Search Results Summary</summary><pre>'+esc(topResults)+'</pre></details>');}
  html.push('<details class="section"><summary>Final Output</summary><pre>'+esc(asJson(final))+'</pre></details>');
  readable.innerHTML=html.join('');
}
function setOut(value){lastObject=value;lastOutput=typeof value==='string'?value:JSON.stringify(value,null,2);out.textContent=lastOutput;renderReadable(value);}
async function copyText(text){try{await navigator.clipboard.writeText(text);status.textContent='Copied all output to clipboard.';return true;}catch(e){const box=document.getElementById('copyBox');box.value=text;box.focus();box.select();box.setSelectionRange(0,999999);try{document.execCommand('copy');status.textContent='Copied using fallback selector.';return true;}catch{status.textContent='Copy failed — text selected in fallback box.';return false;}}}
function selectOutput(){const range=document.createRange();range.selectNodeContents(out);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);status.textContent='Output selected. Use iOS Copy from the selection menu if needed.';}
document.getElementById('file').onchange=async(e)=>{const file=e.target.files[0]; if(!file)return; const text=await file.text(); try{dataset=JSON.parse(text);status.textContent='Dataset loaded: '+file.name+' | entities/nodes/rows: '+(dataset.entities?.length||dataset.nodes?.length||dataset.rows?.length||Object.keys(dataset).length);}catch{dataset={rawText:text, filename:file.name};status.textContent='Loaded as raw text: '+file.name;}};
runBtn.onclick=async()=>{try{const message=command.value.trim(); if(!message)return setOut('Type a command first.'); runBtn.disabled=true; runBtn.textContent='Running…'; status.textContent='Running chain…'; setOut('Running…'); const res=await fetch('/chain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,dataset})}); const text=await res.text(); let data; try{data=text?JSON.parse(text):null}catch{data={raw:text}} if(!res.ok){throw new Error(data?.error||res.status+' '+res.statusText)} setOut(data); status.textContent='Run complete.';}catch(err){setOut({ok:false,error:err.message});status.textContent='Run failed: '+err.message;}finally{runBtn.disabled=false;runBtn.textContent='Run';}};
document.getElementById('copyAll').onclick=()=>copyText(lastOutput);
document.getElementById('selectAll').onclick=selectOutput;
document.getElementById('download').onclick=()=>{const blob=new Blob([lastOutput],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hook-output-'+Date.now()+'.json';a.click();URL.revokeObjectURL(url);status.textContent='Download created.';};
document.getElementById('expand').onclick=(e)=>{out.classList.toggle('fullscreen');e.target.textContent=out.classList.contains('fullscreen')?'Shrink Raw':'Expand Raw';};
document.getElementById('clear').onclick=()=>{command.value='';setOut('Ready.');status.textContent=dataset?'Dataset still loaded.':'No dataset loaded.';};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&out.classList.contains('fullscreen'))out.classList.remove('fullscreen');});
</script>
</body>
</html>`;
}

app.get('/', (_, res) => res.send(page()));

app.post('/chain', async (req, res) => {
  try {
    const message = req.body.message;
    const chain = decideWorkflow(message);
    const result = await runChain({ payload: req.body }, chain);
    await appendLog({ id: Date.now(), message, chain, result });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.get('/logs', async (_, res) => res.json(await getLogs()));

app.listen(PORT, () => console.log('Hook running'));

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
  const hooks = [
    deepResearchHook,
    mediaCampaignHook,
    agentPlanHook,
    riskReviewHook,
    exportReportHook,
    networkResearchHook
  ];
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
<title>Hook OS v1</title>
<style>
body{background:#080511;color:#f5edff;font-family:sans-serif}
textarea{width:100%;height:120px}
pre{min-height:300px;background:#000;padding:12px;color:#d4af37}
</style>
</head>
<body>
<h1>Hook OS v1</h1>
<textarea id="command"></textarea>
<input type="file" id="file" />
<button id="run">Run</button>
<pre id="out"></pre>
<script>
let dataset=null;
const out=document.getElementById('out');

document.getElementById('file').onchange=async(e)=>{
  const file=e.target.files[0];
  const text=await file.text();
  try{
    dataset=JSON.parse(text);
    out.textContent='Dataset loaded: '+(dataset.entities?.length||Object.keys(dataset).length);
  }catch{
    out.textContent='Invalid JSON';
  }
};

document.getElementById('run').onclick=async()=>{
  const message=document.getElementById('command').value;
  const res=await fetch('/chain',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message,dataset})
  });
  out.textContent=JSON.stringify(await res.json(),null,2);
};
</script>
</body>
</html>`;
}

app.get('/', (_, res) => res.send(page()));

app.post('/chain', async (req, res) => {
  const message = req.body.message;
  const chain = decideWorkflow(message);
  const result = await runChain({payload:req.body}, chain);
  await appendLog({id:Date.now(),message,chain,result});
  res.json(result);
});

app.get('/logs', async (_, res) => res.json(await getLogs()));

app.listen(PORT,()=>console.log('Hook running'));

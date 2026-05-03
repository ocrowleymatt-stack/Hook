import fs from 'fs/promises';

const LOG_PATH = './data/execution-log.json';

export async function appendLog(entry) {
  try {
    let logs = [];
    try {
      const raw = await fs.readFile(LOG_PATH, 'utf-8');
      logs = JSON.parse(raw);
    } catch {}

    logs.unshift(entry);
    if (logs.length > 200) logs = logs.slice(0, 200);

    await fs.writeFile(LOG_PATH, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Log write failed:', e.message);
  }
}

export async function getLogs() {
  try {
    const raw = await fs.readFile(LOG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

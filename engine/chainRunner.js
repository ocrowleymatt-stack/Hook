import { listHooks } from '../src/hookRegistry.js';

function getHook(name) {
  return listHooks().find(h => h.name === name);
}

export async function runChain(event, chain = []) {
  const trace = [];
  let context = { input: event.payload || {}, output: null };

  for (const hookName of chain) {
    const hook = getHook(hookName);

    if (!hook) {
      trace.push({ hook: hookName, ok: false, error: 'Hook not found' });
      return { ok: false, failedAt: hookName, trace, final: context.output };
    }

    try {
      const startedAt = new Date().toISOString();
      const result = await hook.handler({ ...context.input, previous: context.output });
      const finishedAt = new Date().toISOString();

      context.output = result;

      trace.push({
        hook: hookName,
        ok: true,
        startedAt,
        finishedAt,
        outputPreview: JSON.stringify(result).slice(0, 800)
      });
    } catch (e) {
      trace.push({ hook: hookName, ok: false, error: e.message });
      return { ok: false, failedAt: hookName, trace, final: context.output };
    }
  }

  return { ok: true, chain, trace, final: context.output };
}

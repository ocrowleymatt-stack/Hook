const hooks = new Map();

export function registerHook(hook) {
  if (!hook?.name || typeof hook.handler !== 'function') {
    throw new Error('Invalid hook registration');
  }
  if (hooks.has(hook.name)) {
    throw new Error(`Hook already registered: ${hook.name}`);
  }
  hooks.set(hook.name, hook);
}

export function getHook(name) {
  return hooks.get(name);
}

export function listHooks() {
  return Array.from(hooks.values());
}

export function clearHooks() {
  hooks.clear();
}

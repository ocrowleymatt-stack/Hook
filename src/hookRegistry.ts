import { Hook } from "./types.js";

const hooks = new Map<string, Hook>();

export function registerHook(hook: Hook) {
  if (hooks.has(hook.name)) {
    throw new Error(`Hook already registered: ${hook.name}`);
  }
  hooks.set(hook.name, hook);
}

export function getHook(name: string): Hook | undefined {
  return hooks.get(name);
}

export function listHooks(): Hook[] {
  return Array.from(hooks.values());
}

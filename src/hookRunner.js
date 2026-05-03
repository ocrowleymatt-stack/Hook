'use strict';

/**
 * Strict hook-chain runner for Hook OS style pipelines.
 *
 * Design goals:
 * - deterministic ordering;
 * - explicit hook registry;
 * - no silent missing hooks;
 * - no mutation of prior hook output;
 * - court/evidence-safe output labelling where used for research chains.
 */

const DEFAULT_CHAIN = Object.freeze([
  'network_research',
  'risk_review',
  'export_report',
]);

class HookChainError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'HookChainError';
    this.details = details;
  }
}

function normaliseChain(chain = DEFAULT_CHAIN) {
  if (!Array.isArray(chain) || chain.length === 0) {
    throw new HookChainError('Hook chain must be a non-empty array.', { chain });
  }

  const normalised = chain.map((hook) => {
    if (typeof hook !== 'string' || hook.trim() === '') {
      throw new HookChainError('Hook names must be non-empty strings.', { hook });
    }
    return hook.trim();
  });

  return Object.freeze([...normalised]);
}

function assertRegistry(registry) {
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) {
    throw new HookChainError('Hook registry must be an object keyed by hook name.');
  }
}

function createHookRunner(registry, options = {}) {
  assertRegistry(registry);

  const chain = normaliseChain(options.chain || DEFAULT_CHAIN);
  const strict = options.strict !== false;

  async function run(initialInput = {}) {
    const trace = [];
    let current = Object.freeze({ ...initialInput });

    for (const hookName of chain) {
      const hook = registry[hookName];

      if (typeof hook !== 'function') {
        if (strict) {
          throw new HookChainError(`Missing hook: ${hookName}`, { hookName, chain });
        }
        trace.push({ hook: hookName, ok: false, skipped: true, reason: 'missing_hook' });
        continue;
      }

      const startedAt = new Date().toISOString();

      try {
        const output = await hook(current, {
          hookName,
          chain,
          trace: Object.freeze([...trace]),
        });

        const finishedAt = new Date().toISOString();
        current = Object.freeze(output && typeof output === 'object' ? { ...output } : { value: output });

        trace.push({
          hook: hookName,
          ok: true,
          startedAt,
          finishedAt,
          outputPreview: safePreview(current),
        });
      } catch (error) {
        const finishedAt = new Date().toISOString();
        trace.push({
          hook: hookName,
          ok: false,
          startedAt,
          finishedAt,
          error: error && error.message ? error.message : String(error),
        });

        throw new HookChainError(`Hook failed: ${hookName}`, {
          hookName,
          chain,
          trace,
          cause: error && error.message ? error.message : String(error),
        });
      }
    }

    return Object.freeze({
      ok: true,
      chain,
      trace: Object.freeze(trace),
      final: current,
    });
  }

  return Object.freeze({ run, chain });
}

function safePreview(value, maxLength = 1000) {
  let text;
  try {
    text = JSON.stringify(value);
  } catch (_error) {
    text = String(value);
  }

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function buildDefaultRegistry(overrides = {}) {
  return Object.freeze({
    network_research: async (input) => ({
      stage: 'network_research_results',
      previous: input,
      evidentialWarning: 'Generated output is analysis/control material, not primary evidence.',
    }),

    risk_review: async (input) => ({
      risks: [
        'Check every factual assertion against primary evidence',
        'Do not blur allegation and established fact',
        'Preserve uncertainty and contradictions',
        'Avoid overclaiming causation or intent',
      ],
      previous: input,
    }),

    export_report: async (input) => ({
      title: 'Hook OS Chain Report',
      generatedAt: new Date().toISOString(),
      report: input,
      evidentialWarning: 'Generated output is analysis/control material, not primary evidence.',
    }),

    ...overrides,
  });
}

module.exports = {
  DEFAULT_CHAIN,
  HookChainError,
  buildDefaultRegistry,
  createHookRunner,
  normaliseChain,
  safePreview,
};

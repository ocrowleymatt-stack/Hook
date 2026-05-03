const {
  createHookRunner,
  buildDefaultRegistry,
} = require('../src/hookRunner');

(async () => {
  const registry = buildDefaultRegistry();
  const runner = createHookRunner(registry);

  const result = await runner.run({ seed: true });

  if (!result.ok) {
    throw new Error('Runner did not complete successfully');
  }

  if (!Array.isArray(result.trace) || result.trace.length !== 3) {
    throw new Error('Trace length mismatch');
  }

  console.log('Hook runner test passed');
})();

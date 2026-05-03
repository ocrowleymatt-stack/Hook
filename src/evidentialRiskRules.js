'use strict';

const DEFAULT_RISK_RULES = Object.freeze([
  {
    id: 'primary_evidence_required',
    severity: 'high',
    test: (ctx) => !ctx.primaryEvidence || ctx.primaryEvidence.length === 0,
    message: 'No primary evidence mounted. Treat all output as lead/control material only.',
  },
  {
    id: 'allegation_language_required',
    severity: 'high',
    test: (ctx) => Boolean(ctx.containsAllegations) && !ctx.usesAllegationLanguage,
    message: 'Allegations must be framed as alleged/reported/appears, unless independently proved.',
  },
  {
    id: 'causation_overclaim',
    severity: 'medium',
    test: (ctx) => Boolean(ctx.assertsCausation) && !ctx.causationEvidence,
    message: 'Causation is not evidenced. Reframe as chronology, proximity, or concern.',
  },
  {
    id: 'intent_overclaim',
    severity: 'medium',
    test: (ctx) => Boolean(ctx.assertsIntent) && !ctx.intentEvidence,
    message: 'Intent is not evidenced. Use neutral wording unless primary evidence proves intent.',
  },
  {
    id: 'public_source_leads_only',
    severity: 'medium',
    test: (ctx) => Boolean(ctx.publicSourceOnly),
    message: 'Public-source results are investigative leads, not proof of identity, connection, or misconduct.',
  },
  {
    id: 'needs_source_trace',
    severity: 'high',
    test: (ctx) => !ctx.sourceTrace || ctx.sourceTrace.length === 0,
    message: 'No source trace supplied. Add URLs, exhibit IDs, screenshots, or document references before reliance.',
  },
]);

function reviewRiskContext(context = {}, rules = DEFAULT_RISK_RULES) {
  const flags = [];

  for (const rule of rules) {
    if (rule.test(context)) {
      flags.push({
        id: rule.id,
        severity: rule.severity,
        message: rule.message,
      });
    }
  }

  return Object.freeze({
    ok: !flags.some((flag) => flag.severity === 'high'),
    flags: Object.freeze(flags),
    guidance: Object.freeze([
      'Separate raw evidence from derived analysis.',
      'Keep public-source leads in a lead schedule until verified.',
      'Use cautious, court-safe wording for unproved matters.',
      'Do not merge similarity, proximity, or name-match into proof of connection.',
    ]),
  });
}

module.exports = {
  DEFAULT_RISK_RULES,
  reviewRiskContext,
};

import { searchWeb } from '../engine/webSearch.js';

function extractSignals(text = '') {
  const t = String(text).toLowerCase();
  return {
    company: t.includes('director') || t.includes('company') || t.includes('companies house'),
    charity: t.includes('charity') || t.includes('charity commission'),
    church: t.includes('church') || t.includes('parish') || t.includes('chapel') || t.includes('ecclesia') || t.includes('christadelphian'),
    christadelphian: t.includes('christadelphian') || t.includes('ecclesia'),
    estate: t.includes('hall') || t.includes('estate') || t.includes('dudmaston') || t.includes('burwarton'),
    location: t.includes('shropshire') || t.includes('ironbridge') || t.includes('bridgnorth')
  };
}

function classifyFinding(result = {}) {
  const text = `${result.title || ''} ${result.snippet || ''} ${result.link || ''}`.toLowerCase();
  if (text.includes('company-information.service.gov.uk') || text.includes('companies house')) return 'probable';
  if (text.includes('charitycommission') || text.includes('gov.uk')) return 'probable';
  if (text.includes('christadelphian') || text.includes('ecclesia')) return 'possible';
  if (text.includes('church') || text.includes('parish') || text.includes('estate') || text.includes('hall')) return 'possible';
  return 'unknown';
}

export const networkResearchHook = {
  name: 'network_research',
  handler: async ({ dataset, message }) => {
    const rawEntities = dataset?.entities || dataset?.nodes || dataset?.rows || [];

    const entities = rawEntities
      .map((e, i) => ({
        id: e.id || e.phone || e['Phone (Normalized)'] || `entity-${i + 1}`,
        name: e.name || e.label || e['Primary Name'] || e.Name || e.name_display || e.id || `Entity ${i + 1}`
      }))
      .filter(e => e.name && String(e.name).trim())
      .slice(0, Number(process.env.NETWORK_RESEARCH_LIMIT || 20));

    const results = [];

    for (const e of entities) {
      const baseQueries = [
        `${e.name} UK`,
        `${e.name} Companies House`,
        `${e.name} Charity Commission`,
        `${e.name} church parish`,
        `${e.name} ecclesia`,
        `${e.name} Christadelphian`,
        `${e.name} Ironbridge Shropshire`
      ];

      const wildcardQueries = [
        `"${e.name}" Shropshire`,
        `"${e.name}" Ironbridge`,
        `"${e.name}" Dudmaston`,
        `"${e.name}" Burwarton`,
        `"${e.name}" ecclesia`,
        `"${e.name}" Christadelphian`,
        `"${e.name}" "Christadelphian ecclesia"`,
        `"${e.name}" committee`,
        `"${e.name}" trust`,
        `"${e.name}" event`,
        `"${e.name}" spiritual`,
        `"${e.name}" healing`
      ];

      const queries = [...baseQueries, ...wildcardQueries];
      const findings = [];

      for (const q of queries) {
        const res = await searchWeb(q, 5);

        for (const r of res.results || []) {
          findings.push({
            query: q,
            source: r.link,
            title: r.title,
            snippet: r.snippet,
            priority: Boolean(r.priority),
            signals: extractSignals(`${r.title} ${r.snippet} ${r.link}`),
            confidence: classifyFinding(r),
            statementType: 'public_source_lead_not_verified'
          });
        }
      }

      results.push({ entity: e.name, id: e.id, queryCount: queries.length, findings });
    }

    return {
      stage: 'network_research_results',
      entityCount: entities.length,
      results,
      warning: 'Search results are public-source leads. Confirm identity and relevance before treating a link as evidenced.'
    };
  }
};

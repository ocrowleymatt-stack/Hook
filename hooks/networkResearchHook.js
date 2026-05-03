import { searchWeb } from '../engine/webSearch.js';

function extractSignals(text = '') {
  const t = String(text).toLowerCase();
  return {
    company: t.includes('director') || t.includes('company') || t.includes('companies house'),
    charity: t.includes('charity') || t.includes('charity commission'),
    church: t.includes('church') || t.includes('parish') || t.includes('chapel'),
    estate: t.includes('hall') || t.includes('estate') || t.includes('dudmaston') || t.includes('burwarton'),
    location: t.includes('shropshire') || t.includes('ironbridge') || t.includes('bridgnorth')
  };
}

function classifyFinding(result = {}) {
  const text = `${result.title || ''} ${result.snippet || ''} ${result.link || ''}`.toLowerCase();
  if (text.includes('company-information.service.gov.uk') || text.includes('companies house')) return 'probable';
  if (text.includes('charitycommission') || text.includes('gov.uk')) return 'probable';
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
      .slice(0, 20);

    const results = [];

    for (const e of entities) {
      const queries = [
        `${e.name} UK`,
        `${e.name} Companies House`,
        `${e.name} church parish`,
        `${e.name} Ironbridge Shropshire`
      ];

      const findings = [];

      for (const q of queries) {
        const res = await searchWeb(q, 5);

        for (const r of res.results || []) {
          findings.push({
            source: r.link,
            title: r.title,
            snippet: r.snippet,
            signals: extractSignals(`${r.title} ${r.snippet}`),
            confidence: classifyFinding(r)
          });
        }
      }

      results.push({ entity: e.name, findings });
    }

    return {
      stage: 'network_research_results',
      entityCount: entities.length,
      results
    };
  }
};

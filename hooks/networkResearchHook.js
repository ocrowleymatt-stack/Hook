import { searchWeb } from '../engine/webSearch.js';

function extractSignals(text = '') {
  const t = String(text).toLowerCase();
  return {
    company: t.includes('director') || t.includes('company') || t.includes('companies house'),
    charity: t.includes('charity') || t.includes('charity commission'),
    church: t.includes('church') || t.includes('parish') || t.includes('chapel') || t.includes('ecclesia') || t.includes('christadelphian'),
    christadelphian: t.includes('christadelphian') || t.includes('ecclesia'),
    estate: t.includes('hall') || t.includes('estate') || t.includes('dudmaston') || t.includes('burwarton'),
    location: t.includes('shropshire') || t.includes('ironbridge') || t.includes('bridgnorth'),
    esoteric: t.includes('crowley') || t.includes('thelema') || t.includes('tarot') || t.includes('numerology') || t.includes('gematria'),
    police: t.includes('police') || t.includes('constabulary') || t.includes('officer') || t.includes('court') || t.includes('cps')
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

function isSearchableName(name = '') {
  const n = String(name).trim();
  if (n.length < 4) return false;
  if (/^[?jptsm]+$/i.test(n)) return false;
  if (/^unknown$/i.test(n)) return false;
  return true;
}

function buildQueries(name) {
  return [
    `${name} UK`,
    `${name} Companies House`,
    `${name} Charity Commission`,
    `${name} ecclesia`,
    `${name} Christadelphian`,
    `${name} Ironbridge Shropshire`,
    `"${name}" Shropshire`,
    `"${name}" ecclesia`,
    `"${name}" Christadelphian`,
    `"${name}" police`,
    `"${name}" tarot`,
    `"${name}" gematria`
  ];
}

export const networkResearchHook = {
  name: 'network_research',
  handler: async ({ dataset, message }) => {
    const rawEntities = dataset?.entities || dataset?.nodes || dataset?.rows || [];
    const entityLimit = Number(process.env.NETWORK_RESEARCH_LIMIT || 3);
    const queryLimit = Number(process.env.NETWORK_QUERY_LIMIT || 4);

    const entities = rawEntities
      .map((e, i) => ({
        id: e.id || e.phone || e['Phone (Normalized)'] || `entity-${i + 1}`,
        name: e.name || e.label || e['Primary Name'] || e.Name || e.name_display || e.id || `Entity ${i + 1}`
      }))
      .filter(e => isSearchableName(e.name))
      .slice(0, entityLimit);

    const results = [];
    const diagnostics = [];

    for (const e of entities) {
      const queries = buildQueries(e.name).slice(0, queryLimit);
      const findings = [];
      const searchNotes = [];

      for (const q of queries) {
        const res = await searchWeb(q, 3);
        if (res.note || res.error || res.diagnostics) {
          searchNotes.push({ query: q, note: res.note, error: res.error, diagnostics: res.diagnostics });
        }

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

      diagnostics.push(...searchNotes.slice(0, 3));
      results.push({ entity: e.name, id: e.id, queryCount: queries.length, findings, searchNotes: searchNotes.slice(0, 3) });
    }

    return {
      stage: 'network_research_results',
      mode: 'safe_first_pass',
      entityCount: entities.length,
      queryLimit,
      results,
      diagnostics: diagnostics.slice(0, 10),
      warning: 'Search results are public-source leads. Confirm identity and relevance before treating a link as evidenced.'
    };
  }
};

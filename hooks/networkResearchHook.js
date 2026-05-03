import { searchWeb } from '../engine/webSearch.js';

const CONTEXT_TERMS = [
  'shropshire', 'ironbridge', 'bridgnorth', 'dudmaston', 'burwarton',
  'millard', 'hardman', 'claybrook', 'gee', 'boyne', 'mottershead', 'hamilton russell',
  'ecclesia', 'christadelphian', 'crowley', 'tarot', 'numerology', 'gematria',
  'police', 'constabulary', 'cps', 'court'
];

const REJECTION_TERMS = [
  'bristol', 'cambridgeshire', 'huntingdon', 'kingston upon hull', 'dundee',
  'northumberland', 'croydon', 'tower hamlets', 'somerset', 'london', 'nottingham'
];

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

function scoreRelevance(result = {}, entityName = '') {
  const text = `${result.title || ''} ${result.snippet || ''} ${result.link || ''}`.toLowerCase();
  const nameParts = String(entityName).toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2);
  const reasons = [];
  let score = 0;

  const nameHits = nameParts.filter(p => text.includes(p));
  if (nameHits.length) {
    score += Math.min(30, nameHits.length * 15);
    reasons.push(`name_match:${nameHits.join(',')}`);
  }

  const contextHits = CONTEXT_TERMS.filter(term => text.includes(term));
  if (contextHits.length) {
    score += Math.min(45, contextHits.length * 15);
    reasons.push(`context:${contextHits.join(',')}`);
  }

  if (result.priority) {
    score += 10;
    reasons.push('priority_domain');
  }

  const rejectionHits = REJECTION_TERMS.filter(term => text.includes(term));
  if (rejectionHits.length && !contextHits.length) {
    score -= 35;
    reasons.push(`outside_context:${rejectionHits.join(',')}`);
  }

  const keep = score >= 25 && !(/^unknown$/i.test(entityName));
  return { score, reasons, keep, rejectionHits, contextHits };
}

function classifyFinding(result = {}, relevance = {}) {
  if (!relevance.keep) return 'rejected_or_weak';
  if (relevance.score >= 60) return 'probable_context_match';
  if (relevance.score >= 35) return 'possible_context_match';
  return 'weak_context_match';
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
    `${name} Shropshire Ironbridge`,
    `${name} Bridgnorth Dudmaston Burwarton`,
    `${name} Companies House Shropshire`,
    `${name} Charity Commission Shropshire`,
    `${name} ecclesia Christadelphian`,
    `${name} police court`,
    `"${name}" "Hamilton Russell"`,
    `"${name}" Mottershead Hardman Claybrook Gee Boyne`
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
      const keptFindings = [];
      const rejectedFindings = [];
      const searchNotes = [];

      for (const q of queries) {
        const res = await searchWeb(q, 5);
        if (res.note || res.error || res.diagnostics) {
          searchNotes.push({ query: q, note: res.note, error: res.error, diagnostics: res.diagnostics });
        }

        for (const r of res.results || []) {
          const relevance = scoreRelevance(r, e.name);
          const finding = {
            query: q,
            source: r.link,
            title: r.title,
            snippet: r.snippet,
            priority: Boolean(r.priority),
            signals: extractSignals(`${r.title} ${r.snippet} ${r.link}`),
            relevance,
            confidence: classifyFinding(r, relevance),
            statementType: 'public_source_lead_not_verified'
          };
          if (relevance.keep) keptFindings.push(finding);
          else rejectedFindings.push(finding);
        }
      }

      diagnostics.push(...searchNotes.slice(0, 3));
      results.push({
        entity: e.name,
        id: e.id,
        queryCount: queries.length,
        keptCount: keptFindings.length,
        rejectedCount: rejectedFindings.length,
        findings: keptFindings,
        rejectedFindings: rejectedFindings.slice(0, 10),
        searchNotes: searchNotes.slice(0, 3)
      });
    }

    return {
      stage: 'network_research_results',
      mode: 'context_filtered_first_pass',
      entityCount: entities.length,
      queryLimit,
      contextTerms: CONTEXT_TERMS,
      results,
      diagnostics: diagnostics.slice(0, 10),
      warning: 'Search results are public-source leads. Context match does not prove identity or relationship; verify before use.'
    };
  }
};

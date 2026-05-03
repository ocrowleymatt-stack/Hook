import { searchWeb } from '../engine/webSearch.js';

const SCORING_VERSION = 'strict_quiet_network_v2';

const LOCAL_TERMS = [
  'shropshire', 'ironbridge', 'bridgnorth', 'dudmaston', 'burwarton', 'telford', 'madeley', 'wharfage', 'quatt'
];

const NETWORK_TERMS = [
  'millard', 'hardman', 'claybrook', 'gee', 'boyne', 'mottershead', 'hamilton russell',
  'dudmaston hall', 'burwarton hall', 'agricultural society', 'village hall'
];

const BELIEF_TERMS = [
  'ecclesia', 'christadelphian', 'chapel', 'parish', 'crowley', 'thelema', 'tarot', 'numerology', 'gematria', 'spiritual', 'healing'
];

const INSTITUTION_TERMS = ['companies house', 'charity commission', 'charity', 'trust', 'director', 'committee', 'society', 'council'];
const POLICE_TERMS = ['wanted', 'police', 'constabulary', 'absconded', 'prison', 'court', 'hmp', 'wounding', 'convicted'];
const NOISE_DOMAINS = ['facebook.com', 'linkedin.com'];
const WEAK_FIRST_NAMES = ['scott', 'jamie', 'maureen', 'michael', 'mike', 'eddie', 'brett', 'martin', 'steve'];

function includesAny(text, terms) {
  return terms.filter(term => text.includes(term));
}

function extractSignals(text = '') {
  const t = String(text).toLowerCase();
  return {
    local: includesAny(t, LOCAL_TERMS).length > 0,
    network: includesAny(t, NETWORK_TERMS).length > 0,
    belief: includesAny(t, BELIEF_TERMS).length > 0,
    institution: includesAny(t, INSTITUTION_TERMS).length > 0,
    police: includesAny(t, POLICE_TERMS).length > 0,
    company: t.includes('director') || t.includes('company') || t.includes('companies house'),
    charity: t.includes('charity') || t.includes('charity commission'),
    church: t.includes('church') || t.includes('parish') || t.includes('chapel') || t.includes('ecclesia') || t.includes('christadelphian'),
    christadelphian: t.includes('christadelphian') || t.includes('ecclesia'),
    estate: t.includes('hall') || t.includes('estate') || t.includes('dudmaston') || t.includes('burwarton'),
    esoteric: t.includes('crowley') || t.includes('thelema') || t.includes('tarot') || t.includes('numerology') || t.includes('gematria')
  };
}

function scoreRelevance(result = {}, entityName = '') {
  const text = `${result.title || ''} ${result.snippet || ''} ${result.link || ''}`.toLowerCase();
  const nameParts = String(entityName).toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2);
  const meaningfulNameParts = nameParts.filter(p => !WEAK_FIRST_NAMES.includes(p));
  const reasons = [];
  let score = 0;

  const nameHits = nameParts.filter(p => text.includes(p));
  const meaningfulNameHits = meaningfulNameParts.filter(p => text.includes(p));
  const localHits = includesAny(text, LOCAL_TERMS);
  const networkHits = includesAny(text, NETWORK_TERMS);
  const beliefHits = includesAny(text, BELIEF_TERMS);
  const institutionHits = includesAny(text, INSTITUTION_TERMS);
  const policeHits = includesAny(text, POLICE_TERMS);
  const noiseHits = includesAny(text, NOISE_DOMAINS);

  const fullNameHit = nameHits.length >= 2;
  const surnameOrNetworkHit = meaningfulNameHits.length > 0 || networkHits.length > 0;
  const quietInstitutional = institutionHits.length > 0 && policeHits.length === 0;
  const quietLocalNetwork = localHits.length > 0 && networkHits.length > 0 && policeHits.length === 0;
  const quietBeliefLocal = localHits.length > 0 && beliefHits.length > 0 && policeHits.length === 0;
  const policeDominated = policeHits.length > 0 && !quietInstitutional && beliefHits.length === 0;

  if (fullNameHit) {
    score += 18;
    reasons.push(`full_or_near_name_match:${nameHits.join(',')}`);
  } else if (meaningfulNameHits.length) {
    score += 10;
    reasons.push(`meaningful_name_match:${meaningfulNameHits.join(',')}`);
  } else if (nameHits.length) {
    score += 2;
    reasons.push(`weak_name_fragment:${nameHits.join(',')}`);
  }

  if (localHits.length) {
    score += Math.min(25, localHits.length * 8);
    reasons.push(`local_trace:${localHits.join(',')}`);
  }

  if (networkHits.length) {
    score += Math.min(30, networkHits.length * 10);
    reasons.push(`network_trace:${networkHits.join(',')}`);
  }

  if (beliefHits.length) {
    score += Math.min(25, beliefHits.length * 10);
    reasons.push(`belief_trace:${beliefHits.join(',')}`);
  }

  if (institutionHits.length) {
    score += Math.min(25, institutionHits.length * 8);
    reasons.push(`institution_trace:${institutionHits.join(',')}`);
  }

  if (policeHits.length) {
    score -= 25;
    reasons.push(`police_headline_downgrade:${policeHits.join(',')}`);
  }

  if (noiseHits.length) {
    score -= 12;
    reasons.push(`noisy_source:${noiseHits.join(',')}`);
  }

  if (result.priority) {
    score += 6;
    reasons.push('priority_domain');
  }

  const hasGoldPattern =
    quietLocalNetwork ||
    quietBeliefLocal ||
    (surnameOrNetworkHit && quietInstitutional) ||
    (localHits.length > 0 && institutionHits.length > 0 && networkHits.length > 0 && policeHits.length === 0);

  const keep = hasGoldPattern || (score >= 40 && policeHits.length === 0);
  let grade = 'rejected_or_background';
  if (hasGoldPattern) grade = 'gold_quiet_network_trace';
  else if (keep) grade = 'kept_context_trace';
  else if (policeDominated) grade = 'police_headline_noise';

  return {
    scoringVersion: SCORING_VERSION,
    score,
    grade,
    reasons,
    keep,
    hasGoldPattern,
    policeDominated,
    localHits,
    networkHits,
    beliefHits,
    institutionHits,
    policeHits
  };
}

function classifyFinding(result = {}, relevance = {}) {
  if (!relevance.keep) return relevance.grade || 'rejected_or_background';
  if (relevance.grade === 'gold_quiet_network_trace') return 'gold_quiet_network_trace';
  if (relevance.score >= 60) return 'strong_quiet_context_trace';
  return 'weak_but_interesting_quiet_trace';
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
    `${name} parish chapel trust committee`,
    `"${name}" "Hamilton Russell"`,
    `"${name}" Mottershead Hardman Claybrook Gee Boyne`,
    `"${name}" Dudmaston Hall`,
    `"${name}" Burwarton Hall`
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

      keptFindings.sort((a, b) => b.relevance.score - a.relevance.score);
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
      mode: SCORING_VERSION,
      scoringVersion: SCORING_VERSION,
      entityCount: entities.length,
      queryLimit,
      localTerms: LOCAL_TERMS,
      networkTerms: NETWORK_TERMS,
      beliefTerms: BELIEF_TERMS,
      results,
      diagnostics: diagnostics.slice(0, 10),
      warning: 'Search results are leads. This version favours quiet local/institutional/network traces and hard-downgrades police/wanted/prison headlines.'
    };
  }
};

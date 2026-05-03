const PRIORITY_DOMAINS = [
  'gov.uk',
  'company-information.service.gov.uk',
  'companieshouse.gov.uk',
  'charitycommission.gov.uk',
  'bbc.co.uk',
  'parish',
  'church',
  'estate',
  'hall',
  'ecclesia',
  'christadelphian'
];

function getApiKey() {
  return process.env.SERP_API_KEY || '';
}

export function searchDiagnostics() {
  const key = getApiKey();
  return {
    serpApiConfigured: Boolean(key),
    keyLength: key ? key.length : 0,
    keyPrefix: key ? `${key.slice(0, 4)}...` : null
  };
}

function isPriority(link = '') {
  const lower = String(link).toLowerCase();
  return PRIORITY_DOMAINS.some(domain => lower.includes(domain));
}

export async function searchWeb(query, limit = 5) {
  const SERP_API_KEY = getApiKey();

  if (!SERP_API_KEY) {
    return { query, results: [], note: 'SERP_API_KEY not configured', diagnostics: searchDiagnostics() };
  }

  const params = new URLSearchParams({
    q: query,
    api_key: SERP_API_KEY,
    num: String(Math.max(1, Math.min(limit, 10))),
    hl: 'en',
    gl: 'uk'
  });

  try {
    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        query,
        results: [],
        error: data.error || `${response.status} ${response.statusText}`,
        diagnostics: searchDiagnostics()
      };
    }

    const results = (data.organic_results || [])
      .map(r => ({
        title: r.title || '',
        link: r.link || '',
        snippet: r.snippet || '',
        priority: isPriority(r.link || '')
      }))
      .sort((a, b) => Number(b.priority) - Number(a.priority))
      .slice(0, limit);

    return { query, results, diagnostics: searchDiagnostics() };
  } catch (e) {
    return { query, results: [], error: e?.message || String(e), diagnostics: searchDiagnostics() };
  }
}

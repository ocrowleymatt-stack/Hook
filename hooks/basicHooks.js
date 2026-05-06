import OpenAI from 'openai';

function getAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  });
}

async function callAI(systemPrompt, userContent) {
  const client = getAIClient();
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    response_format: { type: 'json_object' }
  });
  const text = response.choices[0]?.message?.content || '{}';
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export const deepResearchHook = {
  name: 'deep_research',
  handler: async ({ query, message }) => ({
    summary: `Deep research placeholder for: ${query || message}`,
    status: 'source_check_required',
    note: 'This is a placeholder research layer pending live source integration.'
  })
};

export const annexXHook = {
  name: 'annex_x',
  handler: async ({ previous, message }) => ({
    section: 'Annex X Draft Entry',
    sourceMaterial: previous || message || null,
    classification: 'derived_analysis_pending_primary_source_check',
    chronology: [],
    issues: [
      'Identify each alleged failure separately',
      'Map each issue to primary evidence',
      'Separate fact, allegation, inference and legal analysis'
    ],
    courtSafeNote: 'Facts require verification against raw exhibits before pleading use.'
  })
};

export const mediaCampaignHook = {
  name: 'media_campaign',
  handler: async ({ input, message, previous }) => ({
    campaign: `Campaign draft for: ${input || message}`,
    previous,
    legalSafety: 'Use alleged/reported language unless supported by primary evidence.'
  })
};

export const agentPlanHook = {
  name: 'agent_plan',
  handler: async ({ message }) => ({
    plan: [`Analyse: ${message}`, 'Break into steps', 'Execute chain']
  })
};

export const buildPlanHook = {
  name: 'build_plan',
  handler: async ({ previous, message }) => ({
    buildPlan: ['Define target output', 'Identify modules', 'Wire execution route', 'Add tests', 'Deploy behind auth'],
    previous,
    message
  })
};

export const riskReviewHook = {
  name: 'risk_review',
  handler: async ({ previous }) => {
    if (!previous || !previous.results) {
      return {
        risks: [
          'Check every factual assertion against primary evidence',
          'Do not blur allegation and established fact',
          'Preserve uncertainty and contradictions',
          'Avoid overclaiming causation or intent'
        ],
        previous
      };
    }

    const findingsSummary = (previous.results || []).map(entity => {
      const topFindings = (entity.findings || []).slice(0, 5).map(f =>
        `  - [score:${f.relevance?.score}] ${f.title} | ${f.source} | "${(f.snippet || '').slice(0, 120)}"`
      ).join('\n');
      return `Entity: ${entity.entity} (kept:${entity.keptCount}, rejected:${entity.rejectedCount})\n${topFindings}`;
    }).join('\n\n');

    const systemPrompt = `You are an intelligence analyst reviewing open-source research findings.
Identify specific evidential risks, gaps, and flags. Be precise and legally cautious.
Return JSON with:
- "risks": array of specific risk strings tied to actual findings
- "flags": array of { entity, issue, source, recommendation }
- "gaps": array of strings describing missing or failed searches
- "overallAssessment": 1-2 sentence summary of research quality
- "confidenceLevel": "high" | "medium" | "low"`;

    const userContent = `Review these findings:\n\n${findingsSummary}\n\nMode: ${previous.mode}\nEntities: ${previous.entityCount}`;

    try {
      const analysis = await callAI(systemPrompt, userContent);
      return { ...analysis, analysisMethod: 'ai_risk_review', previous };
    } catch (err) {
      return {
        risks: [
          'Check every factual assertion against primary evidence',
          'Do not blur allegation and established fact',
          'Preserve uncertainty and contradictions',
          'Avoid overclaiming causation or intent'
        ],
        flags: [],
        gaps: [],
        overallAssessment: 'AI risk review unavailable — manual review required.',
        confidenceLevel: 'low',
        analysisMethod: 'fallback_static',
        aiError: err?.message || String(err),
        previous
      };
    }
  }
};

export const exportReportHook = {
  name: 'export_report',
  handler: async ({ previous }) => {
    const generatedAt = new Date().toISOString();

    if (!previous || (!previous.results && !previous.flags)) {
      return {
        title: 'Hook OS Chain Report',
        generatedAt,
        report: previous,
        evidentialWarning: 'Generated output is analysis/control material, not primary evidence.'
      };
    }

    const researchData = previous.previous || previous;
    const riskData = previous;

    const entitySummaries = (researchData.results || []).map(entity => {
      const topFindings = (entity.findings || []).slice(0, 8).map(f =>
        `  Source: ${f.source}\n  Title: ${f.title}\n  Snippet: ${(f.snippet || '').slice(0, 200)}\n  Score: ${f.relevance?.score} | Grade: ${f.relevance?.grade}`
      ).join('\n\n');
      return `### ${entity.entity}\nQueries: ${entity.queryCount} | Kept: ${entity.keptCount} | Rejected: ${entity.rejectedCount}\n\n${topFindings}`;
    }).join('\n\n---\n\n');

    const riskSummary = [
      ...(riskData.risks || []).map(r => `- ${r}`),
      ...(riskData.flags || []).map(f => `- FLAG [${f.entity}]: ${f.issue} (${f.recommendation})`)
    ].join('\n');

    const systemPrompt = `You are an intelligence analyst writing a structured OSINT brief.
Write a professional, factual, legally cautious intelligence report.
Use "alleged", "reported", "unverified" language. Never state as fact what is only a lead.
Return JSON with:
- "executiveSummary": string (3-5 sentences)
- "entityProfiles": array of { name, keyFindings: string[], institutionalLinks: string[], geographicLinks: string[], confidenceScore: number, assessmentNotes: string }
- "networkPatterns": string describing connections between entities
- "priorityLeads": array of 3-5 actionable follow-up items
- "evidentialWarnings": array of strings
- "reportClassification": "UNCLASSIFIED - OPEN SOURCE LEADS ONLY"`;

    const userContent = `Research findings:\n${entitySummaries}\n\nRisk review:\n${riskSummary}\n\nMode: ${researchData.mode || 'unknown'}\nGenerated: ${generatedAt}`;

    try {
      const brief = await callAI(systemPrompt, userContent);
      return {
        title: 'Hook OS Intelligence Brief',
        generatedAt,
        reportClassification: 'UNCLASSIFIED - OPEN SOURCE LEADS ONLY',
        ...brief,
        metadata: {
          mode: researchData.mode,
          entityCount: researchData.entityCount,
          totalQueriesRun: (researchData.results || []).reduce((sum, e) => sum + e.queryCount, 0),
          totalFindingsKept: (researchData.results || []).reduce((sum, e) => sum + e.keptCount, 0),
          generatedBy: 'Hook OS export_report hook v2'
        },
        evidentialWarning: 'Generated output is analysis/control material, not primary evidence. All leads require verification against primary sources before use.'
      };
    } catch (err) {
      return {
        title: 'Hook OS Chain Report',
        generatedAt,
        report: previous,
        exportMethod: 'fallback_passthrough',
        aiError: err?.message || String(err),
        evidentialWarning: 'Generated output is analysis/control material, not primary evidence.'
      };
    }
  }
};

export const networkResearchHook = {
  name: 'network_research',
  handler: async ({ dataset, message }) => {
    const rawEntities = dataset?.entities || dataset?.nodes || dataset?.rows || [];
    const entities = rawEntities
      .map((e, i) => ({
        id: e.id || e.phone || e['Phone (Normalized)'] || `entity-${i + 1}`,
        name: e.name || e.label || e['Primary Name'] || e.Name || e.name_display || e.id || `Entity ${i + 1}`,
        type: e.type || e.entity_type || 'unknown',
        risk: e.risk || e['Risk Score'] || e.risk_score || null
      }))
      .filter(e => e.name && String(e.name).trim());

    const tasks = entities.slice(0, 75).map(e => ({
      entity: e.name,
      id: e.id,
      type: e.type,
      risk: e.risk,
      publicSearchQueries: [
        `${e.name} UK`,
        `${e.name} Companies House`,
        `${e.name} Charity Commission`,
        `${e.name} church parish`,
        `${e.name} Ironbridge Shropshire`,
        `${e.name} estate hall`
      ],
      evidentialStatus: 'research_task_only_not_verified'
    }));

    return {
      stage: 'network_research_plan',
      instruction: message,
      entityCount: entities.length,
      taskCount: tasks.length,
      tasks,
      outputRequired: [
        'confirmed_links_with_sources',
        'probable_links',
        'co_mentions',
        'church_new_age_estate_signals',
        'top_connectors',
        'false_match_warnings',
        'evidence_gaps'
      ],
      warning: 'This stage generates public-source research tasks. It does not prove relationships or wrongdoing.'
    };
  }
};

export function decideWorkflow(input = '') {
  const text = String(input || '').toLowerCase();

  if (text.includes('network') || text.includes('research')) {
    return ['network_research', 'risk_review', 'export_report'];
  }

  if (text.includes('evidence') || text.includes('annex') || text.includes('bundle') || text.includes('court')) {
    return ['deep_research', 'annex_x', 'risk_review', 'export_report'];
  }

  if (text.includes('campaign') || text.includes('media') || text.includes('headline') || text.includes('press')) {
    return ['deep_research', 'media_campaign', 'risk_review', 'export_report'];
  }

  if (text.includes('app') || text.includes('build') || text.includes('code') || text.includes('workflow')) {
    return ['agent_plan', 'build_plan', 'risk_review', 'export_report'];
  }

  return ['agent_plan', 'risk_review', 'export_report'];
}

export function decideWorkflow(input = '') {
  const text = String(input || '').toLowerCase();

  if (
    text.includes('network') ||
    text.includes('research') ||
    text.includes('co-mention') ||
    text.includes('comention') ||
    text.includes('appears in') ||
    text.includes('appears with') ||
    text.includes('edge') ||
    text.includes('cluster') ||
    text.includes('link map') ||
    text.includes('graph')
  ) {
    return ['network_research', 'risk_review', 'export_report'];
  }

  if (text.includes('evidence') || text.includes('annex') || text.includes('bundle') || text.includes('court')) {
    return ['deep_research', 'annex_x', 'risk_review', 'export_report'];
  }

  if (text.includes('campaign') || text.includes('media') || text.includes('headline') || text.includes('press')) {
    return ['deep_research', 'media_campaign', 'risk_review', 'export_report'];
  }

  if (text.includes('app') || text.includes('code') || text.includes('workflow')) {
    return ['agent_plan', 'risk_review', 'export_report'];
  }

  return ['agent_plan', 'risk_review', 'export_report'];
}

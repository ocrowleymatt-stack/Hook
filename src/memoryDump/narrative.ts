import { CausalAnalysis } from "./causal.js";
import { Timeline } from "./timeline.js";

export type Narrative = {
  id: string;
  summary: string;
  chronology: string[];
  keyFindings: string[];
  knowledgeStateFindings: string[];
  patternFindings: string[];
  risks: string[];
  cautions: string[];
};

export function buildNarrative(tl: Timeline, ca: CausalAnalysis): Narrative {
  const chronology = tl.events.map(e => `${e.timestamp || "(no date)"} — ${e.title}: ${e.description}`);

  const keyFindings = ca.links.slice(0, 10).map(l =>
    `Link: ${l.fromId} → ${l.toId} (${l.relationship}) — ${l.rationale}`
  );

  const knowledgeStateFindings = ca.knowledgeStates.slice(0, 10).map(k =>
    `${k.actor} knew by ${k.knownByTimestamp || "(unknown)"}: ${k.knownFacts.join("; ")}`
  );

  const patternFindings = ca.repeatedPatterns.map(p =>
    `Pattern '${p.pattern}' repeated across events: ${p.eventIds.join(", ")}`
  );

  const summary = [
    "This narrative summarises a sequence of events, associated knowledge states, and repeated patterns.",
    "Causal links are analytical and not findings of fact.",
    "Manual verification is required before reliance in legal proceedings."
  ].join(" ");

  const risks = [
    "Potential over-reliance on inferred links",
    "Incomplete or missing timestamps",
    "Source bias or gaps in data"
  ];

  return {
    id: `narrative-${tl.id}`,
    summary,
    chronology,
    keyFindings,
    knowledgeStateFindings,
    patternFindings,
    risks,
    cautions: ca.warnings
  };
}

import { Timeline, TimelineEvent } from "./timeline.js";

export type CausalLink = {
  fromId: string;
  toId: string;
  relationship: "possible_cause" | "context" | "consequence" | "knowledge_state" | "pattern_repeat";
  rationale: string;
  confidence: number;
  cautions: string[];
};

export type KnowledgeState = {
  actor: string;
  knownByTimestamp?: string;
  knownFacts: string[];
  sourceEventIds: string[];
  confidence: number;
};

export type CausalAnalysis = {
  timelineId: string;
  links: CausalLink[];
  knowledgeStates: KnowledgeState[];
  repeatedPatterns: Array<{
    pattern: string;
    eventIds: string[];
    confidence: number;
  }>;
  warnings: string[];
};

function sharedTerms(a: string[], b: string[]) {
  return a.filter(x => b.includes(x));
}

export function inferCausalAnalysis(timeline: Timeline): CausalAnalysis {
  const links: CausalLink[] = [];
  const knowledgeStates: KnowledgeState[] = [];
  const warnings: string[] = [
    "Causal links are analytical assessments, not findings of fact.",
    "Manual review is required before use in pleadings or evidence bundles."
  ];

  for (let i = 0; i < timeline.events.length; i++) {
    for (let j = i + 1; j < timeline.events.length; j++) {
      const a = timeline.events[i];
      const b = timeline.events[j];
      const entityOverlap = sharedTerms(a.entities, b.entities);
      const tagOverlap = sharedTerms(a.tags, b.tags);

      if (entityOverlap.length || tagOverlap.length) {
        links.push({
          fromId: a.id,
          toId: b.id,
          relationship: tagOverlap.length ? "pattern_repeat" : "context",
          rationale: `Shared ${entityOverlap.length ? "entities" : "tags"}: ${(entityOverlap.length ? entityOverlap : tagOverlap).join(", ")}`,
          confidence: Math.min(0.85, 0.45 + (entityOverlap.length + tagOverlap.length) * 0.1),
          cautions: ["Correlation or sequence does not prove causation"]
        });
      }
    }
  }

  for (const event of timeline.events) {
    const actorTags = event.tags.filter(t => t.startsWith("actor:"));
    for (const actorTag of actorTags) {
      const actor = actorTag.replace("actor:", "");
      knowledgeStates.push({
        actor,
        knownByTimestamp: event.timestamp,
        knownFacts: [event.description],
        sourceEventIds: [event.id],
        confidence: event.confidence
      });
    }
  }

  const patternMap = new Map<string, TimelineEvent[]>();
  for (const event of timeline.events) {
    for (const tag of event.tags) {
      if (tag.startsWith("pattern:")) {
        const arr = patternMap.get(tag) || [];
        arr.push(event);
        patternMap.set(tag, arr);
      }
    }
  }

  const repeatedPatterns = Array.from(patternMap.entries())
    .filter(([, events]) => events.length > 1)
    .map(([pattern, events]) => ({
      pattern: pattern.replace("pattern:", ""),
      eventIds: events.map(e => e.id),
      confidence: Math.min(0.9, events.reduce((sum, e) => sum + e.confidence, 0) / events.length)
    }));

  return { timelineId: timeline.id, links, knowledgeStates, repeatedPatterns, warnings };
}

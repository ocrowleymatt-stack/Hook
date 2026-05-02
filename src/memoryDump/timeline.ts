export type TimelineEvent = {
  id: string;
  timestamp?: string;
  source: string;
  sourcePath: string;
  title: string;
  description: string;
  entities: string[];
  tags: string[];
  confidence: number;
};

export type Timeline = {
  id: string;
  events: TimelineEvent[];
  warnings: string[];
};

function parseDateSafe(input?: string): number | null {
  if (!input) return null;
  const t = Date.parse(input);
  return Number.isNaN(t) ? null : t;
}

export function buildTimeline(events: TimelineEvent[]): Timeline {
  const warnings: string[] = [];

  const withTs = events
    .map(e => ({ e, ts: parseDateSafe(e.timestamp) }))
    .sort((a, b) => {
      if (a.ts === null && b.ts === null) return 0;
      if (a.ts === null) return 1;
      if (b.ts === null) return -1;
      return a.ts - b.ts;
    })
    .map(x => x.e);

  if (withTs.some(e => !e.timestamp)) {
    warnings.push("Some events missing timestamps; placed at end");
  }

  return { id: "timeline-1", events: withTs, warnings };
}

export type LinkedTimeline = Timeline & {
  links: Array<{ fromId: string; toId: string; reason: string }>;
};

export function linkTimeline(tl: Timeline): LinkedTimeline {
  const links: Array<{ fromId: string; toId: string; reason: string }> = [];

  // naive linking by shared entities
  for (let i = 0; i < tl.events.length; i++) {
    for (let j = i + 1; j < tl.events.length; j++) {
      const a = tl.events[i];
      const b = tl.events[j];
      const shared = a.entities.filter(x => b.entities.includes(x));
      if (shared.length) {
        links.push({ fromId: a.id, toId: b.id, reason: `shared entities: ${shared.join(", ")}` });
      }
    }
  }

  return { ...tl, links };
}

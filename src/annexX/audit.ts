import { AnnexXEntry } from "./schema.js";

export function auditEntry(entry: AnnexXEntry): string[] {
  const issues: string[] = [];

  if (!entry.observedFact) issues.push("Missing observed fact");
  if (!entry.sourceTrace || entry.sourceTrace.length === 0) issues.push("Missing source trace");
  if (entry.confidence < 0.5) issues.push("Low confidence");
  if (entry.riskLevel === "critical" && entry.confidence < 0.7) {
    issues.push("Critical risk but low confidence");
  }

  return issues;
}

export function auditBatch(entries: AnnexXEntry[]) {
  return entries.map(e => ({ id: e.id, issues: auditEntry(e) }));
}

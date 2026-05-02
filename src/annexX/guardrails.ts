import { AnnexXEntry, EvidenceClassification } from "./schema.js";

const ALLOWED_CLASSIFICATIONS: EvidenceClassification[] = [
  "threat_to_life_or_safeguarding",
  "crime_recording_failure",
  "contact_management_failure",
  "sar_data_accuracy",
  "custody_pace_property",
  "victims_code",
  "equality_reasonable_adjustments",
  "iopc_referral_failure",
  "hidden_case_status",
  "post_notice_continuation",
  "damages_multiplier",
  "other"
];

export type GuardrailResult = {
  passed: boolean;
  blocked: boolean;
  issues: string[];
};

export function runGuardrails(entry: AnnexXEntry): GuardrailResult {
  const issues: string[] = [];

  if (!entry.id) issues.push("Entry has no id");
  if (!entry.createdAt) issues.push("Entry has no createdAt timestamp");
  if (!entry.observedFact || entry.observedFact.trim().length < 10) issues.push("Observed fact is missing or too thin");
  if (!entry.legalRelevance || entry.legalRelevance.trim().length < 10) issues.push("Legal relevance is missing or too thin");
  if (!entry.sourceTrace?.length) issues.push("No source trace supplied");
  if (entry.inference && !entry.cautions?.length) issues.push("Inference provided without caution/limitation note");
  if (entry.confidence < 0 || entry.confidence > 1) issues.push("Confidence must be between 0 and 1");
  if (entry.confidence < 0.65) issues.push("Confidence below litigation-safe threshold");

  for (const c of entry.classification) {
    if (!ALLOWED_CLASSIFICATIONS.includes(c)) issues.push(`Unknown classification: ${c}`);
  }

  return {
    passed: issues.length === 0,
    blocked: issues.some(i => i.includes("No source trace") || i.includes("Observed fact") || i.includes("Unknown classification")),
    issues
  };
}

export function runBatchGuardrails(entries: AnnexXEntry[]) {
  return entries.map(entry => ({ id: entry.id, ...runGuardrails(entry) }));
}
